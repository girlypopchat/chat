import { db } from './db'

export type CircleTier = 'none' | 'fan' | 'fave' | 'moot' | 'bestie'

export const CIRCLE_TIERS = {
  none: { emoji: '', label: '' },
  fan: { emoji: '👋', label: 'Fan' },
  fave: { emoji: '⭐', label: 'Fave' },
  moot: { emoji: '🌸', label: 'Moot' },
  bestie: { emoji: '💖', label: 'Bestie' },
} as const

export async function getCircleTier(myId: string, theirId: string): Promise<CircleTier> {
  if (myId === theirId) return 'none'

  const [iFollow, theyFollow] = await Promise.all([
    db.follow.findUnique({ where: { followerId_followingId: { followerId: myId, followingId: theirId } } }),
    db.follow.findUnique({ where: { followerId_followingId: { followerId: theirId, followingId: myId } } }),
  ])

  if (iFollow && theyFollow) {
    if (iFollow.isBestie && theyFollow.isBestie) return 'bestie'
    return 'moot'
  }
  if (iFollow) return 'fave'
  if (theyFollow) return 'fan'
  return 'none'
}

export async function getMyCircles(userId: string) {
  const [following, followers] = await Promise.all([
    db.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, displayName: true, avatar: true, genderIcon: true, lastOnlineAt: true } } },
    }),
    db.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, displayName: true, avatar: true, genderIcon: true, lastOnlineAt: true } } },
    }),
  ])

  const followingIds = new Set(following.map(f => f.followingId))
  const followerIds = new Set(followers.map(f => f.followerId))

  const followingMap = new Map(following.map(f => [f.followingId, f]))
  const followerMap = new Map(followers.map(f => [f.followerId, f]))

  const besties: typeof following[0]['following'][] = []
  const moots: typeof following[0]['following'][] = []
  const faves: typeof following[0]['following'][] = []
  const fans: typeof followers[0]['follower'][] = []

  for (const f of following) {
    if (followerIds.has(f.followingId)) {
      const reverse = followerMap.get(f.followingId)!
      if (f.isBestie && reverse.isBestie) {
        besties.push(f.following)
      } else {
        moots.push(f.following)
      }
    } else {
      faves.push(f.following)
    }
  }

  for (const f of followers) {
    if (!followingIds.has(f.followerId)) {
      fans.push(f.follower)
    }
  }

  return { besties, moots, faves, fans }
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('Cannot follow yourself')

  return db.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  })
}

export async function unfollowUser(followerId: string, followingId: string) {
  return db.follow.deleteMany({
    where: { followerId, followingId },
  })
}

export async function toggleBestie(userId: string, targetId: string) {
  const follow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetId } },
  })

  if (!follow) throw new Error('You must follow this user first')

  return db.follow.update({
    where: { id: follow.id },
    data: { isBestie: !follow.isBestie },
  })
}
