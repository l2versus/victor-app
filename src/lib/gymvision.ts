// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — GymVision (Camera Machine Recognition)
//
// Identifies gym equipment via phone camera using TensorFlow.js.
// MVP uses a placeholder classifier — swap for real model when dataset is ready.
//
// Flow:
//   1. User opens camera in GymVision mode
//   2. Taps "Scan" button (tap-to-scan, not continuous)
//   3. Model classifies the frame → identifies equipment
//   4. Shows card: machine name, muscles, if it's in today's workout
//   5. If not in workout: "Your next machine is: X"
//
// Future:
//   - Real TF.js MobileNetV3 model trained on gym equipment images
//   - Continuous real-time overlay
//   - Indoor navigation with gym layout mapping
// ══════════════════════════════════════════════════════════════════════════════

// ─── Machine Database ──────────────────────────────────────────────────────

export interface GymMachine {
  id: string
  name: string
  nameEn: string
  category: string
  muscles: string[]
  icon: string
  /** Keywords for matching (used by placeholder classifier) */
  keywords: string[]
}

export const GYM_MACHINES: GymMachine[] = [
  { id: "leg_press", name: "Leg Press", nameEn: "Leg Press", category: "Pernas", muscles: ["Quadríceps", "Glúteos"], icon: "🦵", keywords: ["leg press", "prensa"] },
  { id: "hack_squat", name: "Hack Squat", nameEn: "Hack Squat", category: "Pernas", muscles: ["Quadríceps", "Glúteos"], icon: "🦵", keywords: ["hack", "squat machine"] },
  { id: "smith_machine", name: "Smith Machine", nameEn: "Smith Machine", category: "Multi", muscles: ["Vários"], icon: "🏋️", keywords: ["smith", "guiada"] },
  { id: "lat_pulldown", name: "Puxada Frontal", nameEn: "Lat Pulldown", category: "Costas", muscles: ["Latíssimo", "Bíceps"], icon: "💪", keywords: ["pulldown", "puxada", "pulley alto"] },
  { id: "seated_row", name: "Remada Baixa", nameEn: "Seated Row", category: "Costas", muscles: ["Romboides", "Latíssimo"], icon: "💪", keywords: ["row", "remada", "seated row"] },
  { id: "chest_press", name: "Supino Máquina", nameEn: "Chest Press", category: "Peito", muscles: ["Peitoral", "Tríceps"], icon: "💪", keywords: ["chest press", "supino", "bench"] },
  { id: "pec_deck", name: "Pec Deck", nameEn: "Pec Deck / Fly", category: "Peito", muscles: ["Peitoral"], icon: "💪", keywords: ["pec deck", "fly", "crucifixo"] },
  { id: "shoulder_press", name: "Desenvolvimento Máquina", nameEn: "Shoulder Press", category: "Ombros", muscles: ["Deltóide", "Tríceps"], icon: "💪", keywords: ["shoulder press", "desenvolvimento"] },
  { id: "leg_extension", name: "Cadeira Extensora", nameEn: "Leg Extension", category: "Pernas", muscles: ["Quadríceps"], icon: "🦵", keywords: ["extensora", "leg extension"] },
  { id: "leg_curl", name: "Mesa Flexora", nameEn: "Leg Curl", category: "Pernas", muscles: ["Isquiotibiais"], icon: "🦵", keywords: ["flexora", "leg curl", "mesa"] },
  { id: "cable_crossover", name: "Crossover", nameEn: "Cable Crossover", category: "Multi", muscles: ["Peitoral", "Costas"], icon: "🏋️", keywords: ["crossover", "cable", "cross"] },
  { id: "abductor", name: "Abdutora", nameEn: "Hip Abductor", category: "Pernas", muscles: ["Glúteo Médio"], icon: "🦵", keywords: ["abdutora", "abductor"] },
  { id: "adductor", name: "Adutora", nameEn: "Hip Adductor", category: "Pernas", muscles: ["Adutores"], icon: "🦵", keywords: ["adutora", "adductor"] },
  { id: "calf_raise", name: "Panturrilha", nameEn: "Calf Raise Machine", category: "Pernas", muscles: ["Panturrilha"], icon: "🦵", keywords: ["panturrilha", "calf", "gêmeos"] },
  { id: "bicep_curl_machine", name: "Rosca Bíceps Máquina", nameEn: "Bicep Curl Machine", category: "Braços", muscles: ["Bíceps"], icon: "💪", keywords: ["rosca", "bicep", "scott"] },
  { id: "tricep_pushdown", name: "Tríceps Pulley", nameEn: "Tricep Pushdown", category: "Braços", muscles: ["Tríceps"], icon: "💪", keywords: ["tricep", "pulley", "tríceps"] },
  { id: "treadmill", name: "Esteira", nameEn: "Treadmill", category: "Cardio", muscles: ["Cardiovascular"], icon: "🏃", keywords: ["esteira", "treadmill"] },
  { id: "stationary_bike", name: "Bicicleta Ergométrica", nameEn: "Stationary Bike", category: "Cardio", muscles: ["Cardiovascular"], icon: "🚴", keywords: ["bicicleta", "bike", "ergométrica"] },
  { id: "elliptical", name: "Elíptico", nameEn: "Elliptical", category: "Cardio", muscles: ["Cardiovascular"], icon: "🏃", keywords: ["elíptico", "elliptical", "transport"] },
  { id: "glute_machine", name: "Glúteo Máquina", nameEn: "Glute Machine", category: "Pernas", muscles: ["Glúteo Máximo"], icon: "🍑", keywords: ["glúteo", "glute", "kickback"] },
]

