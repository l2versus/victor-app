import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const orphans = await prisma.workoutSession.findMany({
    where: { completedAt: null },
    include: { student: { include: { user: { select: { name: true } } } }, _count: { select: { sets: true } } },
  })

  for (const s of orphans) {
    if (s._count.sets === 0) {
      await prisma.workoutSession.delete({ where: { id: s.id } })
      console.log(`❌ Deletada (0 sets): ${s.student.user.name}`)
    } else {
      await prisma.workoutSession.update({
        where: { id: s.id },
        data: {
          completedAt: new Date(),
          durationMin: Math.round((Date.now() - s.startedAt.getTime()) / 60000),
          notes: "Auto-finalizado (sessão pendente)",
        },
      })
      console.log(`✅ Auto-finalizada (${s._count.sets} sets): ${s.student.user.name}`)
    }
  }

  console.log(`\nTotal processadas: ${orphans.length}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
