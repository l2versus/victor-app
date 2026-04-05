// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Ghost Mirror (Espelho Fantasma)
//
// Renders an ideal pose silhouette overlay on canvas so the user can "fit"
// their body into the perfect form. Closer to ideal = GREEN, far = RED.
//
// Uses the same ExerciseRule/RepConfig system. For each exercise+phase, we
// compute the IDEAL landmark positions based on biomechanical targets, then
// draw a translucent skeleton the user tries to match.
//
// The ghost adapts to the user's body proportions (limb lengths) so it works
// for any body type — tall, short, wide, narrow.
// ══════════════════════════════════════════════════════════════════════════════

import type { Point, MuscleGroup } from "./posture-rules"
import { calculateAngle, LANDMARKS } from "./posture-rules"
import type { RepConfig } from "./posture-tracker"
import { getRepConfig } from "./posture-tracker"

const L = LANDMARKS

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GhostConfig {
  /** Enable/disable ghost overlay */
  enabled: boolean
  /** Opacity of the ghost skeleton (0-1) */
  opacity: number
  /** Show match score percentage */
  showScore: boolean
}

export interface GhostResult {
  /** Overall match score 0-100 */
  matchScore: number
  /** Per-joint match scores (used for coloring) */
  jointScores: Map<number, number>
  /** Ideal landmarks (adapted to user's proportions) */
  idealLandmarks: Point[]
}

// ─── Skeleton Connections (same as MediaPipe POSE_CONNECTIONS) ──────────────

const GHOST_CONNECTIONS: [number, number][] = [
  [L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
  [L.LEFT_SHOULDER, L.LEFT_ELBOW],
  [L.LEFT_ELBOW, L.LEFT_WRIST],
  [L.RIGHT_SHOULDER, L.RIGHT_ELBOW],
  [L.RIGHT_ELBOW, L.RIGHT_WRIST],
  [L.LEFT_SHOULDER, L.LEFT_HIP],
  [L.RIGHT_SHOULDER, L.RIGHT_HIP],
  [L.LEFT_HIP, L.RIGHT_HIP],
  [L.LEFT_HIP, L.LEFT_KNEE],
  [L.LEFT_KNEE, L.LEFT_ANKLE],
  [L.RIGHT_HIP, L.RIGHT_KNEE],
  [L.RIGHT_KNEE, L.RIGHT_ANKLE],
]

// Key joints we track for matching score
const SCORED_JOINTS = [
  L.LEFT_SHOULDER, L.RIGHT_SHOULDER,
  L.LEFT_ELBOW, L.RIGHT_ELBOW,
  L.LEFT_WRIST, L.RIGHT_WRIST,
  L.LEFT_HIP, L.RIGHT_HIP,
  L.LEFT_KNEE, L.RIGHT_KNEE,
  L.LEFT_ANKLE, L.RIGHT_ANKLE,
]

// ─── Ideal Angle Targets per Exercise Pattern ──────────────────────────────

interface IdealAngles {
  /** [pointA, vertex, pointC] → target angle in degrees */
  targets: Array<{ points: [number, number, number]; angle: number; weight: number }>
}

function getIdealAngles(muscleGroup: MuscleGroup, exerciseId: string): IdealAngles {
  // Squat family
  if (muscleGroup === "quadriceps" || exerciseId.includes("squat") || exerciseId.includes("leg_press")) {
    return {
      targets: [
        { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], angle: 90, weight: 3 },
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 80, weight: 2 },
        { points: [L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE], angle: 90, weight: 3 },
      ],
    }
  }

  // Lunge
  if (exerciseId.includes("lunge") || exerciseId.includes("afundo") || exerciseId.includes("bulgarian")) {
    return {
      targets: [
        { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], angle: 90, weight: 3 },
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 170, weight: 2 },
      ],
    }
  }

  // Deadlift / RDL
  if (muscleGroup === "hamstrings" || exerciseId.includes("deadlift") || exerciseId.includes("rdl") || exerciseId.includes("stiff")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 90, weight: 3 },
        { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], angle: 165, weight: 2 },
      ],
    }
  }

  // Chest press / push-up
  if (muscleGroup === "chest" || exerciseId.includes("push") || exerciseId.includes("flexao") || exerciseId.includes("bench")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 90, weight: 3 },
        { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], angle: 90, weight: 3 },
      ],
    }
  }

  // Back / row
  if (muscleGroup === "back" || exerciseId.includes("row") || exerciseId.includes("remada") || exerciseId.includes("pull")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 75, weight: 3 },
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 170, weight: 2 },
      ],
    }
  }

  // Shoulders
  if (muscleGroup === "shoulders" || exerciseId.includes("press") || exerciseId.includes("raise")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 170, weight: 3 },
        { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], angle: 170, weight: 3 },
      ],
    }
  }

  // Biceps curl
  if (muscleGroup === "biceps" || exerciseId.includes("curl") || exerciseId.includes("rosca")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 35, weight: 3 },
        { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], angle: 35, weight: 3 },
      ],
    }
  }

  // Triceps
  if (muscleGroup === "triceps" || exerciseId.includes("tricep") || exerciseId.includes("dip")) {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 170, weight: 3 },
        { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], angle: 170, weight: 3 },
      ],
    }
  }

  // Glutes
  if (muscleGroup === "glutes") {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 175, weight: 3 },
        { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], angle: 90, weight: 2 },
      ],
    }
  }

  // Core / abs
  if (muscleGroup === "core") {
    return {
      targets: [
        { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], angle: 60, weight: 3 },
      ],
    }
  }

  // Default
  return {
    targets: [
      { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], angle: 90, weight: 2 },
    ],
  }
}

