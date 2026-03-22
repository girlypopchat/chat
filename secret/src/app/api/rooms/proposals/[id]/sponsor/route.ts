// Sponsor a Room Proposal
// When 5 sponsors are reached, automatically create the room

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const REQUIRED_SPONSORS = 5

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get the proposal
    const proposal = await db.roomProposal.findUnique({
      where: { id: proposalId },
      include: { sponsors: true }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Proposal is no longer pending' }, { status: 400 })
    }

    // Check if expired
    if (proposal.expiresAt && proposal.expiresAt < new Date()) {
      await db.roomProposal.update({
        where: { id: proposalId },
        data: { status: 'expired' }
      })
      return NextResponse.json({ error: 'Proposal has expired' }, { status: 400 })
    }

    // Check if user already sponsored
    const existingSponsor = proposal.sponsors.find(s => s.userId === userId)
    if (existingSponsor) {
      return NextResponse.json({ 
        error: 'You have already sponsored this proposal',
        sponsorCount: proposal.sponsorCount,
        sponsorsNeeded: REQUIRED_SPONSORS - proposal.sponsorCount
      }, { status: 400 })
    }

    // Add sponsor
    await db.roomProposalSponsor.create({
      data: {
        proposalId,
        userId
      }
    })

    const newSponsorCount = proposal.sponsorCount + 1

    // Check if we have enough sponsors
    if (newSponsorCount >= REQUIRED_SPONSORS) {
      // Collect all sponsor user IDs as guardians
      const allSponsors = await db.roomProposalSponsor.findMany({
        where: { proposalId },
        select: { userId: true },
      })
      const guardianIds = allSponsors.map(s => s.userId)

      // Create the room!
      const newRoom = await db.room.create({
        data: {
          name: proposal.name,
          displayName: proposal.displayName,
          description: proposal.description,
          icon: proposal.icon,
          roomType: proposal.roomType,
          accessMode: proposal.accessMode,
          vibePreset: proposal.vibePreset,
          isNSFW: proposal.isNSFW,
          ownerId: proposal.createdById,
          isPublic: proposal.accessMode !== 'secret',
          guardians: JSON.stringify(guardianIds),
        }
      })

      // Update proposal status
      await db.roomProposal.update({
        where: { id: proposalId },
        data: {
          status: 'approved',
          sponsorCount: newSponsorCount,
          createdRoomId: newRoom.id
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Room created!',
        room: newRoom,
        sponsorCount: newSponsorCount,
        sponsorsNeeded: 0
      })
    }

    // Just update sponsor count
    await db.roomProposal.update({
      where: { id: proposalId },
      data: { sponsorCount: newSponsorCount }
    })

    return NextResponse.json({
      success: true,
      message: 'Sponsorship added!',
      sponsorCount: newSponsorCount,
      sponsorsNeeded: REQUIRED_SPONSORS - newSponsorCount
    })
  } catch (error) {
    console.error('Failed to sponsor proposal:', error)
    return NextResponse.json({ error: 'Failed to sponsor proposal' }, { status: 500 })
  }
}

// Remove sponsorship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const proposal = await db.roomProposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Can't remove if already approved
    if (proposal.status === 'approved') {
      return NextResponse.json({ error: 'Cannot remove sponsorship from approved proposal' }, { status: 400 })
    }

    // Remove sponsorship
    await db.roomProposalSponsor.deleteMany({
      where: { proposalId, userId }
    })

    const newSponsorCount = Math.max(0, proposal.sponsorCount - 1)

    await db.roomProposal.update({
      where: { id: proposalId },
      data: { sponsorCount: newSponsorCount }
    })

    return NextResponse.json({
      success: true,
      sponsorCount: newSponsorCount,
      sponsorsNeeded: REQUIRED_SPONSORS - newSponsorCount
    })
  } catch (error) {
    console.error('Failed to remove sponsorship:', error)
    return NextResponse.json({ error: 'Failed to remove sponsorship' }, { status: 500 })
  }
}
