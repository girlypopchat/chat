const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()
async function main() {
  const sessions = await db.session.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  sessions.forEach(s => console.log(
    'token:', s.stytchSession ? (s.stytchSession.length > 0 ? s.stytchSession.slice(0,30)+'...' : 'EMPTY STRING') : 'NULL',
    '| expires:', s.expiresAt
  ))
  await db.$disconnect()
}
main().catch(console.error)
