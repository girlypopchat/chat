// k-ID Age Verification Webhook
import { NextRequest, NextResponse } from 'next/server'
import { handleAgeVerificationWebhook } from '@/lib/age-verification'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const result = await handleAgeVerificationWebhook(payload)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Age webhook error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
