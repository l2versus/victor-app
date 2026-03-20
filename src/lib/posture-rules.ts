// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Motor de Regras Biomecanicas para Correcao de Postura
// MediaPipe Pose 33 landmarks, 100% client-side
//
// Baseado em evidencias de fisiologia do exercicio e biomecanica articular.
// Foco: hipertrofia com seguranca, prevencao de lesoes.
// ══════════════════════════════════════════════════════════════════════════════

// ─── MediaPipe Pose 33-point landmark indices ───────────────────────────────
export const LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

// ─── Types ──────────────────────────────────────────────────────────────────

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

/** Camera positioning the user needs for this exercise */
export type CameraPosition = "side" | "front" | "side-or-front"

/** Muscle group for UI grouping */
export type MuscleGroup =
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "full_body"
  | "calves"

export interface ExerciseRule {
  id: string
  name: string
  nameEn: string
  muscleGroup: MuscleGroup
  cameraPosition: CameraPosition
  /** Short positioning tip shown before starting */
  positioningTip: string
  analyze: (landmarks: Point[]) => PostureFeedback[]
}

export interface ExerciseGroup {
  id: MuscleGroup
  label: string
  icon: string
  exercises: ExerciseRule[]
}

// ─── Utility functions ──────────────────────────────────────────────────────

/** Calculate angle between three points (in degrees, 0-180) */
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(rad * 180 / Math.PI)
  if (angle > 180) angle = 360 - angle
  return angle
}

/** Check if a landmark is visible enough for analysis.
 *  Floor exercises (push-up, plank) use lower threshold (0.3) because
 *  camera angle from floor level reduces landmark confidence. */
function isVisible(p: Point, threshold = 0.3): boolean {
  return (p.visibility ?? 0) >= threshold
}

/** Get the midpoint between two points */
function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** Vertical distance (Y axis — in MediaPipe, Y increases downward) */
function verticalDiff(a: Point, b: Point): number {
  return a.y - b.y
}

/** Pick the more visible side (left or right) for a given landmark pair */
function bestSide(landmarks: Point[], leftIdx: number, rightIdx: number): "left" | "right" {
  const lVis = landmarks[leftIdx]?.visibility ?? 0
  const rVis = landmarks[rightIdx]?.visibility ?? 0
  return lVis >= rVis ? "left" : "right"
}

