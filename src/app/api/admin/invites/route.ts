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
    const codes = await db.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(codes)
  } catch (error: any) {
    console.error('Get invite codes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get invite codes' },
      { status: 500 }
    )
  }
}