// ─── Core: Compute ideal landmarks from user's body + target angles ────────

/**
 * Given the user's current landmarks (for body proportions) and target angles,
 * compute WHERE each joint SHOULD be for perfect form.
 *
 * Strategy: keep the "anchor" joints (hips, shoulders) in place, then
 * reposition the "moving" joints (elbows, wrists, knees, ankles) to match
 * the ideal angles while preserving limb lengths.
 */
export function computeIdealLandmarks(
  userLandmarks: Point[],
  muscleGroup: MuscleGroup,
  exerciseId: string,
): Point[] {
  // Start with a copy of user's landmarks (preserves body proportions)
  const ideal = userLandmarks.map(p => ({ ...p }))
  const idealAngles = getIdealAngles(muscleGroup, exerciseId)

  for (const target of idealAngles.targets) {
    const [aIdx, bIdx, cIdx] = target.points
    const a = ideal[aIdx]
    const b = ideal[bIdx] // vertex (pivot)
    const c = ideal[cIdx]

    if (!a || !b || !c) continue
    if ((a.visibility ?? 0) < 0.3 || (b.visibility ?? 0) < 0.3 || (c.visibility ?? 0) < 0.3) continue

    // Current limb length from vertex to endpoint C
    const limbLength = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2)
    if (limbLength < 0.01) continue

    // Current angle from A to B (the "reference" direction)
    const refAngle = Math.atan2(a.y - b.y, a.x - b.x)

    // Target angle in radians (angle at vertex B between BA and BC)
    const targetRad = (target.angle * Math.PI) / 180

    // Compute ideal position for C: rotate from reference by target angle
    // Try both directions and pick the one closer to current C position
    const candidate1X = b.x + limbLength * Math.cos(refAngle - targetRad)
    const candidate1Y = b.y + limbLength * Math.sin(refAngle - targetRad)
    const candidate2X = b.x + limbLength * Math.cos(refAngle + targetRad)
    const candidate2Y = b.y + limbLength * Math.sin(refAngle + targetRad)

    const dist1 = (candidate1X - c.x) ** 2 + (candidate1Y - c.y) ** 2
    const dist2 = (candidate2X - c.x) ** 2 + (candidate2Y - c.y) ** 2

    if (dist1 <= dist2) {
      ideal[cIdx] = { ...ideal[cIdx], x: candidate1X, y: candidate1Y }
    } else {
      ideal[cIdx] = { ...ideal[cIdx], x: candidate2X, y: candidate2Y }
    }
  }

  return ideal
}

// ─── Scoring: How well does user match the ghost? ──────────────────────────

export function calculateGhostMatch(
  userLandmarks: Point[],
  idealLandmarks: Point[],
  muscleGroup: MuscleGroup,
  exerciseId: string,
): GhostResult {
  const jointScores = new Map<number, number>()
  const idealAngles = getIdealAngles(muscleGroup, exerciseId)

  // Score based on angle difference from ideal
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const target of idealAngles.targets) {
    const [aIdx, bIdx, cIdx] = target.points
    const uA = userLandmarks[aIdx], uB = userLandmarks[bIdx], uC = userLandmarks[cIdx]

    if (!uA || !uB || !uC) continue
    if ((uA.visibility ?? 0) < 0.3 || (uB.visibility ?? 0) < 0.3 || (uC.visibility ?? 0) < 0.3) continue

    const currentAngle = calculateAngle(uA, uB, uC)
    const diff = Math.abs(currentAngle - target.angle)

    // Score: 100 at 0° diff, 0 at 30°+ diff
    const score = Math.max(0, 100 - (diff / 30) * 100)

    totalWeightedScore += score * target.weight
    totalWeight += target.weight

    // Per-joint scores (vertex gets main score, endpoints get blended)
    jointScores.set(bIdx, score)
    jointScores.set(aIdx, Math.max(jointScores.get(aIdx) ?? 0, score * 0.7))
    jointScores.set(cIdx, Math.max(jointScores.get(cIdx) ?? 0, score * 0.7))
  }

  // Also score by spatial proximity of scored joints
  for (const jIdx of SCORED_JOINTS) {
    const user = userLandmarks[jIdx]
    const ideal = idealLandmarks[jIdx]
    if (!user || !ideal) continue
    if ((user.visibility ?? 0) < 0.3) continue

    const dist = Math.sqrt((user.x - ideal.x) ** 2 + (user.y - ideal.y) ** 2)
    // Score: 100 at 0 dist, 0 at 0.15+ dist (normalized coords)
    const spatialScore = Math.max(0, 100 - (dist / 0.15) * 100)

    const existing = jointScores.get(jIdx) ?? spatialScore
    jointScores.set(jIdx, (existing + spatialScore) / 2)
  }

  const matchScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50

  return { matchScore, jointScores, idealLandmarks }
}

