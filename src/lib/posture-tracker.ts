// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Posture Tracker (Rep Counter + Score + Speed)
//
// Sistema de tracking em tempo real que funciona SOBRE o MediaPipe.
// Não altera nenhuma regra existente — apenas observa os ângulos.
// ══════════════════════════════════════════════════════════════════════════════

import type { Point, PostureFeedback, MuscleGroup } from "./posture-rules"
import { calculateAngle, LANDMARKS } from "./posture-rules"

// ─── Rep Counter ────────────────────────────────────────────────────────────

/** Config for rep detection per exercise pattern */
export interface RepConfig {
  /** Which landmarks form the angle to track (3 indices) */
  anglePoints: [number, number, number]
  /** Angle below this = "down" position (bottom of rep) */
  downThreshold: number
  /** Angle above this = "up" position (top of rep) */
  upThreshold: number
  /** Target ROM for visual zone line (ideal bottom angle) */
  targetAngle: number
  /** Label for the movement phase */
  downLabel: string
  upLabel: string
}

/** Get rep tracking config based on muscle group / exercise pattern */
export function getRepConfig(muscleGroup: MuscleGroup, exerciseId: string): RepConfig {
  // Squat-type exercises
  if (muscleGroup === "quadriceps" || exerciseId.includes("squat") || exerciseId.includes("leg_press")) {
    return {
      anglePoints: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      downThreshold: 100,
      upThreshold: 150,
      targetAngle: 90,
      downLabel: "Descendo",
      upLabel: "Subindo",
    }
  }

  // Lunge-type
  if (exerciseId.includes("lunge") || exerciseId.includes("afundo") || exerciseId.includes("step_up") || exerciseId.includes("bulgarian")) {
    return {
      anglePoints: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      downThreshold: 100,
      upThreshold: 145,
      targetAngle: 90,
      downLabel: "Descendo",
      upLabel: "Subindo",
    }
  }

  // Hip hinge (deadlift, RDL)
  if (muscleGroup === "hamstrings" || exerciseId.includes("deadlift") || exerciseId.includes("rdl") || exerciseId.includes("stiff")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
      downThreshold: 110,
      upThreshold: 155,
      targetAngle: 90,
      downLabel: "Descendo",
      upLabel: "Subindo",
    }
  }

  // Push-up / chest press
  if (muscleGroup === "chest" || exerciseId.includes("push") || exerciseId.includes("flexao") || exerciseId.includes("bench")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      downThreshold: 95,
      upThreshold: 150,
      targetAngle: 80,
      downLabel: "Descendo",
      upLabel: "Empurrando",
    }
  }

  // Back (row)
  if (muscleGroup === "back" || exerciseId.includes("row") || exerciseId.includes("remada")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      downThreshold: 85,
      upThreshold: 140,
      targetAngle: 75,
      downLabel: "Puxando",
      upLabel: "Soltando",
    }
  }

  // Overhead press / shoulders
  if (muscleGroup === "shoulders" || exerciseId.includes("press") || exerciseId.includes("raise")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      downThreshold: 95,
      upThreshold: 160,
      targetAngle: 90,
      downLabel: "Descendo",
      upLabel: "Empurrando",
    }
  }

  // Curl (biceps)
  if (muscleGroup === "biceps" || exerciseId.includes("curl") || exerciseId.includes("rosca")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      downThreshold: 50,
      upThreshold: 130,
      targetAngle: 35,
      downLabel: "Contraindo",
      upLabel: "Soltando",
    }
  }

  // Triceps
  if (muscleGroup === "triceps" || exerciseId.includes("tricep") || exerciseId.includes("dip")) {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      downThreshold: 90,
      upThreshold: 155,
      targetAngle: 85,
      downLabel: "Descendo",
      upLabel: "Estendendo",
    }
  }

  // Glutes (hip thrust)
  if (muscleGroup === "glutes") {
    return {
      anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
      downThreshold: 145,
      upThreshold: 168,
      targetAngle: 175,
      downLabel: "Descendo",
      upLabel: "Subindo",
    }
  }

  // Calves
  if (muscleGroup === "calves") {
    return {
      anglePoints: [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_HEEL],
      downThreshold: 140,
      upThreshold: 160,
      targetAngle: 130,
      downLabel: "Descendo",
      upLabel: "Subindo",
    }
  }

  // Default fallback (generic upper body)
  return {
    anglePoints: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
    downThreshold: 90,
    upThreshold: 150,
    targetAngle: 85,
    downLabel: "Fase 1",
    upLabel: "Fase 2",
  }
}

