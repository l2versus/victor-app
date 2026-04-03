/**
 * Overhead Squat Assessment Engine (NASM)
 *
 * Analyzes 5 checkpoints during an overhead squat from frontal + lateral views.
 * Uses MediaPipe landmarks to detect compensations in real-time.
 *
 * REFERENCES:
 * [1] NASM Essentials of Corrective Exercise Training, 2nd ed
 * [2] NASM Overhead Squat Assessment protocol (ptpioneer.com/nasm-overhead-squat-assessment)
 * [3] PMC 4595915 — DS scores predict FMS composite scores
 * [4] SOMA system — MediaPipe FMS validation (SOAR, 2024)
 *
 * CHECKPOINTS:
 * Frontal: (1) Feet turn out  (2) Knees cave in (valgus)
 * Lateral: (3) Excessive lumbar arch  (4) Arms fall forward  (5) Heels rise
 */

import { calculateAngle, LANDMARKS, type Point } from "./posture-rules"

const L = LANDMARKS

// ═══ Types ═══

export interface SquatCheckpoint {
  key: string
  label: string
  labelEn: string
  view: "frontal" | "lateral"
  passed: boolean
  measuredValue: number
  threshold: string
  description: string
  overactiveMusclePT: string[]
  underactiveMusclePT: string[]
  correctiveExercises: string[]
  reference: string
}

export interface SquatPhase {
  phase: "standing" | "descending" | "bottom" | "ascending"
  kneeAngle: number
  timestamp: number
}

export interface SquatRepResult {
  repNumber: number
  checkpoints: SquatCheckpoint[]
  compensationCount: number
  kneeAngleAtBottom: number
}

export interface SquatAssessmentResult {
  reps: SquatRepResult[]
  avgCompensations: number
  totalReps: number
  /** Consistent compensations (appear in > 50% of reps) */
  consistentCompensations: string[]
  overallScore: number // 0 = many compensations, 100 = perfect form
  allCheckpoints: SquatCheckpoint[] // aggregated across all reps
}

// ═══ Phase Detection ═══

/** Detect squat phase from knee angle */
export function detectSquatPhase(
  kneeAngle: number,
  prevPhase: SquatPhase["phase"],
): SquatPhase["phase"] {
  // Standing: knee angle > 160°
  // Descending: angle decreasing and < 160°
  // Bottom: angle < 100° (deep squat)
  // Ascending: angle increasing from bottom
  if (kneeAngle > 160) return "standing"
  if (kneeAngle < 100) return "bottom"
  if (prevPhase === "standing" || prevPhase === "descending") return "descending"
  return "ascending"
}

// ═══ Checkpoint Analysis ═══

/** Checkpoint 1 (Frontal): Feet turn out — ankle-knee alignment */
function checkFeetTurnout(lm: Point[]): SquatCheckpoint {
  // Compare ankle X positions relative to knee X
  // If ankles are wider than knees = feet turning out
  const lAnkle = lm[L.LEFT_ANKLE]
  const rAnkle = lm[L.RIGHT_ANKLE]
  const lKnee = lm[L.LEFT_KNEE]
  const rKnee = lm[L.RIGHT_KNEE]
  const lFoot = lm[L.LEFT_FOOT_INDEX]
  const rFoot = lm[L.RIGHT_FOOT_INDEX]

  // Foot spread vs knee spread — if feet much wider = turnout
  const footSpread = Math.abs(lFoot.x - rFoot.x)
  const kneeSpread = Math.abs(lKnee.x - rKnee.x)
  const ankleSpread = Math.abs(lAnkle.x - rAnkle.x)

  // Ratio: if foot/ankle > knee by 15%+, feet are turning out
  const turnoutRatio = kneeSpread > 0 ? ((ankleSpread / kneeSpread) - 1) * 100 : 0
  const passed = turnoutRatio < 15

  return {
    key: "feet_turnout",
    label: "Pés — Rotação Externa",
    labelEn: "Feet Turn Out",
    view: "frontal",
    passed,
    measuredValue: Math.round(turnoutRatio),
    threshold: "< 15% diferença pé/joelho",
    description: passed
      ? "Pés alinhados corretamente com os joelhos"
      : "Pés rodam para fora durante o agachamento",
    overactiveMusclePT: ["Sóleo", "Gastrocnêmio lateral", "Bíceps femoral"],
    underactiveMusclePT: ["Gastrocnêmio medial", "Grácil", "Sartório", "Poplíteo"],
    correctiveExercises: ["calf-stretch", "ankle-dorsiflexion", "single-leg-balance"],
    reference: "NASM CPT, Sahrmann 2002",
  }
}

