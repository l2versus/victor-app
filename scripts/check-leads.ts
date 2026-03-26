import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const leads = await prisma.saasLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })
  console.log("Total leads:", leads.length)
  leads.forEach(l => {
    console.log(`- ${l.name} (${l.email}) | ${l.status} | Score: ${l.score} | ${l.temperature} | ${l.source}`)
  })
  await prisma.$disconnect()
}
main().catch(console.error)
