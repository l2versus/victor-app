// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Regras Biomecanicas Estendidas (Maquinas, Cabos, Cardio, Alongamentos)
// 153+ exercicios adicionais para completar o banco de 203
//
// Importa tipos de posture-rules.ts; recria utilidades locais (nao exportadas).
// ══════════════════════════════════════════════════════════════════════════════

import type {
  Point,
  PostureFeedback,
  ExerciseRule,
  MuscleGroup,
  CameraPosition,
} from "./posture-rules"
import { LANDMARKS, calculateAngle } from "./posture-rules"

// ─── Utilidades locais (recriadas — nao exportadas pelo modulo original) ─────

function isVisible(p: Point, threshold = 0.3): boolean {
  return (p.visibility ?? 0) >= threshold
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function verticalDiff(a: Point, b: Point): number {
  return a.y - b.y
}

function bestSide(
  landmarks: Point[],
  leftIdx: number,
  rightIdx: number,
): "left" | "right" {
  const lVis = landmarks[leftIdx]?.visibility ?? 0
  const rVis = landmarks[rightIdx]?.visibility ?? 0
  return lVis >= rVis ? "left" : "right"
}

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
      ear: landmarks[L.LEFT_EAR],
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
    ear: landmarks[L.RIGHT_EAR],
  }
}

