// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Multi-Dimensional Posture Scorer (5 Dimensions)
//
// Inspired by GymScore's 5-dimension system. Evaluates form quality across
// independent axes so the user knows WHERE they need to improve, not just
// a single number.
//
// Dimensions:
//   1. ALIGNMENT  — Joint alignment relative to target positions
//   2. STABILITY  — Core/trunk steadiness during movement
//   3. ROM        — Range of motion vs target for this exercise
//   4. TEMPO      — Eccentric/concentric cadence control (ideal ~2:1)
//   5. SYMMETRY   — Left vs right side balance
//
// Each dimension: 0-100. Overall = weighted average.
// ══════════════════════════════════════════════════════════════════════════════

import type { Point, PostureFeedback } from "./posture-rules"
import { calculateAngle, LANDMARKS } from "./posture-rules"
import type { TrackerState } from "./posture-tracker"
import type { RepConfig } from "./posture-tracker"

const L = LANDMARKS

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DimensionScore {
  value: number       // 0-100
  label: string       // PT label
  labelEn: string     // EN label
  icon: string        // emoji
  color: string       // tailwind text color
  detail: string      // one-line explanation
}

export interface MultiDimensionalScore {
  overall: number
  grade: string
  gradeColor: string
  dimensions: {
    alignment: DimensionScore
    stability: DimensionScore
    rom: DimensionScore
    tempo: DimensionScore
    symmetry: DimensionScore
  }
}

// ─── Accumulator (call per-frame, get score at end of set) ─────────────────

export class PostureScorer {
  // Alignment: accumulate feedback-based scores
  private alignmentCorrect = 0
  private alignmentTotal = 0

  // Stability: Welford's online algorithm for trunk angle variance (O(1) per frame)
  private trunkCount = 0
  private trunkMean = 0
  private trunkM2 = 0

  // ROM: min/max angles per rep
  private repRoms: number[] = [] // actual ROM per rep (bounded by rep count, not frame count)
  private targetRom = 0

  // Tempo: eccentric and concentric durations
  private eccentricMs: number[] = []
  private concentricMs: number[] = []

  // Symmetry: Welford's online for left-right angle diffs (O(1) per frame)
  private symCount = 0
  private symMean = 0
  private symM2 = 0

  // World landmarks Z: Welford's online for depth asymmetry (O(1) per frame)
  private zCount = 0
  private zMean = 0

  constructor(private repConfig: RepConfig) {
    // Target ROM = difference between up and down thresholds
    this.targetRom = Math.abs(repConfig.upThreshold - repConfig.downThreshold)
  }

  /** Reset for new set */
  reset(repConfig: RepConfig): void {
    this.repConfig = repConfig
    this.targetRom = Math.abs(repConfig.upThreshold - repConfig.downThreshold)
    this.alignmentCorrect = 0
    this.alignmentTotal = 0
    this.trunkCount = 0
    this.trunkMean = 0
    this.trunkM2 = 0
    this.repRoms = []
    this.eccentricMs = []
    this.concentricMs = []
    this.symCount = 0
    this.symMean = 0
    this.symM2 = 0
    this.zCount = 0
    this.zMean = 0
  }