// ─── Tracker State ──────────────────────────────────────────────────────────

export type RepPhase = "idle" | "eccentric" | "concentric"

export interface TrackerState {
  reps: number
  phase: RepPhase
  currentAngle: number
  /** Timestamp when current phase started (for speed measurement) */
  phaseStartTime: number
  /** Duration of last eccentric phase in ms */
  lastEccentricMs: number
  /** Duration of last concentric phase in ms */
  lastConcentricMs: number
  /** Min angle reached in current rep (for ROM tracking) */
  minAngleInRep: number
  /** Max angle reached in current rep */
  maxAngleInRep: number
  /** Score components: feedbacks during this set */
  totalFeedbacks: number
  correctFeedbacks: number
  warningFeedbacks: number
  errorFeedbacks: number
  /** Per-rep scores for final summary */
  repScores: number[]
}

export function createTrackerState(): TrackerState {
  return {
    reps: 0,
    phase: "idle",
    currentAngle: 0,
    phaseStartTime: 0,
    lastEccentricMs: 0,
    lastConcentricMs: 0,
    minAngleInRep: 999,
    maxAngleInRep: 0,
    totalFeedbacks: 0,
    correctFeedbacks: 0,
    warningFeedbacks: 0,
    errorFeedbacks: 0,
    repScores: [],
  }
}

/** Update tracker with new landmarks + feedbacks. Returns updated state (mutates in place for perf). */
export function updateTracker(
  state: TrackerState,
  landmarks: Point[],
  config: RepConfig,
  feedbacks: PostureFeedback[],
): TrackerState {
  const now = performance.now()

  // Calculate the tracked angle
  const [i1, i2, i3] = config.anglePoints
  const p1 = landmarks[i1]
  const p2 = landmarks[i2]
  const p3 = landmarks[i3]

  if (!p1 || !p2 || !p3 || (p1.visibility ?? 0) < 0.3 || (p2.visibility ?? 0) < 0.3) {
    return state
  }

  const angle = calculateAngle(p1, p2, p3)
  state.currentAngle = angle

  // Track min/max angle in current rep
  state.minAngleInRep = Math.min(state.minAngleInRep, angle)
  state.maxAngleInRep = Math.max(state.maxAngleInRep, angle)

  // Phase detection
  const prevPhase = state.phase

  if (angle <= config.downThreshold && state.phase !== "eccentric") {
    // Entered "down" position
    if (state.phase === "concentric" || state.phase === "idle") {
      // Was going up or idle → now going down = eccentric started
      if (state.phase === "concentric") {
        state.lastConcentricMs = now - state.phaseStartTime
      }
      state.phase = "eccentric"
      state.phaseStartTime = now
    }
  } else if (angle >= config.upThreshold && state.phase === "eccentric") {
    // Came back up from "down" position = completed a rep!
    state.lastEccentricMs = now - state.phaseStartTime
    state.phase = "concentric"
    state.phaseStartTime = now
    state.reps++

    // Calculate score for this rep based on feedbacks collected
    const repScore = calculateRepScore(state)
    state.repScores.push(repScore)

    // Reset min/max for next rep
    state.minAngleInRep = 999
    state.maxAngleInRep = 0
  }

  // Accumulate feedback stats
  for (const fb of feedbacks) {
    state.totalFeedbacks++
    if (fb.status === "correct") state.correctFeedbacks++
    else if (fb.status === "warning") state.warningFeedbacks++
    else state.errorFeedbacks++
  }

  return state
}

// ─── Score Calculation ──────────────────────────────────────────────────────

