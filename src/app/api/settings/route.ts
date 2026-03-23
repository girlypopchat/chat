import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LAST_NAMES, GENDER_ICONS } from '@/lib/last-names'

async function getSessionUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null
  const session = await db.session.findUnique({
    where: { stytchSession: sessionToken },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      firstName: user.firstName,
      lastName: user.lastName,
      lastNameEmoji: user.lastNameEmoji,
      genderIcon: user.genderIcon,
      displayMode: user.displayMode,
      privacyMode: user.privacyMode,
      allowDmsFrom: user.allowDmsFrom,
      showOnlineStatus: user.showOnlineStatus,
      identitySetup: user.identitySetup,
      cameraWhitelist: user.cameraWhitelist ? JSON.parse(user.cameraWhitelist) : [],
      cameraBlacklist: user.cameraBlacklist ? JSON.parse(user.cameraBlacklist) : [],
    },
  })
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, any> = {}

  // Identity fields - can't change if already set (identity is locked after setup)
  if (user.identitySetup && (body.firstName !== undefined || body.lastName !== undefined)) {
    return NextResponse.json({ error: 'Identity is locked after setup' }, { status: 403 })
  }

  // Identity fields
  if (body.firstName !== undefined) {
    const f = String(body.firstName).trim()
    if (f.length < 1 || f.length > 30) {
      return NextResponse.json({ error: 'First name must be 1-30 characters' }, { status: 400 })
    }
    updates.firstName = f
  }

  if (body.lastName !== undefined) {
    const entry = LAST_NAMES.find(ln => ln.name === body.lastName)
    if (!entry) return NextResponse.json({ error: 'Invalid last name' }, { status: 400 })
    updates.lastName = entry.name
    updates.lastNameEmoji = entry.emoji
  }

  if (body.genderIcon !== undefined) {
    if (body.genderIcon === null || body.genderIcon === '') {
      updates.genderIcon = null
    } else {
      const valid = GENDER_ICONS.map(g => g.icon)
      if (!valid.includes(body.genderIcon)) {
        return NextResponse.json({ error: 'Invalid gender icon' }, { status: 400 })
      }
      updates.genderIcon = body.genderIcon
    }
  }

  if (body.displayMode !== undefined) {
    const valid = ['full', 'first_only', 'first_emoji', 'first_last']
    if (!valid.includes(body.displayMode)) {
      return NextResponse.json({ error: 'Invalid display mode' }, { status: 400 })
    }
    updates.displayMode = body.displayMode
  }

  if (body.bio !== undefined) {
    updates.bio = String(body.bio).slice(0, 200)
  }

  // Privacy fields
  if (body.privacyMode !== undefined) {
    const valid = ['open', 'private', 'invisible']
    if (!valid.includes(body.privacyMode)) {
      return NextResponse.json({ error: 'Invalid privacy mode' }, { status: 400 })
    }
    updates.privacyMode = body.privacyMode
  }

  if (body.allowDmsFrom !== undefined) {
    const valid = ['anyone', 'moots', 'besties', 'nobody']
    if (!valid.includes(body.allowDmsFrom)) {
      return NextResponse.json({ error: 'Invalid DM setting' }, { status: 400 })
    }
    updates.allowDmsFrom = body.allowDmsFrom
  }

  if (body.showOnlineStatus !== undefined) {
    updates.showOnlineStatus = Boolean(body.showOnlineStatus)
  }

  if (body.cameraWhitelist !== undefined) {
    if (!Array.isArray(body.cameraWhitelist)) {
      return NextResponse.json({ error: 'cameraWhitelist must be an array' }, { status: 400 })
    }
    updates.cameraWhitelist = JSON.stringify(body.cameraWhitelist)
  }

  if (body.cameraBlacklist !== undefined) {
    if (!Array.isArray(body.cameraBlacklist)) {
      return NextResponse.json({ error: 'cameraBlacklist must be an array' }, { status: 400 })
    }
    updates.cameraBlacklist = JSON.stringify(body.cameraBlacklist)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Rebuild displayName if identity fields changed
  const needsDisplayNameRebuild = updates.firstName || updates.lastName || updates.displayMode
  if (needsDisplayNameRebuild) {
    const fn = updates.firstName || user.firstName || ''
    const ln = updates.lastName || user.lastName || ''
    const le = updates.lastNameEmoji || user.lastNameEmoji || ''
    const dm = updates.displayMode || user.displayMode || 'full'
    switch (dm) {
      case 'first_only': updates.displayName = fn; break
      case 'first_emoji': updates.displayName = `${fn} ${le}`; break
      case 'first_last': updates.displayName = `${fn} ${ln}`; break
      default: updates.displayName = `${fn} ${ln} ${le}`
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: updates,
  })

  return NextResponse.json({ success: true, displayName: updated.displayName })
}
