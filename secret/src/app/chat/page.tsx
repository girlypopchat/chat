'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { 
  MoreVertical, Edit2, Trash2, Smile, Image, X, Check, 
  Reply, Copy, ExternalLink, Clock, User, Hash, Plus
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface Reaction {
  emoji: string
  userIds: string[]
}

interface Message {
  _id: string
  userId: string
  name: string
  displayName?: string
  text: string
  createdAt: string
  badge?: string
  isEdited?: boolean
  isDeleted?: boolean
  imageUrl?: string
  replyTo?: {
    _id: string
    name: string
    text: string
  }
  reactions?: Reaction[]
}

interface User {
  userId: string
  username: string
  displayName?: string
  avatar?: string
  cam: number
  isIdle: boolean
}

interface ViewRequest {
  viewerId: string
  viewerName: string
  viewerAvatar?: string
}

interface EditingState {
  messageId: string
  content: string
}

interface ReplyingState {
  messageId: string
  name: string
  text: string
}

interface Room {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  memberCount: number
  isNSFW: boolean
}

interface RoomProposal {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  sponsorCount: number
  status: string
  expiresAt?: string
  createdAt: string
  createdBy: {
    username: string
    displayName?: string
  }
  sponsors: Array<{
    userId: string
    user: { username: string; displayName?: string; avatar?: string }
  }>
}

// LiveKit
import { LiveKitRoom, VideoConference, useLocalParticipant } from '@livekit/components-react'
import '@livekit/components-styles'

const REQUIRED_SPONSORS = 5

// ============================================
// Emoji Picker Data
// ============================================

const EMOJI_CATEGORIES = {
  reactions: ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '😅'],
  faces: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  hands: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
}

// ============================================
// Main Chat Component
// ============================================