/** Checkpoint 2 (Frontal): Knees cave in (valgus) */
function checkKneeValgus(lm: Point[]): SquatCheckpoint {
  // At bottom of squat, knees should track over toes
  // Valgus = knees collapse inward past ankle line
  const lHip = lm[L.LEFT_HIP]
  const rHip = lm[L.RIGHT_HIP]
  const lKnee = lm[L.LEFT_KNEE]
  const rKnee = lm[L.RIGHT_KNEE]
  const lAnkle = lm[L.LEFT_ANKLE]
  const rAnkle = lm[L.RIGHT_ANKLE]

  // Frontal plane: hip-knee-ankle angle (should be ~180° = straight)
  const leftAngle = calculateAngle(lHip, lKnee, lAnkle)
  const rightAngle = calculateAngle(rHip, rKnee, rAnkle)

  // Also check if knees are closer together than ankles
  const kneeWidth = Math.abs(lKnee.x - rKnee.x)
  const ankleWidth = Math.abs(lAnkle.x - rAnkle.x)
  const valgusRatio = ankleWidth > 0 ? (kneeWidth / ankleWidth) : 1

  // Valgus if knees are < 90% of ankle width OR angle deviation > 10°
  const worstAngleDeviation = Math.max(Math.abs(180 - leftAngle), Math.abs(180 - rightAngle))
  const passed = valgusRatio > 0.85 && worstAngleDeviation < 10

  return {
    key: "knee_valgus",
    label: "Joelhos — Valgo (para dentro)",
    labelEn: "Knee Valgus",
    view: "frontal",
    passed,
    measuredValue: Math.round((1 - valgusRatio) * 100),
    threshold: "Joelhos alinhados com tornozelos",
    description: passed
      ? "Joelhos alinhados sobre os pés durante o agachamento"
      : "Joelhos colapsam para dentro (valgo dinâmico)",
    overactiveMusclePT: ["Adutores", "TFL/Banda IT", "Vasto Lateral"],
    underactiveMusclePT: ["Glúteo Médio", "Glúteo Máximo", "VMO"],
    correctiveExercises: ["clamshell", "glute-bridge", "agachamento"],
    reference: "NASM CPT, Q-angle (Physiopedia)",
  }
}

/** Checkpoint 3 (Lateral): Excessive lumbar arch */
function checkLumbarArch(lm: Point[]): SquatCheckpoint {
  const side = bestSide(lm)
  const shoulder = lm[side === "left" ? L.LEFT_SHOULDER : L.RIGHT_SHOULDER]
  const hip = lm[side === "left" ? L.LEFT_HIP : L.RIGHT_HIP]
  const knee = lm[side === "left" ? L.LEFT_KNEE : L.RIGHT_KNEE]

  // Shoulder-hip-knee angle — excessive arch = angle < 160° at bottom of squat
  const lordosisAngle = calculateAngle(shoulder, hip, knee)
  const deviation = 180 - lordosisAngle
  const passed = deviation < 15 // < 15° = normal pelvic tilt during squat

  return {
    key: "lumbar_arch",
    label: "Lombar — Hiperlordose",
    labelEn: "Excessive Lumbar Arch",
    view: "lateral",
    passed,
    measuredValue: Math.round(deviation),
    threshold: "< 15° de desvio lombar",
    description: passed
      ? "Coluna lombar neutra durante o agachamento"
      : "Arco lombar excessivo (anterior pelvic tilt)",
    overactiveMusclePT: ["Flexores do Quadril", "Eretores da Espinha"],
    underactiveMusclePT: ["Glúteo Máximo", "Core/Transverso", "Isquiotibiais"],
    correctiveExercises: ["hip-flexor-stretch", "glute-bridge", "dead-bug"],
    reference: "NASM CPT, Kendall 2005",
  }
}

/** Checkpoint 4 (Lateral): Arms fall forward */
function checkArmsFallForward(lm: Point[]): SquatCheckpoint {
  const side = bestSide(lm)
  const ear = lm[side === "left" ? L.LEFT_EAR : L.RIGHT_EAR]
  const shoulder = lm[side === "left" ? L.LEFT_SHOULDER : L.RIGHT_SHOULDER]
  const elbow = lm[side === "left" ? L.LEFT_ELBOW : L.RIGHT_ELBOW]
  const wrist = lm[side === "left" ? L.LEFT_WRIST : L.RIGHT_WRIST]
  const hip = lm[side === "left" ? L.LEFT_HIP : L.RIGHT_HIP]

  // Arms overhead: wrist should be above/behind ear in lateral view
  // If wrist X is significantly forward of shoulder = arms falling
  const armAngle = calculateAngle(hip, shoulder, wrist)

  // Arms should be ~180° (straight up in line with torso)
  // < 150° = arms falling forward significantly
  const deviation = 180 - armAngle
  const passed = deviation < 20

  return {
    key: "arms_fall_forward",
    label: "Braços — Caem para frente",
    labelEn: "Arms Fall Forward",
    view: "lateral",
    passed,
    measuredValue: Math.round(deviation),
    threshold: "Braços alinhados com o tronco (< 20°)",
    description: passed
      ? "Braços mantêm posição overhead corretamente"
      : "Braços caem para frente durante o agachamento",
    overactiveMusclePT: ["Peitoral Maior", "Grande Dorsal", "Deltóide Anterior"],
    underactiveMusclePT: ["Deltóide Médio/Posterior", "Rotadores Externos", "Trapézio Inferior"],
    correctiveExercises: ["wall-angel", "face-pull", "remada-curvada"],
    reference: "NASM CPT",
  }
}

