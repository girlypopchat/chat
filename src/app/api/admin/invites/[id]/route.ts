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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await db.inviteCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete invite code error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete invite code' },
      { status: 500 }
    )
  }
}
