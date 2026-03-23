const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany()
  console.log('Users:', JSON.stringify(users, null, 2))
  
  const config = await db.appConfig.findMany()
  console.log('Config:', JSON.stringify(config, null, 2))
}

main().catch(console.error).finally(() => db.$disconnect())
