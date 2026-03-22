import { db } from './db'
import { getCircleTier, type CircleTier } from './circles'

export async function canDm(senderId: string, recipientId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (senderId === recipientId) return { allowed: false, reason: 'Cannot DM yourself' }

  const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { allowDmsFrom: true } })
  if (!recipient) return { allowed: false, reason: 'User not found' }

  const setting = recipient.allowDmsFrom

  if (setting === 'nobody') return { allowed: false, reason: 'This user has DMs turned off' }
  if (setting === 'anyone') return { allowed: true }

  const tier = await getCircleTier(recipientId, senderId)

  if (setting === 'moots' && (tier === 'moot' || tier === 'bestie')) return { allowed: true }
  if (setting === 'besties' && tier === 'bestie') return { allowed: true }

  return { allowed: false, reason: 'You need to be in this user\'s circle to DM them' }
}

export async function getOrCreateConversation(userAId: string, userBId: string) {
  const [lo, hi] = userAId < userBId ? [userAId, userBId] : [userBId, userAId]

  let conv = await db.directConversation.findUnique({
    where: { userAId_userBId: { userAId: lo, userBId: hi } },
  })

  if (!conv) {
    conv = await db.directConversation.create({
      data: { userAId: lo, userBId: hi },
    })
  }

  return conv
}

export function getOtherUserId(conv: { userAId: string; userBId: string }, myId: string) {
  return conv.userAId === myId ? conv.userBId : conv.userAId
}
