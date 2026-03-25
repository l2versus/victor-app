import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Correct prices per slug (matching frontend)
const PRICE_MAP: Record<string, number> = {
  essencial_monthly: 199.90,
  essencial_quarterly: 509.70,
  essencial_semiannual: 899.10,
  essencial_annual: 1439.28,
  pro_monthly: 299.90,
  pro_quarterly: 764.70,
  pro_semiannual: 1349.10,
  pro_annual: 2159.28,
  elite_monthly: 499.90,
  elite_quarterly: 1274.70,
  elite_semiannual: 2249.10,
  elite_annual: 3599.28,
}

async function main() {
  console.log("Planos atuais:\n")
  const plans = await prisma.plan.findMany({ orderBy: { name: "asc" } })

  for (const p of plans) {
    console.log(`  [${p.slug}] ${p.name} ${p.interval}: R$ ${p.price} | VIP=${p.hasVipGroup}`)
  }

  console.log("\n--- Atualizando ---\n")

  for (const p of plans) {
    const correctPrice = p.slug ? PRICE_MAP[p.slug] : undefined
    const updates: Record<string, unknown> = {}

    // Fix price
    if (correctPrice && Math.abs(p.price - correctPrice) > 0.1) {
      updates.price = correctPrice
      console.log(`  ${p.slug}: R$ ${p.price} → R$ ${correctPrice}`)
    }

    // Fix description: "Grupo VIP" → "Rede Social Ironberg"
    if (p.description?.includes("VIP")) {
      updates.description = p.description.replace(/[Gg]rupo VIP/g, "Rede Social Ironberg")
    }

    if (Object.keys(updates).length > 0) {
      await prisma.plan.update({ where: { id: p.id }, data: updates })
    }
  }

  console.log("\n--- Final ---\n")
  const final = await prisma.plan.findMany({ orderBy: { name: "asc" } })
  for (const p of final) {
    console.log(`  ${p.name} ${p.interval}: R$ ${p.price}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
