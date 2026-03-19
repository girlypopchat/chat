import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET() {
  try {
    const stats = await db.waitlistEntry.aggregate({
      _count: true,
      _sum: {
        referralCount: true,
      },
    })

    return NextResponse.json({
      total: stats._count,
      referrals: stats._sum.referralCount || 0,
    })
  } catch (error) {
    console.error('Get waitlist stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, referralCode } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    const existing = await db.waitlistEntry.findUnique({
      where: { email },
    })

    if (existing) {
      const position = await db.waitlistEntry.count({
        where: { createdAt: { lt: existing.createdAt } },
      }) + 1

      return NextResponse.json({
        success: true,
        referralCode: existing.referralCode,
        position,
        alreadyJoined: true,
      })
    }

    const entry = await db.waitlistEntry.create({
      data: {
        email,
        referralCode: nanoid(8),
        referredBy: referralCode || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    if (referralCode) {
      await db.waitlistEntry.updateMany({
        where: { referralCode },
        data: { referralCount: { increment: 1 } },
      })
    }

    const position = await db.waitlistEntry.count({
      where: { createdAt: { lt: entry.createdAt } },
    }) + 1

    return NextResponse.json({
      success: true,
      referralCode: entry.referralCode,
      position,
    })
  } catch (error) {
    console.error('Join waitlist error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
