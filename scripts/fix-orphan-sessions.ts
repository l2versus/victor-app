import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find all sessions without completedAt
  const orphans = await prisma.workoutSession.findMany({
    where: { completedAt: null },
    include: {
      student: { include: { user: { select: { name: true } } } },
      template: { select: { name: true } },
      _count: { select: { sets: true } },
    },
    orderBy: { startedAt: "desc" },
  })

  console.log(`\n🔍 Sessões sem completedAt: ${orphans.length}\n`)

  for (const s of orphans) {
    const hrs = Math.round((Date.now() - s.startedAt.getTime()) / 3600000)
    console.log(`  ${s.student.user.name} | ${s.template?.name || "?"} | ${s._count.sets} sets | ${hrs}h atrás | ID: ${s.id.slice(0, 12)}`)
  }

  // Group by student+template to find duplicates
  const groups = new Map<string, typeof orphans>()
  for (const s of orphans) {
    const key = `${s.studentId}-${s.templateId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  // For each group with >1 session, keep the newest, delete the rest
  let deleted = 0
  for (const [, sessions] of groups) {
    if (sessions.length <= 1) continue

    // Sort by startedAt desc — keep first (newest)
    sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    const toDelete = sessions.slice(1) // all except newest

    for (const s of toDelete) {
      // Only delete if 0 sets (no real work done)
      if (s._count.sets === 0) {
        await prisma.sessionSet.deleteMany({ where: { sessionId: s.id } })
        await prisma.workoutSession.delete({ where: { id: s.id } })
        deleted++
        console.log(`  ❌ Deletada: ${s.student.user.name} | ${s.template?.name} | 0 sets | ID: ${s.id.slice(0, 12)}`)
      } else {
        console.log(`  ⚠️ Mantida (tem ${s._count.sets} sets): ${s.student.user.name} | ${s.template?.name}`)
      }
    }
  }

  // Also clean sessions older than 24h with 0 sets
  const old = orphans.filter(s => {
    const hrs = (Date.now() - s.startedAt.getTime()) / 3600000
    return hrs > 24 && s._count.sets === 0
  })
  for (const s of old) {
    // Check if not already deleted above
    const exists = await prisma.workoutSession.findUnique({ where: { id: s.id }, select: { id: true } })
    if (!exists) continue

    await prisma.sessionSet.deleteMany({ where: { sessionId: s.id } })
    await prisma.workoutSession.delete({ where: { id: s.id } })
    deleted++
    console.log(`  🕐 Velha deletada: ${s.student.user.name} | ${s.template?.name} | >24h | 0 sets`)
  }

  console.log(`\n✅ Total deletadas: ${deleted}`)
  console.log(`📊 Sessões restantes sem completar: ${orphans.length - deleted}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
