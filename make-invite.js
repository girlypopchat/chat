const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient({ datasources: { db: { url: 'file:/tmp/gpc.db' } } })

async function main() {
  const code = await db.inviteCode.create({
    data: {
      code: 'ADMINKEY123',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  })
  console.log('Invite code created:', code.code)
  
  await db.appConfig.upsert({
    where: { key: 'registrationOpen' },
    update: { value: 'true' },
    create: { key: 'registrationOpen', value: 'true' }
  })
  console.log('Registration opened')
}

main().catch(console.error).finally(() => db.$disconnect())
