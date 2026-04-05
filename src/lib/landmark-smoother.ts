// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Landmark Smoother (EMA + Velocity Prediction)
//
// Eliminates jitter from MediaPipe landmarks using Exponential Moving Average
// with velocity prediction. Prevents ghost reps, flickering scores, and
// unstable feedback — the #1 gap vs professional form-check apps.
//
// Usage:
//   const smoother = new LandmarkSmoother()
//   const smoothed = smoother.smooth(rawLandmarks)
// ══════════════════════════════════════════════════════════════════════════════

import type { Point } from "./posture-rules"

interface LandmarkState {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  visibility: number
}

export class LandmarkSmoother {
  private states: Map<number, LandmarkState> = new Map()
  private frameCount = 0

  /**
   * @param alpha  Smoothing factor (0.3 = very smooth, 0.8 = very reactive). Default 0.55
   * @param velocityWeight  How much velocity prediction influences position (0-1). Default 0.15
   */
  constructor(
    private alpha: number = 0.55,
    private velocityWeight: number = 0.15,
  ) {}

  /** Reset all state (call when switching exercises or restarting) */
  reset(): void {
    this.states.clear()
    this.frameCount = 0
  }

  /** Smooth a full set of landmarks. Returns new array (does not mutate input). */
  smooth(landmarks: Point[]): Point[] {
    this.frameCount++

    // First frame — seed state directly, no smoothing
    if (this.frameCount === 1) {
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i]
        this.states.set(i, {
          x: lm.x,
          y: lm.y,
          z: lm.z ?? 0,
          vx: 0,
          vy: 0,
          vz: 0,
          visibility: lm.visibility ?? 0,
        })
      }
      return landmarks.map(lm => ({ ...lm }))
    }

    const result: Point[] = []
    const a = this.alpha
    const vw = this.velocityWeight

    for (let i = 0; i < landmarks.length; i++) {
      const raw = landmarks[i]
      const prev = this.states.get(i)

      if (!prev) {
        // New landmark appeared — seed it
        this.states.set(i, {
          x: raw.x,
          y: raw.y,
          z: raw.z ?? 0,
          vx: 0,
          vy: 0,
          vz: 0,
          visibility: raw.visibility ?? 0,
        })
        result.push({ ...raw })
        continue
      }

      const rawZ = raw.z ?? 0
      const rawVis = raw.visibility ?? 0

      // If landmark dropped visibility, keep previous position (don't jump)
      if (rawVis < 0.2 && prev.visibility >= 0.3) {
        result.push({
          x: prev.x,
          y: prev.y,
          z: prev.z,
          visibility: rawVis, // pass through real visibility for downstream checks
        })
        prev.visibility = rawVis
        continue
      }

      // Velocity = difference between raw and previous smoothed
      const vx = raw.x - prev.x
      const vy = raw.y - prev.y
      const vz = rawZ - prev.z

      // Predicted position = previous + velocity
      const predX = prev.x + prev.vx * vw
      const predY = prev.y + prev.vy * vw
      const predZ = prev.z + prev.vz * vw

      // EMA between prediction and raw measurement
      const smoothX = predX + a * (raw.x - predX)
      const smoothY = predY + a * (raw.y - predY)
      const smoothZ = predZ + a * (rawZ - predZ)

      // Smooth velocity too (prevents oscillation)
      const smoothVx = prev.vx + a * (vx - prev.vx)
      const smoothVy = prev.vy + a * (vy - prev.vy)
      const smoothVz = prev.vz + a * (vz - prev.vz)

      // Update state
      prev.x = smoothX
      prev.y = smoothY
      prev.z = smoothZ
      prev.vx = smoothVx
      prev.vy = smoothVy
      prev.vz = smoothVz
      prev.visibility = rawVis

      result.push({
        x: smoothX,
        y: smoothY,
        z: smoothZ,
        visibility: rawVis,
      })
    }

    return result
  }
}

// ─── WorldLandmark 3D Smoother ─────────────────────────────────────────────
// Same algorithm but for worldLandmarks (metric coordinates in meters).
// Uses tighter alpha because world coordinates are already more stable.

export class WorldLandmarkSmoother extends LandmarkSmoother {
  constructor() {
    super(0.45, 0.2) // tighter smoothing for 3D metric data
  }
}
