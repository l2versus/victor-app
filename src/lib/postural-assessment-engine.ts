/**
 * Postural Assessment Engine
 * 12 algorithms for static postural evaluation (frontal + lateral views)
 * Based on: Kendall (2005), Sahrmann (2002), NASM CPT standards
 *
 * All analysis runs CLIENT-SIDE — no server dependency.
 * Reuses calculateAngle and LANDMARKS from posture-rules.ts.
 */

import { calculateAngle, LANDMARKS, type Point } from "./posture-rules"
import { CORRECTIVE_MAP } from "./postural-corrective-map"

const L = LANDMARKS

// ═══ Types ═══

export interface FrontalAngles {
  headTiltDeg: number
  shoulderLevelDiffPct: number
  hipLevelDiffPct: number
  leftKneeAlignDeg: number
  rightKneeAlignDeg: number
  trunkRotationRatio: number
  scoliosisDeviationPct: number
}

export interface LateralAngles {
  forwardHeadOffset: number
  kyphosisAngleDeg: number
  lordosisAngleDeg: number
  pelvicTiltDeg: number
  kneeHyperextDeg: number
  ankleDeviationDeg: number
}

export type Severity = "normal" | "mild" | "moderate" | "severe"

export interface PosturalFinding {
  key: string
  label: string
  view: "frontal" | "lateral"
  measuredValue: number
  referenceNormal: string
  severity: Severity
  severityLabel: string
  colorClass: string
  correctiveExerciseIds: string[]
}

export interface AssessmentResult {
  frontalAngles: FrontalAngles
  lateralAngles: LateralAngles | null
  findings: PosturalFinding[]
  overallScore: number
  severeCount: number
  moderateCount: number
  mildCount: number
  correctiveExerciseIds: string[]
}

// ═══ Helpers ═══

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function severityInfo(sev: Severity): { label: string; colorClass: string } {
  switch (sev) {
    case "normal": return { label: "Normal", colorClass: "text-emerald-400" }
    case "mild": return { label: "Leve", colorClass: "text-amber-400" }
    case "moderate": return { label: "Moderado", colorClass: "text-orange-400" }
    case "severe": return { label: "Grave", colorClass: "text-red-400" }
  }
}

function classify(value: number, mild: number, moderate: number, severe: number): Severity {
  if (value >= severe) return "severe"
  if (value >= moderate) return "moderate"
  if (value >= mild) return "mild"
  return "normal"
}

/** Pick the side with better landmark visibility */
function bestSideIdx(lm: Point[], leftIdx: number, rightIdx: number): "left" | "right" {
  const lVis = lm[leftIdx]?.z ?? 0 // MediaPipe uses z for visibility in IMAGE mode, or visibility field
  const rVis = lm[rightIdx]?.z ?? 0
  return Math.abs(lVis) <= Math.abs(rVis) ? "left" : "right"
}

// ═══ Frontal View Analysis ═══

export function analyzeFrontalView(lm: Point[]): FrontalAngles {
  const lEar = lm[L.LEFT_EAR]
  const rEar = lm[L.RIGHT_EAR]
  const lShoulder = lm[L.LEFT_SHOULDER]
  const rShoulder = lm[L.RIGHT_SHOULDER]
  const lHip = lm[L.LEFT_HIP]
  const rHip = lm[L.RIGHT_HIP]
  const lKnee = lm[L.LEFT_KNEE]
  const rKnee = lm[L.RIGHT_KNEE]
  const lAnkle = lm[L.LEFT_ANKLE]
  const rAnkle = lm[L.RIGHT_ANKLE]
  const nose = lm[L.NOSE]

  // 1. Head tilt: angle of ear-ear line vs horizontal
  const headTiltDeg = Math.atan2(rEar.y - lEar.y, rEar.x - lEar.x) * (180 / Math.PI)

  // 2. Shoulder level difference as % of torso height
  const torsoHeight = midpoint(lHip, rHip).y - midpoint(lShoulder, rShoulder).y
  const shoulderLevelDiffPct = torsoHeight > 0
    ? (Math.abs(lShoulder.y - rShoulder.y) / torsoHeight) * 100
    : 0

  // 3. Hip level difference
  const hipLevelDiffPct = torsoHeight > 0
    ? (Math.abs(lHip.y - rHip.y) / torsoHeight) * 100
    : 0

  // 4. Knee alignment (valgus/varus) — hip-knee-ankle angle
  const leftKneeAlignDeg = calculateAngle(lHip, lKnee, lAnkle)
  const rightKneeAlignDeg = calculateAngle(rHip, rKnee, rAnkle)

  // 5. Trunk rotation — diagonal ratio
  const leftDiag = dist(lShoulder, rHip)
  const rightDiag = dist(rShoulder, lHip)
  const trunkRotationRatio = rightDiag > 0 ? leftDiag / rightDiag : 1

  // 6. Scoliosis screening — midline deviation
  const midShoulder = midpoint(lShoulder, rShoulder)
  const midHip = midpoint(lHip, rHip)
  const midAnkle = midpoint(lAnkle, rAnkle)
  const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x)

  // Ideal midline: straight from nose to mid-ankle
  const idealX = (nose.x + midAnkle.x) / 2
  const maxDeviation = Math.max(
    Math.abs(midShoulder.x - idealX),
    Math.abs(midHip.x - idealX)
  )
  const scoliosisDeviationPct = shoulderWidth > 0
    ? (maxDeviation / shoulderWidth) * 100
    : 0

  return {
    headTiltDeg,
    shoulderLevelDiffPct,
    hipLevelDiffPct,
    leftKneeAlignDeg,
    rightKneeAlignDeg,
    trunkRotationRatio,
    scoliosisDeviationPct,
  }
}

