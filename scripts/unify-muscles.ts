import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Unify ALL muscle names to Portuguese
const MUSCLE_MAP: Record<string, string> = {
  "Back": "Costas",
  "Biceps": "Bíceps",
  "Calves": "Panturrilha",
  "Cardio": "Cardio",
  "Chest": "Peito",
  "Core": "Abdômen",
  "Forearms": "Antebraço",
  "Full Body": "Full Body",
  "Corpo Inteiro": "Full Body",
  "Glutes": "Glúteos",
  "Hamstrings": "Posterior",
  "Quadriceps": "Quadríceps",
  "Shoulders": "Ombros",
  "Stretching": "Alongamento",
  "Traps": "Trapézio",
  "Triceps": "Tríceps",
  // Fix PT variations
  "Trapézio": "Trapézio",
  "Bíceps": "Bíceps",
  "Tríceps": "Tríceps",
  "Quadríceps": "Quadríceps",
}

// Unify equipment to Portuguese
const EQUIP_MAP: Record<string, string> = {
  "Barbell": "Barra",
  "Dumbbell": "Halter",
  "Cable": "Cabo",
  "Machine": "Máquina",
  "Bodyweight": "Peso Corporal",
  "Kettlebell": "Kettlebell",
  "Band": "Elástico",
  "Other": "Outro",
  // Already PT - keep as is
  "Barra": "Barra",
  "Halter": "Halter",
  "Cabo": "Cabo",
  "Máquina": "Máquina",
  "Peso Corporal": "Peso Corporal",
  "Elástico": "Elástico",
  "Outro": "Outro",
}

async function main() {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, muscle: true, equipment: true },
  })

  console.log(`Total exercícios: ${exercises.length}\n`)

  // Show current groups
  const groups = new Map<string, number>()
  for (const ex of exercises) {
    groups.set(ex.muscle, (groups.get(ex.muscle) || 0) + 1)
  }
  console.log("ANTES:")
  for (const [g, c] of [...groups.entries()].sort()) {
    console.log(`  ${g}: ${c}`)
  }

  // Fix muscles and equipment
  let muscleFixed = 0
  let equipFixed = 0

  for (const ex of exercises) {
    const updates: Record<string, string> = {}

    // Fix muscle
    const newMuscle = MUSCLE_MAP[ex.muscle]
    if (newMuscle && newMuscle !== ex.muscle) {
      updates.muscle = newMuscle
      muscleFixed++
    }

    // Fix equipment
    const newEquip = EQUIP_MAP[ex.equipment]
    if (newEquip && newEquip !== ex.equipment) {
      updates.equipment = newEquip
      equipFixed++
    }

    if (Object.keys(updates).length > 0) {
      await prisma.exercise.update({ where: { id: ex.id }, data: updates })
    }
  }

  console.log(`\nMúsculos corrigidos: ${muscleFixed}`)
  console.log(`Equipamentos corrigidos: ${equipFixed}`)

  // Show final groups
  const final = await prisma.exercise.findMany({ select: { muscle: true } })
  const finalGroups = new Map<string, number>()
  for (const ex of final) {
    finalGroups.set(ex.muscle, (finalGroups.get(ex.muscle) || 0) + 1)
  }
  console.log("\nDEPOIS:")
  for (const [g, c] of [...finalGroups.entries()].sort()) {
    console.log(`  ${g}: ${c}`)
  }

  // Check for duplicates (same name)
  const names = new Map<string, string[]>()
  const allEx = await prisma.exercise.findMany({ select: { id: true, name: true } })
  for (const ex of allEx) {
    const key = ex.name.toLowerCase().trim()
    if (!names.has(key)) names.set(key, [])
    names.get(key)!.push(ex.id)
  }
  const dupes = [...names.entries()].filter(([, ids]) => ids.length > 1)
  if (dupes.length > 0) {
    console.log(`\nDUPLICADOS encontrados: ${dupes.length}`)
    for (const [name, ids] of dupes) {
      console.log(`  "${name}" → ${ids.length}x (mantendo 1, removendo ${ids.length - 1})`)
      // Keep first, delete rest
      for (const id of ids.slice(1)) {
        await prisma.exercise.delete({ where: { id } })
      }
    }
    const afterDedup = await prisma.exercise.count()
    console.log(`\nTotal após dedup: ${afterDedup}`)
  } else {
    console.log("\nSem duplicados!")
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
