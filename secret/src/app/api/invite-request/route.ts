import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { email, note } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const existing = await db.inviteRequest.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ alreadyRequested: true })
  }

  await db.inviteRequest.create({ data: { email: email.toLowerCase().trim(), note } })
  return NextResponse.json({ success: true })
}
