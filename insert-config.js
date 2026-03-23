const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  await db.appConfig.upsert({
    where: { key: 'registrationOpen' },
    update: { value: 'true' },
    create: { key: 'registrationOpen', value: 'true' }
  })
  console.log('Registration opened')
}

main().catch(console.error).finally(() => db.$disconnect())
