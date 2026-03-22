import { NextRequest, NextResponse } from 'next/server'

const VALID_PROVIDERS = ['google', 'discord', 'apple']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
  const inviteCode = request.nextUrl.searchParams.get('invite')
  const returnTo = request.nextUrl.searchParams.get('return_to')
  
  const callbackUrl = `${appUrl}/api/auth/callback`

  const stytchBase = 'https://api.stytch.com/v1/public/oauth'
  const url = new URL(`${stytchBase}/${provider}/start`)
  url.searchParams.set('public_token', publicToken!)
  url.searchParams.set('login_redirect_url', callbackUrl)
  url.searchParams.set('signup_redirect_url', callbackUrl)

  const response = NextResponse.redirect(url.toString())
  
  if (returnTo?.startsWith('https://console.girlypopchat.com')) {
    response.cookies.set('return_to', returnTo, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
    })
  }
  
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
}
