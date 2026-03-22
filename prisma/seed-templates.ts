/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("../src/generated/prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Template library — treinos prontos por objetivo e nível
const TEMPLATES = [
  // ═══ HIPERTROFIA ═══
  {
    name: "Push Pull Legs — Hipertrofia Iniciante",
    description: "Divisão clássica PPL para quem está começando. 3 dias/semana com foco em movimentos compostos e isolados.",
    goal: "HYPERTROPHY",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Supino Reto com Barra", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Desenvolvimento Militar", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Tríceps Corda", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Puxada Frontal", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Remada Curvada", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Rosca Direta", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Agachamento Livre", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Leg Press 45°", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Cadeira Extensora", sets: 3, reps: "12-15", restSeconds: 60 },
    ],
  },
  {
    name: "Upper Lower — Hipertrofia Intermediário",
    description: "Divisão superior/inferior 4x/semana. Volume moderado com técnicas avançadas.",
    goal: "HYPERTROPHY",
    level: "INTERMEDIATE",
    daysPerWeek: 4,
    exercises: [
      { name: "Supino Reto com Barra", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Remada Cavalinho", sets: 4, reps: "8-10", restSeconds: 90 },
      { name: "Desenvolvimento com Halteres", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Puxada Frontal", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Elevação Lateral", sets: 4, reps: "12-15", restSeconds: 60 },
      { name: "Tríceps Testa", sets: 3, reps: "10-12", restSeconds: 60 },
      { name: "Rosca Alternada", sets: 3, reps: "10-12", restSeconds: 60 },
      { name: "Agachamento Livre", sets: 4, reps: "6-8", restSeconds: 180 },
      { name: "Stiff", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Leg Press 45°", sets: 3, reps: "10-12", restSeconds: 90 },
      { name: "Cadeira Flexora", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Panturrilha em Pé", sets: 4, reps: "15-20", restSeconds: 45 },
    ],
  },
  {
    name: "PPL 6x — Hipertrofia Avançado",
    description: "Push Pull Legs 6x/semana com alto volume. Para quem já treina há 2+ anos.",
    goal: "HYPERTROPHY",
    level: "ADVANCED",
    daysPerWeek: 6,
    exercises: [
      { name: "Supino Reto com Barra", sets: 4, reps: "6-8", restSeconds: 180 },
      { name: "Supino Inclinado com Halteres", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Crucifixo na Máquina", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Desenvolvimento Arnold", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Elevação Lateral", sets: 4, reps: "15-20", restSeconds: 45 },
      { name: "Tríceps Francês", sets: 4, reps: "10-12", restSeconds: 60 },
      { name: "Puxada Frontal", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Remada Curvada", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Pullover", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Rosca Scott", sets: 3, reps: "10-12", restSeconds: 60 },
      { name: "Rosca Martelo", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Agachamento Livre", sets: 5, reps: "5-8", restSeconds: 180 },
      { name: "Leg Press 45°", sets: 4, reps: "10-12", restSeconds: 120 },
      { name: "Stiff", sets: 4, reps: "8-10", restSeconds: 120 },
      { name: "Cadeira Extensora", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Cadeira Flexora", sets: 3, reps: "12-15", restSeconds: 60 },
      { name: "Panturrilha Sentado", sets: 4, reps: "15-20", restSeconds: 45 },
    ],
  },

  // ═══ FORÇA ═══
  {
    name: "5x5 StrongLifts — Força Iniciante",
    description: "Programa clássico 5x5 com progressão linear. 3x/semana, foco em compostos.",
    goal: "STRENGTH",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Agachamento Livre", sets: 5, reps: "5", restSeconds: 180 },
      { name: "Supino Reto com Barra", sets: 5, reps: "5", restSeconds: 180 },
      { name: "Remada Curvada", sets: 5, reps: "5", restSeconds: 180 },
      { name: "Desenvolvimento Militar", sets: 5, reps: "5", restSeconds: 180 },
      { name: "Levantamento Terra", sets: 1, reps: "5", restSeconds: 300 },
    ],
  },
  {
    name: "Wendler 5/3/1 — Força Intermediário",
    description: "Periodização ondulada com 4 lifts principais. Accessórios complementam.",
    goal: "STRENGTH",
    level: "INTERMEDIATE",
    daysPerWeek: 4,
    exercises: [
      { name: "Agachamento Livre", sets: 3, reps: "5/3/1", restSeconds: 240 },
      { name: "Supino Reto com Barra", sets: 3, reps: "5/3/1", restSeconds: 240 },
      { name: "Levantamento Terra", sets: 3, reps: "5/3/1", restSeconds: 300 },
      { name: "Desenvolvimento Militar", sets: 3, reps: "5/3/1", restSeconds: 240 },
      { name: "Puxada Frontal", sets: 5, reps: "10", restSeconds: 60 },
      { name: "Leg Press 45°", sets: 5, reps: "10", restSeconds: 90 },
      { name: "Tríceps Corda", sets: 3, reps: "15", restSeconds: 45 },
      { name: "Rosca Direta", sets: 3, reps: "15", restSeconds: 45 },
    ],
  },

  // ═══ EMAGRECIMENTO ═══
  {
    name: "Full Body — Emagrecimento Iniciante",
    description: "Circuito full body 3x/semana com descansos curtos. Alto gasto calórico.",
    goal: "FAT_LOSS",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Agachamento Livre", sets: 3, reps: "15", restSeconds: 45 },
      { name: "Supino Reto com Barra", sets: 3, reps: "12", restSeconds: 45 },
      { name: "Remada Curvada", sets: 3, reps: "12", restSeconds: 45 },
      { name: "Desenvolvimento com Halteres", sets: 3, reps: "12", restSeconds: 45 },
      { name: "Cadeira Extensora", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Cadeira Flexora", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Abdominal Crunch", sets: 3, reps: "20", restSeconds: 30 },
    ],
  },
  {
    name: "HIIT + Musculação — Emagrecimento Avançado",
    description: "Combinação de treino de força e circuitos metabólicos. 5x/semana.",
    goal: "FAT_LOSS",
    level: "ADVANCED",
    daysPerWeek: 5,
    exercises: [
      { name: "Agachamento Livre", sets: 4, reps: "10", restSeconds: 60 },
      { name: "Supino Reto com Barra", sets: 4, reps: "10", restSeconds: 60 },
      { name: "Remada Curvada", sets: 4, reps: "10", restSeconds: 60 },
      { name: "Desenvolvimento Militar", sets: 3, reps: "12", restSeconds: 45 },
      { name: "Stiff", sets: 3, reps: "12", restSeconds: 60 },
      { name: "Elevação Lateral", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Tríceps Corda", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Rosca Direta", sets: 3, reps: "15", restSeconds: 30 },
    ],
  },

  // ═══ RESISTÊNCIA ═══
  {
    name: "Circuito Resistência — 3x/semana",
    description: "Circuito com reps altas e descansos mínimos. Foco em resistência muscular.",
    goal: "ENDURANCE",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Agachamento Livre", sets: 3, reps: "20", restSeconds: 30 },
      { name: "Flexão de Braço", sets: 3, reps: "15-20", restSeconds: 30 },
      { name: "Puxada Frontal", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Desenvolvimento com Halteres", sets: 3, reps: "15", restSeconds: 30 },
      { name: "Cadeira Extensora", sets: 3, reps: "20", restSeconds: 20 },
      { name: "Cadeira Flexora", sets: 3, reps: "20", restSeconds: 20 },
      { name: "Abdominal Crunch", sets: 3, reps: "25", restSeconds: 20 },
    ],
  },

  // ═══ CONDICIONAMENTO GERAL ═══
  {
    name: "Full Body Funcional — Condicionamento",
    description: "Treino funcional completo para saúde geral. 3x/semana, 45 min.",
    goal: "GENERAL_FITNESS",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Agachamento Livre", sets: 3, reps: "12", restSeconds: 60 },
      { name: "Supino Reto com Barra", sets: 3, reps: "10", restSeconds: 60 },
      { name: "Remada Curvada", sets: 3, reps: "10", restSeconds: 60 },
      { name: "Desenvolvimento com Halteres", sets: 3, reps: "10", restSeconds: 60 },
      { name: "Stiff", sets: 3, reps: "10", restSeconds: 60 },
      { name: "Abdominal Crunch", sets: 3, reps: "15", restSeconds: 45 },
      { name: "Prancha", sets: 3, reps: "30s", restSeconds: 30 },
    ],
  },

  // ═══ REABILITAÇÃO ═══
  {
    name: "Reabilitação Articular — Iniciante",
    description: "Exercícios de baixo impacto para recuperação. Cargas leves, movimento controlado.",
    goal: "REHABILITATION",
    level: "BEGINNER",
    daysPerWeek: 3,
    exercises: [
      { name: "Cadeira Extensora", sets: 3, reps: "15", restSeconds: 60 },
      { name: "Cadeira Flexora", sets: 3, reps: "15", restSeconds: 60 },
      { name: "Leg Press 45°", sets: 3, reps: "12", restSeconds: 90 },
      { name: "Puxada Frontal", sets: 3, reps: "12", restSeconds: 60 },
      { name: "Supino na Máquina", sets: 3, reps: "12", restSeconds: 60 },
      { name: "Elevação Lateral", sets: 2, reps: "12", restSeconds: 45 },
    ],
  },
]

async function main() {
  console.log("🌱 Seeding workout template library...")

  for (const t of TEMPLATES) {
    const existing = await prisma.workoutTemplateLibrary.findFirst({
      where: { name: t.name },
    })

    if (existing) {
      console.log(`  ⏭️  "${t.name}" already exists, skipping`)
      continue
    }

    await prisma.workoutTemplateLibrary.create({
      data: {
        name: t.name,
        description: t.description,
        goal: t.goal as "HYPERTROPHY" | "STRENGTH" | "FAT_LOSS" | "ENDURANCE" | "GENERAL_FITNESS" | "REHABILITATION",
        level: t.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        daysPerWeek: t.daysPerWeek,
        exercises: t.exercises.map((ex, idx) => ({ ...ex, order: idx })),
        isPublic: true,
        usageCount: 0,
      },
    })
    console.log(`  ✅ "${t.name}"`)
  }

  console.log(`\n🎉 Done! ${TEMPLATES.length} templates ready.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
