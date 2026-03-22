import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { canDm, getOtherUserId } from '@/lib/dm'

async function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  if (!token) return null
  const session = await db.session.findUnique({ where: { stytchSession: token } })
  if (!session || session.expiresAt < new Date()) return null
  return session.userId
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const conversationId = request.nextUrl.searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  const conv = await db.directConversation.findUnique({ where: { id: conversationId } })
  if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const cursor = request.nextUrl.searchParams.get('cursor')
  const messages = await db.directMessage.findMany({
    where: { conversationId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, username: true, displayName: true, avatar: true } } },
  })

  // Mark as read
  await db.directMessage.updateMany({
    where: { conversationId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages: messages.reverse() })
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { conversationId, content, imageUrl } = await request.json()

  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: 'Message content required' }, { status: 400 })

  const conv = await db.directConversation.findUnique({ where: { id: conversationId } })
  if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const otherId = getOtherUserId(conv, userId)
  const check = await canDm(userId, otherId)
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const message = await db.directMessage.create({
    data: {
      conversationId,
      senderId: userId,
      content: content?.trim() || '',
      imageUrl: imageUrl || null,
    },
    include: { sender: { select: { id: true, username: true, displayName: true, avatar: true } } },
  })

  await db.directConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json({ message })
}
