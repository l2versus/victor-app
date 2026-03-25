import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash("admin123456", 12)
  const user = await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    create: { email: "admin@teste.com", password: hash, name: "Admin Teste", role: "ADMIN" },
    update: { password: hash, role: "ADMIN" },
  })
  console.log("User OK:", user.id, user.email, user.role)

  const tp = await prisma.trainerProfile.findUnique({ where: { userId: user.id } })
  if (!tp) {
    await prisma.trainerProfile.create({
      data: { userId: user.id },
    })
    console.log("TrainerProfile criado")
  } else {
    console.log("TrainerProfile já existe")
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
