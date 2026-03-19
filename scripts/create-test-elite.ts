/**
 * Script para criar conta de teste com plano Elite completo.
 *
 * Uso: npx tsx scripts/create-test-elite.ts
 *
 * Cria:
 *  - User "emmanuel" (STUDENT) com senha "admin123"
 *  - Vincula ao trainer victor@teste.com
 *  - Cria plano Elite Teste (todas features)
 *  - Cria subscription ACTIVE por 1 ano
 *
 * IMPORTANTE: Apagar depois dos testes!
 */

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🔧 Criando conta de teste Elite...")

  // 1. Find the trainer (victor@teste.com)
  const trainerUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    include: { trainerProfile: true },
  })

  if (!trainerUser?.trainerProfile) {
    console.error("❌ Nenhum trainer ADMIN encontrado no banco. Crie primeiro o admin.")
    process.exit(1)
  }

  const trainerId = trainerUser.trainerProfile.id
  console.log(`✅ Trainer encontrado: ${trainerUser.name} (${trainerUser.email})`)

  // 2. Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "emmanuel@teste.com" },
  })

  if (existingUser) {
    console.log("⚠️  User emmanuel@teste.com ja existe. Atualizando...")
    // Delete existing student + subscriptions to recreate clean
    const existingStudent = await prisma.student.findUnique({
      where: { userId: existingUser.id },
    })
    if (existingStudent) {
      await prisma.subscription.deleteMany({ where: { studentId: existingStudent.id } })
      await prisma.student.delete({ where: { id: existingStudent.id } })
    }
    await prisma.user.delete({ where: { id: existingUser.id } })
    console.log("🗑️  User antigo removido")
  }

  // 3. Create User + Student
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const user = await prisma.user.create({
    data: {
      email: "emmanuel@teste.com",
      name: "Emmanuel (Teste Elite)",
      password: hashedPassword,
      role: "STUDENT",
      phone: "85999999999",
      active: true,
    },
  })
  console.log(`✅ User criado: ${user.email} (id: ${user.id})`)

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      trainerId: trainerId,
      gender: "MALE",
      weight: 80,
      height: 1.78,
      goals: "Hipertrofia + teste de todas as features do app",
      status: "ACTIVE",
    },
  })
  console.log(`✅ Student criado (id: ${student.id})`)

  // 4. Create or find Elite plan (with ALL features)
  let elitePlan = await prisma.plan.findFirst({
    where: {
      trainerId: trainerId,
      name: { contains: "Elite" },
      hasPostureCamera: true,
      interval: "ANNUAL",
    },
  })

  if (!elitePlan) {
    elitePlan = await prisma.plan.create({
      data: {
        trainerId: trainerId,
        name: "Elite (Teste)",
        slug: "elite_test_annual",
        interval: "ANNUAL",
        price: 0,
        active: true,
        hasAI: true,
        hasPostureCamera: true,
        hasVipGroup: true,
        hasNutrition: true,
        maxSessionsWeek: null, // ilimitado
        description: "Plano de teste com todas as features liberadas",
      },
    })
    console.log(`✅ Plano Elite criado (id: ${elitePlan.id})`)
  } else {
    console.log(`✅ Plano Elite existente encontrado (id: ${elitePlan.id})`)
  }

  // 5. Create subscription — 1 year from now
  const startDate = new Date()
  const endDate = new Date()
  endDate.setFullYear(endDate.getFullYear() + 1)

  const subscription = await prisma.subscription.create({
    data: {
      studentId: student.id,
      planId: elitePlan.id,
      status: "ACTIVE",
      startDate,
      endDate,
      autoRenew: false,
    },
  })
  console.log(`✅ Subscription ACTIVE criada (expira: ${endDate.toISOString().split("T")[0]})`)

  console.log("\n" + "═".repeat(50))
  console.log("🎉 CONTA DE TESTE CRIADA COM SUCESSO!")
  console.log("═".repeat(50))
  console.log(`   Login:  emmanuel@teste.com`)
  console.log(`   Senha:  admin123`)
  console.log(`   Plano:  Elite (todas features)`)
  console.log(`   Valido: ate ${endDate.toLocaleDateString("pt-BR")}`)
  console.log("")
  console.log("   Features liberadas:")
  console.log("   ✅ Chat IA")
  console.log("   ✅ Camera de Postura (MediaPipe)")
  console.log("   ✅ Grupo VIP")
  console.log("   ✅ Nutricao")
  console.log("   ✅ Sessoes ilimitadas")
  console.log("═".repeat(50))
  console.log("\n⚠️  LEMBRE-SE: Apague esta conta depois dos testes!")
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
