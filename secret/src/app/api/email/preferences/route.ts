import { NextRequest, NextResponse } from 'next/server'
import { updateEmailPreferences, getUserEmailPreferences } from '@/lib/email'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { stytchSession: sessionToken },
      include: { user: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const updates = await request.json()

    const prefs = await updateEmailPreferences(session.userId, updates)

    return NextResponse.json({ success: true, preferences: prefs })
  } catch (error: any) {
    console.error('Update email preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { stytchSession: sessionToken },
    })

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const prefs = await getUserEmailPreferences(session.userId)

    return NextResponse.json({ preferences: prefs })
  } catch (error: any) {
    console.error('Get email preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get preferences' },
      { status: 500 }
    )
  }
}