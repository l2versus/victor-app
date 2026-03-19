// Biomechanical rules for posture correction
// Uses MediaPipe Pose landmark indices

// Landmark indices (MediaPipe Pose 33 points)
export const LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const

export interface Point {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface PostureFeedback {
  status: "correct" | "warning" | "error"
  message: string
  angle?: number
  targetAngle?: string
}

export interface ExerciseRule {
  id: string
  name: string
  nameEn: string
  analyze: (landmarks: Point[]) => PostureFeedback[]
}

// Calculate angle between three points (in degrees)
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(rad * 180 / Math.PI)
  if (angle > 180) angle = 360 - angle
  return angle
}

// Check if point is visible enough
function isVisible(p: Point, threshold = 0.5): boolean {
  return (p.visibility ?? 0) >= threshold
}

// ════════════════════════════════════════
// AGACHAMENTO (Squat)
// ════════════════════════════════════════
const squatRule: ExerciseRule = {
  id: "squat",
  name: "Agachamento",
  nameEn: "Squat",
  analyze(landmarks: Point[]): PostureFeedback[] {
    const feedback: PostureFeedback[] = []

    const hip = landmarks[LANDMARKS.LEFT_HIP]
    const knee = landmarks[LANDMARKS.LEFT_KNEE]
    const ankle = landmarks[LANDMARKS.LEFT_ANKLE]
    const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER]

    if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
      return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
    }

    // Knee angle (hip-knee-ankle)
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle < 70) {
      feedback.push({ status: "warning", message: "Agachamento muito profundo! Cuidado com os joelhos", angle: kneeAngle, targetAngle: "80-100°" })
    } else if (kneeAngle <= 100) {
      feedback.push({ status: "correct", message: "Profundidade excelente!", angle: kneeAngle, targetAngle: "80-100°" })
    } else if (kneeAngle <= 130) {
      feedback.push({ status: "warning", message: "Desça mais! Joelho precisa passar de 90°", angle: kneeAngle, targetAngle: "80-100°" })
    } else {
      feedback.push({ status: "error", message: "Agachamento muito raso. Desça o quadril!", angle: kneeAngle, targetAngle: "80-100°" })
    }

    // Torso angle (shoulder-hip relative to vertical)
    if (isVisible(shoulder)) {
      const torsoAngle = calculateAngle(shoulder, hip, { x: hip.x, y: hip.y - 1 })
      if (torsoAngle > 45) {
        feedback.push({ status: "error", message: "Tronco muito inclinado! Mantenha o peito erguido", angle: torsoAngle })
      } else if (torsoAngle > 30) {
        feedback.push({ status: "warning", message: "Tente manter o tronco mais ereto", angle: torsoAngle })
      } else {
        feedback.push({ status: "correct", message: "Tronco na posicao correta", angle: torsoAngle })
      }
    }

    // Knee tracking (knee should not go too far past toes)
    if (knee.x > ankle.x + 0.08) {
      feedback.push({ status: "warning", message: "Joelho passando da ponta do pe. Empurre o quadril para tras" })
    }

    return feedback
  },
}

// ════════════════════════════════════════
// ROSCA BÍCEPS (Bicep Curl)
// ════════════════════════════════════════
const bicepCurlRule: ExerciseRule = {
  id: "bicep_curl",
  name: "Rosca Biceps",
  nameEn: "Bicep Curl",
  analyze(landmarks: Point[]): PostureFeedback[] {
    const feedback: PostureFeedback[] = []

    const shoulder = landmarks[LANDMARKS.RIGHT_SHOULDER]
    const elbow = landmarks[LANDMARKS.RIGHT_ELBOW]
    const wrist = landmarks[LANDMARKS.RIGHT_WRIST]

    if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
      return [{ status: "warning", message: "Posicione o braco direito visivel para a camera" }]
    }

    // Elbow angle (shoulder-elbow-wrist)
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)

    if (elbowAngle < 40) {
      feedback.push({ status: "correct", message: "Contracao maxima! Mantenha!", angle: elbowAngle, targetAngle: "<40°" })
    } else if (elbowAngle < 90) {
      feedback.push({ status: "correct", message: "Subindo bem! Continue contraindo", angle: elbowAngle })
    } else if (elbowAngle < 140) {
      feedback.push({ status: "warning", message: "Fase intermediaria — controle a descida", angle: elbowAngle })
    } else if (elbowAngle < 160) {
      feedback.push({ status: "correct", message: "Boa extensao! Hora de subir", angle: elbowAngle, targetAngle: ">150°" })
    } else {
      feedback.push({ status: "correct", message: "Extensao completa!", angle: elbowAngle, targetAngle: ">160°" })
    }

    // Check if shoulder is moving (should stay static)
    const hip = landmarks[LANDMARKS.RIGHT_HIP]
    if (isVisible(hip)) {
      const shoulderDrift = Math.abs(shoulder.y - hip.y)
      // If shoulder moves too close to hip, they're swinging
      if (shoulder.x < elbow.x - 0.05) {
        feedback.push({ status: "error", message: "Ombro se movendo! Mantenha o cotovelo fixo ao corpo" })
      } else {
        feedback.push({ status: "correct", message: "Ombro estavel — otimo!" })
      }
    }

    return feedback
  },
}

// ════════════════════════════════════════
// PRANCHA (Plank)
// ════════════════════════════════════════
const plankRule: ExerciseRule = {
  id: "plank",
  name: "Prancha",
  nameEn: "Plank",
  analyze(landmarks: Point[]): PostureFeedback[] {
    const feedback: PostureFeedback[] = []

    const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER]
    const hip = landmarks[LANDMARKS.LEFT_HIP]
    const ankle = landmarks[LANDMARKS.LEFT_ANKLE]

    if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(ankle)) {
      return [{ status: "warning", message: "Posicione-se de lado para a camera ver seu corpo inteiro" }]
    }

    // Body alignment angle (shoulder-hip-ankle)
    const bodyAngle = calculateAngle(shoulder, hip, ankle)

    if (bodyAngle >= 165 && bodyAngle <= 180) {
      feedback.push({ status: "correct", message: "Alinhamento perfeito! Corpo reto como uma tabua!", angle: bodyAngle, targetAngle: "165-180°" })
    } else if (bodyAngle >= 155) {
      feedback.push({ status: "warning", message: "Quase la! Alinhe um pouco mais", angle: bodyAngle, targetAngle: "165-180°" })
    } else if (bodyAngle < 155 && hip.y < shoulder.y) {
      feedback.push({ status: "error", message: "Quadril subindo demais! Abaixe o quadril", angle: bodyAngle, targetAngle: "165-180°" })
    } else {
      feedback.push({ status: "error", message: "Quadril caindo! Contraia o abdomen e levante o quadril", angle: bodyAngle, targetAngle: "165-180°" })
    }

    // Check if shoulders are over wrists
    const wrist = landmarks[LANDMARKS.LEFT_WRIST]
    if (isVisible(wrist)) {
      const shWristDist = Math.abs(shoulder.x - wrist.x)
      if (shWristDist > 0.1) {
        feedback.push({ status: "warning", message: "Ombros devem ficar acima dos pulsos" })
      } else {
        feedback.push({ status: "correct", message: "Ombros alinhados com os pulsos" })
      }
    }

    return feedback
  },
}

export const EXERCISE_RULES: ExerciseRule[] = [squatRule, bicepCurlRule, plankRule]

export function getExerciseRule(id: string): ExerciseRule | undefined {
  return EXERCISE_RULES.find(r => r.id === id)
}
