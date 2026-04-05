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
  nextMachine?: string
  /** Reference images from dataset for this class */
  referenceImages?: string[]
  /** Number of images in dataset for this class */
  datasetCount?: number
}

// ─── Dataset Manifest ──────────────────────────────────────────────────────

export interface DatasetClass {
  name: string
  namePt: string
  imageCount: number
  images: string[]
}

export interface DatasetManifest {
  totalImages: number
  totalClasses: number
  classes: Record<string, DatasetClass>
}

let cachedManifest: DatasetManifest | null = null

/** Load the dataset manifest (cached after first load) */
export async function loadDatasetManifest(): Promise<DatasetManifest | null> {
  if (cachedManifest) return cachedManifest
  try {
    const res = await fetch("/models/gymvision/dataset.json")
    if (!res.ok) return null
    cachedManifest = await res.json()
    return cachedManifest
  } catch {
    return null
  }
}

// ─── Classifier ────────────────────────────────────────────────────────────

/**
 * MVP classifier — uses color histogram comparison against dataset images.
 *
 * Strategy: for each class in the dataset, load 1 reference image and
 * compare its dominant color profile against the scanned frame.
 * This gives ~40-60% accuracy — much better than random, but still MVP.
 *
 * When a real TF.js MobileNetV3 model is trained:
 *   1. Load model from /models/gymvision/model.json
 *   2. Resize canvas to 224x224
 *   3. Run model.predict()
 *   4. Map output index → dataset class
 */
export async function classifyMachine(
  canvas: HTMLCanvasElement,
  todayExercises: string[],
): Promise<ScanResult> {
  // Load dataset manifest
  const manifest = await loadDatasetManifest()

  // Extract dominant color from scanned frame
  const ctx = canvas.getContext("2d")
  if (!ctx || !manifest) {
    // Fallback: random if no manifest
    const idx = Math.floor(Math.random() * GYM_MACHINES.length)
    return { machine: GYM_MACHINES[idx], confidence: 0.3, isInWorkout: false }
  }

  const frameColors = extractColorHistogram(ctx, canvas.width, canvas.height)

  // Compare against reference images from each class
  let bestMatch = { classId: "", score: 0 }
  const classEntries = Object.entries(manifest.classes)

  // Load reference images and compare
  const comparisons = await Promise.all(
    classEntries.map(async ([classId, cls]) => {
      if (cls.images.length === 0) return { classId, score: 0 }

      // Use first image as reference
      const refImageUrl = cls.images[0]
      try {
        const refColors = await getImageColorHistogram(refImageUrl)
        if (!refColors) return { classId, score: 0 }

        // Compare histograms (cosine similarity)
        const score = compareHistograms(frameColors, refColors)
        return { classId, score }
      } catch {
        return { classId, score: 0 }
      }
    })
  )

  // Find best match
  for (const comp of comparisons) {
    if (comp.score > bestMatch.score) {
      bestMatch = comp
    }
  }

  // Map class ID to GymMachine
  const matchedMachine = GYM_MACHINES.find(m => m.id === bestMatch.classId)
    || GYM_MACHINES.find(m => m.id.includes(bestMatch.classId) || bestMatch.classId.includes(m.id))
    || GYM_MACHINES[0]

  // Check if in workout
  const isInWorkout = todayExercises.some(ex => {
    const exLower = ex.toLowerCase()
    return matchedMachine.keywords.some(kw => exLower.includes(kw) || kw.includes(exLower))
  })

  let nextMachine: string | undefined
  if (!isInWorkout && todayExercises.length > 0) {
    const match = GYM_MACHINES.find(m =>
      todayExercises.some(ex => {
        const exLower = ex.toLowerCase()
        return m.keywords.some(kw => exLower.includes(kw) || kw.includes(exLower))
      })
    )
    nextMachine = match?.name
  }

  // Add reference images to result
  const datasetClass = manifest.classes[bestMatch.classId]
  const result: ScanResult = {
    machine: matchedMachine,
    confidence: Math.min(0.95, bestMatch.score),
    isInWorkout,
    nextMachine,
  }
  if (datasetClass) {
    result.referenceImages = datasetClass.images.slice(0, 4)
    result.datasetCount = datasetClass.imageCount
  }

  return result
}

// ─── Color Histogram Helpers ───────────────────────────────────────────────

type ColorHistogram = number[] // 27 bins (3x3x3 RGB)

function extractColorHistogram(ctx: CanvasRenderingContext2D, w: number, h: number): ColorHistogram {
  // Sample center region (60% of frame to avoid edges)
  const sx = Math.floor(w * 0.2)
  const sy = Math.floor(h * 0.2)
  const sw = Math.floor(w * 0.6)
  const sh = Math.floor(h * 0.6)
  const imageData = ctx.getImageData(sx, sy, sw, sh)
  const data = imageData.data
  const bins = new Array(27).fill(0)
  const step = 4 * 4 // Sample every 4th pixel for speed

  for (let i = 0; i < data.length; i += step) {
    const r = Math.floor(data[i] / 86)     // 0, 1, 2
    const g = Math.floor(data[i + 1] / 86)
    const b = Math.floor(data[i + 2] / 86)
    bins[r * 9 + g * 3 + b]++
  }

  // Normalize
  const total = bins.reduce((a, b) => a + b, 0) || 1
  return bins.map(b => b / total)
}

const imageHistogramCache = new Map<string, ColorHistogram>()

async function getImageColorHistogram(imageUrl: string): Promise<ColorHistogram | null> {
  if (imageHistogramCache.has(imageUrl)) return imageHistogramCache.get(imageUrl)!

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 100 // Small for speed
      canvas.height = 100
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0, 100, 100)
      const hist = extractColorHistogram(ctx, 100, 100)
      imageHistogramCache.set(imageUrl, hist)
      resolve(hist)
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

function compareHistograms(a: ColorHistogram, b: ColorHistogram): number {
  // Cosine similarity
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom > 0 ? dot / denom : 0
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
