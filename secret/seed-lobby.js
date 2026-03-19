const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  let systemUser = await db.user.findFirst({ where: { username: 'system' } })
  if (!systemUser) {
    systemUser = await db.user.create({
      data: { stytchId: 'system', username: 'system', displayName: 'System', role: 'admin' }
    })
  }
  const existing = await db.room.findUnique({ where: { name: 'lobby' } })
  if (!existing) {
    const room = await db.room.create({
      data: { name: 'lobby', displayName: 'Lobby', description: 'The main room', icon: '✨', ownerId: systemUser.id, isPublic: true }
    })
    console.log('Created lobby:', room.id)
  } else {
    console.log('Lobby exists:', existing.id)
  }
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
