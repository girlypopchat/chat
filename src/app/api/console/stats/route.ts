import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../auth'

export async function GET(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)

  const [totalUsers, newToday, activeNow, totalInvites, usedInvites, pendingRequests, recentUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { joinedAt: { gte: todayStart } } }),
    db.user.count({ where: { lastOnlineAt: { gte: fifteenMinAgo } } }),
    db.inviteCode.count(),
    db.inviteCode.count({ where: { usedAt: { not: null } } }),
    db.inviteRequest.count({ where: { status: 'pending' } }),
    db.user.findMany({
      orderBy: { joinedAt: 'desc' },
      take: 8,
      select: { id: true, username: true, displayName: true, role: true, joinedAt: true, ageVerified: true },
    }),
  ])

  return NextResponse.json({
    users: { total: totalUsers, today: newToday, activeNow },
    invites: { total: totalInvites, used: usedInvites, available: totalInvites - usedInvites },
    pendingRequests,
    recentUsers,
  })
}
