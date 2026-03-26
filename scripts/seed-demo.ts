import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding Demo Organization...\n")

  const hash = (pw: string) => bcrypt.hash(pw, 10)

  // ═══ 1. Create Demo Organization ═══
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Fitness",
      slug: "demo",
      status: "ACTIVE",
      maxProfessionals: 5,
      maxStudents: 100,
      ownerEmail: "demo@trainer.com",
      brandConfig: {
        primaryColor: "#dc2626",
        appName: "Demo Fitness",
        trainerName: "Carlos Demo",
        isDemo: true,
      },
    },
  })
  console.log("  Org:", org.name, `(${org.slug})`)

  // ═══ 2. Create Demo Trainer ═══
  const trainerUser = await prisma.user.upsert({
    where: { email: "demo@trainer.com" },
    update: {},
    create: {
      email: "demo@trainer.com",
      password: await hash("demo2026"),
      name: "Carlos Demo",
      role: "ADMIN",
    },
  })

  const trainerProfile = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      organizationId: org.id,
      bio: "Personal Trainer especializado em hipertrofia e emagrecimento. 10 anos de experiencia.",
      cref: "000000-G/DEMO",
      gymName: "Demo Fitness",
      brandColor: "#dc2626",
      onboardingComplete: true,
    },
  })
  console.log("  Trainer:", trainerUser.email)

  // ═══ 3. Create Demo Nutritionist ═══
  const nutriUser = await prisma.user.upsert({
    where: { email: "demo@nutri.com" },
    update: {},
    create: {
      email: "demo@nutri.com",
      password: await hash("demo2026"),
      name: "Ana Nutri Demo",
      role: "NUTRITIONIST",
    },
  })

  await prisma.nutritionistProfile.upsert({
    where: { userId: nutriUser.id },
    update: {},
    create: {
      userId: nutriUser.id,
      organizationId: org.id,
      bio: "Nutricionista esportiva com foco em performance e composicao corporal.",
      crn: "00000/DEMO",
      specialty: "Nutricao Esportiva",
      brandColor: "#10b981",
      onboardingComplete: true,
    },
  })
  console.log("  Nutri:", nutriUser.email)

  // ═══ 4. Create 5 Demo Students ═══
  const studentNames = [
    { name: "Maria Silva", email: "demo@aluno.com", weight: 62, height: 165, gender: "FEMALE" as const, goals: "Emagrecimento e definicao" },
    { name: "Joao Santos", email: "demo.joao@aluno.com", weight: 85, height: 178, gender: "MALE" as const, goals: "Hipertrofia e ganho de massa" },
    { name: "Camila Lima", email: "demo.camila@aluno.com", weight: 55, height: 160, gender: "FEMALE" as const, goals: "Condicionamento fisico" },
    { name: "Pedro Costa", email: "demo.pedro@aluno.com", weight: 90, height: 182, gender: "MALE" as const, goals: "Perda de gordura e hipertrofia" },
    { name: "Luisa Oliveira", email: "demo.luisa@aluno.com", weight: 58, height: 168, gender: "FEMALE" as const, goals: "Tonificacao e flexibilidade" },
  ]

  const studentIds: string[] = []

  for (const s of studentNames) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: await hash("demo2026"),
        name: s.name,
        role: "STUDENT",
      },
    })

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        trainerId: trainerProfile.id,
        organizationId: org.id,
        weight: s.weight,
        height: s.height,
        gender: s.gender,
        goals: s.goals,
        status: "ACTIVE",
        bio: `Aluno demo - ${s.goals}`,
      },
    })
    studentIds.push(student.id)
    console.log(`  Student: ${s.email}`)
  }

  // ═══ 5. Create 10 Workout Templates ═══
  const templateNames = [
    { name: "Treino A — Peito e Triceps", type: "PUSH" },
    { name: "Treino B — Costas e Biceps", type: "PULL" },
    { name: "Treino C — Pernas Completo", type: "LEGS" },
    { name: "Treino D — Ombros e Trapezio", type: "SHOULDERS" },
    { name: "Treino E — Full Body", type: "FULL_BODY" },
    { name: "HIIT — Cardio Intenso", type: "CARDIO" },
    { name: "Core e Abdomen", type: "CORE" },
    { name: "Treino Funcional", type: "FUNCTIONAL" },
    { name: "Treino Iniciante — Adaptacao", type: "BEGINNER" },
    { name: "Treino Avancado — Forca", type: "STRENGTH" },
  ]

  for (const t of templateNames) {
    const exists = await prisma.workoutTemplate.findFirst({
      where: { name: t.name, trainerId: trainerProfile.id },
    })
    if (!exists) {
      await prisma.workoutTemplate.create({
        data: {
          name: t.name,
          type: t.type,
          trainerId: trainerProfile.id,
        },
      })
    }
  }
  console.log("  Created 10 workout templates")

  // ═══ 6. Create 3 Meal Plans ═══
  const nutriProfile = await prisma.nutritionistProfile.findUnique({
    where: { userId: nutriUser.id },
  })

  if (nutriProfile) {
    const mealPlans = [
      {
        name: "Cutting — 1800kcal",
        description: "Plano para fase de definicao muscular",
        targetCalories: 1800,
        targetProtein: 150,
        targetCarbs: 180,
        targetFat: 50,
        meals: {
          meals: [
            { name: "Cafe da manha", time: "07:00", items: ["3 ovos mexidos", "1 fatia pao integral", "Cafe preto"] },
            { name: "Lanche", time: "10:00", items: ["1 banana", "30g whey protein"] },
            { name: "Almoco", time: "12:30", items: ["150g frango grelhado", "100g arroz integral", "Salada verde"] },
            { name: "Lanche", time: "15:30", items: ["1 iogurte grego", "15g granola"] },
            { name: "Jantar", time: "19:00", items: ["150g tilapia", "Legumes grelhados", "Batata doce"] },
          ],
        },
      },
      {
        name: "Bulking — 2800kcal",
        description: "Plano para ganho de massa muscular",
        targetCalories: 2800,
        targetProtein: 200,
        targetCarbs: 350,
        targetFat: 70,
        meals: {
          meals: [
            { name: "Cafe da manha", time: "07:00", items: ["4 ovos", "2 fatias pao integral", "Suco de laranja", "Aveia"] },
            { name: "Lanche", time: "10:00", items: ["2 bananas", "40g whey", "Pasta de amendoim"] },
            { name: "Almoco", time: "12:30", items: ["200g carne vermelha", "150g arroz", "Feijao", "Salada"] },
            { name: "Pre-treino", time: "15:30", items: ["Batata doce", "Frango desfiado"] },
            { name: "Pos-treino", time: "17:30", items: ["40g whey", "Dextrose", "Banana"] },
            { name: "Jantar", time: "19:30", items: ["200g salmao", "Arroz", "Brocolis"] },
          ],
        },
      },
      {
        name: "Manutencao — 2200kcal",
        description: "Plano equilibrado para manter peso",
        targetCalories: 2200,
        targetProtein: 160,
        targetCarbs: 250,
        targetFat: 60,
        meals: {
          meals: [
            { name: "Cafe da manha", time: "07:00", items: ["3 ovos", "Pao integral", "Frutas"] },
            { name: "Almoco", time: "12:30", items: ["150g proteina", "Arroz integral", "Salada completa"] },
            { name: "Lanche", time: "15:30", items: ["Frutas", "Castanhas", "Iogurte"] },
            { name: "Jantar", time: "19:00", items: ["150g peixe ou frango", "Legumes", "Carboidrato complexo"] },
          ],
        },
      },
    ]

    for (const mp of mealPlans) {
      const exists = await prisma.mealPlan.findFirst({
        where: { name: mp.name, nutritionistId: nutriProfile.id },
      })
      if (!exists) {
        await prisma.mealPlan.create({
          data: {
            ...mp,
            nutritionistId: nutriProfile.id,
          },
        })
      }
    }
    console.log("  Created 3 meal plans")
  }

  // ═══ 7. Create Community Posts ═══
  const communityPosts = [
    { content: "Primeiro treino de pernas do ano! Superou todas as expectativas. Sentindo as pernas tremerem!", type: "USER_POST" },
    { content: "Consegui bater meu PR no supino: 100kg! Treino consistente da resultado.", type: "USER_POST" },
    { content: "Dica do dia: nunca pule o aquecimento. 10 minutos salvam seus joelhos no longo prazo.", type: "USER_POST" },
    { content: "6 meses de treino e 12kg de massa magra ganhos. A jornada vale a pena!", type: "USER_POST" },
    { content: "Hoje foi dia de HIIT. 30 minutos de puro sofrimento, mas a sensacao depois e incrivel.", type: "USER_POST" },
  ]

  for (let i = 0; i < communityPosts.length; i++) {
    const studentId = studentIds[i % studentIds.length]
    const exists = await prisma.communityPost.findFirst({
      where: { studentId, content: communityPosts[i].content },
    })
    if (!exists) {
      await prisma.communityPost.create({
        data: {
          studentId,
          content: communityPosts[i].content,
          type: communityPosts[i].type as "USER_POST" | "ACHIEVEMENT" | "ANNOUNCEMENT" | "MILESTONE",
        },
      })
    }
  }
  console.log("  Created 5 community posts")

  // ═══ 8. Link a trial subscription to Pro plan ═══
  const proPlan = await prisma.saasPlan.findFirst({
    where: { name: "Pro", interval: "MONTHLY", active: true },
  })

  if (proPlan) {
    const existingSub = await prisma.saasSubscription.findFirst({
      where: { organizationId: org.id },
    })
    if (!existingSub) {
      await prisma.saasSubscription.create({
        data: {
          organizationId: org.id,
          planId: proPlan.id,
          status: "ACTIVE",
          startDate: new Date(),
        },
      })
      console.log("  Linked Pro subscription to demo org")
    }
  }

  console.log("\n=== Demo Credentials ===")
  console.log("  Trainer:  demo@trainer.com / demo2026")
  console.log("  Nutri:    demo@nutri.com / demo2026")
  console.log("  Student:  demo@aluno.com / demo2026")
  console.log("========================\n")

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
