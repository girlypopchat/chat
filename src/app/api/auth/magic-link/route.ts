import { NextRequest, NextResponse } from 'next/server'
import { stytch } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, inviteCode } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
    const callbackUrl = `${appUrl}/api/auth/callback`

    await stytch.magicLinks.email.loginOrCreate({
      email,
      login_magic_link_url: callbackUrl,
      signup_magic_link_url: callbackUrl,
    })

    const response = NextResponse.json({ success: true })
    
    if (inviteCode) {
      response.cookies.set('invite_code', inviteCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
        domain: '.girlypopchat.com',
      })
    }
    
    return response
  } catch (error: any) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