// ─── Scan Result ───────────────────────────────────────────────────────────

export interface ScanResult {
  machine: GymMachine
  confidence: number // 0-1
  isInWorkout: boolean
  nextMachine?: string // Name of the next machine in workout
}

// ─── Placeholder Classifier (swap for TF.js model later) ───────────────────

/**
 * MVP classifier: randomly picks a machine from the database.
 *
 * In production, this will be replaced with:
 *   1. Capture frame from canvas
 *   2. Resize to 224x224 (MobileNet input)
 *   3. Run through TF.js model
 *   4. Get top-1 prediction
 *
 * To train the real model:
 *   - Collect 200-500 images per machine type (20+ types)
 *   - Fine-tune MobileNetV3-Small with TensorFlow/Keras
 *   - Export to TF.js format (tfjs_graph_model)
 *   - Host model.json + weight shards in /public/models/gymvision/
 */
export async function classifyMachine(
  _canvas: HTMLCanvasElement,
  todayExercises: string[],
): Promise<ScanResult> {
  // Simulate processing time
  await new Promise(r => setTimeout(r, 800 + Math.random() * 400))

  // Random machine for demo (replace with real TF.js inference)
  const idx = Math.floor(Math.random() * GYM_MACHINES.length)
  const machine = GYM_MACHINES[idx]

  // Check if this machine's exercises are in today's workout
  const isInWorkout = todayExercises.some(ex => {
    const exLower = ex.toLowerCase()
    return machine.keywords.some(kw => exLower.includes(kw) || kw.includes(exLower))
  })

  // Find next machine in workout
  let nextMachine: string | undefined
  if (!isInWorkout && todayExercises.length > 0) {
    // Find a machine that matches any workout exercise
    const match = GYM_MACHINES.find(m =>
      todayExercises.some(ex => {
        const exLower = ex.toLowerCase()
        return m.keywords.some(kw => exLower.includes(kw) || kw.includes(exLower))
      })
    )
    nextMachine = match?.name
  }

  return {
    machine,
    confidence: 0.75 + Math.random() * 0.2, // 75-95% for demo
    isInWorkout,
    nextMachine,
  }
}

// ─── Future: Load TF.js Model ──────────────────────────────────────────────

/**
 * Placeholder for loading the trained model.
 * Uncomment and use when model is ready:
 *
 * import * as tf from '@tensorflow/tfjs'
 *
 * let model: tf.LayersModel | null = null
 *
 * export async function loadGymVisionModel() {
 *   if (model) return model
 *   model = await tf.loadLayersModel('/models/gymvision/model.json')
 *   return model
 * }
 *
 * export async function classifyMachineReal(canvas: HTMLCanvasElement): Promise<ScanResult> {
 *   const model = await loadGymVisionModel()
 *   const tensor = tf.browser.fromPixels(canvas)
 *     .resizeBilinear([224, 224])
 *     .expandDims(0)
 *     .div(255.0)
 *   const predictions = model.predict(tensor) as tf.Tensor
 *   const scores = await predictions.data()
 *   const topIndex = scores.indexOf(Math.max(...scores))
 *   tensor.dispose()
 *   predictions.dispose()
 *   return { machine: GYM_MACHINES[topIndex], confidence: scores[topIndex], ... }
 * }
 */
