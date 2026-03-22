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

export async function POST(request: NextRequest) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { count = 10, maxUses = 1, expiresInDays = 30 } = body

    if (count < 1 || count > 50) {
      return NextResponse.json({ error: 'Count must be between 1 and 50' }, { status: 400 })
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    const codes = []

    for (let i = 0; i < count; i++) {
      let code = ''
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      await db.inviteCode.create({
        data: {
          code,
          maxUses,
          expiresAt,
          createdById: admin.id,
        },
      })
      codes.push(code)
    }

    return NextResponse.json({ success: true, codes })
  } catch (error: any) {
    console.error('Generate invite codes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate invite codes' },
      { status: 500 }
    )
  }
}
