import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { followUser, unfollowUser, getCircleTier } from '@/lib/circles'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const session = await db.session.findUnique({ where: { stytchSession: sessionToken } })
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const { targetId } = await request.json()
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id: targetId } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    await followUser(session.userId, targetId)
    const tier = await getCircleTier(session.userId, targetId)
    return NextResponse.json({ success: true, tier })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const session = await db.session.findUnique({ where: { stytchSession: sessionToken } })
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const { targetId } = await request.json()
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })

  await unfollowUser(session.userId, targetId)
  const tier = await getCircleTier(session.userId, targetId)
  return NextResponse.json({ success: true, tier })
}
