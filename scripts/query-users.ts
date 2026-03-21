import { prisma } from "../src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, sessionVersion: true }
  })
  console.log(JSON.stringify(users, null, 2))

  const emm = users.find(u => u.email === "emmanuel@teste.com")
  if (emm) {
    const student = await prisma.student.findUnique({
      where: { userId: emm.id },
      include: { subscriptions: { include: { plan: { select: { name: true, hasAI: true, hasPostureCamera: true, hasVipGroup: true } } } } }
    })
    console.log("\nEmmanuel subscriptions:", JSON.stringify(student?.subscriptions, null, 2))
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
