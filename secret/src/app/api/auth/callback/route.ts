import { NextRequest, NextResponse } from 'next/server'
import { authenticateOAuth, stytch, getOrCreateUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

async function authenticateToken(token: string, tokenType: string) {
  if (tokenType === 'magic_links') {
    const response = await stytch.magicLinks.authenticate({
      token,
      session_duration_minutes: 60 * 24 * 7,
    })
    return {
      success: true,
      user: response.user,
      session: {
        session_token: (response as any).session_token,
        session_jwt: (response as any).session_jwt,
      },
    }
  }
  return authenticateOAuth(token)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const tokenType = searchParams.get('stytch_token_type') || 'oauth'
  const inviteCode = request.cookies.get('invite_code')?.value || searchParams.get('invite')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('x-forwarded-host') || request.headers.get('host')}`

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_token`)
  }

  try {
    const result = await authenticateToken(token, tokenType)

    if (!result.success) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent((result as any).error || 'auth_failed')}`
      )
    }

    const { user, isNew, email } = await getOrCreateUser(result.user, inviteCode)

    await db.session.create({
      data: {
        userId: user.id,
        stytchSession: result.session?.session_token ?? '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    if (isNew && email) {
      sendWelcomeEmail(user.id, email).catch(err => console.error('Welcome email failed:', err))
    }

    const returnTo = request.cookies.get('return_to')?.value

    let dest: string
    if (returnTo) {
      dest = returnTo
    } else if (!user.ageVerified) {
      dest = `${appUrl}/verify`
    } else if (!user.identitySetup) {
      dest = `${appUrl}/setup`
    } else {
      dest = `${appUrl}/chat`
    }

    const response = NextResponse.redirect(dest)

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: '.girlypopchat.com',
    }

    response.cookies.set('session_token', result.session?.session_token ?? '', cookieOpts)
    response.cookies.set('user_id', user.id, { ...cookieOpts, httpOnly: false })
    response.cookies.delete('return_to')
    response.cookies.delete('invite_code')

    return response
  } catch (error: any) {
    console.error('Auth callback error:', error)
    if (error.message === 'REGISTRATION_CLOSED') {
      return NextResponse.redirect(`${appUrl}/login?error=closed`)
    }
    if (error.message === 'INVALID_INVITE') {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_invite`)
    }
    if (error.message === 'INVITE_REQUIRED') {
      return NextResponse.redirect(`${appUrl}/login?error=invite_required`)
    }
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent(error.message || 'unknown')}`
    )
  }
}