/** Checkpoint 5 (Lateral): Heels rise off ground */
function checkHeelRise(lm: Point[]): SquatCheckpoint {
  const side = bestSide(lm)
  const ankle = lm[side === "left" ? L.LEFT_ANKLE : L.RIGHT_ANKLE]
  const heel = lm[side === "left" ? L.LEFT_HEEL : L.RIGHT_HEEL]
  const foot = lm[side === "left" ? L.LEFT_FOOT_INDEX : L.RIGHT_FOOT_INDEX]

  // If heel Y is significantly higher (lower value) than foot Y = heel rising
  // Heel should be at same Y or lower (higher value) than foot
  const heelRise = (foot.y - heel.y) * 100 // positive = heel higher than toe base
  const passed = heelRise < 3 // < 3% of image height = normal

  return {
    key: "heel_rise",
    label: "Calcanhares — Levantam do chão",
    labelEn: "Heels Rise",
    view: "lateral",
    passed,
    measuredValue: Math.round(Math.max(0, heelRise)),
    threshold: "Calcanhares no chão",
    description: passed
      ? "Calcanhares mantêm contato com o solo"
      : "Calcanhares levantam durante o agachamento",
    overactiveMusclePT: ["Sóleo", "Gastrocnêmio"],
    underactiveMusclePT: ["Tibial Anterior", "Glúteo Máximo"],
    correctiveExercises: ["calf-stretch", "ankle-dorsiflexion", "agachamento"],
    reference: "NASM CPT",
  }
}

// ═══ Helpers ═══

function bestSide(lm: Point[]): "left" | "right" {
  const lVis = Math.abs(lm[L.LEFT_SHOULDER]?.z ?? 0)
  const rVis = Math.abs(lm[L.RIGHT_SHOULDER]?.z ?? 0)
  return lVis <= rVis ? "left" : "right"
}

// ═══ Single Rep Analysis ═══

export function analyzeSquatRep(
  frontalLandmarks: Point[],
  lateralLandmarks: Point[] | null,
  repNumber: number,
): SquatRepResult {
  const checkpoints: SquatCheckpoint[] = []

  // Frontal checkpoints (always available)
  checkpoints.push(checkFeetTurnout(frontalLandmarks))
  checkpoints.push(checkKneeValgus(frontalLandmarks))

  // Lateral checkpoints (if lateral view provided AND actually from a lateral angle).
  // Guard: in a true lateral view, one shoulder is much closer to the camera than the other,
  // producing a large z-depth difference. When both shoulders have similar z values
  // (difference < 0.15), the landmarks are from a frontal view and lateral checks
  // would produce unreliable results — skip them even if lateralLandmarks is non-null.
  if (lateralLandmarks) {
    const lShoulderZ = lateralLandmarks[L.LEFT_SHOULDER]?.z ?? 0
    const rShoulderZ = lateralLandmarks[L.RIGHT_SHOULDER]?.z ?? 0
    const shoulderZDiff = Math.abs(lShoulderZ - rShoulderZ)

    if (shoulderZDiff >= 0.15) {
      checkpoints.push(checkLumbarArch(lateralLandmarks))
      checkpoints.push(checkArmsFallForward(lateralLandmarks))
      checkpoints.push(checkHeelRise(lateralLandmarks))
    }
  }

  const kneeAngle = calculateAngle(
    frontalLandmarks[L.LEFT_HIP],
    frontalLandmarks[L.LEFT_KNEE],
    frontalLandmarks[L.LEFT_ANKLE]
  )

  return {
    repNumber,
    checkpoints,
    compensationCount: checkpoints.filter(c => !c.passed).length,
    kneeAngleAtBottom: kneeAngle,
  }
}

// ═══ Full Assessment (multiple reps) ═══

export function buildSquatAssessment(reps: SquatRepResult[]): SquatAssessmentResult {
  if (reps.length === 0) {
    return {
      reps: [],
      avgCompensations: 0,
      totalReps: 0,
      consistentCompensations: [],
      overallScore: 100,
      allCheckpoints: [],
    }
  }

  const totalReps = reps.length
  const avgCompensations = reps.reduce((sum, r) => sum + r.compensationCount, 0) / totalReps

  // Find consistent compensations (> 50% of reps)
  const allKeys = [...new Set(reps.flatMap(r => r.checkpoints.map(c => c.key)))]
  const consistentCompensations = allKeys.filter(key => {
    const failCount = reps.filter(r =>
      r.checkpoints.find(c => c.key === key && !c.passed)
    ).length
    return failCount / totalReps > 0.5
  })

  // Overall score: 100 - (avg compensations / total checkpoints) * 100
  const maxCheckpoints = reps[0].checkpoints.length
  const overallScore = Math.round(Math.max(0, 100 - (avgCompensations / maxCheckpoints) * 100))

  // Aggregate checkpoints from last rep (most representative after warm-up)
  const allCheckpoints = reps[reps.length - 1].checkpoints

  return {
    reps,
    avgCompensations: Math.round(avgCompensations * 10) / 10,
    totalReps,
    consistentCompensations,
    overallScore,
    allCheckpoints,
  }
}
