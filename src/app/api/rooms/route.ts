// Rooms API
// List all public rooms

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const rooms = await db.room.findMany({
      where: { isPublic: true },
      orderBy: { memberCount: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        icon: true,
        memberCount: true,
        isNSFW: true,
      }
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}
