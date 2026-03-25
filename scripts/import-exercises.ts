import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type NewExercise = { name: string; muscle: string; equipment: string }

// ══════════════════════════════════════════
// TRÍCEPS
// ══════════════════════════════════════════
const TRICEPS: NewExercise[] = [
  // Extensões de cotovelo — Pulley
  { name: "Tríceps na corda", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps barra reta", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps barra W", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps invertido (pegada supinada)", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps unilateral no cabo", muscle: "Triceps", equipment: "Cable" },
  // Peso livre
  { name: "Tríceps testa (barra reta)", muscle: "Triceps", equipment: "Barbell" },
  { name: "Tríceps testa barra W", muscle: "Triceps", equipment: "Barbell" },
  { name: "Tríceps testa com halteres", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tríceps testa unilateral", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tríceps testa no banco inclinado", muscle: "Triceps", equipment: "Barbell" },
  // Acima da cabeça
  { name: "Tríceps francês com halter (bilateral)", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tríceps francês unilateral", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tríceps francês com barra", muscle: "Triceps", equipment: "Barbell" },
  { name: "Tríceps no pulley acima da cabeça", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps corda acima da cabeça", muscle: "Triceps", equipment: "Cable" },
  { name: "Tríceps sentado acima da cabeça", muscle: "Triceps", equipment: "Dumbbell" },
  // Multiarticulares
  { name: "Supino fechado", muscle: "Triceps", equipment: "Barbell" },
  { name: "Paralelas (mergulho)", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Paralela assistida", muscle: "Triceps", equipment: "Machine" },
  { name: "Mergulho em banco", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Flexão diamante", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Máquina de mergulho", muscle: "Triceps", equipment: "Machine" },
  // Variações
  { name: "Tríceps coice (kickback)", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tríceps cross body no cabo", muscle: "Triceps", equipment: "Cable" },
  { name: "Extensão no smith (tipo testa guiado)", muscle: "Triceps", equipment: "Machine" },
  { name: "Tríceps no banco declinado", muscle: "Triceps", equipment: "Barbell" },
  { name: "Tríceps com elástico", muscle: "Triceps", equipment: "Band" },
  { name: "Tríceps em suspensão (TRX)", muscle: "Triceps", equipment: "Other" },
  // Máquinas
  { name: "Tríceps máquina (extensão guiada)", muscle: "Triceps", equipment: "Machine" },
  { name: "Máquinas articuladas de extensão", muscle: "Triceps", equipment: "Machine" },
]

// ══════════════════════════════════════════
// BÍCEPS
// ══════════════════════════════════════════
const BICEPS: NewExercise[] = [
  // Barra
  { name: "Rosca direta barra reta", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca direta barra W (EZ)", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca direta pegada aberta", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca direta pegada fechada", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca direta invertida (pronada)", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca drag (barra rente ao corpo)", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca direta no Smith", muscle: "Biceps", equipment: "Machine" },
  // Halteres
  { name: "Rosca alternada", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca simultânea", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca concentrada", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca inclinada (banco inclinado)", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca spider (apoio no banco inclinado)", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca unilateral em pé", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca com rotação (supinação ativa)", muscle: "Biceps", equipment: "Dumbbell" },
  // Cabo
  { name: "Rosca no pulley barra reta", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca no pulley barra W", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca no pulley com corda", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca unilateral no cabo", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca cruzada no cabo (cross body)", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca Bayesian (cabo atrás do corpo)", muscle: "Biceps", equipment: "Cable" },
  { name: "Rosca alta no cabo (tipo duplo bíceps)", muscle: "Biceps", equipment: "Cable" },
  // Máquinas
  { name: "Rosca Scott máquina", muscle: "Biceps", equipment: "Machine" },
  { name: "Rosca bíceps máquina (sentado)", muscle: "Biceps", equipment: "Machine" },
  { name: "Rosca articulada (Hammer / convergente)", muscle: "Biceps", equipment: "Machine" },
  { name: "Rosca unilateral em máquina", muscle: "Biceps", equipment: "Machine" },
  // Scott
  { name: "Rosca Scott barra", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca Scott barra W", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca Scott halter", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca Scott unilateral", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca Scott no cabo", muscle: "Biceps", equipment: "Cable" },
  // Pegada
  { name: "Rosca martelo", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca martelo alternada", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca martelo cross body", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca invertida (barra ou halter)", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca Zottman", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca neutra no cabo", muscle: "Biceps", equipment: "Cable" },
  // Funcionais
  { name: "Chin-up (barra fixa supinada)", muscle: "Biceps", equipment: "Bodyweight" },
  { name: "Rosca no TRX", muscle: "Biceps", equipment: "Other" },
  { name: "Rosca com elástico", muscle: "Biceps", equipment: "Band" },
  { name: "Rosca isométrica (hold)", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Rosca 21 (método)", muscle: "Biceps", equipment: "Barbell" },
  { name: "Rosca com pausa (isometria no pico)", muscle: "Biceps", equipment: "Dumbbell" },
]

// ══════════════════════════════════════════
// OMBROS (DELTÓIDE)
// ══════════════════════════════════════════
const SHOULDERS: NewExercise[] = [
  // Frontal
  { name: "Elevação frontal com halter", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação frontal alternada", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação frontal com barra", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Elevação frontal com anilha", muscle: "Shoulders", equipment: "Other" },
  { name: "Elevação frontal no cabo", muscle: "Shoulders", equipment: "Cable" },
  { name: "Elevação frontal unilateral no cabo", muscle: "Shoulders", equipment: "Cable" },
  { name: "Elevação frontal com elástico", muscle: "Shoulders", equipment: "Band" },
  { name: "Elevação frontal com pegada neutra", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação frontal com rotação", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação frontal inclinada", muscle: "Shoulders", equipment: "Dumbbell" },
  // Lateral
  { name: "Elevação lateral com halteres", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral alternada", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral bilateral", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral inclinada (leaning)", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral no cabo", muscle: "Shoulders", equipment: "Cable" },
  { name: "Elevação lateral unilateral no cabo", muscle: "Shoulders", equipment: "Cable" },
  { name: "Elevação lateral atrás do corpo (cabo)", muscle: "Shoulders", equipment: "Cable" },
  { name: "Elevação lateral máquina", muscle: "Shoulders", equipment: "Machine" },
  { name: "Elevação lateral articulada", muscle: "Shoulders", equipment: "Machine" },
  { name: "Elevação lateral parcial", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral com pausa", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral com drop", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Elevação lateral sentado", muscle: "Shoulders", equipment: "Dumbbell" },
  // Posterior
  { name: "Crucifixo inverso com halteres", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Crucifixo inverso no banco inclinado", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Crucifixo inverso no cabo", muscle: "Shoulders", equipment: "Cable" },
  { name: "Crucifixo inverso unilateral", muscle: "Shoulders", equipment: "Cable" },
  { name: "Reverse peck deck", muscle: "Shoulders", equipment: "Machine" },
  { name: "Máquina deltóide posterior", muscle: "Shoulders", equipment: "Machine" },
  { name: "Face pull (corda)", muscle: "Shoulders", equipment: "Cable" },
  { name: "Face pull unilateral", muscle: "Shoulders", equipment: "Cable" },
  { name: "Pull-apart com elástico", muscle: "Shoulders", equipment: "Band" },
  // Compostos
  { name: "Desenvolvimento com barra", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Desenvolvimento com halteres", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Desenvolvimento Arnold", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Desenvolvimento no Smith", muscle: "Shoulders", equipment: "Machine" },
  { name: "Desenvolvimento máquina", muscle: "Shoulders", equipment: "Machine" },
  { name: "Desenvolvimento unilateral", muscle: "Shoulders", equipment: "Dumbbell" },
  // Variações
  { name: "Elevação lateral 1 braço no cabo cruzado", muscle: "Shoulders", equipment: "Cable" },
  { name: "Remada alta (ênfase em deltóide)", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Remada alta com halter", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Desenvolvimento atrás da cabeça", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Landmine press (ombro)", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Elevação lateral em 45°", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Crucifixo inverso com pausa isométrica", muscle: "Shoulders", equipment: "Dumbbell" },
  // Funcionais
  { name: "Pike push-up", muscle: "Shoulders", equipment: "Bodyweight" },
  { name: "Handstand push-up", muscle: "Shoulders", equipment: "Bodyweight" },
  { name: "Flexão com elevação de ombro", muscle: "Shoulders", equipment: "Bodyweight" },
  { name: "TRX elevação lateral/posterior", muscle: "Shoulders", equipment: "Other" },
]

// ══════════════════════════════════════════
// PEITO
// ══════════════════════════════════════════
const CHEST: NewExercise[] = [
  // Supinos barra
  { name: "Supino reto barra", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino inclinado barra", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino declinado barra", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino pegada fechada (peito)", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino pegada aberta", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino no Smith (reto)", muscle: "Chest", equipment: "Machine" },
  { name: "Supino no Smith (inclinado)", muscle: "Chest", equipment: "Machine" },
  { name: "Supino no Smith (declinado)", muscle: "Chest", equipment: "Machine" },
  // Halteres
  { name: "Supino reto halter", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Supino inclinado halter", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Supino declinado halter", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Supino unilateral halter", muscle: "Chest", equipment: "Dumbbell" },
  // Máquinas
  { name: "Chest press máquina", muscle: "Chest", equipment: "Machine" },
  { name: "Supino máquina articulada", muscle: "Chest", equipment: "Machine" },
  { name: "Supino convergente (Hammer)", muscle: "Chest", equipment: "Machine" },
  { name: "Supino inclinado máquina", muscle: "Chest", equipment: "Machine" },
  { name: "Supino declinado máquina", muscle: "Chest", equipment: "Machine" },
  { name: "Supino unilateral máquina", muscle: "Chest", equipment: "Machine" },
  // Crucifixos
  { name: "Crucifixo reto", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Crucifixo inclinado", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Crucifixo declinado", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Crucifixo unilateral", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Peck deck (voador)", muscle: "Chest", equipment: "Machine" },
  { name: "Crucifixo máquina articulada", muscle: "Chest", equipment: "Machine" },
  // Crossover
  { name: "Crossover alto → baixo (ênfase inferior)", muscle: "Chest", equipment: "Cable" },
  { name: "Crossover médio → médio", muscle: "Chest", equipment: "Cable" },
  { name: "Crossover baixo → alto (ênfase superior)", muscle: "Chest", equipment: "Cable" },
  { name: "Crossover unilateral", muscle: "Chest", equipment: "Cable" },
  { name: "Crossover com passo à frente", muscle: "Chest", equipment: "Cable" },
  { name: "Crossover com pausa isométrica", muscle: "Chest", equipment: "Cable" },
  // Peso corporal
  { name: "Flexão tradicional", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Flexão inclinada", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Flexão declinada", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Flexão com apoio instável", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Paralelas (ênfase em peito)", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Paralela assistida (peito)", muscle: "Chest", equipment: "Machine" },
  // Avançados
  { name: "Supino guilhotina", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino com pausa (isométrico)", muscle: "Chest", equipment: "Barbell" },
  { name: "Supino com tempo controlado", muscle: "Chest", equipment: "Barbell" },
  { name: "Squeeze press (halter pressionando)", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Crucifixo com pausa", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Crossover com drop set", muscle: "Chest", equipment: "Cable" },
]

// ══════════════════════════════════════════
// COSTAS
// ══════════════════════════════════════════
const BACK: NewExercise[] = [
  // Barra fixa
  { name: "Barra fixa pronada", muscle: "Back", equipment: "Bodyweight" },
  { name: "Barra fixa supinada (chin-up costas)", muscle: "Back", equipment: "Bodyweight" },
  { name: "Barra fixa neutra", muscle: "Back", equipment: "Bodyweight" },
  { name: "Barra fixa assistida", muscle: "Back", equipment: "Machine" },
  // Pulley
  { name: "Puxada frente pegada aberta", muscle: "Back", equipment: "Cable" },
  { name: "Puxada frente pegada fechada", muscle: "Back", equipment: "Cable" },
  { name: "Puxada supinada", muscle: "Back", equipment: "Cable" },
  { name: "Puxada neutra", muscle: "Back", equipment: "Cable" },
  { name: "Puxada unilateral", muscle: "Back", equipment: "Cable" },
  { name: "Puxada atrás (uso específico)", muscle: "Back", equipment: "Cable" },
  // Remadas barra
  { name: "Remada curvada barra", muscle: "Back", equipment: "Barbell" },
  { name: "Remada curvada supinada", muscle: "Back", equipment: "Barbell" },
  { name: "Remada Pendlay", muscle: "Back", equipment: "Barbell" },
  // Halter
  { name: "Remada unilateral halter", muscle: "Back", equipment: "Dumbbell" },
  { name: "Remada apoiada no banco", muscle: "Back", equipment: "Dumbbell" },
  // Máquina/cabo
  { name: "Remada baixa no cabo", muscle: "Back", equipment: "Cable" },
  { name: "Remada máquina", muscle: "Back", equipment: "Machine" },
  { name: "Remada articulada", muscle: "Back", equipment: "Machine" },
  { name: "Remada unilateral no cabo", muscle: "Back", equipment: "Cable" },
  { name: "Remada cavalinho (T-bar)", muscle: "Back", equipment: "Barbell" },
  { name: "Remada no landmine", muscle: "Back", equipment: "Barbell" },
  // Dorsal
  { name: "Pullover com halter", muscle: "Back", equipment: "Dumbbell" },
  { name: "Pullover no cabo", muscle: "Back", equipment: "Cable" },
  { name: "Pullover máquina", muscle: "Back", equipment: "Machine" },
  { name: "Puxada braço estendido (straight arm pulldown)", muscle: "Back", equipment: "Cable" },
  { name: "Puxada unilateral braço estendido", muscle: "Back", equipment: "Cable" },
  // Trapézio
  { name: "Encolhimento (shrug) barra", muscle: "Traps", equipment: "Barbell" },
  { name: "Encolhimento halter", muscle: "Traps", equipment: "Dumbbell" },
  { name: "Encolhimento máquina", muscle: "Traps", equipment: "Machine" },
  { name: "Face pull (costas)", muscle: "Traps", equipment: "Cable" },
  { name: "Remada alta barra", muscle: "Traps", equipment: "Barbell" },
  { name: "Remada alta halter", muscle: "Traps", equipment: "Dumbbell" },
  { name: "Remada alta no cabo", muscle: "Traps", equipment: "Cable" },
  // Lombar
  { name: "Extensão lombar (banco 45°)", muscle: "Back", equipment: "Bodyweight" },
  { name: "Hiperextensão", muscle: "Back", equipment: "Bodyweight" },
  { name: "Good morning", muscle: "Back", equipment: "Barbell" },
  { name: "Levantamento terra", muscle: "Back", equipment: "Barbell" },
  { name: "Terra romeno", muscle: "Back", equipment: "Barbell" },
  { name: "Terra sumô", muscle: "Back", equipment: "Barbell" },
  // Funcionais
  { name: "Remada no TRX", muscle: "Back", equipment: "Other" },
  { name: "Remada com elástico", muscle: "Back", equipment: "Band" },
  { name: "Remada Meadows", muscle: "Back", equipment: "Dumbbell" },
  { name: "Remada com pausa isométrica", muscle: "Back", equipment: "Barbell" },
  { name: "Puxada com foco em escápula", muscle: "Back", equipment: "Cable" },
]

// ══════════════════════════════════════════
// PERNAS
// ══════════════════════════════════════════
const LEGS: NewExercise[] = [
  // Quadríceps compostos
  { name: "Agachamento livre", muscle: "Quadriceps", equipment: "Barbell" },
  { name: "Agachamento frontal", muscle: "Quadriceps", equipment: "Barbell" },
  { name: "Agachamento no Smith", muscle: "Quadriceps", equipment: "Machine" },
  { name: "Leg press 45°", muscle: "Quadriceps", equipment: "Machine" },
  { name: "Leg press horizontal", muscle: "Quadriceps", equipment: "Machine" },
  { name: "Hack machine", muscle: "Quadriceps", equipment: "Machine" },
  // Isoladores quad
  { name: "Cadeira extensora", muscle: "Quadriceps", equipment: "Machine" },
  { name: "Extensora unilateral", muscle: "Quadriceps", equipment: "Machine" },
  { name: "Extensora com pausa", muscle: "Quadriceps", equipment: "Machine" },
  // Variações quad
  { name: "Agachamento búlgaro", muscle: "Quadriceps", equipment: "Dumbbell" },
  { name: "Afundo (lunge)", muscle: "Quadriceps", equipment: "Dumbbell" },
  { name: "Passada andando", muscle: "Quadriceps", equipment: "Dumbbell" },
  { name: "Step-up (quadríceps)", muscle: "Quadriceps", equipment: "Dumbbell" },
  // Posterior
  { name: "Mesa flexora", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Mesa flexora unilateral", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Cadeira flexora", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Flexora em pé", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Stiff", muscle: "Hamstrings", equipment: "Barbell" },
  { name: "Stiff com halter", muscle: "Hamstrings", equipment: "Dumbbell" },
  { name: "Terra romeno (posterior)", muscle: "Hamstrings", equipment: "Barbell" },
  { name: "Good morning (posterior)", muscle: "Hamstrings", equipment: "Barbell" },
  // Glúteo
  { name: "Hip thrust", muscle: "Glutes", equipment: "Barbell" },
  { name: "Glute bridge", muscle: "Glutes", equipment: "Bodyweight" },
  { name: "Elevação pélvica unilateral", muscle: "Glutes", equipment: "Bodyweight" },
  { name: "Coice no cabo (kickback)", muscle: "Glutes", equipment: "Cable" },
  { name: "Coice unilateral", muscle: "Glutes", equipment: "Cable" },
  { name: "Máquina de glúteo", muscle: "Glutes", equipment: "Machine" },
  { name: "Cadeira abdutora", muscle: "Glutes", equipment: "Machine" },
  { name: "Abdução com elástico", muscle: "Glutes", equipment: "Band" },
  { name: "Caminhada lateral com elástico", muscle: "Glutes", equipment: "Band" },
  // Panturrilha
  { name: "Panturrilha em pé", muscle: "Calves", equipment: "Machine" },
  { name: "Panturrilha sentado", muscle: "Calves", equipment: "Machine" },
  { name: "Panturrilha no leg press", muscle: "Calves", equipment: "Machine" },
  { name: "Panturrilha unilateral", muscle: "Calves", equipment: "Bodyweight" },
  { name: "Panturrilha no Smith", muscle: "Calves", equipment: "Machine" },
  { name: "Panturrilha donkey", muscle: "Calves", equipment: "Machine" },
  // Funcionais perna
  { name: "Agachamento unilateral (pistol)", muscle: "Quadriceps", equipment: "Bodyweight" },
  { name: "TRX squat", muscle: "Quadriceps", equipment: "Other" },
  { name: "Afundo com pausa", muscle: "Quadriceps", equipment: "Dumbbell" },
  { name: "Agachamento com elástico", muscle: "Quadriceps", equipment: "Band" },
  { name: "Step-up avançado", muscle: "Quadriceps", equipment: "Dumbbell" },
  { name: "Agachamento com tempo controlado", muscle: "Quadriceps", equipment: "Barbell" },
]

// ══════════════════════════════════════════
// IMPORT
// ══════════════════════════════════════════

const ALL_EXERCISES = [
  ...TRICEPS,
  ...BICEPS,
  ...SHOULDERS,
  ...CHEST,
  ...BACK,
  ...LEGS,
]

async function main() {
  console.log(`\nTotal de exercícios para importar: ${ALL_EXERCISES.length}\n`)

  // Get existing exercises to avoid duplicates
  const existing = await prisma.exercise.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()))
  console.log(`Exercícios já no banco: ${existing.length}`)

  // Filter duplicates
  const toInsert = ALL_EXERCISES.filter((ex) => !existingNames.has(ex.name.toLowerCase().trim()))
  const skipped = ALL_EXERCISES.length - toInsert.length

  console.log(`Novos para inserir: ${toInsert.length}`)
  if (skipped > 0) console.log(`Duplicados ignorados: ${skipped}`)

  // Get trainer ID
  const trainer = await prisma.trainerProfile.findFirst({
    orderBy: { students: { _count: "desc" } },
    select: { id: true },
  })

  if (!trainer) {
    console.error("Nenhum trainer encontrado!")
    return
  }

  // Insert in batches
  let inserted = 0
  for (const ex of toInsert) {
    try {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          isCustom: false,
        },
      })
      inserted++
    } catch (e: any) {
      console.error(`  ERRO ao inserir "${ex.name}": ${e.message}`)
    }
  }

  // Final count
  const total = await prisma.exercise.count()
  console.log(`\n--- IMPORTAÇÃO COMPLETA ---`)
  console.log(`Inseridos: ${inserted}`)
  console.log(`Total no banco agora: ${total}`)

  // Distribution
  const groups = await prisma.exercise.groupBy({
    by: ["muscle"],
    _count: true,
    orderBy: { _count: { muscle: "desc" } },
  })
  console.log(`\nDistribuição por grupo:`)
  for (const g of groups) {
    console.log(`  ${g.muscle}: ${g._count}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
