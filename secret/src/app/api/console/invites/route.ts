import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isConsoleAuth } from '../auth'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all' // all, available, used

  const where = filter === 'available'
    ? { usedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
    : filter === 'used'
    ? { usedAt: { not: null } }
    : {}

  const codes = await db.inviteCode.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // get used-by user info separately
  const usedByIds = codes.filter(c => c.usedById).map(c => c.usedById!)
  const users = usedByIds.length > 0
    ? await db.user.findMany({ where: { id: { in: usedByIds } }, select: { id: true, username: true, displayName: true } })
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const result = codes.map(c => ({
    ...c,
    usedBy: c.usedById ? userMap[c.usedById] : null,
  }))

  const stats = await Promise.all([
    db.inviteCode.count(),
    db.inviteCode.count({ where: { usedAt: { not: null } } }),
  ])

  return NextResponse.json({ codes: result, stats: { total: stats[0], used: stats[1], available: stats[0] - stats[1] } })
}

export async function POST(request: NextRequest) {
  if (!isConsoleAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, count, id, email, message } = await request.json()

  if (action === 'generate') {
    const num = Math.min(Math.max(1, count || 1), 50)
    const created = []
    for (let i = 0; i < num; i++) {
      let code = generateCode()
      // retry on collision
      while (await db.inviteCode.findUnique({ where: { code } })) {
        code = generateCode()
      }
      created.push(await db.inviteCode.create({ data: { code, maxUses: 1, useCount: 0 } }))
    }
    return NextResponse.json({ codes: created.map(c => c.code) })
  }

  if (action === 'delete') {
    await db.inviteCode.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }

  if (action === 'send') {
    let code = generateCode()
    while (await db.inviteCode.findUnique({ where: { code } })) code = generateCode()
    const invite = await db.inviteCode.create({
      data: { code, maxUses: 1, useCount: 0, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const signupUrl = `https://girlypopchat.com/?invite=${invite.code}`

    await resend.emails.send({
      from: `GirlyPopChat <${process.env.NEXT_PUBLIC_APP_EMAIL || 'noreply@girlypopchat.com'}>`,
      to: email,
      subject: "You're invited to GirlyPopChat ✨",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
          <div style="text-align:center;margin-bottom:32px">
            <div style="width:64px;height:64px;background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:12px">✨</div>
            <h1 style="margin:0;font-size:24px;font-weight:800">You're invited!</h1>
          </div>
          ${message ? `<p style="color:#555;line-height:1.6;margin-bottom:24px">${message}</p>` : `<p style="color:#555;line-height:1.6;margin-bottom:24px">You've been personally invited to join GirlyPopChat — the invite-only video chat community for good vibes only.</p>`}
          <div style="background:#fdf2f8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Your invite code</p>
            <div style="font-size:36px;font-weight:900;font-family:monospace;color:#ec4899;letter-spacing:.1em">${invite.code}</div>
          </div>
          <a href="${signupUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#ec4899,#a855f7);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:16px">Join GirlyPopChat →</a>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px">Code expires in 30 days. 18+ only.</p>
        </div>
      `,
    })

    // mark invite request as invited if this email was in the queue
    await db.inviteRequest.updateMany({ where: { email, status: 'pending' }, data: { status: 'invited' } }).catch(() => {})

    return NextResponse.json({ success: true, code: invite.code })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
