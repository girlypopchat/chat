import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../auth'

export async function GET(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const filter = searchParams.get('filter') || 'all'

  const where: any = {}
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { displayName: { contains: search } },
    ]
  }
  if (filter === 'banned') where.isBanned = true
  if (filter === 'admins') where.role = { in: ['admin', 'moderator'] }
  if (filter === 'unverified') where.ageVerified = false

  const users = await db.user.findMany({
    where,
    orderBy: { joinedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      role: true,
      trustScore: true,
      isBanned: true,
      bannedReason: true,
      ageVerified: true,
      identitySetup: true,
      joinedAt: true,
      lastOnlineAt: true,
      messagesCount: true,
      inviteCodeUsed: true,
      _count: { select: { invitedUsers: true } },
    },
  })

  return NextResponse.json({ users })
}
