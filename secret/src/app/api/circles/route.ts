import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMyCircles } from '@/lib/circles'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { stytchSession: sessionToken },
  })
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const circles = await getMyCircles(session.userId)
  return NextResponse.json(circles)
}