// ─── Canvas Renderer ───────────────────────────────────────────────────────

/**
 * Draw the ghost silhouette on canvas. Called every frame during analysis.
 */
export function drawGhostMirror(
  ctx: CanvasRenderingContext2D,
  idealLandmarks: Point[],
  ghostResult: GhostResult,
  canvasWidth: number,
  canvasHeight: number,
  opacity: number = 0.5,
  showScore: boolean = true,
): void {
  const w = canvasWidth
  const h = canvasHeight

  // ═══ Draw ghost skeleton connections ═══
  for (const [startIdx, endIdx] of GHOST_CONNECTIONS) {
    const start = idealLandmarks[startIdx]
    const end = idealLandmarks[endIdx]
    if (!start || !end) continue
    if ((start.visibility ?? 0) < 0.3 || (end.visibility ?? 0) < 0.3) continue

    // Color based on average joint score
    const scoreA = ghostResult.jointScores.get(startIdx) ?? 50
    const scoreB = ghostResult.jointScores.get(endIdx) ?? 50
    const avgScore = (scoreA + scoreB) / 2

    const color = scoreToColor(avgScore, opacity)

    ctx.beginPath()
    ctx.moveTo(start.x * w, start.y * h)
    ctx.lineTo(end.x * w, end.y * h)
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.setLineDash([8, 4]) // Dashed to distinguish from real skeleton
    ctx.stroke()
    ctx.setLineDash([])
  }

  // ═══ Draw ghost joint dots ═══
  for (const jIdx of SCORED_JOINTS) {
    const joint = idealLandmarks[jIdx]
    if (!joint || (joint.visibility ?? 0) < 0.3) continue

    const score = ghostResult.jointScores.get(jIdx) ?? 50
    const color = scoreToColor(score, opacity * 1.2)
    const radius = score > 70 ? 6 : 8 // Bigger dot when off-target (draw attention)

    ctx.beginPath()
    ctx.arc(joint.x * w, joint.y * h, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    // Outer ring glow for low-score joints
    if (score < 50) {
      ctx.beginPath()
      ctx.arc(joint.x * w, joint.y * h, radius + 4, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(239, 68, 68, ${opacity * 0.6})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // ═══ Match score badge (top-center) ═══
  if (showScore) {
    const score = ghostResult.matchScore
    const badgeFontSize = Math.max(20, w * 0.035)
    const badgeText = `GHOST ${score}%`
    ctx.font = `bold ${badgeFontSize}px -apple-system, sans-serif`
    const textW = ctx.measureText(badgeText).width

    const bx = (w - textW) / 2 - 12
    const by = h - 60
    const bw = textW + 24
    const bh = badgeFontSize + 16

    // Background
    const bgColor = score >= 80
      ? "rgba(34, 197, 94, 0.85)"
      : score >= 50
        ? "rgba(234, 179, 8, 0.85)"
        : "rgba(239, 68, 68, 0.85)"

    ctx.fillStyle = bgColor
    ctx.beginPath()
    if (ctx.roundRect) { ctx.roundRect(bx, by, bw, bh, 8) } else { ctx.rect(bx, by, bw, bh) }
    ctx.fill()

    // Text
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.fillText(badgeText, w / 2, by + badgeFontSize + 4)
    ctx.textAlign = "left"

    // Grade label
    const grade = score >= 90 ? "S" : score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D"
    ctx.font = `bold ${badgeFontSize * 0.7}px -apple-system, sans-serif`
    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.textAlign = "center"
    ctx.fillText(`GRADE ${grade}`, w / 2, by - 6)
    ctx.textAlign = "left"
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function scoreToColor(score: number, opacity: number): string {
  const a = Math.min(1, opacity)
  if (score >= 80) return `rgba(34, 197, 94, ${a})`   // green
  if (score >= 50) return `rgba(234, 179, 8, ${a})`   // yellow
  return `rgba(239, 68, 68, ${a})`                     // red
}

/** Default ghost config */
export function createGhostConfig(): GhostConfig {
  return {
    enabled: false,
    opacity: 0.5,
    showScore: true,
  }
}
