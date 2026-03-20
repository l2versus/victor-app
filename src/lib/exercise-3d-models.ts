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
  {
    sketchfabId: "bc1dd40071da4bbcb16947da6bc2b6c4",
    title: "Leg Press Pivot",
    titleEn: "The Pivot Leg Press",
    matchExercises: [
      "Leg Press (Pés Juntos)", "Life Fitness Insignia Leg Press",
      "Hammer Strength Leg Press", "Matrix Leg Press (Sled)",
    ],
    muscles: ["Quadríceps", "Glúteos", "Posterior"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "26c4af65db9d694b623c105c464b739b",
    title: "Agachamento com Cinto",
    titleEn: "Belt Squat Exercise",
    matchExercises: [
      "Hammer Strength Belt Squat", "Agachamento Livre",
      "Agachamento Frontal", "Agachamento Goblet",
    ],
    muscles: ["Quadríceps", "Glúteos", "Core"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "af3da5ae5b6c4dfc8d3c0f283082c43c",
    title: "Máquina de Voador Peitoral",
    titleEn: "Plate Loaded Pec Fly Machine",
    matchExercises: [
      "Peck Deck", "Hammer Strength Super Fly",
      "Hoist Pec Fly (ROC-IT)", "Nautilus Pec Deck",
    ],
    muscles: ["Peito"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "2c8cc3e6b3af4e7485c0ac49e5d4f4c4",
    title: "Máquina de Agachamento com Cinto",
    titleEn: "Belt Squat Machine (HD)",
    matchExercises: [
      "Hammer Strength Belt Squat", "Hammer Strength Pendulum Squat",
    ],
    muscles: ["Quadríceps", "Glúteos"],
    credit: "Mike - Modelo Muscular 3D",
  },
  {
    sketchfabId: "d1e85d7b9d5e4e3f877b83d0af1c3d9e",
    title: "Supino Reto com Barra",
    titleEn: "Bench Press Exercise",
    matchExercises: [
      "Supino Reto com Barra", "Supino Reto com Halter",
      "Supino na Máquina", "Hoist Chest Press (ROC-IT)",
      "Hammer Strength Iso-Lateral Chest Press (Flat)",
    ],
    muscles: ["Peito", "Tríceps", "Ombros"],
    credit: "Mike - Modelo Muscular 3D",
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
