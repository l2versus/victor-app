import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PLANS = [
  {
    name: "Starter",
    price: 97,
    interval: "MONTHLY" as const,
    maxProfessionals: 1,
    maxStudents: 30,
    features: {
      workouts: true,
      nutrition: true,
      community: true,
      aiChat: false,
      crm: false,
      whatsappBot: false,
      whiteLabelDomain: false,
      postureAi: false,
      dedicatedSupport: false,
    },
  },
  {
    name: "Pro",
    price: 197,
    interval: "MONTHLY" as const,
    maxProfessionals: 3,
    maxStudents: 100,
    features: {
      workouts: true,
      nutrition: true,
      community: true,
      aiChat: true,
      crm: true,
      whatsappBot: true,
      whiteLabelDomain: false,
      postureAi: false,
      dedicatedSupport: false,
    },
  },
  {
    name: "Business",
    price: 497,
    interval: "MONTHLY" as const,
    maxProfessionals: 999,
    maxStudents: 99999,
    features: {
      workouts: true,
      nutrition: true,
      community: true,
      aiChat: true,
      crm: true,
      whatsappBot: true,
      whiteLabelDomain: true,
      postureAi: true,
      dedicatedSupport: true,
    },
  },
]

// Annual plans: 30% discount, price = monthly * 12 * 0.7
const ANNUAL_PLANS = PLANS.map((p) => ({
  ...p,
  name: `${p.name} Anual`,
  price: Math.round(p.price * 12 * 0.7 * 100) / 100,
  interval: "ANNUAL" as const,
}))

async function main() {
  console.log("Seeding SaaS plans...\n")

  const allPlans = [...PLANS, ...ANNUAL_PLANS]

  for (const plan of allPlans) {
    const existing = await prisma.saasPlan.findFirst({
      where: { name: plan.name, interval: plan.interval },
    })

    if (existing) {
      await prisma.saasPlan.update({
        where: { id: existing.id },
        data: {
          price: plan.price,
          maxProfessionals: plan.maxProfessionals,
          maxStudents: plan.maxStudents,
          features: plan.features,
          active: true,
        },
      })
      console.log(`  Updated: ${plan.name} (${plan.interval}) — R$${plan.price}`)
    } else {
      await prisma.saasPlan.create({ data: plan })
      console.log(`  Created: ${plan.name} (${plan.interval}) — R$${plan.price}`)
    }
  }

  // Verify
  const count = await prisma.saasPlan.count({ where: { active: true } })
  console.log(`\nTotal active plans: ${count}`)

  const plans = await prisma.saasPlan.findMany({
    where: { active: true },
    orderBy: [{ interval: "asc" }, { price: "asc" }],
    select: { name: true, price: true, interval: true, maxProfessionals: true, maxStudents: true },
  })

  console.log("\nAll plans:")
  for (const p of plans) {
    console.log(`  ${p.name} (${p.interval}): R$${p.price} — ${p.maxProfessionals} prof, ${p.maxStudents} alunos`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