export default function ChatPage() {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitRoom, setLivekitRoom] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [viewRequests, setViewRequests] = useState<ViewRequest[]>([])
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  
  // New feature states
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [replying, setReplying] = useState<ReplyingState | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // Room management states
  const [rooms, setRooms] = useState<Room[]>([])
  const [proposals, setProposals] = useState<RoomProposal[]>([])
  const [sidebarTab, setSidebarTab] = useState<'rooms' | 'users'>('rooms')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDisplayName, setNewRoomDisplayName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newRoomIcon, setNewRoomIcon] = useState('💬')
  const [creatingRoom, setCreatingRoom] = useState(false)

  // Refs
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          window.location.href = '/login'
          return
        }
        setUser(data.user)
        connectSocket(data.user)
      })
      .catch(() => window.location.href = '/login')

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  // Fetch rooms and proposals
  useEffect(() => {
    if (user) {
      fetchRooms()
      fetchProposals()
    }
  }, [user])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  // Auto-join lobby when rooms load and socket is ready
  useEffect(() => {
    if (rooms.length > 0 && connected && !currentRoom && socketRef.current) {
      const lobby = rooms.find(r => r.name === 'lobby') || rooms[0]
      socketRef.current.emit('joinRoom', { roomId: lobby.id })
    }
  }, [rooms, connected, currentRoom])

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/rooms/proposals')
      const data = await res.json()
      setProposals(data.proposals || [])
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => {
      setActiveMenu(null)
      setActiveEmojiPicker(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Handle paste for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await uploadImage(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [currentRoom])

  // ============================================
  // Socket Connection
  // ============================================

  const connectSocket = (userData: any) => {
    const sessionToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1]

    if (!sessionToken) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { sessionToken },
      transports: ['websocket'],
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Messages
    socket.on('message', (msg: Message) => {
      setMessages(prev => [...prev.slice(-199), msg])
    })

    socket.on('messageEdited', (data: { messageId: string; content: string; isEdited: boolean }) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, text: data.content, isEdited: true } 
          : m
      ))
    })

    socket.on('messageDeleted', (data: { messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, isDeleted: true, text: '[message deleted]' } 
          : m
      ))
    })

    socket.on('messageReacted', (data: { messageId: string; reactions: Reaction[] }) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, reactions: data.reactions } 
          : m
      ))
    })

    // Users
    socket.on('userJoin', ({ user }: { user: User }) => {
      setUsers(prev => [...prev.filter(u => u.userId !== user.userId), user])
    })

    socket.on('userLeave', ({ userId }: { userId: string }) => {
      setUsers(prev => prev.filter(u => u.userId !== userId))
    })

    socket.on('userTyping', (data: { userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }]
          }
          return prev
        } else {
          return prev.filter(u => u.userId !== data.userId)
        }
      })
    })

    // Broadcast
    socket.on('broadcastStarted', ({ userId, username }: { userId: string; username: string }) => {
      // Someone else started broadcasting
    })

    socket.on('viewRequest', (request: ViewRequest) => {
      setViewRequests(prev => [...prev, request])
    })

    socket.on('viewerJoined', ({ viewerCount }: { viewerCount: number }) => {
      setViewerCount(viewerCount)
    })

    socket.on('roomJoined', ({ room }: { room: any }) => {
      setCurrentRoom(room.id)
    })

    socketRef.current = socket
  }

  // ============================================
  // Image Upload
  // ============================================

  const uploadImage = async (file: File) => {
    if (!currentRoom || uploadingImage) return

    setUploadingImage(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1]

        // Upload to Imgur
        const response = await fetch('/api/upload/imgur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, type: 'base64' }),
        })

        const data = await response.json()

        if (data.success) {
          // Send image message
          socketRef.current?.emit('message', {
            content: '',
            roomId: currentRoom,
            imageUrl: data.link,
            type: 'image',
          })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload failed:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  // ============================================
  // Message Actions
  // ============================================

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !socketRef.current || !currentRoom) return

    if (editing) {
      // Edit existing message
      socketRef.current.emit('editMessage', {
        messageId: editing.messageId,
        content: input.trim(),
      })
      setEditing(null)
    } else {
      // New message
      socketRef.current.emit('message', {
        content: input.trim(),
        roomId: currentRoom,
        replyToId: replying?.messageId,
      })
      setReplying(null)
    }

    setInput('')
  }

  const startEditing = (msg: Message) => {
    setEditing({ messageId: msg._id, content: msg.text })
    setInput(msg.text)
    inputRef.current?.focus()
  }

  const cancelEditing = () => {
    setEditing(null)
    setInput('')
  }

  const deleteMessage = (messageId: string) => {
    socketRef.current?.emit('deleteMessage', { messageId })
    setActiveMenu(null)
  }

  const addReaction = (messageId: string, emoji: string) => {
    socketRef.current?.emit('addReaction', { messageId, emoji })
    setActiveEmojiPicker(null)
  }

  const startReplying = (msg: Message) => {
    setReplying({ messageId: msg._id, name: msg.name, text: msg.text })
    inputRef.current?.focus()
    setActiveMenu(null)
  }

  const handleTyping = () => {
    if (!socketRef.current || !currentRoom) return

    socketRef.current.emit('typing', { roomId: currentRoom, isTyping: true })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { roomId: currentRoom, isTyping: false })
    }, 2000)
  }

  // ============================================
  // Room Management Actions
  // ============================================

  const joinRoom = (roomId: string) => {
    if (!socketRef.current) return
    socketRef.current.emit('joinRoom', { roomId })
  }

  const createProposal = async () => {
    if (!newRoomName.trim() || !newRoomDisplayName.trim() || !user) return

    setCreatingRoom(true)
    try {
      const res = await fetch('/api/rooms/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          displayName: newRoomDisplayName,
          description: newRoomDescription,
          icon: newRoomIcon,
          userId: user.id,
        }),
      })

      const data = await res.json()
      
      if (data.proposal) {
        setProposals(prev => [data.proposal, ...prev])
        setShowCreateRoom(false)
        setNewRoomName('')
        setNewRoomDisplayName('')
        setNewRoomDescription('')
        setNewRoomIcon('💬')
      }
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setCreatingRoom(false)
    }
  }

  const sponsorProposal = async (proposalId: string) => {
    if (!user) return
    
    try {
      const res = await fetch(`/api/rooms/proposals/${proposalId}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await res.json()

      if (data.room) {
        // Room was created! Refresh
        fetchRooms()
        fetchProposals()
      } else if (data.success) {
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { ...p, sponsorCount: data.sponsorCount }
            : p
        ))
      }
    } catch (error) {
      console.error('Failed to sponsor proposal:', error)
    }
  }

  const hasSponsored = (proposal: RoomProposal) => {
    return proposal.sponsors.some(s => s.userId === user?.id)
  }

  const timeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h left`
  }

  // ============================================
  // Broadcast Actions
  // ============================================

  const startBroadcast = async () => {
    if (!socketRef.current) return

    socketRef.current.emit('startBroadcast', { source: 'camera', locked: isLocked }, 
      (res: { success: boolean; token?: string; roomName?: string; message?: string }) => {
        if (res.success && res.token) {
          setIsBroadcasting(true)
          setLivekitToken(res.token)
          setLivekitRoom(res.roomName ?? null)
        }
      }
    )
  }

  const stopBroadcast = () => {
    socketRef.current?.emit('stopBroadcast', () => {
      setIsBroadcasting(false)
      setLivekitToken(null)
      setLivekitRoom(null)
      setViewerCount(0)
      setViewRequests([])
    })
  }

  const toggleLock = () => {
    if (!socketRef.current || !isBroadcasting) return
    socketRef.current.emit('lockBroadcast', { locked: !isLocked }, () => {
      setIsLocked(!isLocked)
    })
  }

  const approveViewer = (viewerId: string, approved: boolean) => {
    if (!socketRef.current) return
    socketRef.current.emit('viewResponse', { viewerId, approved })
    setViewRequests(prev => prev.filter(r => r.viewerId !== viewerId))
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  // ============================================
  // Render
  // ============================================

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <span className="font-semibold gradient-text">GirlyPopChat</span>
          {connected && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Connected</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isBroadcasting && (
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                LIVE • {viewerCount} viewers
              </span>
              <button
                onClick={toggleLock}
                className={`text-xs px-2 py-1 rounded ${isLocked ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {isLocked ? '🔒 Locked' : '🔓 Open'}
              </button>
            </div>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r flex flex-col shrink-0">
          {/* Tabs */}
          <div className="p-2 border-b flex gap-1">
            <button
              onClick={() => setSidebarTab('rooms')}
              className={`flex-1 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 ${
                sidebarTab === 'rooms'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Hash className="w-3 h-3" />
              Rooms
            </button>
            <button
              onClick={() => setSidebarTab('users')}
              className={`flex-1 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 ${
                sidebarTab === 'users'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <User className="w-3 h-3" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded"
              title="Propose Room"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {sidebarTab === 'rooms' ? (
              <div className="p-2 space-y-1">
                {/* Active Rooms */}
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => joinRoom(room.id)}
                    className={`w-full p-2 rounded-lg text-left transition-colors ${
                      currentRoom === room.id
                        ? 'bg-pink-100 border border-pink-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{room.icon || '💬'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{room.displayName}</div>
                        <div className="text-xs text-gray-400">@{room.name}</div>
                      </div>
                      {room.isNSFW && <span className="text-xs">🔞</span>}
                    </div>
                  </button>
                ))}
                
                {/* Pending Proposals */}
                {proposals.length > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-xs font-medium text-gray-400 px-2 mb-1">Pending Proposals</div>
                    {proposals.map(proposal => (
                      <div key={proposal.id} className="p-2 rounded-lg bg-gray-50 mb-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{proposal.displayName}</span>
                          {proposal.expiresAt && (
                            <span className="text-xs text-gray-400">{timeRemaining(proposal.expiresAt)}</span>
                          )}
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full gradient-bg"
                            style={{ width: `${(proposal.sponsorCount / REQUIRED_SPONSORS) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {proposal.sponsorCount}/{REQUIRED_SPONSORS} sponsors
                          </span>
                          {hasSponsored(proposal) ? (
                            <span className="text-xs text-green-600">✓ Sponsored</span>
                          ) : (
                            <button
                              onClick={() => sponsorProposal(proposal.id)}
                              className="text-xs px-2 py-0.5 gradient-bg text-white rounded"
                            >
                              Sponsor
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {rooms.length === 0 && proposals.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No rooms yet
                    <p className="text-xs mt-1">Propose one to get started!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2">
                {users.map(u => (
                  <div key={u.userId} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm truncate">{u.displayName || u.username}</span>
                    {u.cam > 0 && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Requests */}
          {viewRequests.length > 0 && (
            <div className="border-t p-3 space-y-2">
              <div className="text-xs font-medium text-gray-500">View Requests</div>
              {viewRequests.map(r => (
                <div key={r.viewerId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm truncate">{r.viewerName}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => approveViewer(r.viewerId, true)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => approveViewer(r.viewerId, false)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Broadcast Controls */}
          <div className="p-3 border-t">
            {isBroadcasting ? (
              <button
                onClick={stopBroadcast}
                className="w-full py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Stop Broadcast
              </button>
            ) : (
              <button
                onClick={startBroadcast}
                className="w-full py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                Go Live
              </button>
            )}
          </div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-2">
            {messages.map(msg => (
              <MessageComponent
                key={msg._id}
                message={msg}
                currentUserId={user.id}
                isOwn={msg.userId === user.id}
                onEdit={() => startEditing(msg)}
                onDelete={() => deleteMessage(msg._id)}
                onReply={() => startReplying(msg)}
                onReaction={(emoji) => addReaction(msg._id, emoji)}
                onImageClick={setPreviewImage}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                activeEmojiPicker={activeEmojiPicker}
                setActiveEmojiPicker={setActiveEmojiPicker}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="text-xs text-gray-500 italic px-2">
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          {/* Reply/Edit indicator */}
          {(replying || editing) && (
            <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Edit2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Editing message</span>
                  </>
                ) : replying ? (
                  <>
                    <Reply className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Replying to <span className="font-medium">{replying.name}</span>
                    </span>
                  </>
                ) : null}
              </div>
              <button
                onClick={() => {
                  setReplying(null)
                  setEditing(null)
                  setInput('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  handleTyping()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (editing) cancelEditing()
                    if (replying) setReplying(null)
                  }
                }}
                placeholder={uploadingImage ? "Uploading image..." : "Type a message... (paste image to upload)"}
                disabled={uploadingImage}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || uploadingImage}
              className="px-4 py-2 gradient-bg text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? 'Save' : 'Send'}
            </button>
          </form>
        </main>

        {/* Video Panel */}
        <aside className="w-80 bg-gray-900 flex flex-col shrink-0">
          {isBroadcasting && livekitToken ? (
            <LiveKitRoom
              token={livekitToken}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ''}
              connect={true}
              video={true}
              audio={true}
              className="flex-1"
            >
              <VideoConference />
            </LiveKitRoom>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white text-center">
              <div>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-3xl opacity-30">📹</span>
                </div>
                <p className="text-sm text-gray-500">Click "Go Live" to start</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateRoom(false)}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Propose a Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-pink-50 rounded-lg p-3 text-sm text-pink-700">
              <strong>How it works:</strong> You need {REQUIRED_SPONSORS} people to sponsor your room proposal before it becomes real. Share it with friends!
            </div>

            <div className="space-y-3">
              {/* Icon picker */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {['💬', '🎮', '🎵', '📸', '💼', '🎨', '📚', '🍿', '🌍', '❤️', '🔥', '✨'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewRoomIcon(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        newRoomIcon === emoji 
                          ? 'bg-pink-100 border-2 border-pink-400' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room name */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Room URL Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-cool-room"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, numbers, hyphens only</p>
              </div>

              {/* Display name */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={newRoomDisplayName}
                  onChange={e => setNewRoomDisplayName(e.target.value)}
                  placeholder="My Cool Room"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description (optional)</label>
                <input
                  type="text"
                  value={newRoomDescription}
                  onChange={e => setNewRoomDescription(e.target.value)}
                  placeholder="A place to talk about..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={createProposal}
              disabled={!newRoomName.trim() || !newRoomDisplayName.trim() || creatingRoom}
              className="w-full py-2.5 gradient-bg text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {creatingRoom ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Message Component
// ============================================

interface MessageProps {
  message: Message
  currentUserId: string
  isOwn: boolean
  onEdit: () => void
  onDelete: () => void
  onReply: () => void
  onReaction: (emoji: string) => void
  onImageClick: (url: string) => void
  activeMenu: string | null
  setActiveMenu: (id: string | null) => void
  activeEmojiPicker: string | null
  setActiveEmojiPicker: (id: string | null) => void
}

function MessageComponent({
  message,
  currentUserId,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  onReaction,
  onImageClick,
  activeMenu,
  setActiveMenu,
  activeEmojiPicker,
  setActiveEmojiPicker,
}: MessageProps) {
  const menuOpen = activeMenu === message._id
  const emojiPickerOpen = activeEmojiPicker === message._id

  if (message.isDeleted) {
    return (
      <div className="flex gap-2 opacity-50">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs shrink-0">
          ?
        </div>
        <div className="text-sm text-gray-400 italic">
          [message deleted]
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex gap-2 ${isOwn ? '' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
        {message.name[0]?.toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{message.displayName || message.name}</span>
          {message.badge && (
            <span className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded">
              {message.badge}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> edited
            </span>
          )}
        </div>

        {/* Reply reference */}
        {message.replyTo && (
          <div className="text-xs text-gray-500 border-l-2 border-gray-300 pl-2 mb-1 bg-gray-50 py-1 rounded-r">
            <span className="font-medium">{message.replyTo.name}</span>: {message.replyTo.text.slice(0, 50)}
            {message.replyTo.text.length > 50 && '...'}
          </div>
        )}

        {/* Image */}
        {message.imageUrl && (
          <div className="my-2">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(message.imageUrl!)}
            />
          </div>
        )}

        {/* Text */}
        {message.text && (
          <p className="text-sm text-gray-700 break-words">{message.text}</p>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => onReaction(r.emoji)}
                className={`text-xs px-1.5 py-0.5 rounded-full border ${
                  r.userIds.includes(currentUserId)
                    ? 'bg-pink-50 border-pink-300'
                    : 'bg-gray-50 border-gray-200'
                } hover:border-pink-400 transition-colors`}
              >
                {r.emoji} {r.userIds.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 shrink-0">
        {/* Quick react */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onReaction('❤️')
          }}
          className="p-1 text-gray-400 hover:text-pink-500 rounded hover:bg-gray-100"
          title="Heart react"
        >
          <span className="text-sm">❤️</span>
        </button>

        {/* Emoji picker toggle */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActiveEmojiPicker(emojiPickerOpen ? null : message._id)
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {emojiPickerOpen && (
            <div 
              className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border p-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap gap-1 w-48">
                {EMOJI_CATEGORIES.reactions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reply */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onReply()
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenu(menuOpen ? null : message._id)
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div 
              className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border py-1 w-36 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwn && (
                <button
                  onClick={() => {
                    onEdit()
                    setActiveMenu(null)
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => {
                    onDelete()
                    setActiveMenu(null)
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.text)
                  setActiveMenu(null)
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              {message.imageUrl && (
                <a
                  href={message.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setActiveMenu(null)}
                >
                  <ExternalLink className="w-3 h-3" /> Open image
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
