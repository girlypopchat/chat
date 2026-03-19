// k-ID / AgeKey Age Verification Integration
// https://docs.k-id.com | https://openageinitiative.org

import { db } from './db'

const KID_API_URL = 'https://api.k-id.com/v1'
const KID_API_KEY = process.env.KID_API_KEY!
const KID_PROJECT_ID = process.env.KID_PROJECT_ID!

// ============================================
// Age Verification Session
// ============================================

interface AgeVerificationSession {
  id: string
  verification_url: string
  expires_at: string
}

export async function createAgeVerificationSession(userId: string): Promise<AgeVerificationSession> {
  const response = await fetch(`${KID_API_URL}/verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KID_API_KEY}`,
    },
    body: JSON.stringify({
      project_id: KID_PROJECT_ID,
      external_user_id: userId,
      verification_methods: [
        'agekey',           // Reusable AgeKey (free/cheap)
        'facial_estimation', // AI face age estimation
        'id_document',       // ID card verification
        'credit_card',       // Credit card verification
      ],
      age_threshold: 18,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/age/webhook`,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create age verification session')
  }
  
  return response.json()
}

// ============================================
// Check AgeKey Status
// ============================================

interface AgeKeyStatus {
  has_valid_agekey: boolean
  age_verified: boolean
  age_threshold?: number
  agekey_id?: string
}

export async function checkAgeKeyStatus(userId: string): Promise<AgeKeyStatus> {
  const response = await fetch(`${KID_API_URL}/users/${userId}/agekey`, {
    headers: {
      'Authorization': `Bearer ${KID_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    return { has_valid_agekey: false, age_verified: false }
  }
  
  return response.json()
}

// ============================================
// Verify AgeKey Token
// ============================================

interface AgeKeyVerification {
  verified: boolean
  age_threshold: number
  verification_method: string
  agekey_token?: string
  verified_at: string
}

export async function verifyAgeKeyToken(token: string): Promise<AgeKeyVerification> {
  const response = await fetch(`${KID_API_URL}/verifications/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KID_API_KEY}`,
    },
    body: JSON.stringify({ token }),
  })
  
  if (!response.ok) {
    return { verified: false, age_threshold: 0, verification_method: '', verified_at: '' }
  }
  
  return response.json()
}

// ============================================
// Handle Webhook from k-ID
// ============================================

export async function handleAgeVerificationWebhook(payload: {
  verification_id: string
  external_user_id: string
  status: 'approved' | 'rejected' | 'pending'
  age_verified: boolean
  age_threshold: number
  verification_method: string
  agekey_token?: string
}) {
  const { external_user_id, age_verified, age_threshold, agekey_token } = payload
  
  if (!age_verified) {
    return { success: false, reason: 'Age not verified' }
  }
  
  // Update user in database
  const user = await db.user.update({
    where: { id: external_user_id },
    data: {
      ageVerified: true,
      ageVerifiedAt: new Date(),
      ageKeyToken: agekey_token,
      ageThreshold: age_threshold,
      trustScore: { increment: 15 }, // Bonus for age verification
    },
  })
  
  return { success: true, user }
}

// ============================================
// Check if User Can Stream
// ============================================

export async function canUserStream(userId: string): Promise<{
  canStream: boolean
  reason?: string
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      ageVerified: true,
      isBanned: true,
      trustScore: true,
    },
  })
  
  if (!user) {
    return { canStream: false, reason: 'User not found' }
  }
  
  if (user.isBanned) {
    return { canStream: false, reason: 'Account is banned' }
  }
  
  if (!user.ageVerified) {
    return { canStream: false, reason: 'Age verification required' }
  }
  
  return { canStream: true }
}

// ============================================
// Quick Age Check (for AgeKey holders)
// ============================================

export async function quickAgeCheck(ageKeyToken: string): Promise<boolean> {
  // This is the sub-cent operation - verify an existing AgeKey
  const response = await fetch(`${KID_API_URL}/agekey/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KID_API_KEY}`,
    },
    body: JSON.stringify({
      agekey_token: ageKeyToken,
      age_threshold: 18,
    }),
  })
  
  const data = await response.json()
  return data.valid === true && data.age >= 18
}
