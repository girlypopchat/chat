import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../auth'

export async function GET(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  const requests = await db.inviteRequest.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, id, email } = await request.json()

  if (action === 'ignore') {
    await db.inviteRequest.update({ where: { id }, data: { status: 'ignored' } })
    return NextResponse.json({ success: true })
  }

  if (action === 'restore') {
    await db.inviteRequest.update({ where: { id }, data: { status: 'pending' } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
