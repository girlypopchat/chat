// Stytch OAuth Callback Handler
import { NextRequest, NextResponse } from 'next/server'
import { authenticateOAuth, getOrCreateUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', process.env.NEXT_PUBLIC_APP_URL || request.url))
  }

  try {
    const result = await authenticateOAuth(token)

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error || 'auth_failed')}`, request.url)
      )
    }

    const user = await getOrCreateUser(result.user)

    await db.session.create({
      data: {
        userId: user.id,
        stytchSession: result.session?.session_token ?? "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
    const response = NextResponse.redirect(
      new URL('/chat', appUrl)
    )

    response.cookies.set('session_token', result.session?.session_token ?? '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || 'unknown')}`, request.url)
    )
  }
}