function calculateRepScore(state: TrackerState): number {
  if (state.totalFeedbacks === 0) return 100

  // Base score: percentage of correct feedbacks
  const correctPct = state.correctFeedbacks / state.totalFeedbacks
  let score = Math.round(correctPct * 100)

  // Penalty for errors (each error -5 from score)
  score -= state.errorFeedbacks * 5

  // Penalty for warnings (each warning -2)
  score -= state.warningFeedbacks * 2

  // Bonus for good eccentric speed (2-4 seconds is ideal)
  if (state.lastEccentricMs >= 1500 && state.lastEccentricMs <= 4500) {
    score += 5 // Controlled eccentric bonus
  }

  return Math.max(0, Math.min(100, score))
}

/** Calculate overall set score */
export function calculateSetScore(state: TrackerState): {
  score: number
  grade: string
  gradeColor: string
  details: string
} {
  if (state.reps === 0) {
    return { score: 0, grade: "—", gradeColor: "text-neutral-500", details: "Nenhuma repetição completada" }
  }

  const avgScore = Math.round(
    state.repScores.reduce((a, b) => a + b, 0) / state.repScores.length
  )

  let grade: string
  let gradeColor: string

  if (avgScore >= 90) {
    grade = "S"
    gradeColor = "text-emerald-400"
  } else if (avgScore >= 80) {
    grade = "A"
    gradeColor = "text-green-400"
  } else if (avgScore >= 70) {
    grade = "B"
    gradeColor = "text-blue-400"
  } else if (avgScore >= 55) {
    grade = "C"
    gradeColor = "text-yellow-400"
  } else {
    grade = "D"
    gradeColor = "text-red-400"
  }

  const details = [
    `${state.reps} reps`,
    state.lastEccentricMs > 0 ? `excêntrica ${(state.lastEccentricMs / 1000).toFixed(1)}s` : null,
    state.lastConcentricMs > 0 ? `concêntrica ${(state.lastConcentricMs / 1000).toFixed(1)}s` : null,
  ].filter(Boolean).join(" · ")

  return { score: avgScore, grade, gradeColor, details }
}

// ─── ROM Visual Zone — Calculate Y position for target angle line ─────────

/** Get the Y position (0-1 normalized) where the ROM target line should be drawn.
 *  Uses the actual landmark positions to project where the target angle would be. */
export function getRomTargetPosition(
  landmarks: Point[],
  config: RepConfig,
): { y: number; visible: boolean } {
  const [i1, i2, i3] = config.anglePoints
  const pivot = landmarks[i2] // The joint (knee, elbow, etc.)

  if (!pivot || (pivot.visibility ?? 0) < 0.3) {
    return { y: 0, visible: false }
  }

  // The target line is drawn at the Y position of the joint
  // (horizontal line at the joint level when it reaches target angle)
  return { y: pivot.y, visible: true }
}

// ─── Positioning Guide — Preset landmark positions for silhouette ─────────

export interface GuideFrame {
  /** Normalized landmark positions [x, y] for the guide silhouette */
  points: [number, number][]
  /** Which connections to draw (pairs of indices into points array) */
  connections: [number, number][]
}

