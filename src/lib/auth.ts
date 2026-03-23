// Stytch Authentication Integration
import { Client } from 'stytch'
import { db } from './db'

const stytch = new Client({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
})

export { stytch }

// ============================================
// OAuth Providers
// ============================================

export const OAUTH_PROVIDERS = {
  google: 'google',
  discord: 'discord', 
  apple: 'apple',
} as const

export type OAuthProvider = keyof typeof OAUTH_PROVIDERS

// ============================================
// Start OAuth Flow
// ============================================

export async function startOAuth(provider: OAuthProvider) {
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  
  // @ts-ignore - provider-based OAuth start
  const response = await stytch.oauth[provider as any].start({
    login_redirect_url: redirectUrl,
    signup_redirect_url: redirectUrl,
  })
  
  return response
}

// ============================================
// Authenticate OAuth Callback
// ============================================

export async function authenticateOAuth(token: string) {
  try {
    const response = await stytch.oauth.authenticate({
      token,
      session_duration_minutes: 60 * 24 * 7, // 7 days
    })
    
    return {
      success: true,
      user: response.user,
      session: {
        session_token: (response as any).session_token,
        session_jwt: (response as any).session_jwt,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Authentication failed',
    }
  }
}

// ============================================
// Validate Session
// ============================================

export async function validateSession(sessionToken: string) {
  try {
    const response = await stytch.sessions.authenticate({
      session_token: sessionToken,
    })
    
    return {
      valid: true,
      user: response.user,
      session: response.session,
    }
  } catch {
    return { valid: false }
  }
}

// ============================================
// Revoke Session (Logout)
// ============================================

export async function revokeSession(sessionToken: string) {
  try {
    await stytch.sessions.revoke({ session_token: sessionToken })
    return true
  } catch {
    return false
  }
}

// ============================================
// Get or Create User from Stytch
// ============================================

let _regOpenCache: { value: boolean; ts: number } | null = null

async function isRegistrationOpen(): Promise<boolean> {
  if (_regOpenCache && Date.now() - _regOpenCache.ts < 30_000) return _regOpenCache.value
  try {
    const config = await db.appConfig.findUnique({ where: { key: 'registrationOpen' } })
    const value = config?.value === 'true'
    _regOpenCache = { value, ts: Date.now() }
    return value
  } catch {
    return false
  }
}

export async function getOrCreateUser(stytchUser: any, inviteCode?: string | null) {
  let user = await db.user.findUnique({
    where: { stytchId: stytchUser.user_id },
  })
  
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { lastOnlineAt: new Date() },
    })
    return { user, isNew: false }
  }

  // New user - check invite code before checking REGISTRATION_OPEN
  const email = stytchUser.emails?.[0]?.email
  
  if (inviteCode) {
    const invite = await db.inviteCode.findUnique({
      where: { code: inviteCode },
    })
    
    if (!invite || invite.usedAt || (invite.expiresAt && invite.expiresAt < new Date())) {
      throw new Error('INVALID_INVITE')
    }
  } else if (!await isRegistrationOpen()) {
    throw new Error('REGISTRATION_CLOSED')
  }
  
  let username = email?.split('@')[0] || `user_${stytchUser.user_id.slice(0, 8)}`
  
  const existing = await db.user.findUnique({ where: { username } })
  if (existing) {
    username = `${username}_${Date.now().toString(36)}`
  }
  
  user = await db.user.create({
    data: {
      stytchId: stytchUser.user_id,
      username,
      displayName: stytchUser.name?.first_name 
        ? `${stytchUser.name.first_name}${stytchUser.name.last_name ? ' ' + stytchUser.name.last_name : ''}`
        : username,
      avatar: stytchUser?.providers?.find((p: any) => p.avatar_url)?.avatar_url,
    },
  })
  
  if (inviteCode) {
    await db.inviteCode.update({
      where: { code: inviteCode },
      data: {
        usedById: user.id,
        usedAt: new Date(),
        useCount: { increment: 1 },
      },
    })
  }
  
  return { user, isNew: true, email }
}
