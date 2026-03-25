import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // List all admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
  })
  console.log("Admins:", admins)

  // Reset Victor's password
  const victor = admins.find((a) => a.name.includes("Victor") || a.email.includes("victor"))
  if (victor) {
    const hash = await bcrypt.hash("admin123456", 12)
    await prisma.user.update({ where: { id: victor.id }, data: { password: hash } })
    console.log("Senha resetada:", victor.email, "-> admin123456")
  }

  // Count students per trainer
  const trainers = await prisma.trainerProfile.findMany({
    include: { _count: { select: { students: true } } },
  })
  for (const t of trainers) {
    const user = await prisma.user.findUnique({ where: { id: t.userId }, select: { email: true, name: true } })
    console.log(`Trainer: ${user?.name} (${user?.email}) -> ${t._count.students} alunos`)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
