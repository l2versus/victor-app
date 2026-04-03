/**
 * Postural Assessment Engine v2 — Calibrated with Clinical References
 *
 * 12 algorithms for static postural evaluation (frontal + lateral views)
 *
 * REFERENCES:
 * [1] Kendall FP et al. "Muscles: Testing and Function with Posture and Pain" 5th ed, 2005
 * [2] Sahrmann SA. "Diagnosis and Treatment of Movement Impairment Syndromes", 2002
 * [3] NASM Essentials of Corrective Exercise Training, 2nd ed
 * [4] Physiopedia — Craniovertebral Angle: CVA > 50° normal, 40-50° mild FHP, < 40° severe
 * [5] Fon GT et al. "Thoracic kyphosis: range in normal subjects" AJR 1980 — Cobb 20-40° normal
 * [6] Frontiers in Endocrinology 2020 — Hyperkyphosis defined as Cobb > 50°
 * [7] Scoliosis Research Society — ATR 5-7° threshold for radiograph referral
 * [8] PMC 2565125 — Normal anterior pelvic tilt ~7-15° in asymptomatic adults
 * [9] Genu recurvatum: > 5° = clinical threshold (PMC/Springer)
 * [10] Q-angle: normal 14° male / 17° female, abnormal > 20° male / > 22° female (Physiopedia)
 * [11] SOMA/FMS MediaPipe validation (SOAR, Holy Angel University PT Journal 2024)
 * [12] PMC 11042887 — CVA standing vs sitting, FHP classification
 * [13] Griegel-Morris et al. 1992 — Forward head posture distance thresholds
 *
 * All analysis runs CLIENT-SIDE — no server dependency.
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
  /** Scientific source for threshold */
  reference: string
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
  const lVis = lm[leftIdx]?.z ?? 0
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

  // 1. Head tilt — ear-ear line vs horizontal
  const headTiltDeg = Math.atan2(rEar.y - lEar.y, rEar.x - lEar.x) * (180 / Math.PI)

  // 2. Shoulder level — diff as % of torso height
  const torsoHeight = midpoint(lHip, rHip).y - midpoint(lShoulder, rShoulder).y
  const shoulderLevelDiffPct = torsoHeight > 0
    ? (Math.abs(lShoulder.y - rShoulder.y) / torsoHeight) * 100
    : 0

  // 3. Hip level — diff as % of torso height
  const hipLevelDiffPct = torsoHeight > 0
    ? (Math.abs(lHip.y - rHip.y) / torsoHeight) * 100
    : 0

  // 4. Knee alignment (valgus/varus) — hip-knee-ankle angle
  // Ref [10]: Q-angle normal 14-17°, abnormal > 20-22°
  const leftKneeAlignDeg = calculateAngle(lHip, lKnee, lAnkle)
  const rightKneeAlignDeg = calculateAngle(rHip, rKnee, rAnkle)

  // 5. Trunk rotation — diagonal shoulder-hip ratio
  const leftDiag = dist(lShoulder, rHip)
  const rightDiag = dist(rShoulder, lHip)
  const trunkRotationRatio = rightDiag > 0 ? leftDiag / rightDiag : 1

  // 6. Scoliosis screening — midline deviation
  // Ref [7]: ATR 0-3° normal, 5-7° referral threshold (SRS)
  const midShoulder = midpoint(lShoulder, rShoulder)
  const midHip = midpoint(lHip, rHip)
  const midAnkle = midpoint(lAnkle, rAnkle)
  const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x)

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
  const side = bestSideIdx(lm, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const ear = lm[side === "left" ? L.LEFT_EAR : L.RIGHT_EAR]
  const shoulder = lm[side === "left" ? L.LEFT_SHOULDER : L.RIGHT_SHOULDER]
  const hip = lm[side === "left" ? L.LEFT_HIP : L.RIGHT_HIP]
  const knee = lm[side === "left" ? L.LEFT_KNEE : L.RIGHT_KNEE]
  const ankle = lm[side === "left" ? L.LEFT_ANKLE : L.RIGHT_ANKLE]

  // 7. Forward head posture — ear X offset from shoulder X
  // Ref [4]: CVA > 50° normal, 40-50° mild, < 40° severe (Physiopedia)
  // Using normalized offset × 1000 as proxy for CVA displacement
  const forwardHeadOffset = (ear.x - shoulder.x) * 1000

  // 8. Kyphosis — ear-shoulder-hip angle
  // Ref [5]: Cobb 20-40° normal, [6]: > 50° hyperkyphosis
  // Our proxy: 180° - angle = deviation. < 20° dev normal, 20-30° mild, 30-45° mod, > 45° severe
  const kyphosisAngleDeg = calculateAngle(ear, shoulder, hip)

  // 9. Lordosis — shoulder-hip-knee angle
  // Ref [1]: Normal lumbar lordosis ~40-60° Cobb, hyperlordosis > 60°
  const lordosisAngleDeg = calculateAngle(shoulder, hip, knee)

  // 10. Anterior pelvic tilt — derived from lordosis
  // Ref [8]: Normal APT 7-15° in asymptomatic adults (Kroll et al: 3-22° range)
  const pelvicTiltDeg = Math.max(0, 180 - lordosisAngleDeg)

  // 11. Knee hyperextension — hip-knee-ankle angle
  // Ref [9]: > 5° beyond neutral = genu recurvatum, > 10° = clinical concern
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

// ═══ Findings Computation — Calibrated Thresholds ═══

export function computeFindings(frontal: FrontalAngles, lateral: LateralAngles | null): PosturalFinding[] {
  const findings: PosturalFinding[] = []

  function addFinding(
    key: string, label: string, view: "frontal" | "lateral",
    measuredValue: number, referenceNormal: string, severity: Severity,
    reference: string
  ) {
    const info = severityInfo(severity)
    findings.push({
      key, label, view, measuredValue, referenceNormal, severity,
      severityLabel: info.label,
      colorClass: info.colorClass,
      correctiveExerciseIds: CORRECTIVE_MAP[key] ?? [],
      reference,
    })
  }

  // ─── FRONTAL FINDINGS ───

  // Head tilt — Ref [1]: Kendall, normal < 2-3°
  addFinding("head_tilt", "Inclinação da Cabeça", "frontal",
    Math.abs(frontal.headTiltDeg), "< 3°",
    classify(Math.abs(frontal.headTiltDeg), 3, 6, 10),
    "Kendall 2005")

  // Shoulder level — clinical: > 1cm diff = asymmetry, > 2.5cm = significant
  // As % of torso: ~2% mild, ~4% moderate, ~7% severe
  addFinding("shoulder_level", "Nivelamento dos Ombros", "frontal",
    frontal.shoulderLevelDiffPct, "< 2%",
    classify(frontal.shoulderLevelDiffPct, 2, 4, 7),
    "Kendall 2005, NASM CPT")

  // Hip level — same thresholds as shoulder
  addFinding("hip_level", "Nivelamento do Quadril", "frontal",
    frontal.hipLevelDiffPct, "< 2%",
    classify(frontal.hipLevelDiffPct, 2, 4, 7),
    "Kendall 2005")

  // Knee valgus/varus — Ref [10]: Q-angle deviation from ~175° ideal in standing
  // > 5° = mild, > 10° = moderate (Q-angle > 20° abnormal), > 15° = severe
  const leftKneeDeviation = Math.abs(175 - frontal.leftKneeAlignDeg)
  const rightKneeDeviation = Math.abs(175 - frontal.rightKneeAlignDeg)
  const worstKnee = Math.max(leftKneeDeviation, rightKneeDeviation)
  addFinding("knee_alignment", "Alinhamento dos Joelhos", "frontal",
    worstKnee, "< 5° (Q-angle normal: 14-17°)",
    classify(worstKnee, 5, 10, 15),
    "Physiopedia Q-angle, PMC 9974941")

  // Trunk rotation — ratio deviation from 1.0
  addFinding("trunk_rotation", "Rotação do Tronco", "frontal",
    Math.abs(1 - frontal.trunkRotationRatio) * 100, "< 5%",
    classify(Math.abs(1 - frontal.trunkRotationRatio) * 100, 5, 10, 15),
    "Sahrmann 2002")

  // Scoliosis screening — Ref [7]: SRS ATR 0-3° normal, 5-7° referral
  // Calibrated: < 3% normal, 3-5% mild, 5-8% moderate, > 8% severe/refer
  addFinding("scoliosis", "Desvio Lateral (Escoliose)", "frontal",
    frontal.scoliosisDeviationPct, "< 3% (SRS: ATR < 5° normal)",
    classify(frontal.scoliosisDeviationPct, 3, 5, 8),
    "Scoliosis Research Society, PMC 6765789")

  // ─── LATERAL FINDINGS ───

  if (lateral) {
    // Forward head — Ref [4,12,13]: CVA > 50° normal, 40-50° mild FHP, < 40° severe
    // Proxy: offset units. Calibrated with Griegel-Morris 1992 (~2.5cm thresholds)
    // 20 units ≈ mild, 35 ≈ moderate, 50 ≈ severe
    addFinding("forward_head", "Protração Cervical (Forward Head)", "lateral",
      Math.abs(lateral.forwardHeadOffset), "< 20 (CVA > 50°)",
      classify(Math.abs(lateral.forwardHeadOffset), 20, 35, 50),
      "Physiopedia CVA, Griegel-Morris 1992, PMC 11042887")

    // Kyphosis — Ref [5,6]: Cobb 20-40° normal, 40-50° mild, > 50° hyperkyphosis
    // Our proxy: 180° - ear-shoulder-hip angle = thoracic flexion deviation
    // Calibrated: < 25° normal, 25-35° mild, 35-45° moderate, > 45° severe
    const kyphDev = 180 - lateral.kyphosisAngleDeg
    addFinding("kyphosis", "Cifose Torácica", "lateral",
      kyphDev, "< 25° (Cobb 20-40° normal)",
      classify(kyphDev, 25, 35, 45),
      "Fon 1980 AJR, Frontiers Endocrinol 2020")

    // Lordosis — Ref [1]: normal lumbar lordosis ~40-60°, hyperlordosis > 60°
    // Proxy via shoulder-hip-knee angle deviation from neutral (~170°)
    // Calibrated: < 10° normal, 10-20° mild, 20-30° moderate, > 30° severe
    const lordosisDev = Math.max(0, 170 - lateral.lordosisAngleDeg)
    addFinding("lordosis", "Lordose Lombar", "lateral",
      lordosisDev, "< 10° (desvio do ângulo lombar)",
      classify(lordosisDev, 10, 20, 30),
      "Kendall 2005, Sahrmann 2002")

    // Anterior pelvic tilt — Ref [8]: normal ~7-15°, > 15° = excessive
    // Kroll et al: 3-22° range in normals, mean ~11°
    // Calibrated: < 15° normal, 15-20° mild, 20-25° moderate, > 25° severe
    // Cap severity to avoid double-penalizing with lordosis —
    // pelvicTiltDeg is derived from lordosisAngleDeg, so they always correlate
    const pelvicSeverity = classify(lateral.pelvicTiltDeg, 15, 20, 25)
    const lordosisSeverity = classify(lordosisDev, 10, 20, 30)
    const SEVERITY_ORDER: Severity[] = ["normal", "mild", "moderate", "severe"]
    const lordosisIdx = SEVERITY_ORDER.indexOf(lordosisSeverity)
    const cappedPelvicSeverity = SEVERITY_ORDER[Math.min(SEVERITY_ORDER.indexOf(pelvicSeverity), Math.max(0, lordosisIdx))] as Severity
    addFinding("pelvic_tilt", "Inclinação Pélvica Anterior", "lateral",
      lateral.pelvicTiltDeg, "< 15° (normal 7-15°)",
      cappedPelvicSeverity,
      "PMC 2565125, Kroll 2000, Physiopedia")

    // Knee hyperextension — Ref [9]: > 5° = genu recurvatum, > 10° = clinical
    // Calibrated: deviation from 180° (neutral)
    const kneeHyperDev = lateral.kneeHyperextDeg > 180
      ? lateral.kneeHyperextDeg - 180
      : Math.max(0, 175 - lateral.kneeHyperextDeg)
    addFinding("knee_hyperextension", "Hiperextensão do Joelho (Recurvatum)", "lateral",
      kneeHyperDev, "< 5° (> 5° = recurvatum clínico)",
      classify(kneeHyperDev, 5, 10, 15),
      "PMC genu recurvatum, Springer 2020")

    // Ankle alignment — deviation from vertical
    addFinding("ankle_alignment", "Alinhamento do Tornozelo", "lateral",
      lateral.ankleDeviationDeg, "< 5°",
      classify(lateral.ankleDeviationDeg, 5, 8, 12),
      "NASM CPT, Kendall 2005")
  }

  return findings
}

// ═══ Scoring — Weighted by clinical significance ═══

const FINDING_WEIGHTS: Record<string, number> = {
  scoliosis: 1.5,         // highest clinical significance — SRS referral
  forward_head: 1.3,      // CVA < 50° associated with neck pain (PMC)
  kyphosis: 1.2,          // hyperkyphosis = fall risk in elderly (Frontiers 2020)
  lordosis: 1.1,          // disc degeneration risk
  pelvic_tilt: 1.0,       // related to lordosis but less independent significance
  knee_alignment: 1.0,    // patellofemoral syndrome risk
  knee_hyperextension: 1.0, // ligament injury risk
  shoulder_level: 0.9,    // common compensation, lower injury risk
  hip_level: 0.9,         // often functional, not structural
  trunk_rotation: 0.8,    // often postural habit
  head_tilt: 0.7,         // usually muscular, easily correctable
  ankle_alignment: 0.7,   // often footwear-related
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
