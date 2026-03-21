/**
 * Mapeamento de exercícios para modelos 3D no Sketchfab.
 * Cada modelo pode ser embarcado via iframe gratuitamente (CC-BY).
 *
 * Fonte: Mike - Modelo Muscular 3D (@mikeshortall1991)
 * https://sketchfab.com/mikeshortall1991/models
 *
 * Crédito: "Modelo 3D de músculos" por Mike - Modelo Muscular 3D no Sketchfab
 */

export interface Exercise3DModel {
  /** Sketchfab model ID (used in embed URL) */
  sketchfabId: string
  /** Title shown in the app */
  title: string
  /** Title in English (original) */
  titleEn: string
  /** Exercise names in our database that match this model */
  matchExercises: string[]
  /** Muscle groups highlighted in the model */
  muscles: string[]
  /** Credit text */
  credit: string
}

export const EXERCISE_3D_MODELS: Exercise3DModel[] = [
  // ═══ PEITO ═══
  {
    sketchfabId: "53319e9420994a3890ce3c8c76077a8b",
    title: "Supino Reto com Barra",
    titleEn: "The Barbell Bench Press Anatomy",
    matchExercises: [
      "Supino Reto com Barra", "Supino Reto com Halter", "Supino na Máquina",
      "Hoist Chest Press (ROC-IT)", "Nautilus Chest Press",
      "Life Fitness Insignia Chest Press",
      "Hammer Strength Iso-Lateral Chest Press (Flat)",
    ],
    muscles: ["Peito", "Tríceps", "Deltóide Anterior"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "ab33b95eaa4d451a96e9a409aaa18b69",
    title: "Voador Peitoral (Pec Deck)",
    titleEn: "Plate Loaded Pec Fly Machine",
    matchExercises: [
      "Peck Deck", "Hammer Strength Super Fly", "Hoist Pec Fly (ROC-IT)",
      "Nautilus Pec Deck", "Crucifixo com Halter", "Crucifixo Inclinado",
    ],
    muscles: ["Peito"],
    credit: "Mike - Modelo Muscular 3D",
  },
  // Crucifixo e Crossover — aguardando IDs reais do Sketchfab

  // ═══ COSTAS ═══
  {
    sketchfabId: "956d42dfd57d4a2cb8daf0454f361996",
    title: "Puxada na Máquina (Lat Pulldown)",
    titleEn: "Cable Lat Pull Down Machine",
    matchExercises: [
      "Puxada Aberta", "Puxada Fechada", "Puxada Supinada",
      "Hoist Lat Pulldown (ROC-IT)", "Nautilus Lat Pulldown",
      "Life Fitness Insignia Lat Pulldown",
    ],
    muscles: ["Costas", "Bíceps"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "c51f5ca053f548b1880a5a461d27ec16",
    title: "Remada no Cabo (Seated Row)",
    titleEn: "Close Cable Row",
    matchExercises: [
      "Remada Sentada no Cabo", "Remada na Máquina",
      "Hammer Strength Iso-Lateral Row", "Hammer Strength D.Y. Row",
    ],
    muscles: ["Costas", "Bíceps"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "c6fccd943ec14d5db22e679beed7bef1",
    title: "Remada T-Bar com Apoio",
    titleEn: "Chest Supported T-Bar Row",
    matchExercises: [
      "Remada Cavalinho", "Remada com Apoio no Peito",
    ],
    muscles: ["Costas", "Bíceps", "Trapézio"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "43592d585f694f9aae975b5ba2435500",
    title: "Barra Fixa Assistida (Pull-Up)",
    titleEn: "Assisted Pull Ups",
    matchExercises: [
      "Barra Fixa (Pronada)", "Barra Fixa (Supinada)", "Barra Fixa (Neutra)",
    ],
    muscles: ["Costas", "Bíceps"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "c1c72e01eee241ac8fb19f7804d5b4c9",
    title: "Extensão Lombar (Hiperextensão)",
    titleEn: "Back Extension Cable Machine",
    matchExercises: ["Hiperextensão", "Good Morning"],
    muscles: ["Lombar", "Glúteos", "Posterior"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "6bd2fd7eab314514954acf6bd45a5fa0",
    title: "Remada para Deltóide Posterior",
    titleEn: "Rear Delt Row Variation",
    matchExercises: [
      "Crucifixo Inverso com Halter", "Crucifixo Inverso no Cabo",
      "Peck Deck Inverso", "Face Pull no Cabo",
    ],
    muscles: ["Deltóide Posterior", "Trapézio"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "e4888851bb4e4d83bc0544994100b869",
    title: "Máquina Remada / Deltóide Posterior",
    titleEn: "Row / Rear Delt Machine",
    matchExercises: [
      "Remada na Máquina", "Hoist Lat Pulldown (ROC-IT)",
    ],
    muscles: ["Costas", "Deltóide Posterior"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ OMBROS ═══
  {
    sketchfabId: "01ece82aae8b478a9bb89eff41f59648",
    title: "Desenvolvimento na Máquina (Shoulder Press)",
    titleEn: "Cable Loaded Seated Shoulder Press Machine",
    matchExercises: [
      "Desenvolvimento na Máquina", "Desenvolvimento com Barra",
      "Desenvolvimento com Halter", "Hoist Shoulder Press (ROC-IT)",
      "Hammer Strength Iso-Lateral Shoulder Press",
      "Life Fitness Insignia Shoulder Press",
    ],
    muscles: ["Ombros", "Tríceps"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "2834cffa04c64ade81619f486e707f57",
    title: "Remada Alta no Cabo",
    titleEn: "Cable Loaded Upright Row",
    matchExercises: ["Remada Alta"],
    muscles: ["Ombros", "Trapézio"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "c4e8d6d990914c139b9d7e82f52b0a46",
    title: "Remada Alta com Barra W",
    titleEn: "Upright Row Ez Barbell",
    matchExercises: ["Remada Alta", "Encolhimento com Barra"],
    muscles: ["Ombros", "Trapézio"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ BÍCEPS ═══
  {
    sketchfabId: "5cfadaec9d7a45e9abaa995c307f6f5e",
    title: "Rosca no Cabo",
    titleEn: "Cable Loaded Bicep Curl",
    matchExercises: [
      "Rosca no Cabo", "Rosca Martelo no Cabo (Corda)",
      "Hoist Biceps Curl (ROC-IT)",
    ],
    muscles: ["Bíceps"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "445d64d93cd340d384288929b21a682e",
    title: "Rosca com Barra W",
    titleEn: "EZ Barbell Curls",
    matchExercises: [
      "Rosca com Barra W", "Rosca Direta com Barra",
    ],
    muscles: ["Bíceps", "Antebraço"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ TRÍCEPS ═══
  {
    sketchfabId: "4ad529fe1de94359b3025b422333e7e5",
    title: "Mergulho no Cabo (Triceps Dip)",
    titleEn: "Cable Loaded Tricep Dip",
    matchExercises: [
      "Paralela (Tríceps)", "Paralela (Peito)", "Mergulho no Banco",
      "Hoist Seated Dip (ROC-IT)",
    ],
    muscles: ["Tríceps", "Peito"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ PERNAS ═══
  {
    sketchfabId: "26c4af65dba94694b623c105c464b739",
    title: "Agachamento com Cinto (Belt Squat)",
    titleEn: "Belt Squat Exercise Working Glutes",
    matchExercises: [
      "Hammer Strength Belt Squat", "Agachamento Livre",
      "Agachamento Frontal", "Agachamento Goblet", "Agachamento Sumô",
      "Hammer Strength Pendulum Squat", "Hammer Strength V-Squat",
    ],
    muscles: ["Quadríceps", "Glúteos", "Core"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "bc1dd40071da4bbcb16947da6bc2b6c4",
    title: "Leg Press",
    titleEn: "The Pivot Leg Press",
    matchExercises: [
      "Leg Press (Pés Juntos)", "Life Fitness Insignia Leg Press",
      "Hammer Strength Leg Press", "Matrix Leg Press (Sled)",
    ],
    muscles: ["Quadríceps", "Glúteos", "Posterior"],
    credit: "Mike - Modelo Muscular 3D",
  },
  // Cadeira Extensora — aguardando ID real do Sketchfab

  // ═══ GLÚTEOS ═══
  {
    sketchfabId: "24a2f90f299c456b8668d4b0b0855fb9",
    title: "Hip Thrust (Elevação Pélvica)",
    titleEn: "Hip Thrust Glute Drive Machine",
    matchExercises: [
      "Hip Thrust com Barra", "Hip Thrust no Smith", "Hip Thrust Unilateral",
      "Elevação de Quadril", "Elevação de Quadril com Elástico",
      "Hoist Glute Master (ROC-IT)",
    ],
    muscles: ["Glúteos", "Posterior"],
    credit: "Mike - Modelo Muscular 3D",
  },
  // Hiperextensão — aguardando ID real do Sketchfab

  // ═══ ADUTORES / ABDUTORES ═══
  {
    sketchfabId: "ce660cb48c45472dbd9a8f5b6122a2ac",
    title: "Abdutora (Hip Abduction)",
    titleEn: "Cable Loaded Abductors",
    matchExercises: ["Abdutora", "Caminhada Lateral com Elástico"],
    muscles: ["Glúteos (médio)", "Abdutores"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "36d8bb3a7a4f41f9bd568f436747dcb0",
    title: "Adutora (Hip Adduction)",
    titleEn: "Cable Loaded Adductors",
    matchExercises: ["Adutora"],
    muscles: ["Adutores"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ POSTERIOR ═══
  {
    sketchfabId: "aa88db6006274f71bebb9741b07d430d",
    title: "Stiff com Kettlebell (RDL)",
    titleEn: "Kettlebell RDL",
    matchExercises: [
      "Stiff (Romeno)", "Stiff com Halter", "Stiff Unilateral",
      "Stiff com Pernas Retas",
    ],
    muscles: ["Posterior", "Glúteos", "Lombar"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ CORE ═══
  {
    sketchfabId: "9d9210a007034674a822d8f1fe547244",
    title: "Abdominal na Máquina (Crunch)",
    titleEn: "Abdominal Crunch Machine",
    matchExercises: [
      "Abdominal Crunch", "Abdominal no Cabo", "Abdominal Declinado",
      "Hoist Abdominal (ROC-IT)", "Nautilus Abdominal Crunch",
    ],
    muscles: ["Abdômen"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "b70eb4054ba946ad91eeec0a63145d02",
    title: "Abdominal no Chão (Crunch)",
    titleEn: "Bodyweight Crunch",
    matchExercises: [
      "Abdominal Crunch", "Abdominal Bicicleta",
    ],
    muscles: ["Abdômen"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ FLEXÃO ═══
  // Flexão — aguardando ID real do Sketchfab

  // ═══ PARALELAS ═══
  {
    sketchfabId: "10bfcd1fdc7845a1b8e90d0ed6c23879",
    title: "Paralela Assistida (Dips)",
    titleEn: "Assisted Dips",
    matchExercises: [
      "Paralela (Peito)", "Paralela (Tríceps)",
    ],
    muscles: ["Peito", "Tríceps", "Ombros"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ═══ FUNCIONAL ═══
  {
    sketchfabId: "21bc1760bef745f7b4b966727a3733e6",
    title: "Functional Trainer (Cabo Duplo)",
    titleEn: "Dual Functional Trainer",
    matchExercises: [
      "Crossover no Cabo", "Rosca no Cabo", "Tríceps Corda",
      "Face Pull no Cabo", "Woodchop no Cabo",
    ],
    muscles: ["Variado"],
    credit: "Mike - Modelo Muscular 3D",
  },

  // ══════════════════════════════════════════════════════════════
  // ANIMAÇÕES DE EXERCÍCIO (pessoa fazendo o movimento na máquina)
  // Fontes: luismi93, amir.poorazima, chaitanyak (Sketchfab CC)
  // ══════════════════════════════════════════════════════════════

  // ─── PERNAS (máquinas) ─────────────────────────────────────
  {
    sketchfabId: "49ab42b9ee0c4e4fbd0407fb48b0a4d4",
    title: "Leg Press (Animado)",
    titleEn: "Gym Leg Press Animated",
    matchExercises: [
      "Leg Press", "Life Fitness Insignia Leg Press",
      "Hammer Strength Leg Press", "Matrix Leg Press",
    ],
    muscles: ["Quadríceps", "Glúteos"],
    credit: "luismi93 (Sketchfab)",
  },
  {
    sketchfabId: "c476464294ed4a67bafb27ca7fc114a1",
    title: "Treino de Pernas (Animado)",
    titleEn: "Legs Workout Animated",
    matchExercises: [
      "Cadeira Extensora", "Cadeira Flexora", "Mesa Flexora",
      "Hoist Leg Extension", "Hoist Leg Curl",
      "Cybex Prestige VRS Leg Extension", "Cybex Prestige VRS Leg Curl",
    ],
    muscles: ["Quadríceps", "Posterior"],
    credit: "luismi93 (Sketchfab)",
  },

  // ─── COSTAS (máquinas) ─────────────────────────────────────
  {
    sketchfabId: "201736c5f3974529a1c4fdc5e6bb6074",
    title: "Exercício de Costas (Animado)",
    titleEn: "Gym Exercise Animated (Back)",
    matchExercises: [
      "Remada na Máquina", "Remada Sentada no Cabo",
      "Hammer Strength D.Y. Row", "Hoist Lat Pulldown",
      "Remada Curvada com Barra", "Remada Cavalinho",
    ],
    muscles: ["Costas", "Bíceps"],
    credit: "luismi93 (Sketchfab)",
  },
  {
    sketchfabId: "164f19da64494642be5b4a203c1b1468",
    title: "Puxada Dorsal (Lat Pulldown Animado)",
    titleEn: "Gym Lat Pulldown Animated",
    matchExercises: [
      "Puxada Aberta", "Puxada Fechada", "Puxada Supinada",
      "Nautilus Lat Pulldown", "Life Fitness Insignia Lat Pulldown",
    ],
    muscles: ["Costas", "Bíceps"],
    credit: "luismi93 (Sketchfab)",
  },

  // ─── PEITO (máquinas) ──────────────────────────────────────
  {
    sketchfabId: "12436dd60a5a49329ffb502a23f77d97",
    title: "Supino na Máquina (Animado)",
    titleEn: "Seated Chest Press Machine",
    matchExercises: [
      "Supino na Máquina", "Hoist Chest Press (ROC-IT)",
      "Nautilus Chest Press", "Life Fitness Insignia Chest Press",
      "Hammer Strength Iso-Lateral Chest Press",
      "Hammer Strength Decline Press",
    ],
    muscles: ["Peito", "Tríceps"],
    credit: "chaitanyak (Sketchfab)",
  },
  {
    sketchfabId: "dbb127254b2a4910ba44dcd590f1e653",
    title: "Crossover no Cabo (Máquina)",
    titleEn: "Signature Cable Crossover",
    matchExercises: [
      "Crossover no Cabo", "Crossover Baixo",
      "Rosca no Cabo", "Tríceps Corda", "Face Pull no Cabo",
    ],
    muscles: ["Peito", "Variado"],
    credit: "chaitanyak (Sketchfab)",
  },

  // ─── CORE (animados) ───────────────────────────────────────
  {
    sketchfabId: "1076a704673b4386966215962132cc51",
    title: "Abdômen e Glúteos (Animado)",
    titleEn: "Gym Abs-Glutes Animated",
    matchExercises: [
      "Abdominal Crunch", "Abdominal Declinado",
      "Hoist Abdominal (ROC-IT)", "Nautilus Abdominal Crunch",
      "Elevação de Quadril", "Elevação de Quadril com Elástico",
    ],
    muscles: ["Abdômen", "Glúteos"],
    credit: "luismi93 (Sketchfab)",
  },
  {
    sketchfabId: "c24d18ab0e194c629eb5df4ded145b15",
    title: "Abdominal Bicicleta (Animado)",
    titleEn: "Bicycle Crunch Exercise",
    matchExercises: ["Abdominal Bicicleta", "Mountain Climber"],
    muscles: ["Abdômen"],
    credit: "chaitanyak (Sketchfab)",
  },
  {
    sketchfabId: "bc935ce6fc7a44f1b51cd9ae8e7981e0",
    title: "Twist Russo com Halter",
    titleEn: "Dumbbell Russian Twist",
    matchExercises: ["Twist Russo"],
    muscles: ["Abdômen", "Oblíquos"],
    credit: "luismi93 (Sketchfab)",
  },
  {
    sketchfabId: "3c37d2298ca14c2093ef796a412c539d",
    title: "Abdominal Reverso com Halter",
    titleEn: "Dumbbell Reverse Crunches",
    matchExercises: ["Elevação de Pernas Deitado", "Elevação de Joelhos na Barra"],
    muscles: ["Abdômen"],
    credit: "luismi93 (Sketchfab)",
  },

  // ─── AGACHAMENTO / TERRA (animados) ────────────────────────
  {
    sketchfabId: "66be0ea74eec428182a53214c47fc1fc",
    title: "Agachamento e Levantamento Terra",
    titleEn: "Gym Squats and Deadlift",
    matchExercises: [
      "Agachamento Livre", "Agachamento Frontal",
      "Levantamento Terra", "Terra Sumô",
    ],
    muscles: ["Quadríceps", "Glúteos", "Posterior", "Costas"],
    credit: "chaitanyak (Sketchfab)",
  },
  {
    sketchfabId: "ec77d84940d2459ab71c8be5b74e1c16",
    title: "Agachamento com Salto",
    titleEn: "Squat Jump Exercise",
    matchExercises: ["Agachamento Sumô", "Agachamento Goblet", "Burpee"],
    muscles: ["Quadríceps", "Glúteos"],
    credit: "amir.poorazima (Sketchfab)",
  },

  // ─── BARRA / HALTERES (animados) ──────────────────────────
  {
    sketchfabId: "ea6c656c83104c35ae0668c12b2fb9d4",
    title: "Treino com Barra (Vários Exercícios)",
    titleEn: "Barbells Workout Animation Bundle",
    matchExercises: [
      "Supino Reto com Barra", "Desenvolvimento com Barra",
      "Rosca Direta com Barra", "Remada Curvada com Barra",
      "Encolhimento com Barra",
    ],
    muscles: ["Variado"],
    credit: "chaitanyak (Sketchfab)",
  },

  // ─── 5 EXERCÍCIOS (pacote animado) ────────────────────────
  {
    sketchfabId: "7b5abc01fd804bc7b53da6259234eaf6",
    title: "5 Exercícios de Academia (Animado)",
    titleEn: "Gym 5 Exercises Animated",
    matchExercises: [
      "Crucifixo com Halter", "Rosca Direta com Halter",
      "Rosca Martelo", "Supino Inclinado com Halter",
      "Hiperextensão",
    ],
    muscles: ["Peito", "Bíceps", "Lombar"],
    credit: "luismi93 (Sketchfab)",
  },

  // ─── OMBROS (máquinas) ────────────────────────────────────
  {
    sketchfabId: "0d4e687bdbb24b5888ccfb72d296fa76",
    title: "Treino de Academia (Geral)",
    titleEn: "Gym Workout",
    matchExercises: [
      "Desenvolvimento na Máquina", "Hoist Shoulder Press (ROC-IT)",
      "Hammer Strength Iso-Lateral Shoulder Press",
      "Life Fitness Insignia Shoulder Press",
      "Elevação Lateral na Máquina", "Hoist Lateral Raise (ROC-IT)",
    ],
    muscles: ["Ombros"],
    credit: "luismi93 (Sketchfab)",
  },
]

/**
 * Encontra um modelo 3D para um exercício pelo nome.
 * Retorna null se não houver modelo disponível.
 */
export function find3DModel(exerciseName: string): Exercise3DModel | null {
  const lower = exerciseName.toLowerCase()
  for (const model of EXERCISE_3D_MODELS) {
    for (const match of model.matchExercises) {
      if (match.toLowerCase() === lower) return model
      // Partial match
      if (lower.includes(match.toLowerCase()) || match.toLowerCase().includes(lower)) return model
    }
  }
  return null
}

/**
 * Gera a URL de embed do Sketchfab com tema dark e configurações otimizadas.
 */
export function getSketchfabEmbedUrl(sketchfabId: string): string {
  return `https://sketchfab.com/models/${sketchfabId}/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=1&ui_stop=0&preload=1&transparent=1`
}