/** Horizontal distance between two points (absolute) */
function horizontalDist(a: Point, b: Point): number {
  return Math.abs(a.x - b.x)
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO A: MACHINE PRESS (Chest Press, Shoulder Press machines)
// Costas contra o pad, cotovelo caminho controlado, ombros alinhados
// ══════════════════════════════════════════════════════════════════════════════

function analyzeMachinePress(
  landmarks: Point[],
  opts?: {
    incline?: boolean
    decline?: boolean
    isShoulderPress?: boolean
    label?: string
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado ou levemente angulado para a camera" }]
  }

  // 1. Elbow angle — ROM do press
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle >= 160) {
    feedback.push({
      status: "correct",
      message: "Extensao completa! Contracao no topo",
      angle: elbowAngle,
      targetAngle: ">160°",
    })
  } else if (elbowAngle >= 100) {
    feedback.push({
      status: "correct",
      message: "Empurre ate extensao total!",
      angle: elbowAngle,
    })
  } else if (elbowAngle >= 70) {
    feedback.push({
      status: "correct",
      message: "Boa profundidade — empurre agora!",
      angle: elbowAngle,
      targetAngle: "70-90°",
    })
  } else {
    feedback.push({
      status: "warning",
      message: "Descendo demais! Risco para o ombro",
      angle: elbowAngle,
    })
  }

  // 2. Costas contra o encosto — ombro nao deve avançar muito a frente do quadril
  if (isVisible(hip)) {
    const shoulderForward = shoulder.x - hip.x
    if (opts?.isShoulderPress) {
      // Shoulder press: tronco deve ficar vertical
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 15) {
        feedback.push({
          status: "error",
          message: "Costas saindo do encosto! Mantenha apoiado",
          angle: torsoAngle,
        })
      } else {
        feedback.push({ status: "correct", message: "Costas bem apoiadas no encosto" })
      }
    } else {
      // Chest press
      if (Math.abs(shoulderForward) > 0.12) {
        feedback.push({
          status: "warning",
          message: "Costas saindo do pad! Mantenha apoiado",
        })
      } else {
        feedback.push({ status: "correct", message: "Costas bem apoiadas" })
      }
    }
  }

  // 3. Ombros — devem ficar nivelados (frontal view check)
  const lShoulder = landmarks[L.LEFT_SHOULDER]
  const rShoulder = landmarks[L.RIGHT_SHOULDER]
  if (isVisible(lShoulder) && isVisible(rShoulder)) {
    const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y)
    if (shoulderTilt > 0.06) {
      feedback.push({ status: "warning", message: "Ombros desnivelados! Empurre uniforme dos dois lados" })
    }
  }

  // 4. Cotovelo nao deve abrir excessivamente (impingement risk)
  if (isVisible(hip) && !opts?.isShoulderPress) {
    // Em chest press, cotovelo deve ficar ~45-75° do tronco, nao 90°
    const elbowHeight = verticalDiff(elbow, shoulder)
    if (elbowHeight > 0.08) {
      feedback.push({ status: "warning", message: "Cotovelos muito altos — traga mais para baixo" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO B: MACHINE PULL (Lat Pulldown, Seated Row machines)
// Torso estavel, retracao escapular, caminho do cotovelo
// ══════════════════════════════════════════════════════════════════════════════

function analyzeMachinePull(
  landmarks: Point[],
  opts?: {
    isVerticalPull?: boolean // lat pulldown, pull-up
    isSeatedRow?: boolean
    isInvertedRow?: boolean
    label?: string
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow)) {
    return [{ status: "warning", message: "Posicione-se para a camera ver ombros e cotovelos" }]
  }

  // 1. Elbow angle — fase do puxar
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (isVisible(wrist)) {
    if (elbowAngle <= 70) {
      feedback.push({
        status: "correct",
        message: "Contracao maxima! Aperte as escapulas!",
        angle: elbowAngle,
        targetAngle: "<75°",
      })
    } else if (elbowAngle <= 110) {
      feedback.push({
        status: "correct",
        message: "Puxando bem — traga mais!",
        angle: elbowAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase de retorno — controle a volta!",
        angle: elbowAngle,
      })
    }
  }

  // 2. Torso — verificar inclinacao
  if (isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)

    if (opts?.isVerticalPull) {
      // Pulldown/pull-up: leve inclinacao para tras e aceitavel (10-25°)
      if (torsoAngle > 30) {
        feedback.push({
          status: "error",
          message: "Inclinando demais para tras! Risco lombar",
          angle: torsoAngle,
          targetAngle: "10-25°",
        })
      } else if (torsoAngle >= 10) {
        feedback.push({ status: "correct", message: "Boa inclinacao do tronco", angle: torsoAngle })
      } else {
        feedback.push({
          status: "warning",
          message: "Incline levemente para tras para melhor ativacao",
          angle: torsoAngle,
        })
      }
    } else if (opts?.isSeatedRow) {
      // Seated row: tronco quase vertical
      if (torsoAngle > 20) {
        feedback.push({
          status: "error",
          message: "Tronco inclinando demais! Mantenha ereto",
          angle: torsoAngle,
        })
      } else {
        feedback.push({ status: "correct", message: "Tronco estavel e ereto" })
      }
    } else if (opts?.isInvertedRow) {
      // Inverted row: corpo deve ficar reto
      const { ankle } = getSideLandmarks(landmarks, side)
      if (isVisible(ankle)) {
        const bodyAngle = calculateAngle(shoulder, hip, ankle)
        if (bodyAngle >= 160) {
          feedback.push({ status: "correct", message: "Corpo reto — otimo!", angle: bodyAngle })
        } else {
          feedback.push({ status: "warning", message: "Mantenha o corpo reto — contraia o core", angle: bodyAngle })
        }
      }
    } else {
      if (torsoAngle > 25) {
        feedback.push({ status: "warning", message: "Tronco inclinando — mantenha mais estavel", angle: torsoAngle })
      } else {
        feedback.push({ status: "correct", message: "Postura do tronco correta" })
      }
    }
  }

  // 3. Retracao escapular — ombros nao devem protrair (avançar para frente)
  if (isVisible(hip) && isVisible(shoulder)) {
    // Se ombro esta muito a frente do quadril: escapulas nao estao retraindo
    if (shoulder.x < hip.x - 0.1) {
      feedback.push({ status: "warning", message: "Retraia as escapulas! Ombros para tras" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO C: LEG PRESS
// Rastreio do joelho, lombar no pad, profundidade
// ══════════════════════════════════════════════════════════════════════════════

function analyzeLegPress(
  landmarks: Point[],
  opts?: { narrow?: boolean; calfRaise?: boolean },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_HIP, L.RIGHT_HIP)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(hip) || !isVisible(knee)) {
    return [{ status: "warning", message: "Posicione a camera de lado para ver pernas e quadril" }]
  }

  if (opts?.calfRaise) {
    // Calf raise no leg press: verificar extensao do tornozelo
    if (isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle < 160) {
        feedback.push({ status: "warning", message: "Mantenha os joelhos quase estendidos", angle: kneeAngle })
      } else {
        feedback.push({ status: "correct", message: "Joelhos estendidos — foque na panturrilha" })
      }
    }
    feedback.push({ status: "correct", message: "Empurre com a ponta dos pes — amplitude total!" })
    return feedback
  }

  // 1. Knee angle — profundidade
  if (isVisible(ankle)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle < 70) {
      feedback.push({
        status: "error",
        message: "Muito profundo! Risco para joelhos e lombar",
        angle: kneeAngle,
        targetAngle: "80-100°",
      })
    } else if (kneeAngle <= 100) {
      feedback.push({
        status: "correct",
        message: "Profundidade ideal!",
        angle: kneeAngle,
        targetAngle: "80-100°",
      })
    } else if (kneeAngle <= 140) {
      feedback.push({
        status: "warning",
        message: "Desca mais — amplitude incompleta",
        angle: kneeAngle,
        targetAngle: "80-100°",
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase de extensao — empurre!",
        angle: kneeAngle,
      })
    }
  }

  // 2. Lombar — quadril nao deve descolar do assento (butt wink no leg press)
  if (isVisible(shoulder) && isVisible(hip)) {
    // Se hip sobe em relacao ao shoulder = lombar descolando
    const hipToShoulder = verticalDiff(hip, shoulder)
    if (hipToShoulder < -0.12) {
      feedback.push({
        status: "error",
        message: "Lombar descolando do assento! Reduza a amplitude",
      })
    } else {
      feedback.push({ status: "correct", message: "Lombar apoiada no assento" })
    }
  }

  // 3. Joelhos nao devem colapsar para dentro (frontal view)
  const lKnee = landmarks[L.LEFT_KNEE]
  const rKnee = landmarks[L.RIGHT_KNEE]
  const lAnkle = landmarks[L.LEFT_ANKLE]
  const rAnkle = landmarks[L.RIGHT_ANKLE]
  if (isVisible(lKnee) && isVisible(rKnee) && isVisible(lAnkle) && isVisible(rAnkle)) {
    const kneeWidth = Math.abs(lKnee.x - rKnee.x)
    const ankleWidth = Math.abs(lAnkle.x - rAnkle.x)
    if (kneeWidth < ankleWidth * 0.7) {
      feedback.push({ status: "error", message: "Joelhos colapsando para dentro! Empurre para fora" })
    }
  }

  // 4. Lockout — nao hiperestender os joelhos
  if (isVisible(ankle)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle > 178) {
      feedback.push({ status: "warning", message: "Nao trave completamente os joelhos!" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO D: LEG EXTENSION (Cadeira Extensora)
// ROM controlado, sem momentum, alinhamento do joelho
// ══════════════════════════════════════════════════════════════════════════════

function analyzeLegExtension(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_KNEE, L.RIGHT_KNEE)
  const { hip, knee, ankle, shoulder } = getSideLandmarks(landmarks, side)

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione a camera de lado para ver a perna inteira" }]
  }

  // 1. Knee angle — extensao
  const kneeAngle = calculateAngle(hip, knee, ankle)
  if (kneeAngle >= 165) {
    feedback.push({
      status: "correct",
      message: "Extensao completa! Segure a contracao 1s!",
      angle: kneeAngle,
      targetAngle: ">165°",
    })
  } else if (kneeAngle >= 130) {
    feedback.push({
      status: "warning",
      message: "Estenda mais! Falta amplitude",
      angle: kneeAngle,
      targetAngle: ">165°",
    })
  } else if (kneeAngle >= 90) {
    feedback.push({
      status: "correct",
      message: "Subindo — estenda completamente!",
      angle: kneeAngle,
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase excentrica — controle a descida!",
      angle: kneeAngle,
    })
  }

  // 2. Tronco — deve manter apoiado no encosto, nao compensar com o corpo
  if (isVisible(shoulder)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 20) {
      feedback.push({
        status: "error",
        message: "Corpo compensando! Mantenha apoiado no encosto",
        angle: torsoAngle,
      })
    } else {
      feedback.push({ status: "correct", message: "Tronco bem apoiado" })
    }
  }

  // 3. Velocidade / momentum — dificil de medir com pose estatica, mas se
  //    o angulo flutua muito rapido entre frames, seria momentum. Dica geral:
  feedback.push({ status: "correct", message: "Controle a excentrica — 2-3s na descida" })

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO E: LEG CURL (Deitado, Sentado ou Em Pe)
// Posicao do quadril, excentrica controlada, contracao completa
// ══════════════════════════════════════════════════════════════════════════════

function analyzeLegCurl(
  landmarks: Point[],
  opts?: { variant?: "lying" | "seated" | "standing" },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_KNEE, L.RIGHT_KNEE)
  const { hip, knee, ankle, shoulder } = getSideLandmarks(landmarks, side)

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione a camera de lado para ver a perna" }]
  }

  // 1. Knee flexion — quanto mais fechado, mais contracao
  const kneeAngle = calculateAngle(hip, knee, ankle)

  if (kneeAngle <= 50) {
    feedback.push({
      status: "correct",
      message: "Contracao maxima dos posteriores! Segure!",
      angle: kneeAngle,
      targetAngle: "<50°",
    })
  } else if (kneeAngle <= 90) {
    feedback.push({
      status: "correct",
      message: "Boa flexao — traga mais o calcanhar!",
      angle: kneeAngle,
    })
  } else if (kneeAngle <= 130) {
    feedback.push({
      status: "warning",
      message: "Flexione mais! Amplitude incompleta",
      angle: kneeAngle,
      targetAngle: "<50°",
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase excentrica — controle a volta",
      angle: kneeAngle,
    })
  }

  // 2. Quadril — nao deve subir (lying curl) ou mover (seated)
  if (opts?.variant === "lying" || !opts?.variant) {
    if (isVisible(shoulder)) {
      const hipHeight = verticalDiff(hip, shoulder)
      // Se quadril sobe muito no lying curl (compensacao)
      if (hipHeight > 0.08) {
        feedback.push({
          status: "error",
          message: "Quadril subindo! Mantenha o quadril no pad",
        })
      } else {
        feedback.push({ status: "correct", message: "Quadril estavel no apoio" })
      }
    }
  } else if (opts?.variant === "seated") {
    if (isVisible(shoulder)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 15) {
        feedback.push({ status: "warning", message: "Mantenha o tronco apoiado no encosto" })
      } else {
        feedback.push({ status: "correct", message: "Tronco bem posicionado" })
      }
    }
  }

  // 3. Controle excentrico
  feedback.push({ status: "correct", message: "Controle a excentrica — 2-3s na volta" })

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO F: HIP ABDUCTION / ADDUCTION (Maquina)
// Tronco ereto, movimento controlado
// ══════════════════════════════════════════════════════════════════════════════

function analyzeHipAbduction(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const lHip = landmarks[L.LEFT_HIP]
  const rHip = landmarks[L.RIGHT_HIP]
  const lKnee = landmarks[L.LEFT_KNEE]
  const rKnee = landmarks[L.RIGHT_KNEE]
  const lShoulder = landmarks[L.LEFT_SHOULDER]
  const rShoulder = landmarks[L.RIGHT_SHOULDER]

  if (!isVisible(lHip) || !isVisible(rHip) || !isVisible(lKnee) || !isVisible(rKnee)) {
    return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
  }

  // 1. Abertura das pernas — distancia entre joelhos
  const kneeSpread = Math.abs(lKnee.x - rKnee.x)
  const hipWidth = Math.abs(lHip.x - rHip.x)
  const spreadRatio = kneeSpread / (hipWidth || 0.01)

  if (spreadRatio > 2.5) {
    feedback.push({
      status: "correct",
      message: "Boa abertura! Segure a contracao!",
    })
  } else if (spreadRatio > 1.5) {
    feedback.push({
      status: "correct",
      message: "Abrindo — empurre mais para fora!",
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase de retorno — controle a volta",
    })
  }

  // 2. Tronco ereto — nao inclinar para ajudar
  if (isVisible(lShoulder) && isVisible(rShoulder)) {
    const shoulderMid = midpoint(lShoulder, rShoulder)
    const hipMid = midpoint(lHip, rHip)
    const torsoTilt = Math.abs(shoulderMid.x - hipMid.x)
    if (torsoTilt > 0.06) {
      feedback.push({ status: "warning", message: "Tronco inclinando! Mantenha reto e centralizado" })
    } else {
      feedback.push({ status: "correct", message: "Tronco estavel e centralizado" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO G: CABLE EXERCISE (General cable movements)
// Postura, cotovelo fixo, controle do movimento
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCableExercise(
  landmarks: Point[],
  opts?: {
    variant?: "crossover" | "face_pull" | "woodchop" | "pull_through" | "crunch" | "general"
    isHighPulley?: boolean
    isLowPulley?: boolean
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, knee } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow)) {
    return [{ status: "warning", message: "Posicione-se para a camera ver o tronco e bracos" }]
  }

  if (opts?.variant === "crossover") {
    // Cable crossover: ombros nao devem protrair, squeeze no centro
    if (isVisible(wrist)) {
      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 120 && elbowAngle <= 160) {
        feedback.push({ status: "correct", message: "Arco controlado — foque na contracao!", angle: elbowAngle })
      } else if (elbowAngle < 120) {
        feedback.push({ status: "correct", message: "Squeeze! Segure a contracao!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Abrindo — controle a excentrica", angle: elbowAngle })
      }
    }
    // Tronco levemente inclinado
    if (isVisible(hip)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 30) {
        feedback.push({ status: "warning", message: "Tronco inclinando demais para frente", angle: torsoAngle })
      } else {
        feedback.push({ status: "correct", message: "Postura do tronco adequada" })
      }
    }
    return feedback
  }

  if (opts?.variant === "face_pull") {
    // Face pull: rotacao externa, cotovelos altos
    if (isVisible(wrist)) {
      // Maos devem ficar na altura do rosto ou acima
      const nose = landmarks[L.NOSE]
      if (isVisible(nose)) {
        if (wrist.y <= nose.y + 0.05) {
          feedback.push({ status: "correct", message: "Maos na altura correta — puxe ate o rosto!" })
        } else {
          feedback.push({ status: "warning", message: "Puxe mais alto — maos na altura do rosto" })
        }
      }
    }
    // Cotovelos devem ficar na altura dos ombros ou acima
    if (elbow.y <= shoulder.y + 0.03) {
      feedback.push({ status: "correct", message: "Cotovelos altos — rotacao externa otima!" })
    } else {
      feedback.push({ status: "warning", message: "Levante os cotovelos — na linha dos ombros" })
    }
    // Tronco ereto
    if (isVisible(hip)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 15) {
        feedback.push({ status: "warning", message: "Nao incline para tras — mantenha ereto" })
      }
    }
    return feedback
  }

  if (opts?.variant === "woodchop") {
    // Cable woodchop: rotacao do tronco controlada
    if (isVisible(hip)) {
      // Verificar que quadril roda junto (nao isolar apenas ombros)
      const hipToShoulder = horizontalDist(hip, shoulder)
      if (hipToShoulder > 0.15) {
        feedback.push({ status: "correct", message: "Boa rotacao! Rode tronco e quadril juntos" })
      } else {
        feedback.push({ status: "correct", message: "Fase de retorno — controle o movimento" })
      }
    }
    feedback.push({ status: "correct", message: "Bracos estendidos — forca vem do core!" })
    return feedback
  }

  if (opts?.variant === "pull_through") {
    // Cable pull-through: hip hinge com cabo
    if (isVisible(hip) && isVisible(knee)) {
      const hipAngle = calculateAngle(shoulder, hip, knee)
      if (hipAngle >= 160) {
        feedback.push({
          status: "correct",
          message: "Extensao completa do quadril! Aperte os gluteos!",
          angle: hipAngle,
        })
      } else if (hipAngle >= 90) {
        feedback.push({
          status: "correct",
          message: "Boa dobradica — empurre o quadril para frente!",
          angle: hipAngle,
        })
      } else {
        feedback.push({
          status: "warning",
          message: "Amplitude muito grande — mantenha coluna neutra",
          angle: hipAngle,
        })
      }
    }
    return feedback
  }

  if (opts?.variant === "crunch") {
    // Cable crunch: flexao da coluna controlada
    if (isVisible(hip)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle >= 40 && torsoAngle <= 70) {
        feedback.push({
          status: "correct",
          message: "Boa flexao do tronco! Contraia o abdomen!",
          angle: torsoAngle,
        })
      } else if (torsoAngle < 40) {
        feedback.push({ status: "warning", message: "Flexione mais o tronco!", angle: torsoAngle })
      } else {
        feedback.push({
          status: "correct",
          message: "Fase de retorno — controle a subida",
          angle: torsoAngle,
        })
      }
    }
    // Quadril deve ficar fixo
    feedback.push({ status: "correct", message: "Mantenha o quadril fixo — movimento so do tronco" })
    return feedback
  }

  // General cable exercise
  if (isVisible(wrist)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    feedback.push({
      status: "correct",
      message: "Controle o movimento — sem balanco!",
      angle: elbowAngle,
    })
  }

  if (isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 20) {
      feedback.push({ status: "warning", message: "Tronco instavel — mantenha postura fixa" })
    } else {
      feedback.push({ status: "correct", message: "Postura estavel" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO H: PEC DECK (Voador na maquina)
// Alinhamento do ombro, squeeze controlado
// ══════════════════════════════════════════════════════════════════════════════

function analyzePecDeck(
  landmarks: Point[],
  opts?: { reverse?: boolean },
): PostureFeedback[] {
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

  if (!isVisible(lShoulder) || !isVisible(rShoulder)) {
    return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
  }

  if (opts?.reverse) {
    // Reverse pec deck (rear delt)
    // Cotovelos devem ficar na altura dos ombros
    if (isVisible(lElbow) && isVisible(rElbow)) {
      const avgElbowY = (lElbow.y + rElbow.y) / 2
      const avgShoulderY = (lShoulder.y + rShoulder.y) / 2
      if (Math.abs(avgElbowY - avgShoulderY) > 0.06) {
        feedback.push({ status: "warning", message: "Cotovelos na altura dos ombros!" })
      } else {
        feedback.push({ status: "correct", message: "Cotovelos alinhados com os ombros!" })
      }
    }

    // Abertura dos bracos
    if (isVisible(lElbow) && isVisible(rElbow)) {
      const elbowSpread = Math.abs(lElbow.x - rElbow.x)
      const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x)
      if (elbowSpread > shoulderWidth * 2.0) {
        feedback.push({ status: "correct", message: "Abertura maxima! Contraia o deltoide posterior!" })
      } else if (elbowSpread > shoulderWidth * 1.3) {
        feedback.push({ status: "correct", message: "Abrindo — puxe mais para tras!" })
      } else {
        feedback.push({ status: "correct", message: "Fase de retorno — controle" })
      }
    }

    return feedback
  }

  // Pec deck normal (chest fly)
  // 1. Ombros nivelados
  const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y)
  if (shoulderTilt > 0.06) {
    feedback.push({ status: "warning", message: "Ombros desnivelados! Equilibre a forca" })
  } else {
    feedback.push({ status: "correct", message: "Ombros nivelados" })
  }

  // 2. Squeeze — bracos se aproximando no centro
  if (isVisible(lElbow) && isVisible(rElbow)) {
    const elbowDist = Math.abs(lElbow.x - rElbow.x)
    const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x)
    if (elbowDist < shoulderWidth * 0.5) {
      feedback.push({ status: "correct", message: "Squeeze perfeito! Segure a contracao!" })
    } else if (elbowDist < shoulderWidth * 1.0) {
      feedback.push({ status: "correct", message: "Unindo — aperte o peitoral!" })
    } else {
      feedback.push({ status: "correct", message: "Abrindo — controle a excentrica, sinta o alongamento" })
    }
  }

  // 3. Costas apoiadas
  if (isVisible(lHip) && isVisible(rHip)) {
    const hipMid = midpoint(lHip, rHip)
    const shoulderMid = midpoint(lShoulder, rShoulder)
    if (Math.abs(shoulderMid.x - hipMid.x) > 0.08) {
      feedback.push({ status: "warning", message: "Costas saindo do encosto! Apoie-se bem" })
    } else {
      feedback.push({ status: "correct", message: "Costas bem apoiadas" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO I: CALF RAISE (Variantes sentado, smith, leg press)
// Full ROM (stretch to peak), posicao do joelho
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCalfRaise(
  landmarks: Point[],
  opts?: { seated?: boolean },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_ANKLE, L.RIGHT_ANKLE)
  const { knee, ankle, hip, shoulder } = getSideLandmarks(landmarks, side)
  const footIdx = side === "left" ? landmarks[L.LEFT_FOOT_INDEX] : landmarks[L.RIGHT_FOOT_INDEX]

  if (!isVisible(knee) || !isVisible(ankle)) {
    return [{ status: "warning", message: "Posicione a camera de lado para ver pernas e pes" }]
  }

  // 1. Ankle/foot ROM
  if (isVisible(footIdx)) {
    const ankleAngle = calculateAngle(knee, ankle, footIdx)
    if (ankleAngle <= 130) {
      feedback.push({
        status: "correct",
        message: "Extensao maxima! Segure no topo 2s!",
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
        message: "Alongue bem na descida — ROM completo!",
        angle: ankleAngle,
      })
    }
  }

  // 2. Seated: joelhos flexionados a ~90°, Standing: joelhos estendidos
  if (opts?.seated) {
    if (isVisible(hip)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 80 && kneeAngle <= 100) {
        feedback.push({ status: "correct", message: "Posicao sentada correta — soleo ativado!" })
      } else {
        feedback.push({ status: "warning", message: "Ajuste a posicao — joelhos a 90°" })
      }
    }
  } else {
    if (isVisible(hip)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle < 160) {
        feedback.push({ status: "warning", message: "Mantenha os joelhos estendidos!", angle: kneeAngle })
      } else {
        feedback.push({ status: "correct", message: "Joelhos estendidos — gastrocnemio ativado!" })
      }
    }
  }

  // 3. Tronco ereto (standing variations)
  if (!opts?.seated && isVisible(shoulder) && isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 10) {
      feedback.push({ status: "warning", message: "Mantenha o tronco reto" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO J: HIP THRUST (Variantes — Smith, single-leg, banded)
// Extensao do quadril, posicao das costas, angulo do joelho
// ══════════════════════════════════════════════════════════════════════════════

function analyzeHipThrust(
  landmarks: Point[],
  opts?: { singleLeg?: boolean },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_HIP, L.RIGHT_HIP)
  const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(knee)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Hip extension
  const hipAngle = calculateAngle(shoulder, hip, knee)
  if (hipAngle >= 165) {
    feedback.push({
      status: "correct",
      message: "Extensao completa! Aperte os gluteos no topo!",
      angle: hipAngle,
      targetAngle: "170-180°",
    })
  } else if (hipAngle >= 145) {
    feedback.push({
      status: "warning",
      message: "Suba mais o quadril!",
      angle: hipAngle,
      targetAngle: "170-180°",
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase excentrica — controle a descida",
      angle: hipAngle,
    })
  }

  // 2. Knee angle — ~90° no topo para maximo gluteo
  if (isVisible(ankle)) {
    const kneeAngle = calculateAngle(hip, knee, ankle)
    if (kneeAngle >= 80 && kneeAngle <= 100) {
      feedback.push({
        status: "correct",
        message: "Joelho a 90° — otimo para gluteo maximo!",
        angle: kneeAngle,
        targetAngle: "85-95°",
      })
    } else if (kneeAngle < 80) {
      feedback.push({ status: "warning", message: "Pes muito proximos — afaste um pouco" })
    } else {
      feedback.push({ status: "warning", message: "Pes muito distantes — aproxime" })
    }
  }

  // 3. Nao hiperestender a lombar
  if (hipAngle > 185) {
    feedback.push({ status: "error", message: "Hiperestensao lombar! Pare no alinhamento" })
  }

  // 4. Upper back position — apoiado no banco
  if (shoulder.y < hip.y - 0.05 && hipAngle > 150) {
    feedback.push({ status: "correct", message: "Costas bem apoiadas no banco" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO K: SHRUG (Encolhimento)
// Caminho vertical, sem rotacao, elevacao do ombro
// ══════════════════════════════════════════════════════════════════════════════

function analyzeShrug(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const lShoulder = landmarks[L.LEFT_SHOULDER]
  const rShoulder = landmarks[L.RIGHT_SHOULDER]
  const lEar = landmarks[L.LEFT_EAR]
  const rEar = landmarks[L.RIGHT_EAR]
  const lHip = landmarks[L.LEFT_HIP]
  const rHip = landmarks[L.RIGHT_HIP]

  if (!isVisible(lShoulder) || !isVisible(rShoulder)) {
    return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
  }

  // 1. Shoulder elevation — ombros devem subir em direcao as orelhas
  if (isVisible(lEar) && isVisible(rEar)) {
    const lShoulderToEar = Math.abs(lShoulder.y - lEar.y)
    const rShoulderToEar = Math.abs(rShoulder.y - rEar.y)
    const avgDist = (lShoulderToEar + rShoulderToEar) / 2

    if (avgDist < 0.08) {
      feedback.push({
        status: "correct",
        message: "Elevacao maxima! Segure 1-2 segundos!",
      })
    } else if (avgDist < 0.12) {
      feedback.push({
        status: "warning",
        message: "Suba mais! Ombros em direcao as orelhas",
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase de descida — controle a excentrica",
      })
    }
  }

  // 2. Simetria — ambos ombros devem subir por igual
  const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y)
  if (shoulderTilt > 0.04) {
    feedback.push({ status: "warning", message: "Ombros desiguais! Suba por igual" })
  } else {
    feedback.push({ status: "correct", message: "Simetria dos ombros — otimo!" })
  }

  // 3. Sem rotacao — ombros nao devem rodar
  if (isVisible(lHip) && isVisible(rHip)) {
    const shoulderMid = midpoint(lShoulder, rShoulder)
    const hipMid = midpoint(lHip, rHip)
    if (Math.abs(shoulderMid.x - hipMid.x) > 0.06) {
      feedback.push({ status: "warning", message: "Sem rotacao! Suba reto, na vertical" })
    } else {
      feedback.push({ status: "correct", message: "Caminho vertical correto" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO L: KICKBACK (Triceps kickback / Glute kickback)
// Upper arm fixo, extensao do cotovelo / extensao do quadril
// ══════════════════════════════════════════════════════════════════════════════

function analyzeKickback(
  landmarks: Point[],
  opts?: { isGlute?: boolean },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (opts?.isGlute) {
    // Glute kickback (cable)
    if (!isVisible(hip) || !isVisible(knee)) {
      return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
    }

    // Hip extension
    if (isVisible(shoulder)) {
      const hipAngle = calculateAngle(shoulder, hip, knee)
      if (hipAngle >= 170) {
        feedback.push({
          status: "correct",
          message: "Extensao maxima do quadril! Aperte o gluteo!",
          angle: hipAngle,
        })
      } else if (hipAngle >= 140) {
        feedback.push({
          status: "correct",
          message: "Levando a perna para tras — estenda mais!",
          angle: hipAngle,
        })
      } else {
        feedback.push({
          status: "correct",
          message: "Fase de retorno — controle",
          angle: hipAngle,
        })
      }
    }

    // Tronco estavel
    if (isVisible(shoulder) && isVisible(hip)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 25) {
        feedback.push({ status: "warning", message: "Tronco instavel — mantenha firme" })
      } else {
        feedback.push({ status: "correct", message: "Tronco estavel" })
      }
    }

    return feedback
  }

  // Triceps kickback
  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera ver o braco" }]
  }

  // 1. Elbow extension
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle >= 160) {
    feedback.push({
      status: "correct",
      message: "Extensao completa! Aperte o triceps!",
      angle: elbowAngle,
      targetAngle: ">160°",
    })
  } else if (elbowAngle >= 120) {
    feedback.push({
      status: "warning",
      message: "Estenda mais — quase la!",
      angle: elbowAngle,
    })
  } else {
    feedback.push({
      status: "correct",
      message: "Fase de retorno — controle",
      angle: elbowAngle,
    })
  }

  // 2. Upper arm fixo — paralelo ao corpo
  if (Math.abs(shoulder.y - elbow.y) > 0.08) {
    feedback.push({ status: "warning", message: "Mantenha o braco superior paralelo ao tronco" })
  } else {
    feedback.push({ status: "correct", message: "Braco superior fixo — isolamento perfeito!" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO M: CARDIO (Esteira, Bike, Eliptico, Remo, Pular Corda)
// Postura ereta, forma da passada
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCardio(
  landmarks: Point[],
  opts?: {
    variant?: "treadmill_run" | "treadmill_walk" | "bike" | "elliptical" | "rowing" | "jump_rope" | "stair_climber"
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, hip, knee, ankle, elbow } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip)) {
    return [{ status: "warning", message: "Posicione a camera de lado, corpo inteiro visivel" }]
  }

  if (opts?.variant === "rowing") {
    // Rowing machine: hip hinge + pull
    if (isVisible(knee) && isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 160) {
        // Legs extended = drive phase complete
        feedback.push({ status: "correct", message: "Pernas estendidas — agora puxe com as costas!", angle: kneeAngle })
      } else if (kneeAngle >= 90) {
        feedback.push({ status: "correct", message: "Fase de drive — empurre com as pernas!", angle: kneeAngle })
      } else {
        feedback.push({ status: "correct", message: "Fase de recuperacao — deslize para frente", angle: kneeAngle })
      }
    }
    // Coluna
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 40) {
      feedback.push({ status: "warning", message: "Costas arredondando! Mantenha coluna neutra", angle: torsoAngle })
    } else {
      feedback.push({ status: "correct", message: "Coluna em boa posicao" })
    }
    return feedback
  }

  if (opts?.variant === "bike") {
    // Stationary bike
    if (isVisible(knee) && isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 140 && kneeAngle <= 170) {
        feedback.push({ status: "correct", message: "Extensao da perna adequada! Altura do banco correta", angle: kneeAngle })
      } else if (kneeAngle < 140) {
        feedback.push({ status: "correct", message: "Fase de subida — pedale com forca!", angle: kneeAngle })
      } else {
        feedback.push({ status: "warning", message: "Banco pode estar alto demais — joelho quase travando", angle: kneeAngle })
      }
    }
    // Postura
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 50) {
      feedback.push({ status: "warning", message: "Muito curvado — relaxe os ombros", angle: torsoAngle })
    } else {
      feedback.push({ status: "correct", message: "Postura adequada na bike" })
    }
    return feedback
  }

  if (opts?.variant === "jump_rope") {
    // Pular corda: postura ereta, cotovelos grudados
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 15) {
      feedback.push({ status: "warning", message: "Mantenha o tronco reto!", angle: torsoAngle })
    } else {
      feedback.push({ status: "correct", message: "Postura ereta — otimo!" })
    }
    if (isVisible(elbow)) {
      if (horizontalDist(elbow, hip) > 0.12) {
        feedback.push({ status: "warning", message: "Cotovelos junto ao corpo! Gire so os pulsos" })
      } else {
        feedback.push({ status: "correct", message: "Cotovelos proximos — tecnica correta!" })
      }
    }
    return feedback
  }

  // Treadmill run/walk, elliptical, stair climber: postura vertical
  const vertRef: Point = { x: hip.x, y: hip.y - 1 }
  const torsoAngle = calculateAngle(shoulder, hip, vertRef)

  if (torsoAngle > 25) {
    feedback.push({
      status: "warning",
      message: "Corpo inclinando demais! Mantenha-se ereto",
      angle: torsoAngle,
    })
  } else if (torsoAngle > 12) {
    feedback.push({
      status: "correct",
      message: opts?.variant === "treadmill_walk"
        ? "Leve inclinacao — ok para caminhada inclinada"
        : "Postura aceitavel — tente ficar mais ereto",
      angle: torsoAngle,
    })
  } else {
    feedback.push({ status: "correct", message: "Postura excelente!", angle: torsoAngle })
  }

  // Stride check (run/walk)
  if (
    (opts?.variant === "treadmill_run" || opts?.variant === "treadmill_walk" || opts?.variant === "elliptical" || opts?.variant === "stair_climber") &&
    isVisible(knee)
  ) {
    // Joelho nao deve ultrapassar excessivamente o tornozelo na aterrissagem
    if (isVisible(ankle) && knee.x > ankle.x + 0.1) {
      feedback.push({ status: "warning", message: "Passada muito longa — encurte o passo" })
    }
  }

  // Head position
  const nose = landmarks[L.NOSE]
  if (isVisible(nose) && isVisible(shoulder)) {
    if (nose.y > shoulder.y + 0.03) {
      feedback.push({ status: "warning", message: "Olhe para frente, nao para baixo!" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO N: STRETCH (Alongamentos)
// Posicao correta mantida
// ══════════════════════════════════════════════════════════════════════════════

function analyzeStretch(
  landmarks: Point[],
  opts?: {
    variant?: "hip_flexor" | "hamstring" | "chest" | "lat" | "quad" | "calf" | "shoulder" | "cat_cow" | "foam_roll" | "general"
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (opts?.variant === "hip_flexor") {
    // Avanço com extensao do quadril
    if (isVisible(shoulder) && isVisible(hip) && isVisible(knee)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle <= 15) {
        feedback.push({ status: "correct", message: "Tronco ereto — otimo alongamento do flexor!" })
      } else {
        feedback.push({ status: "warning", message: "Mantenha o tronco mais ereto" })
      }
      feedback.push({ status: "correct", message: "Empurre o quadril para frente — sinta o alongamento" })
    }
    return feedback
  }

  if (opts?.variant === "hamstring") {
    // Flexao do quadril com perna estendida
    if (isVisible(hip) && isVisible(knee) && isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 155) {
        feedback.push({ status: "correct", message: "Perna estendida — otimo alongamento!" })
      } else {
        feedback.push({ status: "warning", message: "Tente estender mais a perna" })
      }
    }
    if (isVisible(shoulder) && isVisible(hip)) {
      const hipAngle = calculateAngle(shoulder, hip, knee)
      if (hipAngle <= 120) {
        feedback.push({ status: "correct", message: "Boa amplitude do alongamento!" })
      } else {
        feedback.push({ status: "warning", message: "Incline mais o tronco — mantenha costas retas" })
      }
    }
    return feedback
  }

  if (opts?.variant === "chest") {
    // Alongamento peitoral (braco estendido contra parede)
    if (isVisible(shoulder) && isVisible(elbow) && isVisible(wrist)) {
      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 150) {
        feedback.push({ status: "correct", message: "Braco estendido — otimo alongamento peitoral!" })
      } else {
        feedback.push({ status: "correct", message: "Mantenha a posicao — respire profundamente" })
      }
    }
    feedback.push({ status: "correct", message: "Segure 20-30 segundos" })
    return feedback
  }

  if (opts?.variant === "lat") {
    // Lat stretch (braco acima da cabeca, inclinacao lateral)
    if (isVisible(shoulder) && isVisible(hip)) {
      const lateralTilt = horizontalDist(shoulder, hip)
      if (lateralTilt > 0.08) {
        feedback.push({ status: "correct", message: "Boa inclinacao lateral — sinta o latissimo alongar!" })
      } else {
        feedback.push({ status: "warning", message: "Incline mais para o lado" })
      }
    }
    feedback.push({ status: "correct", message: "Segure 20-30 segundos" })
    return feedback
  }

  if (opts?.variant === "quad") {
    // Quad stretch (puxar calcanhar atras)
    if (isVisible(hip) && isVisible(knee) && isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle <= 50) {
        feedback.push({ status: "correct", message: "Otimo alongamento do quadriceps!" })
      } else if (kneeAngle <= 90) {
        feedback.push({ status: "correct", message: "Puxe mais o calcanhar — aumente a amplitude" })
      } else {
        feedback.push({ status: "warning", message: "Flexione mais o joelho — puxe o pe" })
      }
    }
    // Postura
    if (isVisible(shoulder) && isVisible(hip)) {
      const vertRef: Point = { x: hip.x, y: hip.y - 1 }
      const torsoAngle = calculateAngle(shoulder, hip, vertRef)
      if (torsoAngle > 15) {
        feedback.push({ status: "warning", message: "Mantenha-se ereto durante o alongamento" })
      }
    }
    return feedback
  }

  if (opts?.variant === "calf") {
    // Calf stretch (passo para frente, calcanhar atras no chao)
    if (isVisible(hip) && isVisible(knee) && isVisible(ankle)) {
      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 150) {
        feedback.push({ status: "correct", message: "Perna de tras estendida — otimo alongamento!" })
      } else {
        feedback.push({ status: "warning", message: "Estenda mais a perna de tras" })
      }
    }
    feedback.push({ status: "correct", message: "Calcanhar de tras firme no chao" })
    return feedback
  }

  if (opts?.variant === "shoulder") {
    // Shoulder stretches (dislocate, banded)
    if (isVisible(shoulder) && isVisible(elbow) && isVisible(wrist)) {
      const armHeight = verticalDiff(shoulder, wrist)
      if (armHeight > 0.1) {
        feedback.push({ status: "correct", message: "Bracos em boa posicao — sinta o ombro alongar" })
      }
    }
    feedback.push({ status: "correct", message: "Movimento lento e controlado — sem forcar" })
    return feedback
  }

  if (opts?.variant === "cat_cow") {
    // Cat-cow: flexao/extensao da coluna
    if (isVisible(shoulder) && isVisible(hip) && isVisible(knee)) {
      const bodyAngle = calculateAngle(shoulder, hip, knee)
      if (bodyAngle >= 165) {
        feedback.push({ status: "correct", message: "Posicao neutra — respire" })
      } else if (shoulder.y > hip.y) {
        feedback.push({ status: "correct", message: "Cat — arredonde as costas, contraia o abdomen!" })
      } else {
        feedback.push({ status: "correct", message: "Cow — estenda a coluna, peito para baixo!" })
      }
    }
    feedback.push({ status: "correct", message: "Alterne lentamente entre as posicoes" })
    return feedback
  }

  if (opts?.variant === "foam_roll") {
    feedback.push({ status: "correct", message: "Role lentamente sobre o ponto de tensao" })
    feedback.push({ status: "correct", message: "Quando achar um ponto sensivel, pare 20-30 segundos" })
    return feedback
  }

  // General stretch
  if (isVisible(shoulder) && isVisible(hip)) {
    feedback.push({ status: "correct", message: "Mantenha a posicao — respire profundamente" })
    feedback.push({ status: "correct", message: "Segure 20-30 segundos, sem balanco" })
  } else {
    feedback.push({ status: "warning", message: "Posicione-se para a camera ver seu corpo" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO O: BENCH PRESS (Supino — reto, inclinado, declinado com barra/halter)
// Ponto de contato, caminho da barra, cotovelo a ~45°
// ══════════════════════════════════════════════════════════════════════════════

function analyzeBenchPress(
  landmarks: Point[],
  opts?: {
    incline?: boolean
    decline?: boolean
    isFly?: boolean
    label?: string
  },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera ver braco e tronco" }]
  }

  // 1. Elbow angle — ROM
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)

  if (opts?.isFly) {
    // Fly: arco controlado, cotovelo levemente flexionado
    if (elbowAngle >= 130 && elbowAngle <= 165) {
      feedback.push({
        status: "correct",
        message: "Arco do braco perfeito — controle a abertura!",
        angle: elbowAngle,
        targetAngle: "130-160°",
      })
    } else if (elbowAngle < 130) {
      feedback.push({
        status: "warning",
        message: "Cotovelo flexionando demais — mantenha o arco",
        angle: elbowAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Squeeze! Junte as maos no topo!",
        angle: elbowAngle,
      })
    }
  } else {
    // Press normal
    if (elbowAngle >= 165) {
      feedback.push({
        status: "correct",
        message: "Lockout! Bracos estendidos!",
        angle: elbowAngle,
        targetAngle: ">165°",
      })
    } else if (elbowAngle >= 100) {
      feedback.push({
        status: "correct",
        message: "Empurre ate extensao total!",
        angle: elbowAngle,
      })
    } else if (elbowAngle >= 70) {
      feedback.push({
        status: "correct",
        message: "Boa profundidade — empurre agora!",
        angle: elbowAngle,
        targetAngle: "75-90°",
      })
    } else {
      feedback.push({
        status: "warning",
        message: "Muito profundo — risco para o ombro!",
        angle: elbowAngle,
      })
    }
  }

  // 2. Cotovelo nao deve abrir excessivamente (shoulder impingement)
  if (isVisible(hip)) {
    const elbowToShoulder = verticalDiff(elbow, shoulder)
    if (elbowToShoulder > 0.06) {
      feedback.push({ status: "warning", message: "Cotovelos muito abertos — traga a ~45° do corpo" })
    } else {
      feedback.push({ status: "correct", message: "Angulo dos cotovelos seguro" })
    }
  }

  // 3. Wrist alignment — pulso sobre o cotovelo (bar path)
  if (!opts?.isFly) {
    const wristElbowDist = horizontalDist(wrist, elbow)
    if (wristElbowDist > 0.08) {
      feedback.push({ status: "warning", message: "Pulso desalinhado — barra na vertical sobre o cotovelo" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO P: PULL-UP / CHIN-UP
// Retracao escapular, profundidade da puxada, corpo estavel
// ══════════════════════════════════════════════════════════════════════════════

function analyzePullUp(
  landmarks: Point[],
  opts?: { grip?: "wide" | "close" | "neutral" | "chin" },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip, knee, ankle } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow)) {
    return [{ status: "warning", message: "Posicione a camera de frente ou levemente angulada" }]
  }

  // 1. Elbow angle — puxada
  if (isVisible(wrist)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    if (elbowAngle <= 70) {
      feedback.push({
        status: "correct",
        message: "Queixo acima da barra! Contracao maxima!",
        angle: elbowAngle,
        targetAngle: "<70°",
      })
    } else if (elbowAngle <= 110) {
      feedback.push({
        status: "correct",
        message: "Puxando bem — suba mais!",
        angle: elbowAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase de descida — controle!",
        angle: elbowAngle,
      })
    }
  }

  // 2. Corpo nao deve balançar (kipping)
  if (isVisible(hip) && isVisible(ankle)) {
    const bodyAngle = calculateAngle(shoulder, hip, ankle)
    if (bodyAngle < 155) {
      feedback.push({ status: "warning", message: "Corpo balancando! Contraia core — sem kipping" })
    } else {
      feedback.push({ status: "correct", message: "Corpo estavel — excelente forma!" })
    }
  }

  // 3. Full ROM — extensao completa na descida (dead hang)
  if (isVisible(wrist)) {
    const elbowAngle = calculateAngle(shoulder, elbow, wrist)
    if (elbowAngle >= 160) {
      feedback.push({ status: "correct", message: "Dead hang completo — boa amplitude!" })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO Q: CRUNCH / SIT-UP (Abdominais no chao e banco)
// Flexao da coluna, sem puxar o pescoco
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCrunch(
  landmarks: Point[],
  opts?: { isHanging?: boolean; isBicycle?: boolean; isDecline?: boolean },
): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  if (opts?.isHanging) {
    // Hanging leg/knee raise
    const side = bestSide(landmarks, L.LEFT_HIP, L.RIGHT_HIP)
    const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

    if (!isVisible(shoulder) || !isVisible(hip)) {
      return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
    }

    // Angulo do quadril
    const hipAngle = calculateAngle(shoulder, hip, knee ?? hip)
    if (isVisible(knee)) {
      if (hipAngle <= 90) {
        feedback.push({
          status: "correct",
          message: "Pernas acima de 90° — contracao maxima do core!",
          angle: hipAngle,
        })
      } else if (hipAngle <= 120) {
        feedback.push({
          status: "correct",
          message: "Subindo — continue elevando!",
          angle: hipAngle,
        })
      } else {
        feedback.push({
          status: "correct",
          message: "Fase de descida — controle!",
          angle: hipAngle,
        })
      }
    }

    // Sem balanco
    feedback.push({ status: "correct", message: "Sem balanco — contraia o abdomen antes de subir!" })
    return feedback
  }

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, hip, knee } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(hip)) {
    return [{ status: "warning", message: "Posicione a camera de lado" }]
  }

  // Angulo do tronco
  if (isVisible(knee)) {
    const torsoAngle = calculateAngle(shoulder, hip, knee)
    if (torsoAngle <= 100) {
      feedback.push({
        status: "correct",
        message: "Boa flexao do tronco — contraia o abdomen!",
        angle: torsoAngle,
      })
    } else if (torsoAngle <= 140) {
      feedback.push({
        status: "correct",
        message: "Subindo — continue contraindo!",
        angle: torsoAngle,
      })
    } else {
      feedback.push({
        status: "correct",
        message: "Fase excentrica — controle a descida",
        angle: torsoAngle,
      })
    }
  }

  // Pescoco — nao puxar com as maos
  const nose = landmarks[L.NOSE]
  if (isVisible(nose) && isVisible(shoulder)) {
    const noseToShoulder = verticalDiff(nose, shoulder)
    if (noseToShoulder < -0.12) {
      feedback.push({ status: "warning", message: "Nao puxe o pescoco! Olhe para o teto" })
    }
  }

  if (opts?.isBicycle) {
    feedback.push({ status: "correct", message: "Rode os ombros — cotovelo ao joelho oposto!" })
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO R: UPRIGHT ROW
// Puxar ate altura dos ombros, cotovelos acima das maos
// ══════════════════════════════════════════════════════════════════════════════

function analyzeUprightRow(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
  }

  // 1. Elbow height — cotovelos devem subir acima dos ombros? Nao! Risco de impingement
  // Ideal: cotovelos na altura dos ombros ou levemente abaixo
  const elbowVsShoulder = verticalDiff(elbow, shoulder)
  if (elbowVsShoulder < -0.03 && elbowVsShoulder > -0.08) {
    feedback.push({ status: "correct", message: "Cotovelos na altura dos ombros — perfeito!" })
  } else if (elbowVsShoulder <= -0.08) {
    feedback.push({ status: "warning", message: "Cotovelos muito altos — risco de impingement! Pare na linha do ombro" })
  } else if (elbowVsShoulder > 0.03) {
    feedback.push({ status: "correct", message: "Subindo — continue ate a linha do ombro" })
  } else {
    feedback.push({ status: "correct", message: "Quase la — continue subindo!" })
  }

  // 2. Cotovelos acima das maos
  if (elbow.y < wrist.y) {
    feedback.push({ status: "correct", message: "Cotovelos acima das maos — tecnica correta!" })
  } else {
    feedback.push({ status: "warning", message: "Cotovelos devem ficar acima das maos" })
  }

  // 3. Tronco ereto
  if (isVisible(hip)) {
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 10) {
      feedback.push({ status: "warning", message: "Corpo balancando — mantenha ereto!", angle: torsoAngle })
    }
  }

  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRAO S: STRAIGHT ARM PULLDOWN (Pullover de Braco Reto)
// Bracos estendidos, movimento controlado
// ══════════════════════════════════════════════════════════════════════════════

function analyzeStraightArmPulldown(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const L = LANDMARKS

  const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
  const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
  }

  // 1. Elbow angle — bracos devem ficar quase estendidos
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  if (elbowAngle >= 150) {
    feedback.push({ status: "correct", message: "Bracos estendidos — tecnica correta!", angle: elbowAngle })
  } else if (elbowAngle >= 120) {
    feedback.push({ status: "warning", message: "Estenda mais os bracos — mantenha quase retos", angle: elbowAngle })
  } else {
    feedback.push({ status: "error", message: "Bracos muito flexionados — mantenha estendidos!", angle: elbowAngle })
  }

  // 2. ROM — bracos devem ir de cima ate as coxas
  if (isVisible(hip)) {
    const wristVsHip = verticalDiff(wrist, hip)
    if (wristVsHip > 0) {
      feedback.push({ status: "correct", message: "Maos nas coxas — contracao maxima do latissimo!" })
    } else {
      feedback.push({ status: "correct", message: "Puxando para baixo — controle!" })
    }

    // Tronco levemente inclinado
    const vertRef: Point = { x: hip.x, y: hip.y - 1 }
    const torsoAngle = calculateAngle(shoulder, hip, vertRef)
    if (torsoAngle > 30) {
      feedback.push({ status: "warning", message: "Tronco inclinando demais!", angle: torsoAngle })
    }
  }

  return feedback
}


// ══════════════════════════════════════════════════════════════════════════════
// DEFINICAO DE TODOS OS EXERCICIOS ESTENDIDOS
// ══════════════════════════════════════════════════════════════════════════════

export const EXTENDED_EXERCISE_RULES: ExerciseRule[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PEITO (CHEST) — ~15 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "incline-barbell-bench-press",
    name: "Supino Inclinado com Barra",
    nameEn: "Incline Barbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco inclinado a 30-45°",
    analyze: (lm) => analyzeBenchPress(lm, { incline: true }),
  },
  {
    id: "decline-barbell-bench-press",
    name: "Supino Declinado com Barra",
    nameEn: "Decline Barbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco declinado",
    analyze: (lm) => analyzeBenchPress(lm, { decline: true }),
  },
  {
    id: "flat-dumbbell-bench-press",
    name: "Supino Reto com Halteres",
    nameEn: "Flat Dumbbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no banco reto",
    analyze: (lm) => analyzeBenchPress(lm),
  },
  {
    id: "incline-dumbbell-bench-press",
    name: "Supino Inclinado com Halteres",
    nameEn: "Incline Dumbbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco inclinado a 30-45°",
    analyze: (lm) => analyzeBenchPress(lm, { incline: true }),
  },
  {
    id: "decline-dumbbell-bench-press",
    name: "Supino Declinado com Halteres",
    nameEn: "Decline Dumbbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco declinado",
    analyze: (lm) => analyzeBenchPress(lm, { decline: true }),
  },
  {
    id: "dumbbell-fly",
    name: "Crucifixo com Halteres",
    nameEn: "Dumbbell Fly",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, bracos abertos em arco",
    analyze: (lm) => analyzeBenchPress(lm, { isFly: true }),
  },
  {
    id: "incline-dumbbell-fly",
    name: "Crucifixo Inclinado",
    nameEn: "Incline Dumbbell Fly",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco inclinado, bracos em arco",
    analyze: (lm) => analyzeBenchPress(lm, { incline: true, isFly: true }),
  },
  {
    id: "decline-dumbbell-fly",
    name: "Crucifixo Declinado",
    nameEn: "Decline Dumbbell Fly",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, banco declinado, bracos em arco",
    analyze: (lm) => analyzeBenchPress(lm, { decline: true, isFly: true }),
  },
  {
    id: "cable-crossover",
    name: "Crossover de Cabos",
    nameEn: "Cable Crossover",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, entre os cabos",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crossover", isHighPulley: true }),
  },
  {
    id: "low-cable-crossover",
    name: "Crossover Baixo",
    nameEn: "Low Cable Crossover",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, polias na posicao baixa",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crossover", isLowPulley: true }),
  },
  {
    id: "machine-chest-press",
    name: "Supino na Maquina",
    nameEn: "Machine Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado ou levemente angulado, costas apoiadas",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "pec-deck-fly",
    name: "Voador (Pec Deck)",
    nameEn: "Pec Deck Fly",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, sentado na maquina",
    analyze: (lm) => analyzePecDeck(lm),
  },
  {
    id: "svend-press",
    name: "Svend Press",
    nameEn: "Svend Press",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, anilha nas maos a altura do peito",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 150) {
        feedback.push({ status: "correct", message: "Bracos estendidos — aperte a anilha!", angle: elbowAngle })
      } else if (elbowAngle >= 90) {
        feedback.push({ status: "correct", message: "Empurre para frente — aperte o peitoral!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Retornando — mantenha a tensao na anilha" })
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 10) {
          feedback.push({ status: "warning", message: "Mantenha o tronco reto" })
        }
      }
      return feedback
    },
  },
  {
    id: "cable-chest-press",
    name: "Supino no Cabo",
    nameEn: "Cable Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, um passo a frente dos cabos",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "landmine-press",
    name: "Landmine Press",
    nameEn: "Landmine Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, barra ancorada no chao",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 155) {
        feedback.push({ status: "correct", message: "Extensao completa!", angle: elbowAngle })
      } else if (elbowAngle >= 90) {
        feedback.push({ status: "correct", message: "Empurre a barra para cima e frente!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Fase excentrica — controle a descida", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 20) {
          feedback.push({ status: "warning", message: "Mantenha o tronco estavel" })
        } else {
          feedback.push({ status: "correct", message: "Tronco estavel" })
        }
      }
      return feedback
    },
  },

  // ═══ HAMMER STRENGTH ISO-LATERAL CHEST PRESS ═══
  {
    id: "hammer-iso-chest-press-flat",
    name: "Hammer Strength Supino Reto",
    nameEn: "Hammer Strength Iso-Lateral Chest Press (Flat)",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas contra o encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "hammer-iso-chest-press-incline",
    name: "Hammer Strength Supino Inclinado",
    nameEn: "Hammer Strength Iso-Lateral Chest Press (Incline)",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas contra o encosto inclinado",
    analyze: (lm) => analyzeMachinePress(lm, { incline: true }),
  },
  {
    id: "hammer-iso-chest-press-decline",
    name: "Hammer Strength Supino Declinado",
    nameEn: "Hammer Strength Iso-Lateral Chest Press (Decline)",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas contra o encosto declinado",
    analyze: (lm) => analyzeMachinePress(lm, { decline: true }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COSTAS (BACK) — ~14 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "close-grip-lat-pulldown",
    name: "Pulley Pegada Fechada",
    nameEn: "Close-Grip Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado no pulley, pegada fechada",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "reverse-grip-lat-pulldown",
    name: "Pulley Pegada Supinada",
    nameEn: "Reverse-Grip Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado no pulley, palmas para voce",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "wide-grip-lat-pulldown",
    name: "Pulley Frente Aberto",
    nameEn: "Wide-Grip Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado no pulley, pegada aberta",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "seated-cable-row",
    name: "Remada Sentada no Cabo",
    nameEn: "Seated Cable Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, peito erguido",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },
  {
    id: "machine-row",
    name: "Remada na Maquina",
    nameEn: "Machine Row (Hammer Strength)",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito apoiado no pad",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },
  {
    id: "cable-face-pull",
    name: "Face Pull no Cabo",
    nameEn: "Cable Face Pull",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado ou levemente angulado, corda na altura do rosto",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "face_pull" }),
  },
  {
    id: "pull-up",
    name: "Barra Fixa (Pull-Up)",
    nameEn: "Pull-Up",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, pegada pronada aberta",
    analyze: (lm) => analyzePullUp(lm, { grip: "wide" }),
  },
  {
    id: "chin-up",
    name: "Barra Fixa Supinada (Chin-Up)",
    nameEn: "Chin-Up",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, pegada supinada (palmas para voce)",
    analyze: (lm) => analyzePullUp(lm, { grip: "chin" }),
  },
  {
    id: "neutral-grip-pull-up",
    name: "Barra Fixa Neutra",
    nameEn: "Neutral-Grip Pull-Up",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, pegada neutra (palmas uma pra outra)",
    analyze: (lm) => analyzePullUp(lm, { grip: "neutral" }),
  },
  {
    id: "inverted-row",
    name: "Remada Invertida",
    nameEn: "Inverted Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, corpo reto, puxe ate o peito na barra",
    analyze: (lm) => analyzeMachinePull(lm, { isInvertedRow: true }),
  },
  {
    id: "straight-arm-pulldown",
    name: "Pulldown Braco Reto",
    nameEn: "Straight-Arm Pulldown",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, bracos estendidos no cabo",
    analyze: (lm) => analyzeStraightArmPulldown(lm),
  },
  {
    id: "chest-supported-row",
    name: "Remada com Apoio no Peito",
    nameEn: "Chest-Supported Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito apoiado no banco inclinado",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },

  // ═══ HAMMER STRENGTH ISO-LATERAL ROW ═══
  {
    id: "hammer-iso-row",
    name: "Hammer Strength Remada Iso-Lateral",
    nameEn: "Hammer Strength Iso-Lateral Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito apoiado no pad da maquina",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },

  // ═══ NAUTILUS LAT PULLDOWN ═══
  {
    id: "nautilus-lat-pulldown",
    name: "Nautilus Pulley",
    nameEn: "Nautilus Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, coxas travadas no apoio",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OMBROS (SHOULDERS) — ~12 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "machine-shoulder-press",
    name: "Desenvolvimento na Maquina",
    nameEn: "Machine Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, costas apoiadas",
    analyze: (lm) => analyzeMachinePress(lm, { isShoulderPress: true }),
  },
  {
    id: "hammer-iso-shoulder-press",
    name: "Hammer Strength Desenvolvimento",
    nameEn: "Hammer Strength Iso-Lateral Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas contra o encosto",
    analyze: (lm) => analyzeMachinePress(lm, { isShoulderPress: true }),
  },
  {
    id: "cable-lateral-raise",
    name: "Elevacao Lateral no Cabo",
    nameEn: "Cable Lateral Raise",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, cabo passando atras ou do lado",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      if (isVisible(hip)) {
        const armAngle = calculateAngle(hip, shoulder, wrist)
        if (armAngle >= 80 && armAngle <= 100) {
          feedback.push({ status: "correct", message: "Paralelo ao chao! Segure!", angle: armAngle, targetAngle: "80-95°" })
        } else if (armAngle > 100) {
          feedback.push({ status: "warning", message: "Nao passe da linha do ombro!", angle: armAngle })
        } else if (armAngle >= 60) {
          feedback.push({ status: "correct", message: "Subindo — continue!", angle: armAngle })
        } else {
          feedback.push({ status: "correct", message: "Fase inicial — suba com controle", angle: armAngle })
        }
      }

      if (isVisible(elbow)) {
        const elbowAngle = calculateAngle(shoulder, elbow, wrist)
        if (elbowAngle > 175) {
          feedback.push({ status: "warning", message: "Nao trave o cotovelo — leve flexao" })
        }
      }

      if (isVisible(hip) && isVisible(shoulder)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 15) {
          feedback.push({ status: "error", message: "Corpo balancando! Diminua o peso" })
        }
      }

      return feedback
    },
  },
  {
    id: "seated-lateral-raise",
    name: "Elevacao Lateral Sentado",
    nameEn: "Seated Lateral Raise",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, sentado no banco",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      if (isVisible(hip)) {
        const armAngle = calculateAngle(hip, shoulder, wrist)
        if (armAngle >= 80 && armAngle <= 100) {
          feedback.push({ status: "correct", message: "Paralelo ao chao — perfeito!", angle: armAngle })
        } else if (armAngle > 100) {
          feedback.push({ status: "warning", message: "Nao suba alem da linha do ombro!", angle: armAngle })
        } else if (armAngle >= 50) {
          feedback.push({ status: "correct", message: "Continue subindo!", angle: armAngle })
        } else {
          feedback.push({ status: "correct", message: "Suba com controle", angle: armAngle })
        }
      }

      // Sentado = menos compensacao
      feedback.push({ status: "correct", message: "Sentado elimina balanco — otimo isolamento!" })
      return feedback
    },
  },
  {
    id: "machine-lateral-raise",
    name: "Elevacao Lateral na Maquina",
    nameEn: "Machine Lateral Raise",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, sentado na maquina",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      if (isVisible(hip)) {
        const armAngle = calculateAngle(hip, shoulder, wrist)
        if (armAngle >= 80 && armAngle <= 100) {
          feedback.push({ status: "correct", message: "Altura perfeita! Segure a contracao!", angle: armAngle })
        } else if (armAngle > 100) {
          feedback.push({ status: "warning", message: "Pare na linha do ombro", angle: armAngle })
        } else {
          feedback.push({ status: "correct", message: "Suba com controle", angle: armAngle })
        }
      }

      feedback.push({ status: "correct", message: "Maquina estabiliza — foque na contracao!" })
      return feedback
    },
  },
  {
    id: "dumbbell-front-raise",
    name: "Elevacao Frontal com Halteres",
    nameEn: "Dumbbell Front Raise",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado para a camera",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      if (isVisible(hip)) {
        const armAngle = calculateAngle(hip, shoulder, wrist)
        if (armAngle >= 80 && armAngle <= 100) {
          feedback.push({ status: "correct", message: "Paralelo ao chao! Segure!", angle: armAngle, targetAngle: "80-95°" })
        } else if (armAngle > 100) {
          feedback.push({ status: "warning", message: "Nao suba acima da linha do ombro!", angle: armAngle })
        } else if (armAngle >= 50) {
          feedback.push({ status: "correct", message: "Subindo — continue!", angle: armAngle })
        } else {
          feedback.push({ status: "correct", message: "Fase inicial", angle: armAngle })
        }
      }

      if (isVisible(elbow)) {
        const elbowAngle = calculateAngle(shoulder, elbow, wrist)
        if (elbowAngle > 175) {
          feedback.push({ status: "warning", message: "Leve flexao no cotovelo!" })
        }
      }

      if (isVisible(hip) && isVisible(shoulder)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 12) {
          feedback.push({ status: "error", message: "Corpo balancando! Diminua o peso" })
        }
      }

      return feedback
    },
  },
  {
    id: "rear-delt-fly",
    name: "Crucifixo Inverso",
    nameEn: "Rear Delt Fly",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, tronco inclinado ~60°",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      if (isVisible(wrist)) {
        const elbowAngle = calculateAngle(shoulder, elbow, wrist)
        if (elbowAngle >= 140) {
          feedback.push({ status: "correct", message: "Bracos quase estendidos — otimo arco!", angle: elbowAngle })
        } else {
          feedback.push({ status: "warning", message: "Mantenha os bracos mais estendidos", angle: elbowAngle })
        }
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle >= 40 && torsoAngle <= 70) {
          feedback.push({ status: "correct", message: "Inclinacao do tronco ideal!", angle: torsoAngle })
        } else if (torsoAngle < 40) {
          feedback.push({ status: "warning", message: "Incline mais o tronco", angle: torsoAngle })
        } else {
          feedback.push({ status: "warning", message: "Tronco muito inclinado", angle: torsoAngle })
        }
      }

      return feedback
    },
  },
  {
    id: "cable-rear-delt-fly",
    name: "Crucifixo Inverso no Cabo",
    nameEn: "Cable Rear Delt Fly",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, entre os cabos cruzados",
    analyze: (lm) => analyzePecDeck(lm, { reverse: true }),
  },
  {
    id: "reverse-pec-deck",
    name: "Crucifixo Inverso na Maquina",
    nameEn: "Reverse Pec Deck",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, sentado virado para a maquina",
    analyze: (lm) => analyzePecDeck(lm, { reverse: true }),
  },
  {
    id: "upright-row",
    name: "Remada Alta",
    nameEn: "Upright Row",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, barra/halteres na frente do corpo",
    analyze: (lm) => analyzeUprightRow(lm),
  },
  {
    id: "barbell-shrug",
    name: "Encolhimento com Barra",
    nameEn: "Barbell Shrug",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, bracos estendidos ao lado do corpo",
    analyze: (lm) => analyzeShrug(lm),
  },
  {
    id: "dumbbell-shrug",
    name: "Encolhimento com Halteres",
    nameEn: "Dumbbell Shrug",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, halteres ao lado do corpo",
    analyze: (lm) => analyzeShrug(lm),
  },
  {
    id: "behind-neck-press",
    name: "Desenvolvimento Atras da Nuca",
    nameEn: "Behind-the-Neck Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, barra atras do pescoco",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 165) {
        feedback.push({ status: "correct", message: "Lockout completo!", angle: elbowAngle })
      } else if (elbowAngle >= 90) {
        feedback.push({ status: "correct", message: "Empurre ate o topo!", angle: elbowAngle })
      } else {
        feedback.push({
          status: "warning",
          message: "Nao desca demais — risco para o ombro nesta variacao!",
          angle: elbowAngle,
          targetAngle: ">90°",
        })
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 12) {
          feedback.push({ status: "error", message: "Tronco inclinando! Mantenha vertical", angle: torsoAngle })
        } else {
          feedback.push({ status: "correct", message: "Tronco vertical — otimo" })
        }
      }
      return feedback
    },
  },
  {
    id: "plate-front-raise",
    name: "Elevacao Frontal com Anilha",
    nameEn: "Plate Front Raise",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, anilha segura com as duas maos",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado" }]
      }

      if (isVisible(hip)) {
        const armAngle = calculateAngle(hip, shoulder, wrist)
        if (armAngle >= 80 && armAngle <= 100) {
          feedback.push({ status: "correct", message: "Paralelo! Segure!", angle: armAngle })
        } else if (armAngle > 100) {
          feedback.push({ status: "warning", message: "Pare na linha do ombro", angle: armAngle })
        } else {
          feedback.push({ status: "correct", message: "Suba com controle", angle: armAngle })
        }

        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 12) {
          feedback.push({ status: "warning", message: "Tronco balancando!", angle: torsoAngle })
        }
      }
      return feedback
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BICEPS — ~5 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "ez-bar-curl",
    name: "Rosca com Barra W",
    nameEn: "EZ-Bar Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, braco visivel",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle < 40) {
        feedback.push({ status: "correct", message: "Contracao maxima! Segure!", angle: elbowAngle, targetAngle: "<40°" })
      } else if (elbowAngle < 90) {
        feedback.push({ status: "correct", message: "Subindo bem!", angle: elbowAngle })
      } else if (elbowAngle < 140) {
        feedback.push({ status: "warning", message: "Controle a excentrica!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Extensao completa — suba!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        if (shoulder.x < elbow.x - 0.06) {
          feedback.push({ status: "error", message: "Cotovelo se movendo! Fixe ao corpo" })
        } else {
          feedback.push({ status: "correct", message: "Cotovelo fixo — isolamento perfeito!" })
        }

        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 15) {
          feedback.push({ status: "error", message: "Tronco balancando! Diminua a carga" })
        }
      }
      return feedback
    },
  },
  {
    id: "cross-body-hammer-curl",
    name: "Rosca Martelo Cross-Body",
    nameEn: "Cross-Body Hammer Curl",
    muscleGroup: "biceps",
    cameraPosition: "front",
    positioningTip: "De frente, halter cruza o corpo",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle < 40) {
        feedback.push({ status: "correct", message: "Contracao maxima! Segure!", angle: elbowAngle })
      } else if (elbowAngle < 90) {
        feedback.push({ status: "correct", message: "Subindo bem — cruze em direcao ao ombro oposto!", angle: elbowAngle })
      } else if (elbowAngle < 140) {
        feedback.push({ status: "correct", message: "Controle a descida!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Extensao completa — suba!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 12) {
          feedback.push({ status: "error", message: "Tronco balancando!" })
        }
      }
      return feedback
    },
  },
  {
    id: "cable-curl",
    name: "Rosca no Cabo",
    nameEn: "Cable Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, proximo a polia baixa",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle < 40) {
        feedback.push({ status: "correct", message: "Contracao maxima! Tensao constante do cabo!", angle: elbowAngle })
      } else if (elbowAngle < 90) {
        feedback.push({ status: "correct", message: "Subindo — sinta a tensao constante!", angle: elbowAngle })
      } else if (elbowAngle < 140) {
        feedback.push({ status: "correct", message: "Controle a excentrica!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Extensao completa — suba!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        if (shoulder.x < elbow.x - 0.06) {
          feedback.push({ status: "error", message: "Cotovelo saindo! Fixe ao corpo" })
        }

        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 15) {
          feedback.push({ status: "error", message: "Tronco balancando! Fixe a postura" })
        }
      }
      return feedback
    },
  },
  {
    id: "cable-rope-hammer-curl",
    name: "Rosca Martelo no Cabo (Corda)",
    nameEn: "Cable Rope Hammer Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, corda na polia baixa",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle < 40) {
        feedback.push({ status: "correct", message: "Contracao maxima! Punhos neutros!", angle: elbowAngle })
      } else if (elbowAngle < 90) {
        feedback.push({ status: "correct", message: "Subindo — mantenha punho neutro!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Extensao — controle a volta!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 12) {
          feedback.push({ status: "error", message: "Tronco balancando!" })
        } else {
          feedback.push({ status: "correct", message: "Postura estavel" })
        }
      }
      return feedback
    },
  },
  {
    id: "zottman-curl",
    name: "Rosca Zottman",
    nameEn: "Zottman Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, suba supinado, desca pronado",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle < 40) {
        feedback.push({ status: "correct", message: "Topo! Gire o punho para pronado e desca!", angle: elbowAngle })
      } else if (elbowAngle < 90) {
        feedback.push({ status: "correct", message: "Subindo supinado!", angle: elbowAngle })
      } else if (elbowAngle < 140) {
        feedback.push({ status: "correct", message: "Descendo pronado — controle!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Extensao — gire para supinado e suba!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        if (shoulder.x < elbow.x - 0.06) {
          feedback.push({ status: "error", message: "Cotovelo saindo! Fixe ao corpo" })
        }
      }
      return feedback
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRICEPS — ~7 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "overhead-cable-extension",
    name: "Extensao Overhead no Cabo",
    nameEn: "Overhead Cable Extension",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, de costas para o cabo, bracos acima da cabeca",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 160) {
        feedback.push({ status: "correct", message: "Extensao completa! Triceps contraido!", angle: elbowAngle, targetAngle: ">160°" })
      } else if (elbowAngle >= 120) {
        feedback.push({ status: "correct", message: "Estendendo — complete!", angle: elbowAngle })
      } else if (elbowAngle >= 70) {
        feedback.push({ status: "correct", message: "Boa amplitude na excentrica", angle: elbowAngle })
      } else {
        feedback.push({ status: "warning", message: "Descendo demais — risco para o cotovelo", angle: elbowAngle })
      }

      const nose = landmarks[L.NOSE]
      if (isVisible(nose) && Math.abs(elbow.x - nose.x) > 0.15) {
        feedback.push({ status: "warning", message: "Cotovelos proximos a cabeca!" })
      } else {
        feedback.push({ status: "correct", message: "Cotovelos alinhados!" })
      }

      return feedback
    },
  },
  {
    id: "ez-bar-skull-crusher",
    name: "Triceps Testa com Barra W",
    nameEn: "EZ-Bar Skull Crusher",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no banco",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 160) {
        feedback.push({ status: "correct", message: "Extensao completa!", angle: elbowAngle })
      } else if (elbowAngle >= 100) {
        feedback.push({ status: "correct", message: "Estendendo — empurre!", angle: elbowAngle })
      } else if (elbowAngle >= 60) {
        feedback.push({ status: "correct", message: "Boa profundidade — empurre agora!", angle: elbowAngle, targetAngle: "60-90°" })
      } else {
        feedback.push({ status: "warning", message: "Muito profundo — risco para o cotovelo!", angle: elbowAngle })
      }

      // Cotovelos nao devem abrir
      feedback.push({ status: "correct", message: "Mantenha cotovelos apontando para o teto!" })
      return feedback
    },
  },
  {
    id: "dumbbell-skull-crusher",
    name: "Triceps Testa com Halteres",
    nameEn: "Dumbbell Skull Crusher",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no banco, um halter em cada mao",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 160) {
        feedback.push({ status: "correct", message: "Extensao completa!", angle: elbowAngle })
      } else if (elbowAngle >= 90) {
        feedback.push({ status: "correct", message: "Empurre!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Descendo — controle!", angle: elbowAngle })
      }

      feedback.push({ status: "correct", message: "Cotovelos fixos — nao abra!" })
      return feedback
    },
  },
  {
    id: "close-grip-bench-press",
    name: "Supino Pegada Fechada",
    nameEn: "Close-Grip Bench Press",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, pegada na largura dos ombros ou mais fechada",
    analyze: (lm) => analyzeBenchPress(lm),
  },
  {
    id: "bench-dip",
    name: "Mergulho no Banco",
    nameEn: "Bench Dip",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, maos no banco atras de voce",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle <= 90) {
        feedback.push({
          status: "correct",
          message: "Profundidade otima! Nao desca mais — proteja o ombro",
          angle: elbowAngle,
          targetAngle: "85-95°",
        })
      } else if (elbowAngle <= 130) {
        feedback.push({ status: "warning", message: "Desca mais — cotovelo a 90°", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Subindo — empurre!", angle: elbowAngle })
      }

      if (elbowAngle < 70) {
        feedback.push({ status: "error", message: "Muito profundo! Risco para o ombro" })
      }

      if (isVisible(hip)) {
        const hipToShoulder = horizontalDist(hip, shoulder)
        if (hipToShoulder > 0.15) {
          feedback.push({ status: "warning", message: "Corpo muito a frente — fique proximo ao banco" })
        }
      }

      return feedback
    },
  },
  {
    id: "single-arm-cable-pushdown",
    name: "Triceps Unilateral no Cabo",
    nameEn: "Single-Arm Cable Pushdown",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, braco que trabalha visivel",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist, hip } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione o braco visivel para a camera" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 165) {
        feedback.push({ status: "correct", message: "Extensao completa! Segure!", angle: elbowAngle })
      } else if (elbowAngle >= 130) {
        feedback.push({ status: "correct", message: "Empurre ate extensao total!", angle: elbowAngle })
      } else {
        feedback.push({ status: "correct", message: "Fase de retorno — controle!", angle: elbowAngle })
      }

      if (isVisible(hip)) {
        if (elbow.x < hip.x - 0.08 || elbow.x > hip.x + 0.12) {
          feedback.push({ status: "error", message: "Cotovelo saindo! Fixe ao lado do corpo" })
        } else {
          feedback.push({ status: "correct", message: "Cotovelo fixo — otimo!" })
        }
      }
      return feedback
    },
  },
  {
    id: "overhead-rope-extension",
    name: "Extensao Overhead com Corda",
    nameEn: "Overhead Rope Extension",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, corda acima da cabeca",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, elbow, wrist } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
        return [{ status: "warning", message: "Posicione-se de lado" }]
      }

      const elbowAngle = calculateAngle(shoulder, elbow, wrist)
      if (elbowAngle >= 160) {
        feedback.push({ status: "correct", message: "Extensao completa! Abra a corda no final!", angle: elbowAngle })
      } else if (elbowAngle >= 120) {
        feedback.push({ status: "correct", message: "Estendendo!", angle: elbowAngle })
      } else if (elbowAngle >= 70) {
        feedback.push({ status: "correct", message: "Boa amplitude — empurre!", angle: elbowAngle })
      } else {
        feedback.push({ status: "warning", message: "Descendo demais!", angle: elbowAngle })
      }

      const nose = landmarks[L.NOSE]
      if (isVisible(nose) && Math.abs(elbow.x - nose.x) > 0.15) {
        feedback.push({ status: "warning", message: "Cotovelos junto a cabeca!" })
      }
      return feedback
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERNAS (LEGS) — ~12 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "leg-press",
    name: "Leg Press",
    nameEn: "Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera, sentado na maquina",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "leg-press-narrow",
    name: "Leg Press Pegada Fechada",
    nameEn: "Leg Press (Narrow Stance)",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, pes juntos na plataforma",
    analyze: (lm) => analyzeLegPress(lm, { narrow: true }),
  },
  {
    id: "leg-press-wide",
    name: "Leg Press Pegada Aberta",
    nameEn: "Leg Press (Wide Stance)",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, pes afastados na plataforma",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "leg-extension",
    name: "Cadeira Extensora",
    nameEn: "Leg Extension",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na maquina, costas apoiadas",
    analyze: (lm) => analyzeLegExtension(lm),
  },
  {
    id: "lying-leg-curl",
    name: "Mesa Flexora",
    nameEn: "Lying Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado na maquina",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "seated-leg-curl",
    name: "Cadeira Flexora",
    nameEn: "Seated Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na maquina",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "seated" }),
  },
  {
    id: "standing-leg-curl",
    name: "Flexora Em Pe",
    nameEn: "Standing Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, apoiado na maquina",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "standing" }),
  },
  {
    id: "barbell-lunge",
    name: "Afundo com Barra",
    nameEn: "Barbell Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, barra nos ombros",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_KNEE, L.RIGHT_KNEE)
      const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle < 75) {
        feedback.push({ status: "warning", message: "Joelho flexionando demais!", angle: kneeAngle, targetAngle: "85-100°" })
      } else if (kneeAngle <= 100) {
        feedback.push({ status: "correct", message: "Angulo do joelho perfeito!", angle: kneeAngle, targetAngle: "85-100°" })
      } else if (kneeAngle <= 130) {
        feedback.push({ status: "warning", message: "Desca mais!", angle: kneeAngle })
      } else {
        feedback.push({ status: "error", message: "Amplitude muito curta!", angle: kneeAngle })
      }

      if (isVisible(shoulder)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 20) {
          feedback.push({ status: "error", message: "Tronco inclinando! Peito erguido", angle: torsoAngle })
        } else {
          feedback.push({ status: "correct", message: "Tronco ereto — otimo" })
        }
      }

      return feedback
    },
  },
  {
    id: "lateral-lunge",
    name: "Afundo Lateral",
    nameEn: "Lateral Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "front",
    positioningTip: "De frente, passo lateral amplo",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_KNEE, L.RIGHT_KNEE)
      const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle >= 80 && kneeAngle <= 110) {
        feedback.push({ status: "correct", message: "Profundidade lateral perfeita!", angle: kneeAngle })
      } else if (kneeAngle > 110) {
        feedback.push({ status: "warning", message: "Desca mais na lateral!", angle: kneeAngle })
      } else {
        feedback.push({ status: "warning", message: "Muito profundo — cuidado com o joelho", angle: kneeAngle })
      }

      if (isVisible(shoulder)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 25) {
          feedback.push({ status: "warning", message: "Mantenha o tronco mais ereto" })
        } else {
          feedback.push({ status: "correct", message: "Tronco estavel" })
        }
      }

      return feedback
    },
  },
  {
    id: "walking-lunge-extended",
    name: "Afundo Caminhando",
    nameEn: "Walking Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, espaco para caminhar",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_KNEE, L.RIGHT_KNEE)
      const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }

      const kneeAngle = calculateAngle(hip, knee, ankle)
      if (kneeAngle < 80) {
        feedback.push({ status: "warning", message: "Joelho muito flexionado!", angle: kneeAngle })
      } else if (kneeAngle <= 100) {
        feedback.push({ status: "correct", message: "Angulo perfeito!", angle: kneeAngle, targetAngle: "85-100°" })
      } else if (kneeAngle <= 130) {
        feedback.push({ status: "warning", message: "Desca mais!", angle: kneeAngle })
      } else {
        feedback.push({ status: "correct", message: "Transicao entre passos" })
      }

      if (isVisible(shoulder)) {
        const vertRef: Point = { x: hip.x, y: hip.y - 1 }
        const torsoAngle = calculateAngle(shoulder, hip, vertRef)
        if (torsoAngle > 20) {
          feedback.push({ status: "warning", message: "Tronco ereto!" })
        }
      }
      return feedback
    },
  },
  {
    id: "hip-abduction-machine",
    name: "Abdutora",
    nameEn: "Hip Abduction Machine",
    muscleGroup: "glutes",
    cameraPosition: "front",
    positioningTip: "De frente para a camera, sentado na maquina",
    analyze: (lm) => analyzeHipAbduction(lm),
  },
  {
    id: "banded-lateral-walk",
    name: "Caminhada Lateral com Banda",
    nameEn: "Banded Lateral Walk",
    muscleGroup: "glutes",
    cameraPosition: "front",
    positioningTip: "De frente, banda nos tornozelos ou joelhos",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const lHip = landmarks[L.LEFT_HIP]
      const rHip = landmarks[L.RIGHT_HIP]
      const lKnee = landmarks[L.LEFT_KNEE]
      const rKnee = landmarks[L.RIGHT_KNEE]
      const lShoulder = landmarks[L.LEFT_SHOULDER]
      const rShoulder = landmarks[L.RIGHT_SHOULDER]

      if (!isVisible(lHip) || !isVisible(rHip) || !isVisible(lKnee) || !isVisible(rKnee)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      // Posicao semi-agachada
      const hipMid = midpoint(lHip, rHip)
      const kneeMid = midpoint(lKnee, rKnee)
      if (isVisible(lShoulder) && isVisible(rShoulder)) {
        const shoulderMid = midpoint(lShoulder, rShoulder)
        const vertRef: Point = { x: hipMid.x, y: hipMid.y - 1 }
        const torsoAngle = calculateAngle(shoulderMid, hipMid, vertRef)
        if (torsoAngle > 20) {
          feedback.push({ status: "warning", message: "Tronco muito inclinado — mantenha ereto" })
        } else {
          feedback.push({ status: "correct", message: "Postura correta" })
        }
      }

      // Joelhos nao devem colapsar
      const kneeWidth = Math.abs(lKnee.x - rKnee.x)
      const hipWidth = Math.abs(lHip.x - rHip.x)
      if (kneeWidth < hipWidth * 0.8) {
        feedback.push({ status: "warning", message: "Joelhos para fora! Nao deixe colapsar para dentro" })
      } else {
        feedback.push({ status: "correct", message: "Joelhos alinhados — tensao na banda!" })
      }

      feedback.push({ status: "correct", message: "Mantenha semi-agachado — passos laterais curtos!" })
      return feedback
    },
  },

  // ═══ MACHINE-SPECIFIC (HOIST, MATRIX) ═══
  {
    id: "hoist-leg-extension",
    name: "Hoist Cadeira Extensora",
    nameEn: "Hoist Leg Extension",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na Hoist",
    analyze: (lm) => analyzeLegExtension(lm),
  },
  {
    id: "hoist-leg-curl",
    name: "Hoist Cadeira Flexora",
    nameEn: "Hoist Leg Curl (Seated)",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na Hoist",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "seated" }),
  },
  {
    id: "hammer-leg-press",
    name: "Hammer Strength Leg Press",
    nameEn: "Hammer Strength Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na maquina",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "matrix-leg-press",
    name: "Matrix Leg Press",
    nameEn: "Matrix Leg Press (Sled Type)",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, sentado no sled",
    analyze: (lm) => analyzeLegPress(lm),
  },

  // ═══ NAUTILUS PEC DECK ═══
  {
    id: "nautilus-pec-deck",
    name: "Nautilus Pec Deck",
    nameEn: "Nautilus Pec Deck",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, sentado na maquina Nautilus",
    analyze: (lm) => analyzePecDeck(lm),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GLUTEOS — ~5 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "smith-hip-thrust",
    name: "Hip Thrust no Smith",
    nameEn: "Smith Machine Hip Thrust",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, costas apoiadas no banco, barra no quadril",
    analyze: (lm) => analyzeHipThrust(lm),
  },
  {
    id: "cable-kickback",
    name: "Gluteo Kickback no Cabo",
    nameEn: "Cable Kickback",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, tornozelo preso ao cabo baixo",
    analyze: (lm) => analyzeKickback(lm, { isGlute: true }),
  },
  {
    id: "cable-pull-through",
    name: "Pull-Through no Cabo",
    nameEn: "Cable Pull-Through",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, de costas para o cabo, pernas afastadas",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "pull_through" }),
  },
  {
    id: "banded-glute-bridge",
    name: "Ponte de Gluteo com Banda",
    nameEn: "Banded Glute Bridge",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, deitado com banda acima dos joelhos",
    analyze: (lm) => analyzeHipThrust(lm),
  },
  {
    id: "single-leg-hip-thrust",
    name: "Hip Thrust Unilateral",
    nameEn: "Single-Leg Hip Thrust",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, uma perna estendida",
    analyze: (lm) => analyzeHipThrust(lm, { singleLeg: true }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PANTURRILHA (CALVES) — ~4 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "seated-calf-raise",
    name: "Panturrilha Sentado",
    nameEn: "Seated Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na maquina, joelhos a 90°",
    analyze: (lm) => analyzeCalfRaise(lm, { seated: true }),
  },
  {
    id: "donkey-calf-raise",
    name: "Panturrilha Donkey",
    nameEn: "Donkey Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, tronco inclinado, peso nas costas",
    analyze: (lm) => analyzeCalfRaise(lm),
  },
  {
    id: "leg-press-calf-raise",
    name: "Panturrilha no Leg Press",
    nameEn: "Leg Press Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, ponta dos pes na plataforma do leg press",
    analyze: (lm) => analyzeLegPress(lm, { calfRaise: true }),
  },
  {
    id: "smith-calf-raise",
    name: "Panturrilha no Smith",
    nameEn: "Smith Machine Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, barra nos ombros, ponta dos pes em plataforma elevada",
    analyze: (lm) => analyzeCalfRaise(lm),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE / ABDOMEN — ~7 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "bicycle-crunch",
    name: "Abdominal Bicicleta",
    nameEn: "Bicycle Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, deitado no chao",
    analyze: (lm) => analyzeCrunch(lm, { isBicycle: true }),
  },
  {
    id: "hanging-leg-raise",
    name: "Elevacao de Pernas Suspensa",
    nameEn: "Hanging Leg Raise",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, pendurado na barra",
    analyze: (lm) => analyzeCrunch(lm, { isHanging: true }),
  },
  {
    id: "hanging-knee-raise",
    name: "Elevacao de Joelhos Suspensa",
    nameEn: "Hanging Knee Raise",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, pendurado na barra",
    analyze: (lm) => analyzeCrunch(lm, { isHanging: true }),
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    nameEn: "Russian Twist",
    muscleGroup: "core",
    cameraPosition: "front",
    positioningTip: "De frente, sentado no chao, tronco a 45°",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const lShoulder = landmarks[L.LEFT_SHOULDER]
      const rShoulder = landmarks[L.RIGHT_SHOULDER]
      const lHip = landmarks[L.LEFT_HIP]
      const rHip = landmarks[L.RIGHT_HIP]

      if (!isVisible(lShoulder) || !isVisible(rShoulder) || !isVisible(lHip) || !isVisible(rHip)) {
        return [{ status: "warning", message: "Posicione-se de frente para a camera" }]
      }

      // Rotacao do tronco
      const shoulderMid = midpoint(lShoulder, rShoulder)
      const hipMid = midpoint(lHip, rHip)
      const rotation = horizontalDist(shoulderMid, hipMid)

      if (rotation > 0.08) {
        feedback.push({ status: "correct", message: "Boa rotacao! Toque o peso de cada lado!" })
      } else {
        feedback.push({ status: "correct", message: "Rode mais o tronco — amplitude completa!" })
      }

      // Pes no chao? (opcional — mais dificil com pes elevados)
      feedback.push({ status: "correct", message: "Mantenha abdomen contraido durante todo movimento!" })
      return feedback
    },
  },
  {
    id: "cable-woodchop",
    name: "Woodchop no Cabo",
    nameEn: "Cable Woodchop",
    muscleGroup: "core",
    cameraPosition: "front",
    positioningTip: "De frente, ao lado da polia",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "woodchop" }),
  },
  {
    id: "ab-wheel-rollout",
    name: "Roda Abdominal",
    nameEn: "Ab Wheel Rollout",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, ajoelhado no chao",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_SHOULDER, L.RIGHT_SHOULDER)
      const { shoulder, hip, knee, wrist } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(hip)) {
        return [{ status: "warning", message: "Posicione a camera de lado, no chao" }]
      }

      // Alinhamento ombro-quadril (nao deixar quadril cair)
      if (isVisible(knee)) {
        const bodyAngle = calculateAngle(shoulder, hip, knee)
        if (bodyAngle >= 155) {
          feedback.push({
            status: "correct",
            message: "Corpo estendido — excelente amplitude!",
            angle: bodyAngle,
          })
        } else if (bodyAngle >= 130) {
          feedback.push({
            status: "correct",
            message: "Boa extensao — controle o retorno!",
            angle: bodyAngle,
          })
        } else {
          feedback.push({
            status: "correct",
            message: "Fase de retorno — contraia o abdomen!",
            angle: bodyAngle,
          })
        }
      }

      // Quadril nao deve cair (hiperlordose)
      if (isVisible(knee) && isVisible(shoulder)) {
        if (hip.y > shoulder.y + 0.05 && hip.y > knee.y + 0.05) {
          feedback.push({ status: "error", message: "Quadril caindo! Contraia o core — proteja a lombar" })
        } else {
          feedback.push({ status: "correct", message: "Core estavel — otimo!" })
        }
      }

      return feedback
    },
  },
  {
    id: "decline-sit-up",
    name: "Abdominal Declinado",
    nameEn: "Decline Sit-Up",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, no banco declinado",
    analyze: (lm) => analyzeCrunch(lm, { isDecline: true }),
  },
  {
    id: "cable-crunch",
    name: "Abdominal no Cabo",
    nameEn: "Cable Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, ajoelhado em frente a polia alta",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crunch" }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL BODY — ~3 exercicios (Deadlifts adicionais)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "trap-bar-deadlift",
    name: "Terra com Trap Bar",
    nameEn: "Trap Bar Deadlift",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, dentro da trap bar",
    analyze(landmarks: Point[]): PostureFeedback[] {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(landmarks, L.LEFT_HIP, L.RIGHT_HIP)
      const { shoulder, hip, knee, ankle } = getSideLandmarks(landmarks, side)

      if (!isVisible(shoulder) || !isVisible(hip) || !isVisible(knee)) {
        return [{ status: "warning", message: "Posicione-se de lado, corpo inteiro visivel" }]
      }

      // Hip angle
      const hipAngle = calculateAngle(shoulder, hip, knee)
      if (hipAngle >= 160) {
        feedback.push({ status: "correct", message: "Lockout! Quadril estendido!", angle: hipAngle })
      } else if (hipAngle >= 90) {
        feedback.push({ status: "correct", message: "Boa amplitude — empurre o chao!", angle: hipAngle })
      } else {
        feedback.push({ status: "warning", message: "Amplitude grande — coluna neutra!", angle: hipAngle })
      }

      // Coluna
      if (shoulder.y > hip.y + 0.15) {
        feedback.push({ status: "error", message: "Costas arredondando! Coluna neutra!" })
      } else {
        feedback.push({ status: "correct", message: "Coluna em boa posicao" })
      }

      // Joelhos
      if (isVisible(ankle)) {
        const kneeAngle = calculateAngle(hip, knee, ankle)
        if (kneeAngle < 100) {
          feedback.push({ status: "warning", message: "Joelhos muito flexionados — mantenha hip hinge" })
        }
      }

      return feedback
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARDIO — ~8 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "treadmill-run",
    name: "Corrida na Esteira",
    nameEn: "Treadmill Run",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, corpo inteiro visivel",
    analyze: (lm) => analyzeCardio(lm, { variant: "treadmill_run" }),
  },
  {
    id: "treadmill-incline-walk",
    name: "Caminhada Inclinada (Esteira)",
    nameEn: "Treadmill Incline Walk",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, inclinacao da esteira elevada",
    analyze: (lm) => analyzeCardio(lm, { variant: "treadmill_walk" }),
  },
  {
    id: "stationary-bike",
    name: "Bicicleta Ergometrica",
    nameEn: "Stationary Bike",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, sentado na bike",
    analyze: (lm) => analyzeCardio(lm, { variant: "bike" }),
  },
  {
    id: "rowing-machine",
    name: "Remo Ergometrico",
    nameEn: "Rowing Machine",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, no remo",
    analyze: (lm) => analyzeCardio(lm, { variant: "rowing" }),
  },
  {
    id: "elliptical",
    name: "Eliptico (Transport)",
    nameEn: "Elliptical",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, corpo inteiro visivel",
    analyze: (lm) => analyzeCardio(lm, { variant: "elliptical" }),
  },
  {
    id: "jump-rope",
    name: "Pular Corda",
    nameEn: "Jump Rope",
    muscleGroup: "full_body",
    cameraPosition: "front",
    positioningTip: "De frente, espaco amplo",
    analyze: (lm) => analyzeCardio(lm, { variant: "jump_rope" }),
  },
  {
    id: "stair-climber",
    name: "Escada (Stair Climber)",
    nameEn: "Stair Climber",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado na maquina de escada",
    analyze: (lm) => analyzeCardio(lm, { variant: "stair_climber" }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ALONGAMENTOS (STRETCHES) — ~12 exercicios
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "hip-flexor-stretch",
    name: "Alongamento Flexor do Quadril",
    nameEn: "Hip Flexor Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, posicao de avanço",
    analyze: (lm) => analyzeStretch(lm, { variant: "hip_flexor" }),
  },
  {
    id: "hamstring-stretch",
    name: "Alongamento Posterior de Coxa",
    nameEn: "Hamstring Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, perna estendida",
    analyze: (lm) => analyzeStretch(lm, { variant: "hamstring" }),
  },
  {
    id: "chest-stretch",
    name: "Alongamento Peitoral",
    nameEn: "Chest Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, braco contra parede ou portal",
    analyze: (lm) => analyzeStretch(lm, { variant: "chest" }),
  },
  {
    id: "lat-stretch",
    name: "Alongamento Latissimo",
    nameEn: "Lat Stretch",
    muscleGroup: "full_body",
    cameraPosition: "front",
    positioningTip: "De frente, braco acima, incline para o lado",
    analyze: (lm) => analyzeStretch(lm, { variant: "lat" }),
  },
  {
    id: "quad-stretch",
    name: "Alongamento Quadriceps",
    nameEn: "Quad Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, em pe, puxando o calcanhar atras",
    analyze: (lm) => analyzeStretch(lm, { variant: "quad" }),
  },
  {
    id: "calf-stretch",
    name: "Alongamento Panturrilha",
    nameEn: "Calf Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, um pe atras com calcanhar no chao",
    analyze: (lm) => analyzeStretch(lm, { variant: "calf" }),
  },
  {
    id: "cat-cow",
    name: "Gato e Vaca (Cat-Cow)",
    nameEn: "Cat-Cow",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, de quatro no chao",
    analyze: (lm) => analyzeStretch(lm, { variant: "cat_cow" }),
  },
  {
    id: "foam-roll",
    name: "Foam Roll (Liberacao Miofascial)",
    nameEn: "Foam Roll",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, sobre o rolo de espuma",
    analyze: (lm) => analyzeStretch(lm, { variant: "foam_roll" }),
  },
  {
    id: "shoulder-dislocate",
    name: "Deslocamento de Ombro (Bastao)",
    nameEn: "Shoulder Dislocate",
    muscleGroup: "full_body",
    cameraPosition: "front",
    positioningTip: "De frente, bastao/banda com pegada aberta",
    analyze: (lm) => analyzeStretch(lm, { variant: "shoulder" }),
  },
  {
    id: "banded-shoulder-stretch",
    name: "Alongamento de Ombro com Banda",
    nameEn: "Banded Shoulder Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, banda presa em ponto alto",
    analyze: (lm) => analyzeStretch(lm, { variant: "shoulder" }),
  },
  {
    id: "standing-quad-stretch",
    name: "Alongamento Quadriceps em Pe",
    nameEn: "Standing Quad Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, equilibre-se em uma perna",
    analyze: (lm) => analyzeStretch(lm, { variant: "quad" }),
  },
  {
    id: "seated-hamstring-stretch",
    name: "Alongamento Posterior Sentado",
    nameEn: "Seated Hamstring Stretch",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, sentado com perna estendida",
    analyze: (lm) => analyzeStretch(lm, { variant: "hamstring" }),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MÁQUINAS VICTOR PERSONAL — Hammer Strength, Hoist ROC-IT, Nautilus, Life Fitness, Cybex
  // ══════════════════════════════════════════════════════════════════════════

  // ─── HAMMER STRENGTH (plate-loaded, vermelho) ─────────────────────────
  {
    id: "hammer-pendulum-squat",
    name: "Hammer Strength Pendulum Squat",
    nameEn: "Hammer Strength Pendulum Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, ombros nos apoios, pes na plataforma",
    analyze: (lm) => analyzeLegPress(lm, { narrow: true }),
  },
  {
    id: "hammer-v-squat",
    name: "Hammer Strength V-Squat",
    nameEn: "Hammer Strength V-Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado para a camera, costas no encosto",
    analyze: (lm) => analyzeLegPress(lm, { narrow: true }),
  },
  {
    id: "hammer-super-fly",
    name: "Hammer Strength Super Fly",
    nameEn: "Hammer Strength Super Fly",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, costas no encosto",
    analyze: (lm) => analyzePecDeck(lm, { reverse: false }),
  },
  {
    id: "hammer-belt-squat",
    name: "Hammer Strength Belt Squat",
    nameEn: "Hammer Strength Belt Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, cinto na cintura, pes na plataforma",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "hammer-dy-row",
    name: "Hammer Strength D.Y. Row",
    nameEn: "Hammer Strength D.Y. Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito apoiado no pad",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },
  {
    id: "hammer-iso-leg-extension",
    name: "Hammer Strength Iso-Lateral Leg Extension",
    nameEn: "Hammer Strength Iso-Lateral Leg Extension",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, joelhos alinhados com o eixo",
    analyze: (lm) => analyzeLegExtension(lm),
  },
  {
    id: "hammer-iso-leg-curl",
    name: "Hammer Strength Iso-Lateral Leg Curl",
    nameEn: "Hammer Strength Iso-Lateral Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado com quadril no apoio",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "hammer-ground-base-squat",
    name: "Hammer Strength Ground Base Multi-Squat",
    nameEn: "Hammer Strength Ground Base Squat/Lunge",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, ombros nos apoios, pes no chao",
    analyze: (lm) => analyzeLegPress(lm, { narrow: true }),
  },
  {
    id: "hammer-calf-raise",
    name: "Hammer Strength Calf Raise",
    nameEn: "Hammer Strength Standing Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, ombros nos apoios, pontas dos pes na plataforma",
    analyze: (lm) => analyzeCalfRaise(lm),
  },
  {
    id: "hammer-decline-press",
    name: "Hammer Strength Decline Press",
    nameEn: "Hammer Strength Iso-Lateral Decline Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto declinado",
    analyze: (lm) => analyzeMachinePress(lm),
  },

  // ─── HOIST ROC-IT (selectorized, preto/amarelo) ───────────────────────
  {
    id: "hoist-chest-press",
    name: "Hoist Chest Press (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2301 Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "hoist-pec-fly",
    name: "Hoist Pec Fly (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2302 Pec Fly",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, costas no encosto",
    analyze: (lm) => analyzePecDeck(lm, { reverse: false }),
  },
  {
    id: "hoist-shoulder-press",
    name: "Hoist Shoulder Press (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2501 Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, maos nas alavancas",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "hoist-lat-pulldown",
    name: "Hoist Lat Pulldown (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-1201 Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, coxas sob os apoios",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "hoist-biceps-curl",
    name: "Hoist Biceps Curl (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-1102 Biceps Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, bracos apoiados no pad",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "general" }),
  },
  {
    id: "hoist-triceps-extension",
    name: "Hoist Triceps Extension (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-1103 Triceps Extension",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, cotovelos apoiados no pad",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "general" }),
  },
  {
    id: "hoist-lateral-raise",
    name: "Hoist Lateral Raise (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-1502 Lateral Raise",
    muscleGroup: "shoulders",
    cameraPosition: "front",
    positioningTip: "De frente, bracos nas almofadas laterais",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "general" }),
  },
  {
    id: "hoist-seated-dip",
    name: "Hoist Seated Dip (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2101 Seated Dip",
    muscleGroup: "triceps",
    cameraPosition: "side",
    positioningTip: "De lado, maos nas alavancas ao lado do corpo",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "hoist-glute-master",
    name: "Hoist Glute Master (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2412 Glute Master",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, coxa apoiada no pad",
    analyze: (lm) => analyzeKickback(lm, { isGlute: true }),
  },
  {
    id: "hoist-abdominal",
    name: "Hoist Abdominal (ROC-IT)",
    nameEn: "Hoist ROC-IT RS-2601 Abdominals",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crunch" }),
  },

  // ─── NAUTILUS ─────────────────────────────────────────────────────────
  {
    id: "nautilus-leg-curl-prone",
    name: "Nautilus Leg Curl (Deitado)",
    nameEn: "Nautilus Prone Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado de brucos",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "nautilus-chest-press",
    name: "Nautilus Chest Press",
    nameEn: "Nautilus Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "nautilus-abdominal-crunch",
    name: "Nautilus Abdominal Crunch",
    nameEn: "Nautilus Abdominal Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crunch" }),
  },

  // ─── LIFE FITNESS INSIGNIA ────────────────────────────────────────────
  {
    id: "lf-insignia-chest-press",
    name: "Life Fitness Insignia Chest Press",
    nameEn: "Life Fitness Insignia Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "lf-insignia-lat-pulldown",
    name: "Life Fitness Insignia Lat Pulldown",
    nameEn: "Life Fitness Insignia Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, coxas sob os apoios",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "lf-insignia-shoulder-press",
    name: "Life Fitness Insignia Shoulder Press",
    nameEn: "Life Fitness Insignia Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "lf-insignia-leg-press",
    name: "Life Fitness Insignia Leg Press",
    nameEn: "Life Fitness Insignia Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, pes na plataforma",
    analyze: (lm) => analyzeLegPress(lm, { narrow: true }),
  },

  // ─── CYBEX PRESTIGE ───────────────────────────────────────────────────
  {
    id: "cybex-vrs-leg-extension",
    name: "Cybex Prestige VRS Leg Extension",
    nameEn: "Cybex Prestige VRS Leg Extension",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, joelhos alinhados com o eixo",
    analyze: (lm) => analyzeLegExtension(lm),
  },
  {
    id: "cybex-vrs-leg-curl",
    name: "Cybex Prestige VRS Leg Curl",
    nameEn: "Cybex Prestige VRS Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado de brucos",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },

  // ─── CARDIO (Life Fitness / ICG) ──────────────────────────────────────
  {
    id: "lf-activate-treadmill",
    name: "Life Fitness Activate Esteira",
    nameEn: "Life Fitness Activate Treadmill",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, postura ereta na esteira",
    analyze: (lm) => analyzeCardio(lm, { variant: "treadmill_run" }),
  },
  {
    id: "lf-integrity-bike",
    name: "Life Fitness Integrity Bicicleta",
    nameEn: "Life Fitness Integrity Bike",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, pedalando com postura ereta",
    analyze: (lm) => analyzeCardio(lm, { variant: "bike" }),
  },
  {
    id: "icg-spinning-bike",
    name: "ICG Spinning Bike",
    nameEn: "ICG Indoor Cycling Bike",
    muscleGroup: "full_body",
    cameraPosition: "side",
    positioningTip: "De lado, core ativado, sem balançar o tronco",
    analyze: (lm) => analyzeCardio(lm, { variant: "bike" }),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // VICTOR PERSONAL — 52 MÁQUINAS MAPEADAS (março 2026)
  // Marcas: Matrix, Hammer Strength MTS, Panatta, Panatta Monolith,
  //         Panatta Inspiration, Nautilus Impact, Nautilus Inspiration,
  //         Stark Strong, Hoist, Life Fitness
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── ABDOMINAL / CORE ──────────────────────────────────────────────────────
  {
    id: "matrix-abdominal-crunch-cabo",
    name: "Matrix Abdominal Crunch (cabo)",
    nameEn: "Matrix Cable Abdominal Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, flexione o tronco",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "hammer-seated-ab-crunch",
    name: "Hammer Strength Seated Ab Crunch",
    nameEn: "Hammer Strength Seated Ab Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, mãos nas alavancas",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "nautilus-impact-abdominal",
    name: "Nautilus Impact Abdominal (cabo)",
    nameEn: "Nautilus Impact Cable Abdominal",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "hoist-rocit-ab-crunch",
    name: "Hoist ROC-IT Ab Crunch",
    nameEn: "Hoist ROC-IT Ab Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "nautilus-inspiration-abdominal",
    name: "Nautilus Inspiration Abdominal (cabo)",
    nameEn: "Nautilus Inspiration Cable Abdominal",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "panatta-monolith-abdominal-crunch",
    name: "Panatta Monolith Abdominal Crunch (cabo)",
    nameEn: "Panatta Monolith Cable Abdominal Crunch",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, peito nos apoios, design Monolith",
    analyze: (lm) => analyzeCrunch(lm),
  },
  {
    id: "matrix-rotary-torso",
    name: "Matrix Rotary Torso",
    nameEn: "Matrix Rotary Torso",
    muscleGroup: "core",
    cameraPosition: "front",
    positioningTip: "De frente, coxas travadas, gire controlando",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "woodchop" }),
  },

  // ─── PEITO ─────────────────────────────────────────────────────────────────
  {
    id: "hammer-mts-iso-chest-press",
    name: "Hammer Strength MTS Iso-Lateral Chest Press",
    nameEn: "Hammer Strength MTS Iso-Lateral Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "hammer-mts-iso-incline-press",
    name: "Hammer Strength MTS Iso-Lateral Incline Press",
    nameEn: "Hammer Strength MTS Iso-Lateral Incline Press",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas no encosto inclinado",
    analyze: (lm) => analyzeMachinePress(lm, { incline: true }),
  },
  {
    id: "hammer-mts-shoulder-chest-press",
    name: "Hammer Strength MTS Shoulder/Chest Press",
    nameEn: "Hammer Strength MTS Shoulder/Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, empurre para cima",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "panatta-supine-press",
    name: "Panatta Supine Press (plate-loaded)",
    nameEn: "Panatta Supine Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, deitado, costas apoiadas",
    analyze: (lm) => analyzeMachinePress(lm),
  },
  {
    id: "panatta-super-lower-chest-flight",
    name: "Panatta Super Lower Chest Flight",
    nameEn: "Panatta Super Lower Chest Flight",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado ou de frente, costas no encosto",
    analyze: (lm) => analyzePecDeck(lm),
  },
  {
    id: "panatta-inspiration-pec-deck",
    name: "Panatta Inspiration Pec Deck",
    nameEn: "Panatta Inspiration Pec Deck",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, costas no encosto azul, braços nas almofadas",
    analyze: (lm) => analyzePecDeck(lm),
  },
  {
    id: "matrix-incline-bench-barbell",
    name: "Matrix Incline Bench (barbell rack)",
    nameEn: "Matrix Incline Barbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, olhos sob a barra, pes firmes no chao",
    analyze: (lm) => analyzeBenchPress(lm, { incline: true }),
  },
  {
    id: "matrix-flat-bench-press-barbell",
    name: "Matrix Flat Bench Press (barbell rack)",
    nameEn: "Matrix Flat Barbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, olhos sob a barra, pes no chao",
    analyze: (lm) => analyzeBenchPress(lm),
  },
  {
    id: "stark-strong-decline-bench",
    name: "Stark Strong Decline Bench (barbell rack)",
    nameEn: "Stark Strong Decline Barbell Bench Press",
    muscleGroup: "chest",
    cameraPosition: "side",
    positioningTip: "De lado, pernas travadas, costas no decline",
    analyze: (lm) => analyzeBenchPress(lm, { decline: true }),
  },
  {
    id: "panatta-converging-chest-press",
    name: "Panatta Converging Chest Press",
    nameEn: "Panatta Converging Chest Press",
    muscleGroup: "chest",
    cameraPosition: "side-or-front",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm),
  },

  // ─── COSTAS ────────────────────────────────────────────────────────────────
  {
    id: "panatta-super-low-row",
    name: "Panatta Super Low Row (plate-loaded)",
    nameEn: "Panatta Super Low Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito no apoio, puxe baixo",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },
  {
    id: "panatta-monolith-seated-row",
    name: "Panatta Monolith Seated Row (cabo)",
    nameEn: "Panatta Monolith Cable Seated Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, peito no apoio",
    analyze: (lm) => analyzeMachinePull(lm, { isSeatedRow: true }),
  },
  {
    id: "nautilus-impact-lat-pulldown",
    name: "Nautilus Impact Lat Pull Down (cabo)",
    nameEn: "Nautilus Impact Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, coxas sob os apoios",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "hoist-rocit-lat-pulldown-plate",
    name: "Hoist ROC-IT Lat Pulldown (plate-loaded)",
    nameEn: "Hoist ROC-IT Plate-Loaded Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, coxas sob os apoios",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "panatta-lat-pulldown-plate",
    name: "Panatta Lat Pulldown (plate-loaded)",
    nameEn: "Panatta Plate-Loaded Lat Pulldown",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, coxas travadas, puxe ao peito",
    analyze: (lm) => analyzeMachinePull(lm, { isVerticalPull: true }),
  },
  {
    id: "hammer-pulldown-assisted-chin-dip",
    name: "Hammer Strength Pulldown/Assisted Chin-Dip",
    nameEn: "Hammer Strength Gravitron Assisted Chin-Dip",
    muscleGroup: "back",
    cameraPosition: "front",
    positioningTip: "De frente, ajoelhe na plataforma",
    analyze: (lm) => analyzePullUp(lm),
  },
  {
    id: "hammer-iso-high-row",
    name: "Hammer Strength Iso-Lateral High Row",
    nameEn: "Hammer Strength Iso-Lateral High Row",
    muscleGroup: "back",
    cameraPosition: "side",
    positioningTip: "De lado, peito no pad, puxe de cima",
    analyze: (lm) => analyzeMachinePull(lm),
  },

  // ─── OMBROS ────────────────────────────────────────────────────────────────
  {
    id: "hammer-mts-shoulder-press-cables",
    name: "Hammer Strength MTS Shoulder Press (cabos duplos)",
    nameEn: "Hammer Strength MTS Cable Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, empurre para cima",
    analyze: (lm) => analyzeMachinePress(lm, { isShoulderPress: true }),
  },
  {
    id: "hammer-plate-loaded-shoulder-press",
    name: "Hammer Strength Plate-Loaded Shoulder Press",
    nameEn: "Hammer Strength Plate-Loaded Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeMachinePress(lm, { isShoulderPress: true }),
  },
  {
    id: "panatta-monolith-shoulder-press",
    name: "Panatta Monolith Shoulder Press (cabo)",
    nameEn: "Panatta Monolith Cable Shoulder Press",
    muscleGroup: "shoulders",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, design Monolith",
    analyze: (lm) => analyzeMachinePress(lm, { isShoulderPress: true }),
  },

  // ─── PERNAS ────────────────────────────────────────────────────────────────
  {
    id: "matrix-seated-leg-extension-cabo",
    name: "Matrix Seated Leg Extension (cabo)",
    nameEn: "Matrix Cable Seated Leg Extension",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, joelhos alinhados com o eixo",
    analyze: (lm) => analyzeLegExtension(lm),
  },
  {
    id: "hoist-rocit-prone-leg-curl",
    name: "Hoist ROC-IT Prone Leg Curl (cabo)",
    nameEn: "Hoist ROC-IT Cable Prone Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado de brucos",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "matrix-prone-leg-curl-cabo",
    name: "Matrix Prone Leg Curl (cabo)",
    nameEn: "Matrix Cable Prone Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, deitado de brucos",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "hammer-kneeling-leg-curl",
    name: "Hammer Strength Kneeling Leg Curl",
    nameEn: "Hammer Strength Kneeling Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, ajoelhado na maquina",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "lying" }),
  },
  {
    id: "hammer-standing-leg-curl",
    name: "Hammer Strength Standing Leg Curl",
    nameEn: "Hammer Strength Standing Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, em pe, apoie a coxa",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "standing" }),
  },
  {
    id: "nautilus-seated-leg-curl",
    name: "Nautilus Seated Leg Curl",
    nameEn: "Nautilus Seated Leg Curl",
    muscleGroup: "hamstrings",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, rolo na canela",
    analyze: (lm) => analyzeLegCurl(lm, { variant: "seated" }),
  },
  {
    id: "life-fitness-linear-leg-press",
    name: "Life Fitness Linear Leg Press",
    nameEn: "Life Fitness Linear Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, pes na plataforma",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "hoist-leg-press-45",
    name: "Hoist Leg Press 45°",
    nameEn: "Hoist 45-Degree Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto a 45°",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "panatta-leg-press-45",
    name: "Panatta Leg Press 45°",
    nameEn: "Panatta 45-Degree Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, plataforma larga",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "nautilus-leg-press-45",
    name: "Nautilus Leg Press 45°",
    nameEn: "Nautilus 45-Degree Leg Press",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas apoiadas",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "hoist-leg-press-alt",
    name: "Hoist Leg Press (modelo alternativo)",
    nameEn: "Hoist Leg Press Alternate Model",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "panatta-monolith-hip-thrust",
    name: "Panatta Monolith Hip Thrust (cabo)",
    nameEn: "Panatta Monolith Cable Hip Thrust",
    muscleGroup: "glutes",
    cameraPosition: "side",
    positioningTip: "De lado, costas no apoio, pad na cintura",
    analyze: (lm) => analyzeHipThrust(lm),
  },
  {
    id: "panatta-hack-squat",
    name: "Panatta Hack Squat (plate-loaded)",
    nameEn: "Panatta Plate-Loaded Hack Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto inclinado",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "stark-strong-hack-squat",
    name: "Stark Strong Hack Squat",
    nameEn: "Stark Strong Hack Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, costas no encosto, ombros nos apoios",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "panatta-standing-calf-raise",
    name: "Panatta Standing Calf Raise",
    nameEn: "Panatta Standing Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, ombros nos apoios, pontas dos pes na plataforma",
    analyze: (lm) => analyzeCalfRaise(lm),
  },
  {
    id: "hoist-rocit-calf-raise",
    name: "Hoist ROC-IT Calf Raise (plate-loaded)",
    nameEn: "Hoist ROC-IT Plate-Loaded Calf Raise",
    muscleGroup: "calves",
    cameraPosition: "side",
    positioningTip: "De lado, sentado, pontas dos pes na plataforma",
    analyze: (lm) => analyzeCalfRaise(lm, { seated: true }),
  },
  {
    id: "panatta-v-squat-power-squat",
    name: "Panatta V-Squat / Power Squat",
    nameEn: "Panatta V-Squat Power Squat",
    muscleGroup: "quadriceps",
    cameraPosition: "side",
    positioningTip: "De lado, ombros nos apoios, pes na plataforma",
    analyze: (lm) => analyzeLegPress(lm),
  },
  {
    id: "matrix-hip-abduction-adduction",
    name: "Matrix Hip Abduction/Adduction (cabo)",
    nameEn: "Matrix Cable Hip Abduction/Adduction",
    muscleGroup: "glutes",
    cameraPosition: "front",
    positioningTip: "De frente, sentado, pernas nas almofadas",
    analyze: (lm) => analyzeHipAbduction(lm),
  },
  {
    id: "panatta-vertical-knee-raise",
    name: "Panatta Vertical Knee Raise / Captain's Chair",
    nameEn: "Panatta Captain's Chair Knee Raise",
    muscleGroup: "core",
    cameraPosition: "side",
    positioningTip: "De lado, antebracos apoiados, costas no encosto",
    analyze: (lm) => {
      const feedback: PostureFeedback[] = []
      const L = LANDMARKS
      const side = bestSide(lm, L.LEFT_HIP, L.RIGHT_HIP)
      const s = getSideLandmarks(lm, side)
      if (!isVisible(s.hip) || !isVisible(s.knee)) {
        return [{ status: "warning", message: "Posicione-se de lado para a camera" }]
      }
      const kneeAngle = calculateAngle(s.shoulder, s.hip, s.knee)
      if (kneeAngle < 70) {
        feedback.push({ status: "correct", message: "Joelhos bem elevados! Contraia o abdomen", angle: kneeAngle, targetAngle: "<70°" })
      } else if (kneeAngle < 100) {
        feedback.push({ status: "correct", message: "Boa altura — tente subir mais os joelhos", angle: kneeAngle })
      } else {
        feedback.push({ status: "warning", message: "Eleve mais os joelhos em direcao ao peito", angle: kneeAngle })
      }
      // Check swinging
      if (isVisible(s.shoulder) && isVisible(s.hip)) {
        const swing = Math.abs(s.shoulder.x - s.hip.x)
        if (swing > 0.1) {
          feedback.push({ status: "error", message: "Pare de balançar! Mantenha o corpo estavel" })
        } else {
          feedback.push({ status: "correct", message: "Corpo estavel, sem balanco" })
        }
      }
      return feedback
    },
  },

  // ─── BRAÇOS ────────────────────────────────────────────────────────────────
  {
    id: "life-fitness-biceps-curl-cabo",
    name: "Life Fitness Biceps Curl (cabo)",
    nameEn: "Life Fitness Cable Biceps Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, bracos no pad, cotovelos no eixo",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crossover" }),
  },
  {
    id: "panatta-monolith-alternate-arm-curl",
    name: "Panatta Monolith Alternate Arm Curl (cabo)",
    nameEn: "Panatta Monolith Cable Alternate Arm Curl",
    muscleGroup: "biceps",
    cameraPosition: "side",
    positioningTip: "De lado, bracos no pad, alterne os lados",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crossover" }),
  },
  {
    id: "panatta-big-multi-flight-crossover",
    name: "Panatta Big Multi Flight / Cable Crossover",
    nameEn: "Panatta Big Multi Flight Cable Crossover",
    muscleGroup: "chest",
    cameraPosition: "front",
    positioningTip: "De frente, em pe entre as colunas de cabo",
    analyze: (lm) => analyzeCableExercise(lm, { variant: "crossover" }),
  },
]

// ─── Export count for reference ──────────────────────────────────────────────
export const EXTENDED_EXERCISE_COUNT = EXTENDED_EXERCISE_RULES.length
