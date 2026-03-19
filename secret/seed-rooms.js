const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()
async function main() {
  let systemUser = await db.user.findFirst({ where: { username: 'system' } })
  const rooms = [
    { name: 'general', displayName: 'General', description: 'General chat', icon: '💬' },
    { name: 'technology', displayName: 'Technology', description: 'Tech talk', icon: '💻' },
    { name: 'philosophy', displayName: 'Philosophy', description: 'Deep thoughts', icon: '🧠' },
  ]
  for (const r of rooms) {
    const existing = await db.room.findUnique({ where: { name: r.name } })
    if (!existing) {
      const room = await db.room.create({ data: { ...r, ownerId: systemUser.id, isPublic: true } })
      console.log('Created:', room.name)
    } else {
      console.log('Exists:', r.name)
    }
  }
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
