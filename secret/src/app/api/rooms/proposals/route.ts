// Room Proposals API
// Create and list room proposals (need 5 sponsors to create a room)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const REQUIRED_SPONSORS = 5

// GET /api/rooms/proposals - List pending proposals
export async function GET(request: NextRequest) {
  try {
    const proposals = await db.roomProposal.findMany({
      where: {
        status: 'pending',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        sponsors: {
          select: {
            userId: true,
            user: {
              select: { username: true, displayName: true, avatar: true }
            }
          }
        },
        createdBy: {
          select: { username: true, displayName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ proposals })
  } catch (error) {
    console.error('Failed to fetch proposals:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}

// POST /api/rooms/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, displayName, description, icon, isNSFW, userId } = body

    if (!name || !displayName || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if room name already exists
    const existingRoom = await db.room.findUnique({ where: { name } })
    if (existingRoom) {
      return NextResponse.json({ error: 'Room name already taken' }, { status: 400 })
    }

    // Check if there's already a pending proposal with this name
    const existingProposal = await db.roomProposal.findFirst({
      where: { name, status: 'pending' }
    })
    if (existingProposal) {
      return NextResponse.json({ error: 'Proposal already exists for this name' }, { status: 400 })
    }

    // Create proposal (creator is automatically first sponsor)
    const proposal = await db.roomProposal.create({
      data: {
        name,
        displayName,
        description,
        icon,
        isNSFW: isNSFW || false,
        createdById: userId,
        sponsorCount: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        sponsors: {
          create: {
            userId: userId
          }
        }
      },
      include: {
        sponsors: {
          select: {
            userId: true,
            user: { select: { username: true, displayName: true, avatar: true } }
          }
        }
      }
    })

    return NextResponse.json({ 
      proposal,
      sponsorsNeeded: REQUIRED_SPONSORS - proposal.sponsorCount 
    })
  } catch (error) {
    console.error('Failed to create proposal:', error)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }
}