// ═══ Lateral View Analysis ═══

export function analyzeLateralView(lm: Point[]): LateralAngles {
  // Pick visible side
  const side = bestSideIdx(lm, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const ear = lm[side === "left" ? L.LEFT_EAR : L.RIGHT_EAR]
  const shoulder = lm[side === "left" ? L.LEFT_SHOULDER : L.RIGHT_SHOULDER]
  const hip = lm[side === "left" ? L.LEFT_HIP : L.RIGHT_HIP]
  const knee = lm[side === "left" ? L.LEFT_KNEE : L.RIGHT_KNEE]
  const ankle = lm[side === "left" ? L.LEFT_ANKLE : L.RIGHT_ANKLE]

  // 7. Forward head posture — ear X offset from shoulder X (normalized × 1000)
  const forwardHeadOffset = (ear.x - shoulder.x) * 1000

  // 8. Kyphosis — ear-shoulder-hip angle (closer to 180° = straighter)
  const kyphosisAngleDeg = calculateAngle(ear, shoulder, hip)

  // 9. Lordosis — shoulder-hip-knee angle
  const lordosisAngleDeg = calculateAngle(shoulder, hip, knee)

  // 10. Anterior pelvic tilt — derived from lordosis angle
  const pelvicTiltDeg = 180 - lordosisAngleDeg

  // 11. Knee hyperextension — hip-knee-ankle angle
  const kneeHyperextDeg = calculateAngle(hip, knee, ankle)

  // 12. Ankle deviation from vertical
  const ankleDeviationDeg = Math.abs(
    Math.atan2(Math.abs(ankle.x - knee.x), Math.abs(ankle.y - knee.y)) * (180 / Math.PI)
  )

  return {
    forwardHeadOffset,
    kyphosisAngleDeg,
    lordosisAngleDeg,
    pelvicTiltDeg,
    kneeHyperextDeg,
    ankleDeviationDeg,
  }
}

// ═══ Findings Computation ═══

export function computeFindings(frontal: FrontalAngles, lateral: LateralAngles | null): PosturalFinding[] {
  const findings: PosturalFinding[] = []

  function addFinding(
    key: string, label: string, view: "frontal" | "lateral",
    measuredValue: number, referenceNormal: string, severity: Severity
  ) {
    const info = severityInfo(severity)
    findings.push({
      key, label, view, measuredValue, referenceNormal, severity,
      severityLabel: info.label,
      colorClass: info.colorClass,
      correctiveExerciseIds: CORRECTIVE_MAP[key] ?? [],
    })
  }

  // --- Frontal findings ---
  addFinding("head_tilt", "Inclinação da Cabeça", "frontal",
    Math.abs(frontal.headTiltDeg), "< 3°",
    classify(Math.abs(frontal.headTiltDeg), 3, 5, 10))

  addFinding("shoulder_level", "Nivelamento dos Ombros", "frontal",
    frontal.shoulderLevelDiffPct, "< 1.5%",
    classify(frontal.shoulderLevelDiffPct, 1.5, 3, 5))

  addFinding("hip_level", "Nivelamento do Quadril", "frontal",
    frontal.hipLevelDiffPct, "< 1.5%",
    classify(frontal.hipLevelDiffPct, 1.5, 3, 5))

  // Knee valgus — deviation from 175° ideal
  const leftKneeDeviation = Math.abs(175 - frontal.leftKneeAlignDeg)
  const rightKneeDeviation = Math.abs(175 - frontal.rightKneeAlignDeg)
  const worstKnee = Math.max(leftKneeDeviation, rightKneeDeviation)
  addFinding("knee_alignment", "Alinhamento dos Joelhos", "frontal",
    worstKnee, "< 5°",
    classify(worstKnee, 5, 10, 15))

  addFinding("trunk_rotation", "Rotação do Tronco", "frontal",
    Math.abs(1 - frontal.trunkRotationRatio) * 100, "< 5%",
    classify(Math.abs(1 - frontal.trunkRotationRatio) * 100, 5, 10, 15))

  addFinding("scoliosis", "Desvio Lateral (Escoliose)", "frontal",
    frontal.scoliosisDeviationPct, "< 3%",
    classify(frontal.scoliosisDeviationPct, 3, 6, 10))

  // --- Lateral findings ---
  if (lateral) {
    addFinding("forward_head", "Protração Cervical", "lateral",
      Math.abs(lateral.forwardHeadOffset), "< 15",
      classify(Math.abs(lateral.forwardHeadOffset), 15, 25, 40))

    // Kyphosis: deviation from straight (180°)
    const kyphDev = 180 - lateral.kyphosisAngleDeg
    addFinding("kyphosis", "Cifose Torácica", "lateral",
      kyphDev, "< 20°",
      classify(kyphDev, 20, 30, 45))

    addFinding("lordosis", "Lordose Lombar", "lateral",
      lateral.pelvicTiltDeg, "< 10°",
      classify(lateral.pelvicTiltDeg, 10, 20, 30))

    addFinding("pelvic_tilt", "Inclinação Pélvica Anterior", "lateral",
      lateral.pelvicTiltDeg, "< 10°",
      classify(lateral.pelvicTiltDeg, 10, 15, 20))

    // Knee hyperextension: deviation from ideal 175°
    const kneeHyperDev = lateral.kneeHyperextDeg > 180
      ? lateral.kneeHyperextDeg - 180
      : Math.max(0, 175 - lateral.kneeHyperextDeg)
    addFinding("knee_hyperextension", "Hiperextensão do Joelho", "lateral",
      kneeHyperDev, "< 5°",
      classify(kneeHyperDev, 5, 10, 15))

    addFinding("ankle_alignment", "Alinhamento do Tornozelo", "lateral",
      lateral.ankleDeviationDeg, "< 5°",
      classify(lateral.ankleDeviationDeg, 5, 8, 12))
  }

  return findings
}

// ═══ Scoring ═══

const FINDING_WEIGHTS: Record<string, number> = {
  scoliosis: 1.5,
  forward_head: 1.3,
  kyphosis: 1.2,
  lordosis: 1.1,
  pelvic_tilt: 1.1,
  knee_alignment: 1.0,
  knee_hyperextension: 1.0,
  shoulder_level: 0.9,
  hip_level: 0.9,
  trunk_rotation: 0.9,
  ankle_alignment: 0.7,
  head_tilt: 0.8,
}

const SEVERITY_PENALTY: Record<Severity, number> = {
  normal: 0,
  mild: 5,
  moderate: 12,
  severe: 20,
}

export function computeScore(findings: PosturalFinding[]): number {
  let penalty = 0
  for (const f of findings) {
    const weight = FINDING_WEIGHTS[f.key] ?? 1.0
    penalty += SEVERITY_PENALTY[f.severity] * weight
  }
  return Math.max(0, Math.min(100, Math.round(100 - penalty)))
}

// ═══ Main Entry Point ═══

export function buildAssessmentResult(
  frontalLandmarks: Point[],
  lateralLandmarks: Point[] | null,
): AssessmentResult {
  const frontalAngles = analyzeFrontalView(frontalLandmarks)
  const lateralAngles = lateralLandmarks ? analyzeLateralView(lateralLandmarks) : null
  const findings = computeFindings(frontalAngles, lateralAngles)
  const overallScore = computeScore(findings)

  const severeCount = findings.filter(f => f.severity === "severe").length
  const moderateCount = findings.filter(f => f.severity === "moderate").length
  const mildCount = findings.filter(f => f.severity === "mild").length

  const correctiveExerciseIds = [...new Set(
    findings.filter(f => f.severity !== "normal").flatMap(f => f.correctiveExerciseIds)
  )]

  return {
    frontalAngles,
    lateralAngles,
    findings,
    overallScore,
    severeCount,
    moderateCount,
    mildCount,
    correctiveExerciseIds,
  }
}
