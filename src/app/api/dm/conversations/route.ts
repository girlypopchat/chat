import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { canDm, getOrCreateConversation, getOtherUserId } from '@/lib/dm'

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

  const conversations = await db.directConversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, username: true, displayName: true, avatar: true, genderIcon: true } },
      userB: { select: { id: true, username: true, displayName: true, avatar: true, genderIcon: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
  })

  const unreadCounts = await db.directMessage.groupBy({
    by: ['conversationId'],
    where: { senderId: { not: userId }, isRead: false, conversation: { OR: [{ userAId: userId }, { userBId: userId }] } },
    _count: true,
  })
  const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u._count]))

  const result = conversations.map(c => {
    const other = c.userAId === userId ? c.userB : c.userA
    const lastMsg = c.messages[0] || null
    return {
      id: c.id,
      otherUser: other,
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId } : null,
      unreadCount: unreadMap.get(c.id) || 0,
    }
  })

  return NextResponse.json({ conversations: result })
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { targetId } = await request.json()
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })

  const check = await canDm(userId, targetId)
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const conv = await getOrCreateConversation(userId, targetId)

  const other = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, displayName: true, avatar: true, genderIcon: true },
  })

  return NextResponse.json({ conversation: { id: conv.id, otherUser: other } })
}
