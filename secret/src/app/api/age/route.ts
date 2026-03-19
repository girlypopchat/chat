// Age Verification API
import { NextRequest, NextResponse } from 'next/server'
import { createAgeVerificationSession, checkAgeKeyStatus } from '@/lib/age-verification'
import { db } from '@/lib/db'

// Get age verification status
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      ageVerified: true,
      ageVerifiedAt: true,
      ageKeyToken: true,
    },
  })

  // Check if they have a valid AgeKey
  if (user?.ageKeyToken) {
    const status = await checkAgeKeyStatus(user.ageKeyToken)
    return NextResponse.json({
      user,
      hasAgeKey: status.has_valid_agekey,
      ageVerified: status.age_verified,
    })
  }

  return NextResponse.json({ user, hasAgeKey: false, ageVerified: false })
}

// Start age verification session
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const session = await createAgeVerificationSession(userId)
    
    return NextResponse.json({
      success: true,
      verification_url: session.verification_url,
      expires_at: session.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create verification session' },
      { status: 500 }
    )
  }
}
