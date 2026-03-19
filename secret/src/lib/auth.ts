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
  
  const response = await // @ts-ignore - provider-based OAuth start
    stytch.oauth[provider as any].start({
    provider: OAUTH_PROVIDERS[provider],
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
      session: (response as any).session,
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

export async function getOrCreateUser(stytchUser: any) {
  // Find existing user
  let user = await db.user.findUnique({
    where: { stytchId: stytchUser.user_id },
  })
  
  if (user) {
    // Update last online
    await db.user.update({
      where: { id: user.id },
      data: { lastOnlineAt: new Date() },
    })
    return user
  }
  
  // Generate username from email or oauth
  const email = stytchUser.emails?.[0]?.email
  let username = email?.split('@')[0] || `user_${stytchUser.user_id.slice(0, 8)}`
  
  // Ensure unique username
  const existing = await db.user.findUnique({ where: { username } })
  if (existing) {
    username = `${username}_${Date.now().toString(36)}`
  }
  
  // Create new user
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
  
  return user
}
