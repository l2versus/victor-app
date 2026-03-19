/**
 * Script para popular os slugs dos planos existentes no banco.
 *
 * ATENÇÃO: Este script usa o DATABASE_URL do .env
 * Banco Victor App = porta 5433 (NÃO é o banco da Myka)
 *
 * Rodar: npx tsx prisma/seed-slugs.ts
 */
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set!")
  process.exit(1)
}

// Confirmar que é o banco certo (porta 5433)
if (!DATABASE_URL.includes(":5433")) {
  console.error("CUIDADO: DATABASE_URL não aponta para porta 5433 (banco Victor)")
  console.error("Atual:", DATABASE_URL.replace(/:[^:]+@/, ":***@"))
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const nameMap: Record<string, string> = {
  "Essencial": "essencial",
  "Pro": "pro",
  "Elite": "elite",
}

async function seedSlugs() {
  console.log("=== Seed Slugs — Banco Victor App (porta 5433) ===\n")

  const plans = await prisma.plan.findMany({
    orderBy: [{ name: "asc" }, { interval: "asc" }],
  })

  console.log(`Encontrados ${plans.length} planos:\n`)

  let updated = 0
  for (const plan of plans) {
    const baseName = nameMap[plan.name] || plan.name.toLowerCase().replace(/\s+/g, "_")
    const slug = `${baseName}_${plan.interval.toLowerCase()}`

    if (plan.slug === slug) {
      console.log(`  ✓ ${slug} — já ok`)
      continue
    }

    await prisma.plan.update({
      where: { id: plan.id },
      data: { slug },
    })
    console.log(`  → ${slug} — atualizado (era: ${plan.slug || "null"})`)
    updated++
  }

  console.log(`\nDone! ${updated} planos atualizados, ${plans.length - updated} já estavam ok.`)
  await prisma.$disconnect()
}

seedSlugs().catch((e) => {
  console.error("Erro:", e)
  process.exit(1)
})
