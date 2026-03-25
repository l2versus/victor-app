import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find both admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  })
  console.log("Admins:", admins.map((a) => `${a.name} (${a.email})`))

  const victor = admins.find((a) => a.email === "victorroliveiirapersonal@gmail.com")
  const teste = admins.find((a) => a.email === "admin@teste.com")
  if (!victor || !teste) { console.log("Admin(s) não encontrado(s)"); return }

  // Find Victor's TrainerProfile (the one with students)
  const victorTrainer = await prisma.trainerProfile.findUnique({
    where: { userId: victor.id },
    select: { id: true, _count: { select: { students: true } } },
  })
  console.log("Victor trainer:", victorTrainer?.id, "->", victorTrainer?._count.students, "alunos")

  // Find teste's TrainerProfile
  const testeTrainer = await prisma.trainerProfile.findUnique({
    where: { userId: teste.id },
    select: { id: true, _count: { select: { students: true } } },
  })
  console.log("Teste trainer:", testeTrainer?.id, "->", testeTrainer?._count.students, "alunos")

  if (!victorTrainer) { console.log("Victor trainer não encontrado"); return }

  // Move any students from teste's trainer to Victor's trainer
  if (testeTrainer && testeTrainer._count.students > 0) {
    await prisma.student.updateMany({
      where: { trainerId: testeTrainer.id },
      data: { trainerId: victorTrainer.id },
    })
    console.log("Alunos transferidos para Victor")
  }

  // Delete teste's TrainerProfile (empty now)
  if (testeTrainer) {
    await prisma.trainerProfile.delete({ where: { id: testeTrainer.id } })
    console.log("TrainerProfile do Admin Teste deletado")
  }

  // Create a new TrainerProfile for teste pointing to same data
  // Actually: we just make the admin route handler fall through to Victor's trainer
  // The admin panel code gets trainerId from the user's trainer profile
  // So we need teste to share Victor's trainer — but schema requires unique userId

  // Solution: create a new trainer profile for teste, then move Victor's students to include both
  // BETTER: just recreate teste's trainer with same ID as Victor's... can't.

  // SIMPLEST: make teste's trainerProfile and copy Victor's students reference
  // Actually since students belong to ONE trainer, we need a different approach:
  // Just give admin@teste.com the same trainerId relationship by creating a new profile
  // and then duplicating the student references... too complex.

  // REAL SOLUTION: keep only Victor's trainer. When admin@teste.com queries,
  // they don't find their own trainer, so we need the code to fallback to the first available.
  // OR: we rename admin@teste.com to "Victor Oliveira" so it looks the same.

  // Rename admin@teste.com to match Victor's display
  await prisma.user.update({
    where: { id: teste.id },
    data: { name: "Victor Oliveira" },
  })
  console.log("Admin Teste renomeado para 'Victor Oliveira'")

  console.log("\nResultado:")
  console.log("- admin@teste.com agora aparece como 'Victor Oliveira'")
  console.log("- Mas precisa de fix no código para ver os alunos do Victor")

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
