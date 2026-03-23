import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../../auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action, role, reason } = await request.json()

  if (action === 'ban') {
    await db.user.update({ where: { id }, data: { isBanned: true, bannedAt: new Date(), bannedReason: reason || 'Admin action' } })
  } else if (action === 'unban') {
    await db.user.update({ where: { id }, data: { isBanned: false, bannedAt: null, bannedReason: null } })
  } else if (action === 'setRole') {
    await db.user.update({ where: { id }, data: { role } })
  } else if (action === 'adjustTrust') {
    await db.user.update({ where: { id }, data: { trustScore: { increment: parseInt(reason) } } })
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
