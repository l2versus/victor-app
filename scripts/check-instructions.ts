import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const all = await prisma.exercise.findMany({
    select: { id: true, name: true, instructions: true, muscle: true },
    orderBy: { name: "asc" },
  })

  const withInstructions = all.filter((e) => e.instructions && e.instructions.trim().length > 0)
  const without = all.filter((e) => !e.instructions || e.instructions.trim().length === 0)
  const inEnglish = withInstructions.filter((e) => /\b(the|and|with|your|grip|bar|press|pull|push)\b/i.test(e.instructions || ""))

  console.log(`Total exercícios: ${all.length}`)
  console.log(`Com instruções: ${withInstructions.length}`)
  console.log(`Sem instruções: ${without.length}`)
  console.log(`Instruções em inglês: ${inEnglish.length}`)

  console.log(`\n--- Sem instruções (primeiros 20): ---`)
  for (const e of without.slice(0, 20)) {
    console.log(`  [${e.muscle}] ${e.name}`)
  }

  console.log(`\n--- Em inglês (primeiros 5): ---`)
  for (const e of inEnglish.slice(0, 5)) {
    console.log(`  ${e.name}: "${e.instructions?.slice(0, 80)}..."`)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