/** Get a simple 2-frame animation guide for an exercise pattern */
export function getPositioningGuide(muscleGroup: MuscleGroup, exerciseId: string): {
  startFrame: GuideFrame
  endFrame: GuideFrame
  label: string
} {
  // Simplified skeleton: shoulder, elbow, wrist, hip, knee, ankle (6 points)
  const standing: [number, number][] = [
    [0.5, 0.25],  // 0: shoulder
    [0.42, 0.42], // 1: elbow
    [0.40, 0.55], // 2: wrist
    [0.5, 0.50],  // 3: hip
    [0.5, 0.70],  // 4: knee
    [0.5, 0.90],  // 5: ankle
  ]

  const bodyConnections: [number, number][] = [
    [0, 1], [1, 2], // arm
    [0, 3], // torso
    [3, 4], [4, 5], // leg
  ]

  // Squat
  if (muscleGroup === "quadriceps" || exerciseId.includes("squat")) {
    const squatDown: [number, number][] = [
      [0.5, 0.35],  // shoulder (slightly lower)
      [0.42, 0.48], // elbow
      [0.40, 0.58], // wrist
      [0.5, 0.55],  // hip (drops down)
      [0.55, 0.68], // knee (bends forward)
      [0.5, 0.90],  // ankle (stays)
    ]
    return { startFrame: { points: standing, connections: bodyConnections }, endFrame: { points: squatDown, connections: bodyConnections }, label: "Agachamento" }
  }

  // Push-up
  if (muscleGroup === "chest" || exerciseId.includes("push") || exerciseId.includes("flexao")) {
    const pushUpStart: [number, number][] = [
      [0.25, 0.50], // shoulder
      [0.20, 0.65], // elbow
      [0.18, 0.80], // wrist
      [0.55, 0.50], // hip
      [0.75, 0.50], // knee
      [0.90, 0.52], // ankle
    ]
    const pushUpDown: [number, number][] = [
      [0.25, 0.60], // shoulder (drops)
      [0.15, 0.60], // elbow (bends out)
      [0.18, 0.80], // wrist (stays)
      [0.55, 0.58], // hip
      [0.75, 0.55], // knee
      [0.90, 0.55], // ankle
    ]
    return { startFrame: { points: pushUpStart, connections: bodyConnections }, endFrame: { points: pushUpDown, connections: bodyConnections }, label: "Flexão" }
  }

  // Curl
  if (muscleGroup === "biceps" || exerciseId.includes("curl") || exerciseId.includes("rosca")) {
    const curlDown: [number, number][] = [
      [0.5, 0.25],  // shoulder
      [0.48, 0.42], // elbow
      [0.48, 0.55], // wrist (down)
      [0.5, 0.50],  // hip
      [0.5, 0.70],  // knee
      [0.5, 0.90],  // ankle
    ]
    const curlUp: [number, number][] = [
      [0.5, 0.25],  // shoulder
      [0.48, 0.42], // elbow (fixed!)
      [0.45, 0.28], // wrist (up near shoulder)
      [0.5, 0.50],  // hip
      [0.5, 0.70],  // knee
      [0.5, 0.90],  // ankle
    ]
    return { startFrame: { points: curlDown, connections: bodyConnections }, endFrame: { points: curlUp, connections: bodyConnections }, label: "Rosca" }
  }

  // Deadlift / hinge
  if (muscleGroup === "hamstrings" || exerciseId.includes("deadlift") || exerciseId.includes("rdl")) {
    const hingeDown: [number, number][] = [
      [0.35, 0.40], // shoulder (forward+down)
      [0.30, 0.55], // elbow
      [0.32, 0.68], // wrist
      [0.50, 0.48], // hip (hinge point)
      [0.52, 0.70], // knee
      [0.50, 0.90], // ankle
    ]
    return { startFrame: { points: standing, connections: bodyConnections }, endFrame: { points: hingeDown, connections: bodyConnections }, label: "Levantamento" }
  }

  // Overhead press
  if (muscleGroup === "shoulders") {
    const pressUp: [number, number][] = [
      [0.5, 0.25],  // shoulder
      [0.48, 0.18], // elbow (up)
      [0.48, 0.08], // wrist (overhead)
      [0.5, 0.50],  // hip
      [0.5, 0.70],  // knee
      [0.5, 0.90],  // ankle
    ]
    return { startFrame: { points: standing, connections: bodyConnections }, endFrame: { points: pressUp, connections: bodyConnections }, label: "Press" }
  }

  // Default — standing to slight bend
  const defaultEnd: [number, number][] = [
    [0.5, 0.28],
    [0.45, 0.40],
    [0.43, 0.52],
    [0.5, 0.50],
    [0.5, 0.70],
    [0.5, 0.90],
  ]
  return { startFrame: { points: standing, connections: bodyConnections }, endFrame: { points: defaultEnd, connections: bodyConnections }, label: "Exercício" }
}
