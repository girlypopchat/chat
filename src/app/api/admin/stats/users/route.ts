import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

async function getAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null
  const session = await db.session.findUnique({ where: { stytchSession: token }, include: { user: true } })
  if (!session || session.expiresAt < new Date()) return null
  if (!['admin','moderator'].includes(session.user.role)) return null
  return session.user
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [count, active] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { lastOnlineAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } }),
    ])

    return NextResponse.json({ count, active })
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get user stats' },
      { status: 500 }
    )
  }
}
