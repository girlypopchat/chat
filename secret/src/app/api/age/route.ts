// Age Verification API
import { NextRequest, NextResponse } from 'next/server'
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

  return NextResponse.json({ user, ageVerified: user?.ageVerified ?? false })
}

// Mark user as age verified
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        ageVerified: true,
        ageVerifiedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify age' },
      { status: 500 }
    )
  }
}
