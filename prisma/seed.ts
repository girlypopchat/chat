// Database seed - Creates default rooms
// Run with: bun run db:seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_ROOMS = [
  {
    name: 'lobby',
    displayName: 'Lobby',
    description: 'Welcome to GirlyPopChat! Hang out and meet people.',
    icon: '🏠',
    isPublic: true,
    isNSFW: false,
  },
  {
    name: 'general',
    displayName: 'General Chat',
    description: 'Random conversations about anything and everything.',
    icon: '💬',
    isPublic: true,
    isNSFW: false,
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    description: 'Talk about games, find teammates, share clips.',
    icon: '🎮',
    isPublic: true,
    isNSFW: false,
  },
  {
    name: 'music',
    displayName: 'Music',
    description: 'Share what you\'re listening to, discover new artists.',
    icon: '🎵',
    isPublic: true,
    isNSFW: false,
  },
  {
    name: 'selfies',
    displayName: 'Selfies',
    description: 'Share your pics, get compliments 💅',
    icon: '📸',
    isPublic: true,
    isNSFW: false,
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create a system user to own the default rooms
  const systemUser = await prisma.user.upsert({
    where: { username: 'system' },
    update: {},
    create: {
      username: 'system',
      stytchId: 'system-user',
      role: 'admin',
      trustScore: 100,
    },
  })

  console.log('✅ System user created')

  // Create default rooms
  for (const room of DEFAULT_ROOMS) {
    const created = await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: {
        ...room,
        ownerId: systemUser.id,
      },
    })
    console.log(`✅ Room: ${created.displayName}`)
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
