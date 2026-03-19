// Logout
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value

  if (sessionToken) {
    await db.session.deleteMany({ where: { stytchSession: sessionToken } })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')
  response.cookies.delete('user_id')
  return response
}
