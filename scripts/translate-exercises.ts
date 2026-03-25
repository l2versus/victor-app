import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Comprehensive EN → PT translation map for exercise names
const translations: Record<string, string> = {
  // CHEST
  "Flat Barbell Bench Press": "Supino Reto com Barra",
  "Incline Barbell Bench Press": "Supino Inclinado com Barra",
  "Decline Barbell Bench Press": "Supino Declinado com Barra",
  "Flat Dumbbell Bench Press": "Supino Reto com Halteres",
  "Incline Dumbbell Bench Press": "Supino Inclinado com Halteres",
  "Decline Dumbbell Bench Press": "Supino Declinado com Halteres",
  "Cable Crossover": "Crossover no Cabo",
  "Dumbbell Fly": "Crucifixo com Halteres",
  "Incline Dumbbell Fly": "Crucifixo Inclinado com Halteres",
  "Machine Chest Press": "Supino na Máquina",
  "Pec Deck": "Pec Deck (Voador)",
  "Push-Up": "Flexão de Braço",
  "Dips (Chest)": "Paralelas (Peito)",
  "Svend Press": "Svend Press",
  "Cable Chest Press": "Supino no Cabo",
  "Landmine Press": "Landmine Press",
  "Chest Dip Machine": "Paralelas na Máquina (Peito)",

  // BACK
  "Wide-Grip Lat Pulldown": "Puxada Aberta (Pulley)",
  "Close-Grip Lat Pulldown": "Puxada Fechada (Pulley)",
  "Seated Cable Row": "Remada Sentada no Cabo",
  "Barbell Bent-Over Row": "Remada Curvada com Barra",
  "Dumbbell Single-Arm Row": "Remada Unilateral com Halter",
  "T-Bar Row": "Remada Cavalinho (T-Bar)",
  "Machine Row": "Remada na Máquina",
  "Pull-Up": "Barra Fixa (Pegada Pronada)",
  "Chin-Up": "Barra Fixa (Pegada Supinada)",
  "Straight-Arm Pulldown": "Pulldown Braços Estendidos",
  "Hyperextension": "Hiperextensão Lombar",
  "Inverted Row": "Remada Invertida",
  "Deadlift": "Levantamento Terra",
  "Rack Pull": "Rack Pull",
  "Meadows Row": "Remada Meadows",
  "Pendlay Row": "Remada Pendlay",
  "Seal Row": "Remada Seal",
  "Chest-Supported Row": "Remada com Apoio no Peito",
  "Helms Row": "Remada Helms",
  "Kayak Row": "Remada Kayak",

  // SHOULDERS
  "Barbell Overhead Press": "Desenvolvimento com Barra",
  "Dumbbell Shoulder Press": "Desenvolvimento com Halteres",
  "Arnold Press": "Arnold Press",
  "Machine Shoulder Press": "Desenvolvimento na Máquina",
  "Lateral Raise": "Elevação Lateral",
  "Cable Lateral Raise": "Elevação Lateral no Cabo",
  "Front Raise": "Elevação Frontal",
  "Reverse Pec Deck": "Pec Deck Invertido (Deltóide Posterior)",
  "Face Pull": "Face Pull",
  "Upright Row": "Remada Alta",
  "Dumbbell Rear Delt Fly": "Crucifixo Inverso com Halteres",
  "Cable Rear Delt Fly": "Crucifixo Inverso no Cabo",
  "Dumbbell Shrug": "Encolhimento com Halteres",
  "Barbell Shrug": "Encolhimento com Barra",
  "Behind-the-Neck Press": "Desenvolvimento por Trás",
  "Lu Raise": "Lu Raise",

  // BICEPS
  "Barbell Curl": "Rosca Direta com Barra",
  "EZ-Bar Curl": "Rosca Direta com Barra W",
  "Dumbbell Curl": "Rosca Direta com Halteres",
  "Hammer Curl": "Rosca Martelo",
  "Concentration Curl": "Rosca Concentrada",
  "Preacher Curl": "Rosca Scott",
  "Cable Curl": "Rosca no Cabo",
  "Incline Dumbbell Curl": "Rosca Inclinada com Halteres",
  "Spider Curl": "Rosca Spider",
  "Machine Curl": "Rosca na Máquina",
  "Bayesian Curl": "Rosca Bayesian",
  "Cable Hammer Curl": "Rosca Martelo no Cabo",
  "Drag Curl": "Rosca Drag",

  // TRICEPS
  "Triceps Pushdown (Rope)": "Tríceps Corda (Pushdown)",
  "Triceps Pushdown (Bar)": "Tríceps Barra (Pushdown)",
  "Overhead Triceps Extension": "Tríceps Francês",
  "Close-Grip Bench Press": "Supino Fechado",
  "Dumbbell Kickback": "Tríceps Kickback com Halter",
  "Skull Crusher": "Tríceps Testa (Skull Crusher)",
  "Dips (Triceps)": "Paralelas (Tríceps)",
  "Cable Overhead Extension": "Extensão de Tríceps no Cabo",
  "Machine Triceps Extension": "Extensão de Tríceps na Máquina",
  "Diamond Push-Up": "Flexão Diamante",
  "JM Press": "JM Press",

  // LEGS
  "Barbell Back Squat": "Agachamento Livre com Barra",
  "Front Squat": "Agachamento Frontal",
  "Leg Press": "Leg Press",
  "Hack Squat": "Hack Squat",
  "Leg Extension": "Cadeira Extensora",
  "Leg Curl (Lying)": "Mesa Flexora (Deitado)",
  "Leg Curl (Seated)": "Cadeira Flexora (Sentado)",
  "Romanian Deadlift": "Stiff (Levantamento Terra Romeno)",
  "Bulgarian Split Squat": "Agachamento Búlgaro",
  "Goblet Squat": "Agachamento Goblet",
  "Walking Lunge": "Avanço (Passada)",
  "Barbell Hip Thrust": "Hip Thrust com Barra",
  "Cable Pull-Through": "Pull-Through no Cabo",
  "Smith Machine Squat": "Agachamento no Smith",
  "Sissy Squat": "Sissy Squat",
  "Belt Squat": "Belt Squat",
  "Pendulum Squat": "Pendulum Squat",
  "Pistol Squat": "Agachamento Pistol",
  "Step-Up": "Step-Up (Subida no Banco)",
  "Good Morning": "Good Morning",
  "Stiff-Legged Deadlift": "Stiff com Pernas Retas",
  "Dumbbell Romanian Deadlift": "Stiff com Halteres",
  "Single-Leg Romanian Deadlift": "Stiff Unilateral",

  // CALVES
  "Standing Calf Raise": "Panturrilha em Pé",
  "Seated Calf Raise": "Panturrilha Sentado",
  "Leg Press Calf Raise": "Panturrilha no Leg Press",
  "Donkey Calf Raise": "Panturrilha Donkey",
  "Smith Machine Calf Raise": "Panturrilha no Smith",

  // ABS
  "Crunch": "Abdominal (Crunch)",
  "Cable Crunch": "Abdominal no Cabo",
  "Hanging Leg Raise": "Elevação de Pernas na Barra",
  "Plank": "Prancha",
  "Ab Wheel Rollout": "Roda Abdominal",
  "Russian Twist": "Russian Twist",
  "Decline Sit-Up": "Abdominal Declinado",
  "Bicycle Crunch": "Abdominal Bicicleta",
  "Reverse Crunch": "Abdominal Reverso",
  "Leg Raise (Flat)": "Elevação de Pernas (Deitado)",
  "Mountain Climber": "Mountain Climber",
  "Dead Bug": "Dead Bug",
  "Pallof Press": "Pallof Press",
  "Side Plank": "Prancha Lateral",

  // GLUTES
  "Barbell Glute Bridge": "Ponte de Glúteos com Barra",
  "Cable Kickback": "Coice no Cabo",
  "Hip Abduction Machine": "Abdução de Quadril na Máquina",
  "Hip Adduction Machine": "Adução de Quadril na Máquina",
  "Sumo Deadlift": "Levantamento Terra Sumo",
  "Banded Clamshell": "Clamshell com Elástico",
  "Fire Hydrant": "Fire Hydrant",
  "Glute-Ham Raise": "Glute-Ham Raise",

  // FOREARMS
  "Wrist Curl": "Rosca de Punho",
  "Reverse Wrist Curl": "Rosca de Punho Reversa",
  "Farmer's Walk": "Farmer's Walk (Caminhada do Fazendeiro)",
  "Dead Hang": "Suspensão na Barra",
  "Plate Pinch": "Pinça de Anilha",

  // CARDIO
  "Treadmill Run": "Corrida na Esteira",
  "Stationary Bike": "Bicicleta Ergométrica",
  "Rowing Machine": "Remo Ergômetro",
  "Elliptical": "Elíptico",
  "Jump Rope": "Pular Corda",
  "Stair Climber": "Escada (Stair Climber)",
  "Battle Ropes": "Corda Naval",
  "Burpee": "Burpee",
  "Box Jump": "Salto na Caixa",
  "Kettlebell Swing": "Kettlebell Swing",
  "Assault Bike": "Assault Bike",
  "Sled Push": "Empurrada de Trenó",
  "Sled Pull": "Puxada de Trenó",
  "Sprints": "Sprints (Tiros)",
}

async function main() {
  let updated = 0
  let notFound = 0

  for (const [en, pt] of Object.entries(translations)) {
    const result = await prisma.exercise.updateMany({
      where: { name: en },
      data: { name: pt },
    })
    if (result.count > 0) {
      updated += result.count
      console.log(`✓ ${en} → ${pt}`)
    } else {
      notFound++
    }
  }

  // Count remaining English exercises
  const remaining = await prisma.exercise.findMany({
    where: { name: { not: { contains: " " } } },
    select: { name: true },
    take: 20,
  })

  console.log(`\n--- Resultado ---`)
  console.log(`Traduzidos: ${updated}`)
  console.log(`Não encontrados no banco: ${notFound}`)

  if (remaining.length > 0) {
    console.log(`\nExercícios restantes (sem tradução):`)
    remaining.forEach(e => console.log(`  - ${e.name}`))
  }

  await prisma.$disconnect()
}

main().catch(console.error)
