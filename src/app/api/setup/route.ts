import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LAST_NAMES, GENDER_ICONS } from '@/lib/last-names'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const session = await db.session.findUnique({
    where: { stytchSession: sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const { firstName, lastName, genderIcon, displayMode } = await request.json()

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.trim().length > 30) {
    return NextResponse.json({ error: 'First name must be 1-30 characters' }, { status: 400 })
  }

  const lastNameEntry = LAST_NAMES.find(ln => ln.name === lastName)
  if (!lastNameEntry) {
    return NextResponse.json({ error: 'Invalid last name selection' }, { status: 400 })
  }

  const validGenderIcons = GENDER_ICONS.map(g => g.icon)
  if (genderIcon && !validGenderIcons.includes(genderIcon)) {
    return NextResponse.json({ error: 'Invalid gender icon' }, { status: 400 })
  }

  const validDisplayModes = ['full', 'first_only', 'first_emoji', 'first_last']
  const mode = validDisplayModes.includes(displayMode) ? displayMode : 'full'

  const f = firstName.trim()
  let displayName: string
  switch (mode) {
    case 'first_only': displayName = f; break
    case 'first_emoji': displayName = `${f} ${lastNameEntry.emoji}`; break
    case 'first_last': displayName = `${f} ${lastNameEntry.name}`; break
    default: displayName = `${f} ${lastNameEntry.name} ${lastNameEntry.emoji}`
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      firstName: firstName.trim(),
      lastName: lastNameEntry.name,
      lastNameEmoji: lastNameEntry.emoji,
      genderIcon: genderIcon || null,
      displayMode: mode,
      displayName,
      identitySetup: true,
    },
  })

  return NextResponse.json({ success: true })
}
