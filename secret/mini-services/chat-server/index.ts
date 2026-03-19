// GirlyPopChat Socket.IO Server
// Handles: Chat, Presence, View Requests, Broadcasts

import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { db } from '../../src/lib/db'
import { generateViewerToken, generateBroadcasterToken, addViewRequest, getViewRequests, removeViewRequest, clearViewRequests } from '../../src/lib/livekit'

// ============================================
// Types
// ============================================

interface UserSocket extends Socket {
  userId?: string
  user?: {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
    role: string
    trustScore: number
    ageVerified: boolean
  }
  currentRoom?: string
  isBroadcasting?: boolean
}

// ============================================
// In-Memory State (use Redis in production)
// ============================================

const connectedUsers = new Map<string, UserSocket>()
const roomUsers = new Map<string, Set<string>>()
const broadcasters = new Map<string, {
  roomName: string
  livekitRoom: string
  viewerCount: number
  isLocked: boolean
}>()

// ============================================
// Server Class
// ============================================

class GirlyPopChatServer {
  private io: SocketIOServer

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    this.setupMiddleware()
    this.setupEvents()
  }

  // ============================================
  // Authentication Middleware
  // ============================================

  private setupMiddleware() {
    this.io.use(async (socket: UserSocket, next) => {
      const sessionToken = socket.handshake.auth.sessionToken
      
      if (!sessionToken) {
        return next(new Error('Authentication required'))
      }

      // Validate session with our DB
      const session = await db.session.findUnique({
        where: { stytchSession: sessionToken },
        include: { user: true },
      })

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid or expired session'))
      }

      socket.userId = session.user.id
      socket.user = {
        id: session.user.id,
        username: session.user.username,
        displayName: session.user.displayName,
        avatar: session.user.avatar,
        role: session.user.role,
        trustScore: session.user.trustScore,
        ageVerified: session.user.ageVerified,
      }

      connectedUsers.set(session.user.id, socket)
      next()
    })
  }

  // ============================================
  // Event Handlers
  // ============================================

  private setupEvents() {
    this.io.on('connection', (socket: UserSocket) => {
      console.log(`✅ Connected: ${socket.user?.username} (${socket.userId})`)

      // Room events
      socket.on('joinRoom', (data) => this.handleJoinRoom(socket, data))
      socket.on('leaveRoom', (data) => this.handleLeaveRoom(socket, data))
      socket.on('getRooms', () => this.handleGetRooms(socket))

      // Chat events
      socket.on('message', (data) => this.handleMessage(socket, data))
      socket.on('editMessage', (data) => this.handleEditMessage(socket, data))
      socket.on('deleteMessage', (data) => this.handleDeleteMessage(socket, data))
      socket.on('addReaction', (data) => this.handleAddReaction(socket, data))

      // Broadcast events
      socket.on('startBroadcast', (data, cb) => this.handleStartBroadcast(socket, data, cb))
      socket.on('stopBroadcast', (cb) => this.handleStopBroadcast(socket, cb))
      socket.on('viewRequest', (data, cb) => this.handleViewRequest(socket, data, cb))
      socket.on('viewResponse', (data, cb) => this.handleViewResponse(socket, data, cb))
      socket.on('lockBroadcast', (data, cb) => this.handleLockBroadcast(socket, data, cb))

      // Social events
      socket.on('poke', (data) => this.handlePoke(socket, data))
      socket.on('idle', (data) => this.handleIdle(socket, data))
      socket.on('typing', (data) => this.handleTyping(socket, data))

      // Disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  // ============================================
  // Room Handlers
  // ============================================

  private async handleJoinRoom(socket: UserSocket, data: { roomId: string }) {
    const room = await db.room.findUnique({ where: { id: data.roomId } })
    if (!room) {
      return socket.emit('error', { message: 'Room not found' })
    }

    // Leave previous room
    if (socket.currentRoom) {
      this.handleLeaveRoom(socket, { roomId: socket.currentRoom })
    }

    // Join new room
    socket.join(`room:${data.roomId}`)
    socket.currentRoom = data.roomId

    // Track users in room
    if (!roomUsers.has(data.roomId)) {
      roomUsers.set(data.roomId, new Set())
    }
    roomUsers.get(data.roomId)!.add(socket.userId!)

    // Notify others
    socket.to(`room:${data.roomId}`).emit('userJoin', {
      roomId: data.roomId,
      user: {
        userId: socket.userId,
        username: socket.user?.username,
        displayName: socket.user?.displayName,
        avatar: socket.user?.avatar,
        cam: broadcasters.has(socket.userId!) ? 100 : 0,
        isIdle: false,
        badge: socket.user?.role === 'admin' ? 'admin' : socket.user?.role === 'moderator' ? 'mod' : null,
      },
    })

    // Send current room state
    const users = Array.from(roomUsers.get(data.roomId) || [])
      .map(uid => {
        const s = connectedUsers.get(uid)
        return s ? {
          userId: uid,
          username: s.user?.username,
          displayName: s.user?.displayName,
          avatar: s.user?.avatar,
          cam: broadcasters.has(uid) ? 100 : 0,
          isIdle: false,
        } : null
      })
      .filter(Boolean)

    socket.emit('roomJoined', {
      room,
      users,
      activeBroadcasts: Array.from(broadcasters.entries())
        .filter(([_, b]) => room.id === data.roomId)
        .map(([broadcasterId, b]) => ({
          broadcasterId,
          roomName: b.roomName,
          viewerCount: b.viewerCount,
          isLocked: b.isLocked,
        })),
    })

    // Update room stats
    await db.room.update({
      where: { id: data.roomId },
      data: { memberCount: roomUsers.get(data.roomId)?.size || 0 },
    })
  }

  private handleLeaveRoom(socket: UserSocket, data: { roomId: string }) {
    socket.leave(`room:${data.roomId}`)
    
    // Remove from room tracking
    roomUsers.get(data.roomId)?.delete(socket.userId!)
    
    // Notify others
    socket.to(`room:${data.roomId}`).emit('userLeave', {
      roomId: data.roomId,
      userId: socket.userId,
    })

    if (socket.currentRoom === data.roomId) {
      socket.currentRoom = undefined
    }
  }

  private async handleGetRooms(socket: UserSocket) {
    const rooms = await db.room.findMany({
      where: { isPublic: true },
      orderBy: { memberCount: 'desc' },
    })
    socket.emit('roomsList', rooms)
  }

  // ============================================
  // Message Handlers
  // ============================================

  private async handleMessage(socket: UserSocket, data: { content: string; roomId: string; replyToId?: string; imageUrl?: string; type?: string }) {
    if (!socket.currentRoom || socket.currentRoom !== data.roomId) {
      return socket.emit('error', { message: 'Not in room' })
    }

    // Determine message type
    const messageType = data.imageUrl ? 'image' : (data.type || 'text')

    const message = await db.message.create({
      data: {
        content: data.content || '',
        type: messageType,
        userId: socket.userId!,
        roomId: data.roomId,
        replyToId: data.replyToId,
        imageUrl: data.imageUrl,
      },
      include: { user: true },
    })

    // Build response with reply info if needed
    const responseData: any = {
      _id: message.id,
      userId: socket.userId,
      name: socket.user?.username,
      displayName: socket.user?.displayName,
      text: data.content || '',
      roomId: data.roomId,
      createdAt: message.createdAt,
      badge: socket.user?.role === 'admin' ? 'admin' : socket.user?.role === 'moderator' ? 'mod' : null,
      type: messageType,
    }

    if (data.imageUrl) {
      responseData.imageUrl = data.imageUrl
    }

    this.io.to(`room:${data.roomId}`).emit('message', responseData)
  }

  private async handleEditMessage(socket: UserSocket, data: { messageId: string; content: string }) {
    const message = await db.message.findUnique({ where: { id: data.messageId } })
    if (!message || message.userId !== socket.userId) return

    await db.message.update({
      where: { id: data.messageId },
      data: { content: data.content, isEdited: true, editedAt: new Date() },
    })

    this.io.to(`room:${message.roomId}`).emit('messageEdited', {
      messageId: data.messageId,
      content: data.content,
      isEdited: true,
    })
  }

  private async handleDeleteMessage(socket: UserSocket, data: { messageId: string }) {
    const message = await db.message.findUnique({ where: { id: data.messageId } })
    if (!message || (message.userId !== socket.userId && socket.user?.role !== 'admin' && socket.user?.role !== 'moderator')) return

    await db.message.update({
      where: { id: data.messageId },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    this.io.to(`room:${message.roomId}`).emit('messageDeleted', {
      messageId: data.messageId,
    })
  }

  // ============================================
  // Reaction Handler
  // ============================================

  private async handleAddReaction(socket: UserSocket, data: { messageId: string; emoji: string }) {
    const message = await db.message.findUnique({ 
      where: { id: data.messageId },
      include: { user: true }
    })
    
    if (!message || message.isDeleted) return

    // Parse existing reactions
    let reactions: Array<{ emoji: string; userIds: string[] }> = []
    try {
      reactions = message.reactions ? JSON.parse(message.reactions) : []
    } catch {
      reactions = []
    }

    // Find or create reaction group
    let reactionGroup = reactions.find(r => r.emoji === data.emoji)
    
    if (!reactionGroup) {
      reactionGroup = { emoji: data.emoji, userIds: [] }
      reactions.push(reactionGroup)
    }

    // Toggle user's reaction
    const userIdIndex = reactionGroup.userIds.indexOf(socket.userId!)
    if (userIdIndex === -1) {
      // Add reaction
      reactionGroup.userIds.push(socket.userId!)
    } else {
      // Remove reaction
      reactionGroup.userIds.splice(userIdIndex, 1)
      // Remove empty reaction groups
      if (reactionGroup.userIds.length === 0) {
        reactions = reactions.filter(r => r.emoji !== data.emoji)
      }
    }

    // Save to database
    await db.message.update({
      where: { id: data.messageId },
      data: { reactions: JSON.stringify(reactions) },
    })

    // Broadcast to room
    this.io.to(`room:${message.roomId}`).emit('messageReacted', {
      messageId: data.messageId,
      reactions,
    })
  }

  // ============================================
  // Broadcast Handlers
  // ============================================

  private async handleStartBroadcast(socket: UserSocket, data: { source: 'camera' | 'screen'; locked?: boolean }, callback: Function) {
    if (!socket.currentRoom) {
      return callback({ success: false, message: 'Must be in a room to broadcast' })
    }

    if (socket.isBroadcasting) {
      return callback({ success: false, message: 'Already broadcasting' })
    }

    const roomName = `broadcast-${socket.userId}-${Date.now()}`
    const token = await generateBroadcasterToken(roomName, socket.userId!, socket.user!.username)

    // Create broadcast record
    const broadcast = await db.broadcast.create({
      data: {
        userId: socket.userId!,
        roomId: socket.currentRoom,
        livekitRoom: roomName,
        isLocked: data.locked || false,
      },
    })

    // Track in memory
    broadcasters.set(socket.userId!, {
      roomName,
      livekitRoom: roomName,
      viewerCount: 0,
      isLocked: data.locked || false,
    })

    socket.isBroadcasting = true

    // Notify room
    socket.to(`room:${socket.currentRoom}`).emit('broadcastStarted', {
      broadcasterId: socket.userId,
      username: socket.user?.username,
      displayName: socket.user?.displayName,
      roomName,
      isLocked: data.locked || false,
    })

    callback({
      success: true,
      token,
      roomName,
      livekitUrl: process.env.LIVEKIT_URL,
    })
  }

  private async handleStopBroadcast(socket: UserSocket, callback: Function) {
    if (!socket.isBroadcasting) {
      return callback({ success: false, message: 'Not broadcasting' })
    }

    const broadcast = broadcasters.get(socket.userId!)
    if (broadcast) {
      await db.broadcast.updateMany({
        where: { userId: socket.userId!, isActive: true },
        data: { isActive: false, endedAt: new Date() },
      })

      broadcasters.delete(socket.userId!)
      clearViewRequests(socket.userId!)
    }

    socket.isBroadcasting = false

    if (socket.currentRoom) {
      socket.to(`room:${socket.currentRoom}`).emit('broadcastStopped', {
        broadcasterId: socket.userId,
      })
    }

    callback({ success: true })
  }

  private async handleViewRequest(socket: UserSocket, data: { broadcasterId: string }, callback: Function) {
    const broadcast = broadcasters.get(data.broadcasterId)
    if (!broadcast) {
      return callback({ success: false, message: 'Broadcast not found' })
    }

    // If not locked, auto-approve
    if (!broadcast.isLocked) {
      const token = await generateViewerToken(broadcast.livekitRoom, socket.userId!, socket.user!.username)
      broadcast.viewerCount++
      
      return callback({
        success: true,
        approved: true,
        token,
        roomName: broadcast.roomName,
        livekitUrl: process.env.LIVEKIT_URL,
      })
    }

    // Locked broadcast - send request to broadcaster
    addViewRequest(data.broadcasterId, {
      viewerId: socket.userId!,
      viewerName: socket.user!.username,
      viewerAvatar: socket.user?.avatar || undefined,
      requestedAt: Date.now(),
    })

    // Notify broadcaster
    const broadcasterSocket = connectedUsers.get(data.broadcasterId)
    if (broadcasterSocket) {
      broadcasterSocket.emit('viewRequest', {
        viewerId: socket.userId,
        viewerName: socket.user?.username,
        viewerAvatar: socket.user?.avatar,
      })
    }

    callback({ success: true, approved: false, message: 'Request sent to broadcaster' })
  }

  private async handleViewResponse(socket: UserSocket, data: { viewerId: string; approved: boolean }, callback: Function) {
    if (!socket.isBroadcasting) {
      return callback({ success: false, message: 'Not broadcasting' })
    }

    const broadcast = broadcasters.get(socket.userId!)
    if (!broadcast) {
      return callback({ success: false, message: 'No active broadcast' })
    }

    removeViewRequest(socket.userId!, data.viewerId)

    const viewerSocket = connectedUsers.get(data.viewerId)
    if (!viewerSocket) {
      return callback({ success: false, message: 'Viewer not found' })
    }

    if (data.approved) {
      const token = await generateViewerToken(broadcast.livekitRoom, data.viewerId, viewerSocket.user!.username)
      broadcast.viewerCount++

      viewerSocket.emit('viewResponse', {
        approved: true,
        token,
        roomName: broadcast.roomName,
        livekitUrl: process.env.LIVEKIT_URL,
      })

      // Notify broadcaster of new viewer
      socket.emit('viewerJoined', {
        viewerId: data.viewerId,
        viewerName: viewerSocket.user?.username,
        viewerCount: broadcast.viewerCount,
      })
    } else {
      viewerSocket.emit('viewResponse', {
        approved: false,
        message: 'Broadcast denied access',
      })
    }

    callback({ success: true })
  }

  private handleLockBroadcast(socket: UserSocket, data: { locked: boolean }, callback: Function) {
    if (!socket.isBroadcasting) {
      return callback({ success: false, message: 'Not broadcasting' })
    }

    const broadcast = broadcasters.get(socket.userId!)
    if (broadcast) {
      broadcast.isLocked = data.locked
    }

    callback({ success: true, locked: data.locked })
  }

  // ============================================
  // Social Handlers
  // ============================================

  private handlePoke(socket: UserSocket, data: { userId: string }) {
    const targetSocket = connectedUsers.get(data.userId)
    if (targetSocket) {
      targetSocket.emit('poke', {
        senderId: socket.userId,
        senderName: socket.user?.username,
        senderAvatar: socket.user?.avatar,
      })
    }
  }

  private handleIdle(socket: UserSocket, data: { isIdle: boolean }) {
    if (socket.currentRoom) {
      socket.to(`room:${socket.currentRoom}`).emit('userUpdate', {
        userId: socket.userId,
        isIdle: data.isIdle,
      })
    }
  }

  private handleTyping(socket: UserSocket, data: { roomId: string; isTyping: boolean }) {
    socket.to(`room:${data.roomId}`).emit('userTyping', {
      userId: socket.userId,
      username: socket.user?.username,
      isTyping: data.isTyping,
    })
  }

  // ============================================
  // Disconnect Handler
  // ============================================

  private async handleDisconnect(socket: UserSocket) {
    console.log(`❌ Disconnected: ${socket.user?.username}`)

    connectedUsers.delete(socket.userId!)

    // Stop broadcast if active
    if (socket.isBroadcasting) {
      await this.handleStopBroadcast(socket, () => {})
    }

    // Leave room
    if (socket.currentRoom) {
      this.handleLeaveRoom(socket, { roomId: socket.currentRoom })
    }

    // Update last online
    await db.user.update({
      where: { id: socket.userId },
      data: { lastOnlineAt: new Date() },
    })
  }
}

// ============================================
// Start Server
// ============================================

const PORT = parseInt(process.env.SOCKET_PORT || '3001')

async function main() {
  const { createServer } = await import('http')
  const httpServer = createServer()

  new GirlyPopChatServer(httpServer)

  httpServer.listen(PORT, () => {
    console.log(`🚀 GirlyPopChat Socket.IO server running on port ${PORT}`)
  })
}

main().catch(console.error)

export { GirlyPopChatServer }
