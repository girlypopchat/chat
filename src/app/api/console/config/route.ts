import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../auth'

export async function GET(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await db.appConfig.findMany()
  const map = Object.fromEntries(configs.map(c => [c.key, c.value]))

  return NextResponse.json({
    registrationOpen: map.registrationOpen === 'true',
    betaMessage: map.betaMessage || '',
    maxInvitesPerUser: parseInt(map.maxInvitesPerUser || '3'),
  })
}

export async function POST(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const updates: { key: string; value: string }[] = []
  if (body.registrationOpen !== undefined) updates.push({ key: 'registrationOpen', value: String(body.registrationOpen) })
  if (body.betaMessage !== undefined) updates.push({ key: 'betaMessage', value: body.betaMessage })
  if (body.maxInvitesPerUser !== undefined) updates.push({ key: 'maxInvitesPerUser', value: String(body.maxInvitesPerUser) })

  await Promise.all(updates.map(({ key, value }) =>
    db.appConfig.upsert({ where: { key }, update: { value }, create: { key, value } })
  ))

  return NextResponse.json({ success: true })
}
