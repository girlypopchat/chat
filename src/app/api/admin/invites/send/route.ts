import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function getAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null
  const session = await db.session.findUnique({ where: { stytchSession: token }, include: { user: true } })
  if (!session || session.expiresAt < new Date()) return null
  if (!['admin','moderator'].includes(session.user.role)) return null
  return session.user
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, message } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    let code = ''
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    await db.inviteCode.create({
      data: {
        code,
        maxUses: 1,
        expiresAt,
        createdById: admin.id,
      },
    })

    const inviterName = admin.displayName || admin.username
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're invited to GirlyPopChat! 💖</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#fce7f3,#e9d5ff 50%,#dbeafe);min-height:100%"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:white;border-radius:20px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05)"><div style="text-align:center;margin-bottom:30px"><div style="width:80px;height:80px;background:linear-gradient(135deg,#ec4899,#8b5cf6);border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center"><span style="font-size:40px">💌</span></div><h1 style="margin:0;font-size:28px;color:#1f2937">You're Invited!</h1><p style="margin:10px 0 0;color:#6b7280;font-size:16px">Join GirlyPopChat beta</p></div><p style="color:#374151;line-height:1.6;margin-bottom:20px"><strong>${inviterName}</strong> wants you to join the fun!</p>${message ? `<p style="color:#374151;line-height:1.6;margin-bottom:20px;font-style:italic;color:#6b7280">"${message}"</p>` : ''}<p style="color:#374151;line-height:1.6;margin-bottom:20px">We're building the coziest social platform and we'd love for you to be part of our beta. Here's your exclusive invite code:</p><div style="background:linear-gradient(135deg,#fdf4ff,#f5f3ff);border:2px dashed #c084fc;border-radius:12px;padding:25px;text-align:center;margin:25px 0"><p style="margin:0;font-size:32px;font-weight:700;color:#7c3aed;letter-spacing:3px">${code}</p></div><p style="color:#6b7280;font-size:14px;margin:20px 0">Use this code when signing up:</p><div style="text-align:center;margin:30px 0"><a href="${appUrl}/login?invite=${code}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px">Sign Up Now →</a></div><p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:30px">This invite code is single-use and expires in 30 days.</p></div></div></body></html>`

    await resend.emails.send({
      from: 'GirlyPopChat <noreply@girlypopchat.com>',
      to: email,
      subject: "You're invited to GirlyPopChat! 💖",
      html,
    })

    return NextResponse.json({ success: true, code })
  } catch (error: any) {
    console.error('Send invite email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invite email' },
      { status: 500 }
    )
  }
}