  /** Call every frame with current data */
  update(
    landmarks: Point[],
    feedbacks: PostureFeedback[],
    tracker: TrackerState,
    worldLandmarks?: Point[],
  ): void {
    // ═══ ALIGNMENT — from exercise feedback ═══
    for (const fb of feedbacks) {
      this.alignmentTotal++
      if (fb.status === "correct") this.alignmentCorrect++
    }

    // ═══ STABILITY — trunk angle (shoulder-hip vertical) ═══
    const lShoulder = landmarks[L.LEFT_SHOULDER]
    const lHip = landmarks[L.LEFT_HIP]
    const rShoulder = landmarks[L.RIGHT_SHOULDER]
    const rHip = landmarks[L.RIGHT_HIP]

    if (lShoulder && lHip && (lShoulder.visibility ?? 0) > 0.3 && (lHip.visibility ?? 0) > 0.3) {
      // Trunk lean angle from vertical — Welford's incremental update
      const dx = lShoulder.x - lHip.x
      const dy = lShoulder.y - lHip.y
      const trunkAngle = Math.abs(Math.atan2(dx, -dy) * (180 / Math.PI))
      this.trunkCount++
      const delta = trunkAngle - this.trunkMean
      this.trunkMean += delta / this.trunkCount
      this.trunkM2 += delta * (trunkAngle - this.trunkMean)
    }

    // ═══ SYMMETRY — left vs right joint angles ═══
    // Compare left and right elbow angles
    const lElbow = landmarks[L.LEFT_ELBOW]
    const lWrist = landmarks[L.LEFT_WRIST]
    const rElbow = landmarks[L.RIGHT_ELBOW]
    const rWrist = landmarks[L.RIGHT_WRIST]

    if (lShoulder && lElbow && lWrist && rShoulder && rElbow && rWrist) {
      const lVis = Math.min(lShoulder.visibility ?? 0, lElbow.visibility ?? 0, lWrist.visibility ?? 0)
      const rVis = Math.min(rShoulder.visibility ?? 0, rElbow.visibility ?? 0, rWrist.visibility ?? 0)

      if (lVis > 0.3 && rVis > 0.3) {
        const leftAngle = calculateAngle(lShoulder, lElbow, lWrist)
        const rightAngle = calculateAngle(rShoulder, rElbow, rWrist)
        if (Number.isFinite(leftAngle) && Number.isFinite(rightAngle)) {
          this.addSymSample(Math.abs(leftAngle - rightAngle))
        }
      }
    }

    // Also check hip/knee symmetry
    const lKnee = landmarks[L.LEFT_KNEE]
    const rKnee = landmarks[L.RIGHT_KNEE]
    const lAnkle = landmarks[L.LEFT_ANKLE]
    const rAnkle = landmarks[L.RIGHT_ANKLE]

    if (lHip && lKnee && lAnkle && rHip && rKnee && rAnkle) {
      const lVis = Math.min(lHip.visibility ?? 0, lKnee.visibility ?? 0, lAnkle.visibility ?? 0)
      const rVis = Math.min(rHip.visibility ?? 0, rKnee.visibility ?? 0, rAnkle.visibility ?? 0)

      if (lVis > 0.3 && rVis > 0.3) {
        const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle)
        const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle)
        if (Number.isFinite(leftKneeAngle) && Number.isFinite(rightKneeAngle)) {
          this.addSymSample(Math.abs(leftKneeAngle - rightKneeAngle))
        }
      }
    }

    // ═══ WORLD Z — depth symmetry (if worldLandmarks available) ═══
    if (worldLandmarks && worldLandmarks.length > L.RIGHT_HIP) {
      const wls = worldLandmarks[L.LEFT_SHOULDER]
      const wrs = worldLandmarks[L.RIGHT_SHOULDER]
      const wlh = worldLandmarks[L.LEFT_HIP]
      const wrh = worldLandmarks[L.RIGHT_HIP]
      if (wls && wrs && wlh && wrh) {
        const zDiff = Math.abs((wls.z ?? 0) - (wrs.z ?? 0)) + Math.abs((wlh.z ?? 0) - (wrh.z ?? 0))
        this.zCount++
        this.zMean += (zDiff - this.zMean) / this.zCount
      }
    }
  }

  /** Welford's incremental update for symmetry diffs */
  private addSymSample(diff: number): void {
    this.symCount++
    const delta = diff - this.symMean
    this.symMean += delta / this.symCount
    this.symM2 += delta * (diff - this.symMean)
  }

  /** Call when a rep completes (after updateTracker detects rep) */
  onRepComplete(tracker: TrackerState): void {
    // ROM for this rep
    const rom = tracker.maxAngleInRep - tracker.minAngleInRep
    if (Number.isFinite(rom) && rom > 0) {
      this.repRoms.push(rom)
    }

    // Tempo
    if (tracker.lastEccentricMs > 0) {
      this.eccentricMs.push(tracker.lastEccentricMs)
    }
    if (tracker.lastConcentricMs > 0) {
      this.concentricMs.push(tracker.lastConcentricMs)
    }
  }

  /** Calculate final multi-dimensional score */
  calculate(): MultiDimensionalScore {
    // ═══ ALIGNMENT (40% weight) ═══
    let alignmentScore = 100
    if (this.alignmentTotal > 0) {
      alignmentScore = Math.round((this.alignmentCorrect / this.alignmentTotal) * 100)
    }

    // ═══ STABILITY (20% weight) ═══
    let stabilityScore = 100
    if (this.trunkCount > 10) {
      // Standard deviation of trunk angle via Welford — lower = more stable
      const variance = this.trunkM2 / this.trunkCount
      const stdDev = Math.sqrt(variance)

      // Score: < 2° std = 100, > 8° std = 0
      stabilityScore = Math.round(Math.max(0, Math.min(100, 100 - ((stdDev - 2) / 6) * 100)))
    }

    // ═══ ROM (15% weight) ═══
    let romScore = 100
    if (this.repRoms.length > 0 && this.targetRom > 0) {
      const avgRom = this.repRoms.reduce((a, b) => a + b, 0) / this.repRoms.length
      // Score: achieving target ROM = 100, 50% of target = 50
      const romRatio = Math.min(avgRom / this.targetRom, 1.2) // cap at 120% (going deeper is fine but not infinite bonus)
      romScore = Math.round(Math.min(100, romRatio * 100))
    }

    // ═══ TEMPO (15% weight) ═══
    let tempoScore = 100
    if (this.eccentricMs.length > 0) {
      const avgEcc = this.eccentricMs.reduce((a, b) => a + b, 0) / this.eccentricMs.length
      const avgCon = this.concentricMs.length > 0
        ? this.concentricMs.reduce((a, b) => a + b, 0) / this.concentricMs.length
        : avgEcc * 0.5

      // Ideal: eccentric 2-4s, concentric 1-2s, ratio ~2:1
      let eccScore = 100
      if (avgEcc < 1000) eccScore = Math.round((avgEcc / 1000) * 60)        // too fast
      else if (avgEcc > 5000) eccScore = Math.round(Math.max(40, 100 - ((avgEcc - 5000) / 3000) * 60)) // too slow
      else if (avgEcc >= 1500 && avgEcc <= 4500) eccScore = 100              // ideal
      else eccScore = 80                                                       // acceptable

      let ratioScore = 100
      if (avgCon > 0) {
        const ratio = avgEcc / avgCon
        // Ideal ratio 1.5-3.0
        if (ratio >= 1.5 && ratio <= 3.0) ratioScore = 100
        else if (ratio >= 1.0 && ratio <= 4.0) ratioScore = 75
        else ratioScore = 50
      }

      tempoScore = Math.round(eccScore * 0.6 + ratioScore * 0.4)
    }

    // ═══ SYMMETRY (10% weight) ═══
    let symmetryScore = 100
    if (this.symCount > 10) {
      // Score: < 5° diff = 100, > 20° diff = 0
      symmetryScore = Math.round(Math.max(0, Math.min(100, 100 - ((this.symMean - 5) / 15) * 100)))
    }

    // Penalty from worldLandmarks Z depth asymmetry
    if (this.zCount > 10 && this.zMean > 0.05) {
      const zPenalty = Math.min(20, Math.round(((this.zMean - 0.05) / 0.15) * 20))
      symmetryScore = Math.max(0, symmetryScore - zPenalty)
    }

    // ═══ OVERALL — weighted average ═══
    const overall = Math.round(
      alignmentScore * 0.40 +
      stabilityScore * 0.20 +
      romScore * 0.15 +
      tempoScore * 0.15 +
      symmetryScore * 0.10
    )

    const grade = getGrade(overall)

    return {
      overall,
      grade: grade.letter,
      gradeColor: grade.color,
      dimensions: {
        alignment: {
          value: alignmentScore,
          label: "Alinhamento",
          labelEn: "Alignment",
          icon: "🎯",
          color: getScoreColor(alignmentScore),
          detail: this.alignmentTotal > 0
            ? `${this.alignmentCorrect}/${this.alignmentTotal} checkpoints corretos`
            : "Sem dados",
        },
        stability: {
          value: stabilityScore,
          label: "Estabilidade",
          labelEn: "Core Stability",
          icon: "🏛️",
          color: getScoreColor(stabilityScore),
          detail: this.trunkCount > 10
            ? `Variação tronco: ${Math.sqrt(this.trunkM2 / this.trunkCount).toFixed(1)}°`
            : "Sem dados suficientes",
        },
        rom: {
          value: romScore,
          label: "Amplitude",
          labelEn: "Range of Motion",
          icon: "📐",
          color: getScoreColor(romScore),
          detail: this.repRoms.length > 0
            ? `${Math.round(avg(this.repRoms))}° / ${this.targetRom}° alvo`
            : "Sem reps completadas",
        },
        tempo: {
          value: tempoScore,
          label: "Cadência",
          labelEn: "Tempo Control",
          icon: "⏱️",
          color: getScoreColor(tempoScore),
          detail: this.eccentricMs.length > 0
            ? `Exc ${(avg(this.eccentricMs) / 1000).toFixed(1)}s / Con ${this.concentricMs.length > 0 ? (avg(this.concentricMs) / 1000).toFixed(1) : "—"}s`
            : "Sem dados de velocidade",
        },
        symmetry: {
          value: symmetryScore,
          label: "Simetria",
          labelEn: "Symmetry",
          icon: "⚖️",
          color: getScoreColor(symmetryScore),
          detail: this.symCount > 10
            ? `Diferença média: ${this.symMean.toFixed(1)}°`
            : "Sem dados suficientes",
        },
      },
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 95) return { letter: "S+", color: "text-yellow-300" }
  if (score >= 90) return { letter: "S", color: "text-emerald-400" }
  if (score >= 80) return { letter: "A", color: "text-green-400" }
  if (score >= 70) return { letter: "B", color: "text-blue-400" }
  if (score >= 55) return { letter: "C", color: "text-yellow-400" }
  if (score >= 40) return { letter: "D", color: "text-orange-400" }
  return { letter: "F", color: "text-red-400" }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400"
  if (score >= 60) return "text-yellow-400"
  if (score >= 40) return "text-orange-400"
  return "text-red-400"
}
