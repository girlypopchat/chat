// Get current user
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const session = await db.session.findUnique({
    where: { stytchSession: sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      username: session.user.username,
      displayName: session.user.displayName,
      avatar: session.user.avatar,
      role: session.user.role,
      trustScore: session.user.trustScore,
      ageVerified: session.user.ageVerified,
      identitySetup: session.user.identitySetup,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      lastNameEmoji: session.user.lastNameEmoji,
      genderIcon: session.user.genderIcon,
      displayMode: session.user.displayMode,
      privacyMode: session.user.privacyMode,
      allowDmsFrom: session.user.allowDmsFrom,
      showOnlineStatus: session.user.showOnlineStatus,
    },
  })
}