/** Get shoulder/elbow/wrist/hip/knee/ankle for the best visible side */
function getSideLandmarks(landmarks: Point[], side: "left" | "right") {
  const L = LANDMARKS
  if (side === "left") {
    return {
      shoulder: landmarks[L.LEFT_SHOULDER],
      elbow: landmarks[L.LEFT_ELBOW],
      wrist: landmarks[L.LEFT_WRIST],
      hip: landmarks[L.LEFT_HIP],
      knee: landmarks[L.LEFT_KNEE],
      ankle: landmarks[L.LEFT_ANKLE],
      heel: landmarks[L.LEFT_HEEL],
      footIndex: landmarks[L.LEFT_FOOT_INDEX],
    }
  }
  return {
    shoulder: landmarks[L.RIGHT_SHOULDER],
    elbow: landmarks[L.RIGHT_ELBOW],
    wrist: landmarks[L.RIGHT_WRIST],
    hip: landmarks[L.RIGHT_HIP],
    knee: landmarks[L.RIGHT_KNEE],
    ankle: landmarks[L.RIGHT_ANKLE],
    heel: landmarks[L.RIGHT_HEEL],
    footIndex: landmarks[L.RIGHT_FOOT_INDEX],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 1: AGACHAMENTO (Squat Pattern)
// Aplica-se a: Back Squat, Front Squat, Goblet Squat, Sumo Squat, Hack Squat
// ══════════════════════════════════════════════════════════════════════════════

function analyzeSquatPattern(landmarks: Point[], opts?: {
  minDepthAngle?: number
  maxDepthAngle?: number
  wideStance?: boolean
  label?: string
}): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const minDepth = opts?.minDepthAngle ?? 70
  const idealMax = opts?.maxDepthAngle ?? 100

  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Knee angle (hip-knee-ankle) — profundidade do agachamento
  const kneeAngle = calculateAngle(hip, knee, ankle)
  if (kneeAngle < minDepth) {
    feedback.push({
      status: "warning",
      message: "Profundidade excessiva! Risco para os joelhos",
      angle: kneeAngle,
      targetAngle: `${minDepth}-${idealMax}°`,
    })
  } else if (kneeAngle <= idealMax) {
    feedback.push({
      status: "correct",
      message: "Profundidade excelente!",
      angle: kneeAngle,
      targetAngle: `${minDepth}-${idealMax}°`,
    })
  } else if (kneeAngle <= 130) {
    feedback.push({
      status: "warning",
      message: "Desca mais! Joelho precisa passar de 90°",
      angle: kneeAngle,
      targetAngle: `${minDepth}-${idealMax}°`,
    })
  } else {
    feedback.push({
      status: "error",
      message: "Agachamento muito raso. Desca o quadril!",
      angle: kneeAngle,
      targetAngle: `${minDepth}-${idealMax}°`,
    })
  }

  // 2. Torso angle (inclinacao do tronco)
  if (isVisible(shoulder)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 50) {
      feedback.push({ status: "error", message: "Tronco muito inclinado! Peito erguido", angle: torsoAngle })
    } else if (torsoAngle > 35) {
      feedback.push({ status: "warning", message: "Tente manter o tronco mais ereto", angle: torsoAngle })
    } else {
      feedback.push({ status: "correct", message: "Tronco na posicao correta" })
    }
  }

  // 3. Knee tracking — joelho nao deve ultrapassar excessivamente a ponta do pe
  if (!opts?.wideStance && knee.x > ankle.x + 0.08) {
    feedback.push({ status: "warning", message: "Joelho passando da ponta do pe — empurre o quadril para tras" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 2: AFUNDO / LUNGE Pattern
// Aplica-se a: Walking Lunge, Reverse Lunge, Bulgarian Split Squat, Step-Up
// ══════════════════════════════════════════════════════════════════════════════

function analyzeLungePattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Front knee angle — deve ficar proximo a 90° na descida
  const kneeAngle = calculateAngle(hip, knee, ankle)
  if (kneeAngle < 75) {
    feedback.push({
      status: "warning",
      message: "Joelho da frente flexionando demais — risco de lesao!",
      angle: kneeAngle,
      targetAngle: "85-100°",
    })
  } else if (kneeAngle <= 100) {
    feedback.push({
      status: "correct",
      message: "Angulo do joelho perfeito!",
      angle: kneeAngle,
      targetAngle: "85-100°",
    })
  } else if (kneeAngle <= 130) {
    feedback.push({
      status: "warning",
      message: "Desca mais — joelho deve chegar perto de 90°",
      angle: kneeAngle,
      targetAngle: "85-100°",
    })
  } else {
    feedback.push({
      status: "error",
      message: "Amplitude muito curta! Desca o quadril",
      angle: kneeAngle,
      targetAngle: "85-100°",
    })
  }

  // 2. Torso ereto
  if (isVisible(shoulder)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 25) {
      feedback.push({ status: "error", message: "Tronco inclinando! Mantenha o peito erguido", angle: torsoAngle })
    } else {
      feedback.push({ status: "correct", message: "Tronco estavel e ereto" })
    }
  }

  // 3. Joelho nao deve colapsar para dentro (valgo) — verificar X do joelho vs ankle
  if (Math.abs(knee.x - ankle.x) > 0.12) {
    feedback.push({ status: "warning", message: "Joelho saindo do alinhamento — mantenha sobre o pe" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 3: DOBRADIÇA DE QUADRIL (Hip Hinge Pattern)
// Aplica-se a: Deadlift, Romanian DL, Stiff-Leg DL, Good Morning
// ══════════════════════════════════════════════════════════════════════════════

function analyzeHingePattern(landmarks: Point[], opts?: {
  allowKneeBend?: boolean
  label?: string
}): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const allowKnee = opts?.allowKneeBend ?? true

  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(knee)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera ver o corpo inteiro" }]
  }

  // 1. Hip angle (shoulder-hip-knee) — angulo da dobradica
  const hipAngle = calculateAngle(shoulder, hip, knee)
  if (hipAngle >= 160) {
    feedback.push({
      status: "correct",
      message: "Posicao inicial correta — pronto para descer",
      angle: hipAngle,
    })
  } else if (hipAngle >= 90) {
    feedback.push({
      status: "correct",
      message: "Boa amplitude de movimento!",
      angle: hipAngle,
      targetAngle: "90-120°",
    })
  } else if (hipAngle >= 70) {
    feedback.push({
      status: "warning",
      message: "Amplitude grande — mantenha a coluna neutra!",
      angle: hipAngle,
    })
  } else {
    feedback.push({
      status: "error",
      message: "Descendo demais! Risco de lesao lombar",
      angle: hipAngle,
    })
  }

  // 2. Coluna neutra — ombro nao deve ficar muito abaixo do quadril
  // Verificar alinhamento shoulder-hip (costas retas)
  const backAngle = calculateAngle(
    { x: shoulder.x, y: shoulder.y },
    hip,
    { x: hip.x + 1, y: hip.y } // referencia horizontal
  )
  // Se costas arredondando (ombro caindo muito)
  if (shoulder.y > hip.y + 0.15) {
    feedback.push({ status: "error", message: "Costas arredondando! Mantenha a coluna neutra" })
  } else {
    feedback.push({ status: "correct", message: "Coluna neutra — otimo!" })
  }

  // 3. Joelhos — em RDL/Stiff devem ficar mais estendidos, em Deadlift convencional mais flexionados
  if (isVisible(ankle)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (!allowKnee && kneeAngle < 150) {
      feedback.push({
        status: "warning",
        message: "Mantenha os joelhos mais estendidos neste exercicio",
        angle: kneeAngle,
        targetAngle: ">150°",
      })
    } else if (allowKnee && kneeAngle < 100) {
      feedback.push({
        status: "warning",
        message: "Joelhos flexionando demais — mantenha a dobradica no quadril",
        angle: kneeAngle,
      })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 4: FLEXAO / PUSH-UP Pattern
// Aplica-se a: Push-Up, Incline, Deficit, Diamond Push-Up
//
// Suporta 2 angulos de camera:
//   LATERAL  — camera no chao, de lado (ve alinhamento do corpo)
//   FRONTAL  — camera no chao, de frente (ve abertura dos cotovelos, simetria)
//
// Deteccao automatica: se ambos ombros sao visiveis E estao proximos em X
// (distancia X < 0.15), a camera esta LATERAL. Se distantes, esta FRONTAL.
// ══════════════════════════════════════════════════════════════════════════════

function analyzePushUpPattern(landmarks: Point[], opts?: {
  narrow?: boolean
}): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const L = LANDMARKS
  const lShoulder = landmarks[L.LEFT_SHOULDER]
  const rShoulder = landmarks[L.RIGHT_SHOULDER]

  // Auto-detect camera angle based on shoulder separation
  const bothShouldersVisible = isVisible(lShoulder) && isVisible(rShoulder)
  const shoulderXDist = bothShouldersVisible ? Math.abs(lShoulder.x - rShoulder.x) : 0
  const isFrontalView = bothShouldersVisible && shoulderXDist > 0.15

  if (isFrontalView) {
    // ═══ FRONTAL VIEW — camera de frente, cabeca apontando pra camera ═══
    return analyzePushUpFrontal(landmarks, opts)
  }

  // ═══ LATERAL VIEW — camera de lado ═══
  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Camera no chao, de lado ou de frente" }]
  }

  // 1. Body alignment (shoulder-hip-ankle) — corpo reto como prancha
  const bodyAngle = calculateAngle(shoulder, hip, ankle)
  if (bodyAngle >= 165 && bodyAngle <= 180) {
    feedback.push({ status: "correct", message: "Corpo alinhado — perfeito!", angle: bodyAngle, targetAngle: "165-180°" })
  } else if (bodyAngle >= 155) {
    feedback.push({ status: "warning", message: "Alinhe o corpo um pouco mais", angle: bodyAngle, targetAngle: "165-180°" })
  } else if (hip.y < shoulder.y) {
    feedback.push({ status: "error", message: "Quadril subindo! Abaixe o quadril", angle: bodyAngle })
  } else {
    feedback.push({ status: "error", message: "Quadril caindo! Contraia o core", angle: bodyAngle })
  }

  // 2. Elbow angle — profundidade
  if (isVisible(elbow) && isVisible(wrist)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    if (elbowAngle <= 90) {
      feedback.push({ status: "correct", message: "Profundidade excelente!", angle: elbowAngle, targetAngle: "70-90°" })
    } else if (elbowAngle <= 120) {
      feedback.push({ status: "warning", message: "Desca mais — peito perto do chao", angle: elbowAngle, targetAngle: "70-90°" })
    } else {
      feedback.push({ status: "correct", message: "Fase de subida — empurre!", angle: elbowAngle })
    }
  }

  // 3. Cabeca alinhada
  const nose = landmarks[LANDMARKS.NOSE]
  if (isVisible(nose) && isVisible(shoulder)) {
    if (nose.y < shoulder.y - 0.1) {
      feedback.push({ status: "warning", message: "Pescoco neutro — nao olhe para cima" })
    }
  }

  return feedback
}

/** Push-up analysis from FRONTAL camera (head pointing toward camera) */
function analyzePushUpFrontal(landmarks: Point[], opts?: { narrow?: boolean }): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const lShoulder = landmarks[L.LEFT_SHOULDER]
  const rShoulder = landmarks[L.RIGHT_SHOULDER]
  const lElbow = landmarks[L.LEFT_ELBOW]
  const rElbow = landmarks[L.RIGHT_ELBOW]
  const lWrist = landmarks[L.LEFT_WRIST]
  const rWrist = landmarks[L.RIGHT_WRIST]
  const lHip = landmarks[L.LEFT_HIP]
  const rHip = landmarks[L.RIGHT_HIP]

  // 1. Simetria dos ombros — devem estar nivelados
  if (isVisible(lShoulder) && isVisible(rShoulder)) {
    const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y)
    if (shoulderTilt > 0.06) {
      feedback.push({ status: "warning", message: "Ombros desnivelados! Equilibre o peso" })
    } else {
      feedback.push({ status: "correct", message: "Ombros nivelados — simetria!" })
    }
  }

  // 2. Abertura dos cotovelos — nao abrir a 90° (risco de impacto no ombro)
  // Na vista frontal, cotovelo muito afastado do tronco = angulo aberto
  if (isVisible(lElbow) && isVisible(lShoulder) && isVisible(lHip)) {
    // Distancia horizontal do cotovelo em relacao ao tronco
    const elbowFlare = Math.abs(lElbow.x - lShoulder.x)
    const torsoWidth = Math.abs(lShoulder.x - lHip.x)

    if (elbowFlare > torsoWidth * 1.5) {
      feedback.push({
        status: "error",
        message: opts?.narrow
          ? "Cotovelos muito abertos! Na diamante, mantenha grudados"
          : "Cotovelos abrindo demais! Mantenha a 45° — proteja o ombro",
      })
    } else if (elbowFlare > torsoWidth * 1.1) {
      feedback.push({
        status: "warning",
        message: "Cotovelos um pouco abertos — traga mais pro corpo",
      })
    } else {
      feedback.push({
        status: "correct",
        message: opts?.narrow
          ? "Cotovelos grudados — perfeito para triceps!"
          : "Cotovelos a 45° — angulo seguro!",
      })
    }
  }

  // 3. Profundidade — usando a posicao Y do ombro vs pulso
  if (isVisible(lShoulder) && isVisible(lWrist)) {
    const depth = lShoulder.y - lWrist.y
    if (depth > 0.02) {
      feedback.push({ status: "correct", message: "Boa profundidade — peito perto do chao!" })
    } else if (depth > -0.05) {
      feedback.push({ status: "correct", message: "Fase de subida — empurre!" })
    } else {
      feedback.push({ status: "warning", message: "Desca mais — amplitude completa!" })
    }
  }

  // 4. Maos alinhadas com ombros (largura correta)
  if (isVisible(lWrist) && isVisible(rWrist) && isVisible(lShoulder) && isVisible(rShoulder)) {
    const handWidth = Math.abs(lWrist.x - rWrist.x)
    const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x)
    const ratio = handWidth / shoulderWidth

    if (opts?.narrow) {
      if (ratio > 0.6) {
        feedback.push({ status: "warning", message: "Maos mais juntas! Diamante = maos proximas" })
      }
    } else {
      if (ratio < 0.7) {
        feedback.push({ status: "warning", message: "Maos muito juntas — abra na largura dos ombros" })
      } else if (ratio > 1.5) {
        feedback.push({ status: "warning", message: "Maos muito abertas — alinhe com os ombros" })
      }
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 5: PRESS VERTICAL (Overhead Press Pattern)
// Aplica-se a: Overhead Press, Shoulder Press, Arnold Press
// ══════════════════════════════════════════════════════════════════════════════

function analyzeOverheadPressPattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado ou levemente angulado" }]
  }

  // 1. Elbow angle — ROM do press
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle >= 165) {
    feedback.push({
      status: "correct",
      message: "Lockout completo! Bracos estendidos",
      angle: elbowAngle,
      targetAngle: ">165°",
    })
  } else if (elbowAngle >= 140) {
    feedback.push({
      status: "correct",
      message: "Subindo bem! Estenda completamente",
      angle: elbowAngle,
    })
  } else if (elbowAngle >= 85) {
    feedback.push({
      status: "correct",
      message: "Fase intermediaria — empurre!",
      angle: elbowAngle,
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Posicao inicial — cotovelos a 90°",
      angle: elbowAngle,
      targetAngle: "~90°",
    })
  }

  // 2. Tronco — nao deve hiperestender (lean back excessivo)
  if (isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 20) {
      feedback.push({
        status: "error",
        message: "Inclinando para tras! Risco para lombar. Contraia o abdomen",
        angle: torsoAngle,
      })
    } else if (torsoAngle > 10) {
      feedback.push({
        status: "warning",
        message: "Leve inclinacao — contraia o core",
        angle: torsoAngle,
      })
    } else {
      feedback.push({ status: "correct", message: "Tronco estavel e vertical" })
    }
  }

  // 3. Wrist sobre o cotovelo (bar path vertical)
  if (Math.abs(wrist.x - elbow.x) > 0.1) {
    feedback.push({ status: "warning", message: "Mantenha o pulso sobre o cotovelo — barra na vertical" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 6: ROSCA / CURL Pattern
// Aplica-se a: Todas roscas biceps (barra, halter, martelo, etc)
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCurlPattern(landmarks: Point[], opts?: {
  strictShoulder?: boolean
}): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const strict = opts?.strictShoulder ?? true

  const side = bestSide(landmarks, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
  }

  // 1. Elbow angle — fase do movimento
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle < 40) {
    feedback.push({
      status: "correct",
      message: "Contracao maxima! Segure 1 segundo!",
      angle: elbowAngle,
      targetAngle: "<40°",
    })
  } else if (elbowAngle < 90) {
    feedback.push({
      status: "correct",
      message: "Subindo bem! Continue contraindo",
      angle: elbowAngle,
    })
  } else if (elbowAngle < 140) {
    feedback.push({
      status: "warning",
      message: "Fase intermediaria — controle a descida (excentrica!)",
      angle: elbowAngle,
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Extensao completa — pronto para subir!",
      angle: elbowAngle,
      targetAngle: ">140°",
    })
  }

  // 2. Ombro estavel — cotovelo nao deve adiantar (swing / roubo)
  if (strict && isVisible(hip)) {
    // Ombro se movendo pra frente = compensacao
    if (shoulder.x < elbow.x - 0.06) {
      feedback.push({
        status: "error",
        message: "Ombro se movendo! Cotovelo fixo ao corpo — nao balance!",
      })
    } else {
      feedback.push({ status: "correct", message: "Ombro estavel — isolamento perfeito!" })
    }
  }

  // 3. Tronco nao deve balancear (body english)
  if (isVisible(hip) && isVisible(shoulder)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 15) {
      feedback.push({
        status: "error",
        message: "Balancando o tronco! Diminua a carga",
        angle: torsoAngle,
      })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 7: EXTENSAO TRICEPS Pattern
// Aplica-se a: Overhead Extension, Skull Crusher, Kickback
// ══════════════════════════════════════════════════════════════════════════════

function analyzeTricepExtensionPattern(landmarks: Point[], variant: "overhead" | "kickback" | "pushdown"): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
  }

  const elbowAngle = calculateAngle(shoulder, elbow, wrist)

  if (variant === "overhead") {
    // Overhead: cotovelo aponta para cima, extensao completa = angulo grande
    if (elbowAngle >= 160) {
      feedback.push({ status: "correct", message: "Extensao completa! Triceps contraido!", angle: elbowAngle, targetAngle: ">160°" })
    } else if (elbowAngle >= 120) {
      feedback.push({ status: "correct", message: "Subindo — estenda completamente!", angle: elbowAngle })
    } else if (elbowAngle >= 70) {
      feedback.push({ status: "correct", message: "Boa amplitude na descida — controle!", angle: elbowAngle, targetAngle: "70-90°" })
    } else {
      feedback.push({ status: "warning", message: "Descendo demais — risco para o cotovelo", angle: elbowAngle })
    }

    // Cotovelo deve ficar proximo a cabeca (nao abrir)
    const nose = landmarks[LANDMARKS.NOSE]
    if (isVisible(nose) && Math.abs(elbow.x - nose.x) > 0.15) {
      feedback.push({ status: "warning", message: "Mantenha os cotovelos proximos a cabeca" })
    } else {
      feedback.push({ status: "correct", message: "Cotovelos alinhados — perfeito!" })
    }
  } else if (variant === "kickback") {
    // Kickback: tronco inclinado, extensao atras
    if (elbowAngle >= 160) {
      feedback.push({ status: "correct", message: "Extensao maxima! Aperte o triceps!", angle: elbowAngle, targetAngle: ">160°" })
    } else if (elbowAngle >= 120) {
      feedback.push({ status: "warning", message: "Estenda mais o braco — quase la!", angle: elbowAngle })
    } else {
      feedback.push({ status: "correct", message: "Fase de contracao — estenda!", angle: elbowAngle })
    }

    // Braco superior deve ficar paralelo ao tronco
    if (isVisible(hip) && Math.abs(shoulder.y - elbow.y) > 0.08) {
      feedback.push({ status: "warning", message: "Mantenha o braco superior paralelo ao corpo" })
    }
  } else {
    // Pushdown (cabo)
    if (elbowAngle >= 165) {
      feedback.push({ status: "correct", message: "Extensao completa! Segure!", angle: elbowAngle, targetAngle: ">165°" })
    } else if (elbowAngle >= 130) {
      feedback.push({ status: "correct", message: "Empurre ate extensao total!", angle: elbowAngle })
    } else {
      feedback.push({ status: "correct", message: "Fase de retorno — controle!", angle: elbowAngle })
    }

    // Cotovelo fixo ao corpo
    if (isVisible(hip)) {
      if (elbow.x < hip.x - 0.08 || elbow.x > hip.x + 0.12) {
        feedback.push({ status: "error", message: "Cotovelo saindo do corpo! Fixe ao lado" })
      } else {
        feedback.push({ status: "correct", message: "Cotovelo fixo ao corpo — otimo!" })
      }
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 8: ELEVACAO LATERAL / Raise Pattern
// Aplica-se a: Lateral Raise, Front Raise
// ══════════════════════════════════════════════════════════════════════════════

function analyzeRaisePattern(landmarks: Point[], variant: "lateral" | "front"): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(wrist)) {
    return [{ status: "warning", message: variant === "lateral" ? "Posicione-se de frente para a camera" : "Posicione-se de lado" }]
  }

  // Angulo do braco em relacao ao tronco
  if (isVisible(hip)) {
    const armAngle = calculateAngle(hip, shoulder, wrist)

    if (armAngle >= 80 && armAngle <= 100) {
      feedback.push({
        status: "correct",
        message: "Altura perfeita! Paralelo ao chao!",
        angle: armAngle,
        targetAngle: "80-95°",
      })
    } else if (armAngle > 100) {
      feedback.push({
        status: "warning",
        message: "Subiu demais! Nao passe da linha do ombro — risco de impacto!",
        angle: armAngle,
        targetAngle: "80-95°",
      })
    } else if (armAngle >= 60) {
      feedback.push({
        status: "correct",
        message: "Continue subindo! Quase no paralelo",
        angle: armAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase inicial — suba com controle",
        angle: armAngle,
      })
    }
  }

  // Cotovelo levemente flexionado (nao travar)
  if (isVisible(elbow)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    if (elbowAngle > 175) {
      feedback.push({ status: "warning", message: "Nao trave o cotovelo! Mantenha leve flexao" })
    } else if (elbowAngle >= 150) {
      feedback.push({ status: "correct", message: "Cotovelo com boa flexao" })
    }
  }

  // Tronco nao deve balancear
  if (isVisible(hip) && isVisible(shoulder)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 15) {
      feedback.push({ status: "error", message: "Corpo balancando! Diminua a carga", angle: torsoAngle })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 9: REMADA / ROW Pattern
// Aplica-se a: Bent-Over Row, Pendlay Row, Dumbbell Row
// ══════════════════════════════════════════════════════════════════════════════

function analyzeRowPattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, knee } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(knee)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Torso angle — deve ficar entre 30-60° (inclinado, nao ereto)
  const vertRef: Point = { x: hip.x, y: hip.y - 1 }
  const torsoAngle = calculateAngle(shoulder, hip, vertRef)

  if (torsoAngle >= 30 && torsoAngle <= 60) {
    feedback.push({
      status: "correct",
      message: "Inclinacao do tronco ideal!",
      angle: torsoAngle,
      targetAngle: "30-60°",
    })
  } else if (torsoAngle < 30) {
    feedback.push({
      status: "warning",
      message: "Tronco muito ereto — incline mais para isolar costas",
      angle: torsoAngle,
      targetAngle: "30-60°",
    })
  } else {
    feedback.push({
      status: "error",
      message: "Tronco muito inclinado! Risco lombar",
      angle: torsoAngle,
      targetAngle: "30-60°",
    })
  }

  // 2. Elbow — puxar ate cotovelo passar do tronco
  if (isVisible(elbow) && isVisible(wrist)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    if (elbowAngle <= 80) {
      feedback.push({
        status: "correct",
        message: "Contracao maxima das costas! Aperte as escapulas!",
        angle: elbowAngle,
      })
    } else if (elbowAngle <= 120) {
      feedback.push({
        status: "correct",
        message: "Puxando bem — traga mais para o corpo",
        angle: elbowAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase de extensao — controle a descida!",
        angle: elbowAngle,
      })
    }
  }

  // 3. Coluna neutra (costas retas)
  if (shoulder.y > hip.y + 0.15) {
    feedback.push({ status: "error", message: "Costas arredondando! Peito para fora, coluna neutra" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 10: PRANCHA / PLANK Pattern
// Aplica-se a: Plank, Side Plank
// ══════════════════════════════════════════════════════════════════════════════

function analyzePlankPattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const { shoulder, hip, ankle, wrist } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera ver seu corpo inteiro" }]
  }

  // 1. Body alignment (shoulder-hip-ankle)
  const bodyAngle = calculateAngle(shoulder, hip, ankle)
  if (bodyAngle >= 165 && bodyAngle <= 180) {
    feedback.push({ status: "correct", message: "Alinhamento perfeito! Corpo reto como uma tabua!", angle: bodyAngle, targetAngle: "165-180°" })
  } else if (bodyAngle >= 155) {
    feedback.push({ status: "warning", message: "Quase la! Alinhe um pouco mais", angle: bodyAngle, targetAngle: "165-180°" })
  } else if (hip.y < shoulder.y) {
    feedback.push({ status: "error", message: "Quadril subindo demais! Abaixe o quadril", angle: bodyAngle, targetAngle: "165-180°" })
  } else {
    feedback.push({ status: "error", message: "Quadril caindo! Contraia o abdomen e levante o quadril", angle: bodyAngle, targetAngle: "165-180°" })
  }

  // 2. Shoulders over wrists
  if (isVisible(wrist)) {
    const shWristDist = Math.abs(shoulder.x - wrist.x)
    if (shWristDist > 0.1) {
      feedback.push({ status: "warning", message: "Ombros devem ficar acima dos pulsos" })
    } else {
      feedback.push({ status: "correct", message: "Ombros alinhados com os pulsos" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 11: HIP THRUST / PONTE GLUTEO Pattern
// Aplica-se a: Hip Thrust, Glute Bridge
// ══════════════════════════════════════════════════════════════════════════════

function analyzeHipThrustPattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(knee)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Hip extension — quadril deve subir ate alinhar com ombro-joelho
  const hipAngle = calculateAngle(shoulder, hip, knee)
  if (hipAngle >= 165 && hipAngle <= 185) {
    feedback.push({
      status: "correct",
      message: "Extensao completa do quadril! Aperte os gluteos!",
      angle: hipAngle,
      targetAngle: "170-180°",
    })
  } else if (hipAngle >= 145) {
    feedback.push({
      status: "warning",
      message: "Suba mais o quadril! Extensao incompleta",
      angle: hipAngle,
      targetAngle: "170-180°",
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Descendo — controle a excentrica",
      angle: hipAngle,
    })
  }

  // 2. Knee angle — deve ficar proximo a 90° no topo
  if (isVisible(ankle)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle >= 80 && kneeAngle <= 100) {
      feedback.push({
        status: "correct",
        message: "Angulo do joelho perfeito — maximo gluteo!",
        angle: kneeAngle,
        targetAngle: "85-95°",
      })
    } else if (kneeAngle < 80) {
      feedback.push({
        status: "warning",
        message: "Pes muito proximos — afaste um pouco",
        angle: kneeAngle,
      })
    } else {
      feedback.push({
        status: "warning",
        message: "Pes muito distantes — traga mais perto",
        angle: kneeAngle,
      })
    }
  }

  // 3. Hiperestensao — nao forcar lombar
  if (hipAngle > 185) {
    feedback.push({ status: "error", message: "Hiperestensao lombar! Nao force alem do alinhamento" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 12: DIP Pattern
// Aplica-se a: Dips (peito e triceps)
// ══════════════════════════════════════════════════════════════════════════════

function analyzeDipPattern(landmarks: Point[], variant: "chest" | "tricep"): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Elbow angle — profundidade do mergulho
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle <= 90) {
    feedback.push({
      status: "correct",
      message: "Profundidade ideal! Nao desca mais — proteja o ombro",
      angle: elbowAngle,
      targetAngle: "85-95°",
    })
  } else if (elbowAngle <= 120) {
    feedback.push({
      status: "warning",
      message: "Desca mais — cotovelo deve chegar a 90°",
      angle: elbowAngle,
      targetAngle: "85-95°",
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase de subida — empurre!",
      angle: elbowAngle,
    })
  }

  // 2. Torso — peito inclina pra frente, tricep fica mais ereto
  if (isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (variant === "chest") {
      if (torsoAngle >= 15 && torsoAngle <= 35) {
        feedback.push({ status: "correct", message: "Inclinacao perfeita para enfatizar peito!", angle: torsoAngle })
      } else if (torsoAngle < 15) {
        feedback.push({ status: "warning", message: "Incline mais para frente para ativar peito" })
      }
    } else {
      if (torsoAngle <= 15) {
        feedback.push({ status: "correct", message: "Tronco ereto — maximo triceps!", angle: torsoAngle })
      } else {
        feedback.push({ status: "warning", message: "Mantenha o tronco mais ereto para isolar triceps" })
      }
    }
  }

  // 3. Nao descer demais (proteger articulacao do ombro)
  if (elbowAngle < 70) {
    feedback.push({ status: "error", message: "Muito profundo! Risco de lesao no ombro — pare a 90°" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO 13: PANTURRILHA / CALF Pattern
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCalfRaisePattern(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []

  const side = bestSide(landmarks, LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE)
  const { knee, ankle, hip, shoulder } = getSideLandmarks(landmarks, side)
  const heel = side === "left" ? landmarks[LANDMARKS.LEFT_HEEL] : landmarks[LANDMARKS.RIGHT_HEEL]
  const footIdx = side === "left" ? landmarks[LANDMARKS.LEFT_FOOT_INDEX] : landmarks[LANDMARKS.RIGHT_FOOT_INDEX]

  if (!isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera ver pernas e pes" }]
  }

  // 1. Ankle angle — extensao plantar
  const ankleAngle = calculateAngle(knee, ankle, footIdx ?? ankle)
  if (isVisible(footIdx ?? ankle)) {
    if (ankleAngle <= 130) {
      feedback.push({
        status: "correct",
        message: "Extensao maxima! Segure no topo 2 segundos!",
        angle: ankleAngle,
      })
    } else if (ankleAngle <= 150) {
      feedback.push({
        status: "warning",
        message: "Suba mais na ponta dos pes!",
        angle: ankleAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Descendo — estique a panturrilha na excentrica",
        angle: ankleAngle,
      })
    }
  }

  // 2. Joelhos nao devem flexionar (isolar panturrilha)
  if (isVisible(hip)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle < 160) {
      feedback.push({ status: "warning", message: "Mantenha os joelhos estendidos — nao flexione!", angle: kneeAngle })
    } else {
      feedback.push({ status: "correct", message: "Joelhos estendidos — isolamento correto" })
    }
  }

  // 3. Tronco ereto
  if (isVisible(shoulder) && isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 10) {
      feedback.push({ status: "warning", message: "Mantenha o tronco reto e ereto" })
    }
  }

  return feedback
}


// ══════════════════════════════════════════════════════════════════════════════
// DEFINICAO DE TODOS OS EXERCICIOS
// ══════════════════════════════════════════════════════════════════════════════

const exerciseRules: ExerciseRule[] = [
  // ── QUADRICEPS ────────────────────────────────────────────────────────────
  {
    id: "squat",
    name: "Agachamento Livre",
    nameEn: "Barbell Back Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "Fique de lado para a camera, a ~2m de distancia",
    analyze: (lm) => analyzeSquatPattern(lm),
  },
  {
    id: "front_squat",
    name: "Agachamento Frontal",
    nameEn: "Front Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, tronco mais ereto que o agachamento normal",
    analyze: (lm) => analyzeSquatPattern(lm, { minDepthAngle: 75, maxDepthAngle: 100 }),
  },
  {
    id: "goblet_squat",
    name: "Agachamento Goblet",
    nameEn: "Goblet Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, segure o peso proximo ao peito",
    analyze: (lm) => analyzeSquatPattern(lm, { minDepthAngle: 70, maxDepthAngle: 100 }),
  },
  {
    id: "sumo_squat",
    name: "Agachamento Sumo",
    nameEn: "Sumo Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, pes bem abertos",
    analyze: (lm) => analyzeSquatPattern(lm, { wideStance: true, minDepthAngle: 75, maxDepthAngle: 105 }),
  },
  {
    id: "smith_squat",
    name: "Agachamento Smith",
    nameEn: "Smith Machine Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera",
    analyze: (lm) => analyzeSquatPattern(lm),
  },
  {
    id: "walking_lunge",
    name: "Afundo (Passada)",
    nameEn: "Walking Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera, espaco para caminhar",
    analyze: (lm) => analyzeLungePattern(lm),
  },
  {
    id: "reverse_lunge",
    name: "Afundo Reverso",
    nameEn: "Reverse Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera",
    analyze: (lm) => analyzeLungePattern(lm),
  },
  {
    id: "bulgarian_split_squat",
    name: "Agachamento Bulgaro",
    nameEn: "Bulgarian Split Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, pe traseiro elevado no banco",
    analyze: (lm) => analyzeLungePattern(lm),
  },
  {
    id: "step_up",
    name: "Step-Up",
    nameEn: "Step-Up",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera, ao lado do step/banco",
    analyze: (lm) => analyzeLungePattern(lm),
  },

  // ── HAMSTRINGS ────────────────────────────────────────────────────────────
  {
    id: "romanian_deadlift",
    name: "Levantamento Romeno",
    nameEn: "Romanian Deadlift",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, corpo inteiro visivel",
    analyze: (lm) => analyzeHingePattern(lm, { allowKneeBend: false }),
  },
  {
    id: "stiff_leg_deadlift",
    name: "Stiff (Pernas Estendidas)",
    nameEn: "Stiff-Leg Deadlift",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, joelhos quase travados",
    analyze: (lm) => analyzeHingePattern(lm, { allowKneeBend: false }),
  },
  {
    id: "good_morning",
    name: "Good Morning",
    nameEn: "Good Morning",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, barra nos ombros",
    analyze: (lm) => analyzeHingePattern(lm, { allowKneeBend: false }),
  },

  // ── GLUTEOS ───────────────────────────────────────────────────────────────
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    nameEn: "Barbell Hip Thrust",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, costas apoiadas no banco",
    analyze: (lm) => analyzeHipThrustPattern(lm),
  },
  {
    id: "glute_bridge",
    name: "Ponte de Gluteo",
    nameEn: "Glute Bridge",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no chao",
    analyze: (lm) => analyzeHipThrustPattern(lm),
  },

  // ── PANTURRILHA ───────────────────────────────────────────────────────────
  {
    id: "standing_calf_raise",
    name: "Panturrilha em Pe",
    nameEn: "Standing Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, corpo inteiro visivel dos pes a cabeca",
    analyze: (lm) => analyzeCalfRaisePattern(lm),
  },

  // ── PEITO ─────────────────────────────────────────────────────────────────
  {
    id: "push_up",
    name: "Flexao de Bracos",
    nameEn: "Push-Up",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "Camera no chao: de LADO (ve alinhamento) ou de FRENTE (ve cotovelos). Ambos funcionam!",
    analyze: (lm) => analyzePushUpPattern(lm),
  },
  {
    id: "incline_push_up",
    name: "Flexao Inclinada",
    nameEn: "Incline Push-Up",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "Camera no chao: de lado ou de frente — ambos funcionam!",
    analyze: (lm) => analyzePushUpPattern(lm),
  },
  {
    id: "deficit_push_up",
    name: "Flexao Deficit",
    nameEn: "Deficit Push-Up",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "Camera no chao: de lado ou de frente — ambos funcionam!",
    analyze: (lm) => analyzePushUpPattern(lm),
  },
  {
    id: "dip_chest",
    name: "Mergulho (Peito)",
    nameEn: "Dip (Chest)",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, na estacao de mergulho",
    analyze: (lm) => analyzeDipPattern(lm, "chest"),
  },

  // ── COSTAS ────────────────────────────────────────────────────────────────
  {
    id: "barbell_row",
    name: "Remada Curvada",
    nameEn: "Barbell Bent-Over Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, tronco inclinado a 45°",
    analyze: (lm) => analyzeRowPattern(lm),
  },
  {
    id: "dumbbell_row",
    name: "Remada Unilateral",
    nameEn: "Dumbbell Single-Arm Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, mao apoiada no banco",
    analyze: (lm) => analyzeRowPattern(lm),
  },
  {
    id: "pendlay_row",
    name: "Remada Pendlay",
    nameEn: "Pendlay Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, tronco paralelo ao chao",
    analyze: (lm) => analyzeRowPattern(lm),
  },
  {
    id: "t_bar_row",
    name: "Remada T-Bar",
    nameEn: "T-Bar Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, tronco inclinado",
    analyze: (lm) => analyzeRowPattern(lm),
  },

  // ── OMBROS ────────────────────────────────────────────────────────────────
  {
    id: "overhead_press",
    name: "Desenvolvimento Barra",
    nameEn: "Barbell Overhead Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, em pe, barra na frente dos ombros",
    analyze: (lm) => analyzeOverheadPressPattern(lm),
  },
  {
    id: "dumbbell_shoulder_press",
    name: "Desenvolvimento Halteres",
    nameEn: "Dumbbell Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, sentado ou em pe",
    analyze: (lm) => analyzeOverheadPressPattern(lm),
  },
  {
    id: "arnold_press",
    name: "Arnold Press",
    nameEn: "Arnold Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, sentado",
    analyze: (lm) => analyzeOverheadPressPattern(lm),
  },
  {
    id: "lateral_raise",
    name: "Elevacao Lateral",
    nameEn: "Dumbbell Lateral Raise",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, bracos ao lado do corpo",
    analyze: (lm) => analyzeRaisePattern(lm, "lateral"),
  },
  {
    id: "front_raise",
    name: "Elevacao Frontal",
    nameEn: "Dumbbell Front Raise",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado para a camera",
    analyze: (lm) => analyzeRaisePattern(lm, "front"),
  },

  // ── BICEPS ────────────────────────────────────────────────────────────────
  {
    id: "bicep_curl",
    name: "Rosca Direta (Barra)",
    nameEn: "Barbell Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, braco visivel inteiro",
    analyze: (lm) => analyzeCurlPattern(lm),
  },
  {
    id: "dumbbell_curl",
    name: "Rosca Alternada",
    nameEn: "Dumbbell Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, braco que esta trabalhando visivel",
    analyze: (lm) => analyzeCurlPattern(lm),
  },
  {
    id: "hammer_curl",
    name: "Rosca Martelo",
    nameEn: "Hammer Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, punho neutro (palma pra dentro)",
    analyze: (lm) => analyzeCurlPattern(lm),
  },
  {
    id: "preacher_curl",
    name: "Rosca Scott",
    nameEn: "Preacher Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, braco apoiado no banco Scott",
    analyze: (lm) => analyzeCurlPattern(lm, { strictShoulder: false }),
  },
  {
    id: "concentration_curl",
    name: "Rosca Concentrada",
    nameEn: "Concentration Curl",
    muscleGroup: "biceps",
    cameraPosition: "front",
    positioningTip: "De frente, sentado, cotovelo apoiado na coxa",
    analyze: (lm) => analyzeCurlPattern(lm, { strictShoulder: false }),
  },
  {
    id: "incline_curl",
    name: "Rosca Inclinada",
    nameEn: "Incline Dumbbell Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, sentado no banco inclinado a 45°",
    analyze: (lm) => analyzeCurlPattern(lm),
  },
  {
    id: "spider_curl",
    name: "Rosca Spider",
    nameEn: "Spider Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, peito apoiado no banco inclinado",
    analyze: (lm) => analyzeCurlPattern(lm, { strictShoulder: false }),
  },

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  {
    id: "tricep_pushdown",
    name: "Triceps Polia (Pushdown)",
    nameEn: "Cable Tricep Pushdown",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, proximo ao cabo",
    analyze: (lm) => analyzeTricepExtensionPattern(lm, "pushdown"),
  },
  {
    id: "rope_pushdown",
    name: "Triceps Corda",
    nameEn: "Rope Tricep Pushdown",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, proximo ao cabo",
    analyze: (lm) => analyzeTricepExtensionPattern(lm, "pushdown"),
  },
  {
    id: "overhead_tricep",
    name: "Triceps Frances (Overhead)",
    nameEn: "Overhead Cable Extension",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, bracos acima da cabeca",
    analyze: (lm) => analyzeTricepExtensionPattern(lm, "overhead"),
  },
  {
    id: "skull_crusher",
    name: "Triceps Testa (Skull Crusher)",
    nameEn: "EZ-Bar Skull Crusher",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no banco",
    analyze: (lm) => analyzeTricepExtensionPattern(lm, "overhead"),
  },
  {
    id: "tricep_kickback",
    name: "Triceps Kickback",
    nameEn: "Tricep Kickback",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, tronco inclinado",
    analyze: (lm) => analyzeTricepExtensionPattern(lm, "kickback"),
  },
  {
    id: "diamond_push_up",
    name: "Flexao Diamante",
    nameEn: "Diamond Push-Up",
    muscleGroup: "triceps",
    cameraPosition: "side-or-front",
    positioningTip: "Camera no chao: de frente (melhor — ve cotovelos grudados) ou de lado",
    analyze: (lm) => analyzePushUpPattern(lm, { narrow: true }),
  },
  {
    id: "dip_tricep",
    name: "Mergulho (Triceps)",
    nameEn: "Tricep Dip",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, corpo mais vertical",
    analyze: (lm) => analyzeDipPattern(lm, "tricep"),
  },

  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: "plank",
    name: "Prancha",
    nameEn: "Plank",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "Camera no chao, de lado, corpo inteiro visivel",
    analyze: (lm) => analyzePlankPattern(lm),
  },
  {
    id: "side_plank",
    name: "Prancha Lateral",
    nameEn: "Side Plank",
    muscleGroup: "core",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, em apoio lateral",
    analyze: (lm) => analyzePlankPattern(lm),
  },
  {
    id: "mountain_climber",
    name: "Mountain Climber",
    nameEn: "Mountain Climber",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "Camera no chao, de lado",
    analyze: (lm) => analyzePushUpPattern(lm),
  },

  // ── FULL BODY ─────────────────────────────────────────────────────────────
  {
    id: "conventional_deadlift",
    name: "Levantamento Terra",
    nameEn: "Conventional Deadlift",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, corpo inteiro visivel com a barra",
    analyze: (lm) => analyzeHingePattern(lm, { allowKneeBend: true }),
  },
  {
    id: "sumo_deadlift",
    name: "Terra Sumo",
    nameEn: "Sumo Deadlift",
    muscleGroup: "full_body",
    cameraPosition: "front",
    positioningTip: "De frente, pes bem abertos",
    analyze: (lm) => analyzeHingePattern(lm, { allowKneeBend: true }),
  },
  {
    id: "thruster",
    name: "Thruster",
    nameEn: "Thruster",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, espaco para agachar e pressionar",
    analyze(landmarks: Point[]): PostureFeedback[] {
      // Combo: squat + overhead press — analisar a fase atual
      const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
      const { shoulder, elbow, wrist, hip, knee, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const kneeAngle = calculateAngle(hip, knee, ankle)

      // Se joelho < 130 = fase de agachamento
      if (kneeAngle < 130) {
        return analyzeSquatPattern(landmarks)
      }
      // Se joelho > 130 = fase de press (ou transicao)
      if (isVisible(elbow) && isVisible(wrist)) {
        return analyzeOverheadPressPattern(landmarks)
      }
      return [{ status: "correct", message: "Transicao — exploda do agachamento para o press!" }]
    },
  },
  {
    id: "burpee",
    name: "Burpee",
    nameEn: "Burpee",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, espaco amplo",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
      const { shoulder, hip, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(ankle)) {
        return [{ status: "warning", message: "Posicione-se de lado, corpo inteiro visivel" }]
      }

      // Verificar alinhamento na fase de prancha
      const bodyAngle = calculateAngle(shoulder, hip, ankle)
      const feedback: PostureFeedback[] = []

      if (bodyAngle >= 155 && bodyAngle <= 180) {
        feedback.push({ status: "correct", message: "Prancha do burpee alinhada!", angle: bodyAngle })
      } else if (bodyAngle < 155 && hip.y < shoulder.y) {
        feedback.push({ status: "warning", message: "Na prancha: nao suba o quadril!", angle: bodyAngle })
      } else if (bodyAngle < 155) {
        feedback.push({ status: "warning", message: "Na prancha: nao deixe o quadril cair!", angle: bodyAngle })
      }

      feedback.push({ status: "correct", message: "Mantenha ritmo constante e controlado!" })
      return feedback
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS — Agrupamento por musculo para o UI
// ══════════════════════════════════════════════════════════════════════════════

/** All exercise rules, flat list */
export const EXERCISE_RULES: ExerciseRule[] = exerciseRules

/** Exercise rules grouped by muscle for the selector UI */
export const EXERCISE_GROUPS: ExerciseGroup[] = [
  { id: "quadriceps", label: "Quadriceps", icon: "🦵", exercises: exerciseRules.filter(r => r.muscleGroup === "quadriceps") },
  { id: "hamstrings", label: "Posterior", icon: "🦿", exercises: exerciseRules.filter(r => r.muscleGroup === "hamstrings") },
  { id: "glutes", label: "Gluteos", icon: "🍑", exercises: exerciseRules.filter(r => r.muscleGroup === "glutes") },
  { id: "calves", label: "Panturrilha", icon: "🦶", exercises: exerciseRules.filter(r => r.muscleGroup === "calves") },
  { id: "chest", label: "Peito", icon: "💪", exercises: exerciseRules.filter(r => r.muscleGroup === "chest") },
  { id: "back", label: "Costas", icon: "🔙", exercises: exerciseRules.filter(r => r.muscleGroup === "back") },
  { id: "shoulders", label: "Ombros", icon: "🏋️", exercises: exerciseRules.filter(r => r.muscleGroup === "shoulders") },
  { id: "biceps", label: "Biceps", icon: "🦾", exercises: exerciseRules.filter(r => r.muscleGroup === "biceps") },
  { id: "triceps", label: "Triceps", icon: "🔱", exercises: exerciseRules.filter(r => r.muscleGroup === "triceps") },
  { id: "core", label: "Core / Abdomen", icon: "🎯", exercises: exerciseRules.filter(r => r.muscleGroup === "core") },
  { id: "full_body", label: "Full Body", icon: "⚡", exercises: exerciseRules.filter(r => r.muscleGroup === "full_body") },
]

/** Find rule by ID */
export function getExerciseRule(id: string): ExerciseRule | undefined {
  return EXERCISE_RULES.find(r => r.id === id)
}

/** Total count of exercises with posture analysis */
export const TOTAL_EXERCISES_WITH_POSTURE = EXERCISE_RULES.length
