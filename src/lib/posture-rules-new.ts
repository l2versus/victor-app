// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Regras Biomecânicas para os 217 exercícios novos (PT)
//
// Reutiliza os padrões de análise do posture-rules-extended.ts
// Importado por posture-rules-all.ts
// ══════════════════════════════════════════════════════════════════════════════

import type {
  Point,
  PostureFeedback,
  ExerciseRule,
  CameraPosition,
} from "./posture-rules"
import { LANDMARKS, calculateAngle } from "./posture-rules"

// ─── Utilidades locais ────────────────────────────────────────────────────────

function isVisible(p: Point, threshold = 0.3): boolean {
  return (p.visibility ?? 0) >= threshold
}

function bestSide(landmarks: Point[], leftIdx: number, rightIdx: number): "left" | "right" {
  return (landmarks[leftIdx]?.visibility ?? 0) >= (landmarks[rightIdx]?.visibility ?? 0) ? "left" : "right"
}

function getSide(landmarks: Point[], side: "left" | "right") {
  const L = LANDMARKS
  return side === "left" ? {
    shoulder: landmarks[L.LEFT_SHOULDER], elbow: landmarks[L.LEFT_ELBOW],
    wrist: landmarks[L.LEFT_WRIST], hip: landmarks[L.LEFT_HIP],
    knee: landmarks[L.LEFT_KNEE], ankle: landmarks[L.LEFT_ANKLE],
  } : {
    shoulder: landmarks[L.RIGHT_SHOULDER], elbow: landmarks[L.RIGHT_ELBOW],
    wrist: landmarks[L.RIGHT_WRIST], hip: landmarks[L.RIGHT_HIP],
    knee: landmarks[L.RIGHT_KNEE], ankle: landmarks[L.RIGHT_ANKLE],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PADRÕES REUTILIZÁVEIS
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCurl(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  const shoulderDrift = Math.abs(s.elbow.x - s.shoulder.x)
  if (shoulderDrift > 0.08) feedback.push({ status: "warning", message: "Mantenha o cotovelo fixo ao lado do corpo" })
  else feedback.push({ status: "correct", message: "Cotovelo bem posicionado" })
  if (elbowAngle < 40) feedback.push({ status: "correct", message: "Boa contração do bíceps" })
  else if (elbowAngle < 90) feedback.push({ status: "correct", message: "Boa amplitude de movimento" })
  else feedback.push({ status: "warning", message: "Complete a amplitude total" })
  return feedback
}

function analyzeTricepPush(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  const elbowDrift = Math.abs(s.elbow.x - s.shoulder.x)
  if (elbowDrift > 0.1) feedback.push({ status: "warning", message: "Cotovelos se afastando do corpo" })
  else feedback.push({ status: "correct", message: "Cotovelos fixos — ótimo" })
  if (elbowAngle > 160) feedback.push({ status: "correct", message: "Extensão completa — boa contração" })
  else if (elbowAngle > 120) feedback.push({ status: "warning", message: "Estenda mais o braço" })
  else feedback.push({ status: "correct", message: "Fase de flexão — prepare para estender" })
  return feedback
}

function analyzeOverheadTricep(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  if (s.elbow.y > s.shoulder.y) feedback.push({ status: "warning", message: "Cotovelo deve apontar para cima" })
  else feedback.push({ status: "correct", message: "Cotovelo apontando para cima" })
  if (elbowAngle > 150) feedback.push({ status: "correct", message: "Extensão completa" })
  else feedback.push({ status: "correct", message: "Alongue mais a porção longa do tríceps" })
  return feedback
}

function analyzeLateralRaise(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const ls = landmarks[LANDMARKS.LEFT_SHOULDER], rs = landmarks[LANDMARKS.RIGHT_SHOULDER]
  const le = landmarks[LANDMARKS.LEFT_ELBOW], re = landmarks[LANDMARKS.RIGHT_ELBOW]
  const lw = landmarks[LANDMARKS.LEFT_WRIST], rw = landmarks[LANDMARKS.RIGHT_WRIST]
  if (!isVisible(ls) || !isVisible(rs)) return feedback
  const lAngle = calculateAngle(landmarks[LANDMARKS.LEFT_HIP], ls, le)
  const rAngle = calculateAngle(landmarks[LANDMARKS.RIGHT_HIP], rs, re)
  const avgAngle = (lAngle + rAngle) / 2
  if (avgAngle > 80 && avgAngle < 100) feedback.push({ status: "correct", message: "Altura dos braços perfeita — na linha dos ombros" })
  else if (avgAngle > 100) feedback.push({ status: "warning", message: "Braços acima dos ombros — abaixe um pouco" })
  else feedback.push({ status: "correct", message: "Suba os braços até a linha dos ombros" })
  const asymmetry = Math.abs(lAngle - rAngle)
  if (asymmetry > 15) feedback.push({ status: "warning", message: "Um braço mais alto que o outro — equalize" })
  else feedback.push({ status: "correct", message: "Braços simétricos" })
  return feedback
}

function analyzeFrontalRaise(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.wrist)) return feedback
  const armAngle = calculateAngle(s.hip, s.shoulder, s.wrist)
  if (armAngle > 80 && armAngle < 100) feedback.push({ status: "correct", message: "Braço na altura do ombro — perfeito" })
  else if (armAngle > 100) feedback.push({ status: "warning", message: "Não suba acima do ombro" })
  else feedback.push({ status: "correct", message: "Suba o braço até o ombro" })
  return feedback
}

function analyzeShoulderPress(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  if (elbowAngle > 160) feedback.push({ status: "correct", message: "Extensão completa acima da cabeça" })
  else if (elbowAngle > 90) feedback.push({ status: "correct", message: "Empurre até estender" })
  else feedback.push({ status: "correct", message: "Fase de descida — controle o peso" })
  const hipAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (hipAngle < 160) feedback.push({ status: "warning", message: "Mantenha o tronco reto — não arqueie" })
  else feedback.push({ status: "correct", message: "Tronco estável" })
  return feedback
}

function analyzeRearDelt(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow)) return feedback
  const armAngle = calculateAngle(s.hip, s.shoulder, s.elbow)
  if (armAngle > 70) feedback.push({ status: "correct", message: "Boa retração escapular" })
  else feedback.push({ status: "correct", message: "Abra mais os braços para trás" })
  return feedback
}

function analyzeBenchPress(landmarks: Point[], opts: { incline?: boolean; decline?: boolean; fly?: boolean } = {}): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  if (elbowAngle > 160) feedback.push({ status: "correct", message: "Extensão completa — boa contração" })
  else if (elbowAngle < 80) feedback.push({ status: "correct", message: "Boa profundidade" })
  else feedback.push({ status: "correct", message: opts.fly ? "Abra mais os braços" : "Desça mais a barra" })
  return feedback
}

function analyzeCable(landmarks: Point[], direction: "push" | "pull" | "lateral" = "pull"): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  const hipAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (hipAngle < 160 && direction !== "lateral") feedback.push({ status: "warning", message: "Mantenha tronco estável — não balance" })
  else feedback.push({ status: "correct", message: "Tronco estável" })
  if (direction === "pull" && elbowAngle < 60) feedback.push({ status: "correct", message: "Boa contração" })
  else if (direction === "push" && elbowAngle > 150) feedback.push({ status: "correct", message: "Boa extensão" })
  else feedback.push({ status: "correct", message: "Complete o movimento" })
  return feedback
}

function analyzeRow(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.hip)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  const torsoAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (torsoAngle > 160) feedback.push({ status: "warning", message: "Incline mais o tronco à frente" })
  else if (torsoAngle < 110) feedback.push({ status: "warning", message: "Tronco muito inclinado — cuidado com a lombar" })
  else feedback.push({ status: "correct", message: "Ângulo do tronco correto" })
  if (elbowAngle < 50) feedback.push({ status: "correct", message: "Boa retração — cotovelo junto ao corpo" })
  else feedback.push({ status: "correct", message: "Puxe mais — retraia as escápulas" })
  return feedback
}

function analyzePull(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  if (elbowAngle < 60) feedback.push({ status: "correct", message: "Boa contração — barra no peito" })
  else if (elbowAngle > 160) feedback.push({ status: "correct", message: "Braços estendidos — bom alongamento" })
  else feedback.push({ status: "correct", message: "Continue o movimento" })
  return feedback
}

function analyzeSquat(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const s = getSide(landmarks, side)
  if (!isVisible(s.hip) || !isVisible(s.knee) || !isVisible(s.ankle)) return feedback
  const kneeAngle = calculateAngle(s.hip, s.knee, s.ankle)
  const hipAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (kneeAngle < 90) feedback.push({ status: "correct", message: "Boa profundidade — coxas paralelas ou abaixo" })
  else if (kneeAngle < 120) feedback.push({ status: "warning", message: "Desça mais — busque 90° no joelho" })
  else feedback.push({ status: "correct", message: "Comece a descer" })
  if (hipAngle < 80) feedback.push({ status: "warning", message: "Tronco muito inclinado à frente" })
  else feedback.push({ status: "correct", message: "Tronco bem posicionado" })
  return feedback
}

function analyzeLunge(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE)
  const s = getSide(landmarks, side)
  if (!isVisible(s.hip) || !isVisible(s.knee) || !isVisible(s.ankle)) return feedback
  const kneeAngle = calculateAngle(s.hip, s.knee, s.ankle)
  if (kneeAngle < 100) feedback.push({ status: "correct", message: "Boa profundidade do afundo" })
  else feedback.push({ status: "correct", message: "Desça mais o joelho traseiro" })
  return feedback
}

function analyzeLegExtension(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE)
  const s = getSide(landmarks, side)
  if (!isVisible(s.hip) || !isVisible(s.knee) || !isVisible(s.ankle)) return feedback
  const kneeAngle = calculateAngle(s.hip, s.knee, s.ankle)
  if (kneeAngle > 160) feedback.push({ status: "correct", message: "Extensão completa — quadríceps contraído" })
  else if (kneeAngle > 120) feedback.push({ status: "warning", message: "Estenda mais as pernas" })
  else feedback.push({ status: "correct", message: "Fase de flexão — prepare para estender" })
  return feedback
}

function analyzeLegCurl(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE)
  const s = getSide(landmarks, side)
  if (!isVisible(s.hip) || !isVisible(s.knee) || !isVisible(s.ankle)) return feedback
  const kneeAngle = calculateAngle(s.hip, s.knee, s.ankle)
  if (kneeAngle < 50) feedback.push({ status: "correct", message: "Boa contração do posterior" })
  else if (kneeAngle < 90) feedback.push({ status: "correct", message: "Flexione mais o joelho" })
  else feedback.push({ status: "correct", message: "Fase excêntrica — desça controlado" })
  return feedback
}

function analyzeHipThrust(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.hip) || !isVisible(s.knee)) return feedback
  const hipAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (hipAngle > 160) feedback.push({ status: "correct", message: "Quadril totalmente estendido — glúteo contraído" })
  else if (hipAngle > 130) feedback.push({ status: "warning", message: "Empurre mais o quadril para cima" })
  else feedback.push({ status: "correct", message: "Subindo — contraia o glúteo no topo" })
  return feedback
}

function analyzeCalfRaise(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE)
  const s = getSide(landmarks, side)
  if (!isVisible(s.knee) || !isVisible(s.ankle)) return feedback
  const ankleAngle = calculateAngle(s.knee, s.ankle, { x: s.ankle.x, y: s.ankle.y + 0.1 })
  if (s.ankle.y < s.knee.y - 0.3) feedback.push({ status: "correct", message: "Boa elevação na ponta dos pés" })
  else feedback.push({ status: "correct", message: "Suba mais na ponta dos pés" })
  return feedback
}

function analyzeHinge(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.hip) || !isVisible(s.knee)) return feedback
  const hipAngle = calculateAngle(s.shoulder, s.hip, s.knee)
  if (hipAngle < 100) feedback.push({ status: "correct", message: "Bom alongamento do posterior" })
  else if (hipAngle > 160) feedback.push({ status: "correct", message: "Quadril estendido — contraia glúteos" })
  else feedback.push({ status: "correct", message: "Continue o movimento" })
  return feedback
}

function analyzePushUp(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.elbow) || !isVisible(s.wrist)) return feedback
  const elbowAngle = calculateAngle(s.shoulder, s.elbow, s.wrist)
  const bodyAngle = calculateAngle(s.shoulder, s.hip, s.ankle)
  if (bodyAngle < 160) feedback.push({ status: "warning", message: "Mantenha o corpo reto — quadril subindo" })
  else feedback.push({ status: "correct", message: "Corpo alinhado" })
  if (elbowAngle < 90) feedback.push({ status: "correct", message: "Boa profundidade" })
  else if (elbowAngle > 160) feedback.push({ status: "correct", message: "Extensão completa" })
  else feedback.push({ status: "correct", message: "Desça mais o peito" })
  return feedback
}

function analyzeAbduction(landmarks: Point[]): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const lh = landmarks[LANDMARKS.LEFT_HIP], rh = landmarks[LANDMARKS.RIGHT_HIP]
  const lk = landmarks[LANDMARKS.LEFT_KNEE], rk = landmarks[LANDMARKS.RIGHT_KNEE]
  if (!isVisible(lh) || !isVisible(rh) || !isVisible(lk) || !isVisible(rk)) return feedback
  const dist = Math.abs(lk.x - rk.x)
  if (dist > 0.4) feedback.push({ status: "correct", message: "Boa abdução — glúteo médio ativado" })
  else feedback.push({ status: "correct", message: "Abra mais as pernas" })
  return feedback
}

function analyzeGeneric(landmarks: Point[], muscleGroup: string): PostureFeedback[] {
  const feedback: PostureFeedback[] = []
  const side = bestSide(landmarks, LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER)
  const s = getSide(landmarks, side)
  if (!isVisible(s.shoulder) || !isVisible(s.hip)) return feedback
  const torso = calculateAngle(s.shoulder, s.hip, s.knee)
  if (torso < 140 && muscleGroup !== "core") feedback.push({ status: "warning", message: "Mantenha a coluna neutra" })
  else feedback.push({ status: "correct", message: "Boa postura" })
  return feedback
}

// ══════════════════════════════════════════════════════════════════════════════
// NOVAS REGRAS — Exercícios PT (217 adicionados)
// ══════════════════════════════════════════════════════════════════════════════

export const NEW_EXERCISE_RULES: ExerciseRule[] = [

  // ═══ TRÍCEPS (30) ═══
  { id: "triceps-corda", nameEn: "", name: "Tríceps na corda", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, cotovelos visíveis", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-barra-reta", nameEn: "", name: "Tríceps barra reta", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, cotovelos visíveis", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-barra-w", nameEn: "", name: "Tríceps barra W", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, cotovelos visíveis", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-invertido", nameEn: "", name: "Tríceps invertido (pegada supinada)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-unilateral-cabo", nameEn: "", name: "Tríceps unilateral no cabo", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, braço ativo visível", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-testa-barra", nameEn: "", name: "Tríceps testa (barra reta)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, deitado no banco", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-testa-barra-w", nameEn: "", name: "Tríceps testa barra W", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, deitado no banco", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-testa-halteres", nameEn: "", name: "Tríceps testa com halteres", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-testa-uni", nameEn: "", name: "Tríceps testa unilateral", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-testa-inclinado", nameEn: "", name: "Tríceps testa no banco inclinado", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, banco inclinado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-frances-bilateral", nameEn: "", name: "Tríceps francês com halter (bilateral)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, braço acima da cabeça", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-frances-uni", nameEn: "", name: "Tríceps francês unilateral", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-frances-barra", nameEn: "", name: "Tríceps francês com barra", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-pulley-cabeca", nameEn: "", name: "Tríceps no pulley acima da cabeça", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-corda-cabeca", nameEn: "", name: "Tríceps corda acima da cabeça", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-sentado-cabeca", nameEn: "", name: "Tríceps sentado acima da cabeça", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "supino-fechado-tri", nameEn: "", name: "Supino fechado", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "paralelas-mergulho", nameEn: "", name: "Paralelas (mergulho)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "paralela-assistida-tri", nameEn: "", name: "Paralela assistida", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "mergulho-banco", nameEn: "", name: "Mergulho em banco", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, mãos no banco", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "flexao-diamante-tri", nameEn: "", name: "Flexão diamante", muscleGroup: "triceps", cameraPosition: "side-or-front" as CameraPosition, positioningTip: "De lado ou frente", analyze: (lm) => analyzePushUp(lm) },
  { id: "maquina-mergulho", nameEn: "", name: "Máquina de mergulho", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-coice", nameEn: "", name: "Tríceps coice (kickback)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, tronco inclinado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-cross-cabo", nameEn: "", name: "Tríceps cross body no cabo", muscleGroup: "triceps", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "extensao-smith-testa", nameEn: "", name: "Extensão no smith (tipo testa guiado)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-declinado", nameEn: "", name: "Tríceps no banco declinado", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeOverheadTricep(lm) },
  { id: "triceps-elastico", nameEn: "", name: "Tríceps com elástico", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-trx", nameEn: "", name: "Tríceps em suspensão (TRX)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "triceps-maquina-ext", nameEn: "", name: "Tríceps máquina (extensão guiada)", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "triceps-maq-articulada", nameEn: "", name: "Máquinas articuladas de extensão", muscleGroup: "triceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },

  // ═══ BÍCEPS (42) ═══
  { id: "rosca-barra-reta", nameEn: "", name: "Rosca direta barra reta", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, cotovelos visíveis", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-barra-w", nameEn: "", name: "Rosca direta barra W (EZ)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pegada-aberta", nameEn: "", name: "Rosca direta pegada aberta", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pegada-fechada", nameEn: "", name: "Rosca direta pegada fechada", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-invertida", nameEn: "", name: "Rosca direta invertida (pronada)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-drag", nameEn: "", name: "Rosca drag (barra rente ao corpo)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, barra rente ao corpo", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-smith", nameEn: "", name: "Rosca direta no Smith", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-alternada", nameEn: "", name: "Rosca alternada", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-simultanea", nameEn: "", name: "Rosca simultânea", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-concentrada", nameEn: "", name: "Rosca concentrada", muscleGroup: "biceps", cameraPosition: "front", positioningTip: "De frente, sentado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-inclinada", nameEn: "", name: "Rosca inclinada (banco inclinado)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, banco 45°", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-spider", nameEn: "", name: "Rosca spider (apoio no banco inclinado)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-unilateral-pe", nameEn: "", name: "Rosca unilateral em pé", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-rotacao", nameEn: "", name: "Rosca com rotação (supinação ativa)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pulley-reta", nameEn: "", name: "Rosca no pulley barra reta", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pulley-w", nameEn: "", name: "Rosca no pulley barra W", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pulley-corda", nameEn: "", name: "Rosca no pulley com corda", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-uni-cabo", nameEn: "", name: "Rosca unilateral no cabo", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-cruzada-cabo", nameEn: "", name: "Rosca cruzada no cabo (cross body)", muscleGroup: "biceps", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-bayesian", nameEn: "", name: "Rosca Bayesian (cabo atrás do corpo)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, cabo atrás", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-alta-cabo", nameEn: "", name: "Rosca alta no cabo (tipo duplo bíceps)", muscleGroup: "biceps", cameraPosition: "front", positioningTip: "De frente, braços abertos", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-maquina", nameEn: "", name: "Rosca Scott máquina", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-biceps-maquina", nameEn: "", name: "Rosca bíceps máquina (sentado)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-articulada", nameEn: "", name: "Rosca articulada (Hammer / convergente)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-uni-maquina", nameEn: "", name: "Rosca unilateral em máquina", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-barra", nameEn: "", name: "Rosca Scott barra", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, apoiado no banco Scott", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-w", nameEn: "", name: "Rosca Scott barra W", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-halter", nameEn: "", name: "Rosca Scott halter", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-uni", nameEn: "", name: "Rosca Scott unilateral", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-scott-cabo", nameEn: "", name: "Rosca Scott no cabo", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-martelo-pt", nameEn: "", name: "Rosca martelo", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado, pegada neutra", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-martelo-alternada", nameEn: "", name: "Rosca martelo alternada", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-martelo-cross", nameEn: "", name: "Rosca martelo cross body", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-invertida-barra", nameEn: "", name: "Rosca invertida (barra ou halter)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-zottman-pt", nameEn: "", name: "Rosca Zottman", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-neutra-cabo", nameEn: "", name: "Rosca neutra no cabo", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "chinup-biceps", nameEn: "", name: "Chin-up (barra fixa supinada)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePull(lm) },
  { id: "rosca-trx", nameEn: "", name: "Rosca no TRX", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-elastico", nameEn: "", name: "Rosca com elástico", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-isometrica", nameEn: "", name: "Rosca isométrica (hold)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-21", nameEn: "", name: "Rosca 21 (método)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },
  { id: "rosca-pausa", nameEn: "", name: "Rosca com pausa (isometria no pico)", muscleGroup: "biceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCurl(lm) },

  // ═══ OMBROS (49) ═══
  { id: "elev-frontal-halter", nameEn: "", name: "Elevação frontal com halter", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-alternada", nameEn: "", name: "Elevação frontal alternada", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-barra", nameEn: "", name: "Elevação frontal com barra", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-anilha", nameEn: "", name: "Elevação frontal com anilha", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-cabo", nameEn: "", name: "Elevação frontal no cabo", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-uni-cabo", nameEn: "", name: "Elevação frontal unilateral no cabo", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-elastico", nameEn: "", name: "Elevação frontal com elástico", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-neutra", nameEn: "", name: "Elevação frontal com pegada neutra", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-rotacao", nameEn: "", name: "Elevação frontal com rotação", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-frontal-inclinada", nameEn: "", name: "Elevação frontal inclinada", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeFrontalRaise(lm) },
  { id: "elev-lateral-halteres", nameEn: "", name: "Elevação lateral com halteres", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-alternada", nameEn: "", name: "Elevação lateral alternada", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-bilateral", nameEn: "", name: "Elevação lateral bilateral", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-leaning", nameEn: "", name: "Elevação lateral inclinada (leaning)", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente, corpo inclinado", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-cabo", nameEn: "", name: "Elevação lateral no cabo", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-uni-cabo", nameEn: "", name: "Elevação lateral unilateral no cabo", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-atras-cabo", nameEn: "", name: "Elevação lateral atrás do corpo (cabo)", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-maquina", nameEn: "", name: "Elevação lateral máquina", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-articulada", nameEn: "", name: "Elevação lateral articulada", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-parcial", nameEn: "", name: "Elevação lateral parcial", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-pausa", nameEn: "", name: "Elevação lateral com pausa", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-drop", nameEn: "", name: "Elevação lateral com drop", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "elev-lateral-sentado", nameEn: "", name: "Elevação lateral sentado", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente, sentado", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "crucifixo-inv-halter", nameEn: "", name: "Crucifixo inverso com halteres", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado, tronco inclinado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "crucifixo-inv-inclinado", nameEn: "", name: "Crucifixo inverso no banco inclinado", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "crucifixo-inv-cabo", nameEn: "", name: "Crucifixo inverso no cabo", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "crucifixo-inv-uni", nameEn: "", name: "Crucifixo inverso unilateral", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "reverse-peck-deck-pt", nameEn: "", name: "Reverse peck deck", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "maq-delt-posterior", nameEn: "", name: "Máquina deltóide posterior", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "face-pull-corda", nameEn: "", name: "Face pull (corda)", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "face-pull-uni", nameEn: "", name: "Face pull unilateral", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "pull-apart-elastico", nameEn: "", name: "Pull-apart com elástico", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "desenv-barra", nameEn: "", name: "Desenvolvimento com barra", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "desenv-halteres", nameEn: "", name: "Desenvolvimento com halteres", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "desenv-arnold", nameEn: "", name: "Desenvolvimento Arnold", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "desenv-smith", nameEn: "", name: "Desenvolvimento no Smith", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "desenv-maquina", nameEn: "", name: "Desenvolvimento máquina", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "desenv-unilateral", nameEn: "", name: "Desenvolvimento unilateral", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "elev-lat-1braco-cruzado", nameEn: "", name: "Elevação lateral 1 braço no cabo cruzado", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "remada-alta-delt", nameEn: "", name: "Remada alta (ênfase em deltóide)", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "remada-alta-halter-delt", nameEn: "", name: "Remada alta com halter", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "desenv-atras-cabeca", nameEn: "", name: "Desenvolvimento atrás da cabeça", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "landmine-press-ombro", nameEn: "", name: "Landmine press (ombro)", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeShoulderPress(lm) },
  { id: "elev-lateral-45", nameEn: "", name: "Elevação lateral em 45°", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "crucifixo-inv-pausa", nameEn: "", name: "Crucifixo inverso com pausa isométrica", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "pike-pushup", nameEn: "", name: "Pike push-up", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado, formato V invertido", analyze: (lm) => analyzePushUp(lm) },
  { id: "handstand-pushup", nameEn: "", name: "Handstand push-up", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "flexao-elev-ombro", nameEn: "", name: "Flexão com elevação de ombro", muscleGroup: "shoulders", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "trx-lateral-posterior", nameEn: "", name: "TRX elevação lateral/posterior", muscleGroup: "shoulders", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },

  // ═══ PEITO (42) ═══
  { id: "supino-reto-barra-pt", nameEn: "", name: "Supino reto barra", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-inclinado-barra-pt", nameEn: "", name: "Supino inclinado barra", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco 30-45°", analyze: (lm) => analyzeBenchPress(lm, { incline: true }) },
  { id: "supino-declinado-barra-pt", nameEn: "", name: "Supino declinado barra", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco declinado", analyze: (lm) => analyzeBenchPress(lm, { decline: true }) },
  { id: "supino-pegada-fechada-peito", nameEn: "", name: "Supino pegada fechada (peito)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-pegada-aberta", nameEn: "", name: "Supino pegada aberta", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-smith-reto", nameEn: "", name: "Supino no Smith (reto)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-smith-inclinado", nameEn: "", name: "Supino no Smith (inclinado)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco inclinado", analyze: (lm) => analyzeBenchPress(lm, { incline: true }) },
  { id: "supino-smith-declinado", nameEn: "", name: "Supino no Smith (declinado)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { decline: true }) },
  { id: "supino-reto-halter-pt", nameEn: "", name: "Supino reto halter", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-inclinado-halter-pt", nameEn: "", name: "Supino inclinado halter", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco inclinado", analyze: (lm) => analyzeBenchPress(lm, { incline: true }) },
  { id: "supino-declinado-halter-pt", nameEn: "", name: "Supino declinado halter", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { decline: true }) },
  { id: "supino-uni-halter", nameEn: "", name: "Supino unilateral halter", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "chest-press-maq", nameEn: "", name: "Chest press máquina", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-maq-articulada", nameEn: "", name: "Supino máquina articulada", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-convergente", nameEn: "", name: "Supino convergente (Hammer)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-inclinado-maq", nameEn: "", name: "Supino inclinado máquina", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { incline: true }) },
  { id: "supino-declinado-maq", nameEn: "", name: "Supino declinado máquina", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { decline: true }) },
  { id: "supino-uni-maq", nameEn: "", name: "Supino unilateral máquina", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "crucifixo-reto-pt", nameEn: "", name: "Crucifixo reto", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco reto", analyze: (lm) => analyzeBenchPress(lm, { fly: true }) },
  { id: "crucifixo-inclinado-pt", nameEn: "", name: "Crucifixo inclinado", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, banco inclinado", analyze: (lm) => analyzeBenchPress(lm, { incline: true, fly: true }) },
  { id: "crucifixo-declinado-pt", nameEn: "", name: "Crucifixo declinado", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { decline: true, fly: true }) },
  { id: "crucifixo-unilateral", nameEn: "", name: "Crucifixo unilateral", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { fly: true }) },
  { id: "peck-deck-pt", nameEn: "", name: "Peck deck (voador)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeBenchPress(lm, { fly: true }) },
  { id: "crucifixo-maq-art", nameEn: "", name: "Crucifixo máquina articulada", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { fly: true }) },
  { id: "crossover-alto-baixo", nameEn: "", name: "Crossover alto → baixo (ênfase inferior)", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "crossover-medio", nameEn: "", name: "Crossover médio → médio", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "crossover-baixo-alto", nameEn: "", name: "Crossover baixo → alto (ênfase superior)", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "crossover-uni", nameEn: "", name: "Crossover unilateral", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "crossover-passo", nameEn: "", name: "Crossover com passo à frente", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "crossover-pausa", nameEn: "", name: "Crossover com pausa isométrica", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },
  { id: "flexao-tradicional", nameEn: "", name: "Flexão tradicional", muscleGroup: "chest", cameraPosition: "side-or-front" as CameraPosition, positioningTip: "De lado ou frente", analyze: (lm) => analyzePushUp(lm) },
  { id: "flexao-inclinada-pt", nameEn: "", name: "Flexão inclinada", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "flexao-declinada", nameEn: "", name: "Flexão declinada", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "flexao-instavel", nameEn: "", name: "Flexão com apoio instável", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzePushUp(lm) },
  { id: "paralelas-peito", nameEn: "", name: "Paralelas (ênfase em peito)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado, tronco inclinado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "paralela-assist-peito", nameEn: "", name: "Paralela assistida (peito)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeTricepPush(lm) },
  { id: "supino-guilhotina", nameEn: "", name: "Supino guilhotina", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-pausa", nameEn: "", name: "Supino com pausa (isométrico)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "supino-tempo", nameEn: "", name: "Supino com tempo controlado", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "squeeze-press", nameEn: "", name: "Squeeze press (halter pressionando)", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "crucifixo-pausa", nameEn: "", name: "Crucifixo com pausa", muscleGroup: "chest", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeBenchPress(lm, { fly: true }) },
  { id: "crossover-drop", nameEn: "", name: "Crossover com drop set", muscleGroup: "chest", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeCable(lm, "push") },

  // ═══ COSTAS (44) ═══
  { id: "barra-fixa-pronada", nameEn: "", name: "Barra fixa pronada", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas costas ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "barra-fixa-supinada", nameEn: "", name: "Barra fixa supinada (chin-up costas)", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas costas ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "barra-fixa-neutra", nameEn: "", name: "Barra fixa neutra", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas costas ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "barra-fixa-assistida", nameEn: "", name: "Barra fixa assistida", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas costas ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-frente-aberta", nameEn: "", name: "Puxada frente pegada aberta", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas COSTAS (peso bloqueia frente)", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-frente-fechada", nameEn: "", name: "Puxada frente pegada fechada", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas COSTAS (peso bloqueia frente)", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-supinada", nameEn: "", name: "Puxada supinada", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas COSTAS ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-neutra", nameEn: "", name: "Puxada neutra", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas COSTAS ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-unilateral", nameEn: "", name: "Puxada unilateral", muscleGroup: "back", cameraPosition: "back", allowedPositions: ["back", "side"], positioningTip: "Câmera nas COSTAS ou de lado", analyze: (lm) => analyzePull(lm) },
  { id: "puxada-atras", nameEn: "", name: "Puxada atrás (uso específico)", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzePull(lm) },
  { id: "remada-curvada-barra", nameEn: "", name: "Remada curvada barra", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-curvada-supinada", nameEn: "", name: "Remada curvada supinada", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-pendlay-pt", nameEn: "", name: "Remada Pendlay", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-uni-halter", nameEn: "", name: "Remada unilateral halter", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-apoiada-banco", nameEn: "", name: "Remada apoiada no banco", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-baixa-cabo", nameEn: "", name: "Remada baixa no cabo", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas (sentado)", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-maquina-pt", nameEn: "", name: "Remada máquina", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-articulada-pt", nameEn: "", name: "Remada articulada", muscleGroup: "back", cameraPosition: "side", allowedPositions: ["side", "back"], positioningTip: "De lado ou costas", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-uni-cabo", nameEn: "", name: "Remada unilateral no cabo", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-cavalinho", nameEn: "", name: "Remada cavalinho (T-bar)", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-landmine", nameEn: "", name: "Remada no landmine", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "pullover-halter", nameEn: "", name: "Pullover com halter", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeBenchPress(lm) },
  { id: "pullover-cabo", nameEn: "", name: "Pullover no cabo", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCable(lm, "pull") },
  { id: "pullover-maquina", nameEn: "", name: "Pullover máquina", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCable(lm, "pull") },
  { id: "puxada-braco-estendido", nameEn: "", name: "Puxada braço estendido (straight arm pulldown)", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCable(lm, "pull") },
  { id: "puxada-uni-braco-est", nameEn: "", name: "Puxada unilateral braço estendido", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCable(lm, "pull") },
  // Trapézio
  { id: "encolhimento-barra", nameEn: "", name: "Encolhimento (shrug) barra", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeGeneric(lm, "back") },
  { id: "encolhimento-halter", nameEn: "", name: "Encolhimento halter", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeGeneric(lm, "back") },
  { id: "encolhimento-maquina", nameEn: "", name: "Encolhimento máquina", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeGeneric(lm, "back") },
  { id: "face-pull-costas", nameEn: "", name: "Face pull (costas)", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeRearDelt(lm) },
  { id: "remada-alta-barra-trap", nameEn: "", name: "Remada alta barra", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "remada-alta-halter-trap", nameEn: "", name: "Remada alta halter", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  { id: "remada-alta-cabo-trap", nameEn: "", name: "Remada alta no cabo", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeLateralRaise(lm) },
  // Lombar
  { id: "extensao-lombar", nameEn: "", name: "Extensão lombar (banco 45°)", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "hiperextensao", nameEn: "", name: "Hiperextensão", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "good-morning-pt", nameEn: "", name: "Good morning", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "levantamento-terra", nameEn: "", name: "Levantamento terra", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "terra-romeno-costas", nameEn: "", name: "Terra romeno", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "terra-sumo", nameEn: "", name: "Terra sumô", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeSquat(lm) },
  // Funcionais
  { id: "remada-trx", nameEn: "", name: "Remada no TRX", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-elastico", nameEn: "", name: "Remada com elástico", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-meadows", nameEn: "", name: "Remada Meadows", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "remada-pausa-iso", nameEn: "", name: "Remada com pausa isométrica", muscleGroup: "back", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeRow(lm) },
  { id: "puxada-escapula", nameEn: "", name: "Puxada com foco em escápula", muscleGroup: "back", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzePull(lm) },

  // ═══ PERNAS (41) ═══
  { id: "agachamento-livre", nameEn: "", name: "Agachamento livre", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado, barra no trapézio", analyze: (lm) => analyzeSquat(lm) },
  { id: "agachamento-frontal-pt", nameEn: "", name: "Agachamento frontal", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "agachamento-smith-pt", nameEn: "", name: "Agachamento no Smith", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "leg-press-45", nameEn: "", name: "Leg press 45°", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "leg-press-horizontal", nameEn: "", name: "Leg press horizontal", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "hack-machine-pt", nameEn: "", name: "Hack machine", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "cadeira-extensora", nameEn: "", name: "Cadeira extensora", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeLegExtension(lm) },
  { id: "extensora-unilateral", nameEn: "", name: "Extensora unilateral", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLegExtension(lm) },
  { id: "extensora-pausa", nameEn: "", name: "Extensora com pausa", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLegExtension(lm) },
  { id: "agachamento-bulgaro-pt", nameEn: "", name: "Agachamento búlgaro", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  { id: "afundo-lunge", nameEn: "", name: "Afundo (lunge)", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  { id: "passada-andando", nameEn: "", name: "Passada andando", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  { id: "step-up-quad", nameEn: "", name: "Step-up (quadríceps)", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  // Posterior
  { id: "mesa-flexora", nameEn: "", name: "Mesa flexora", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeLegCurl(lm) },
  { id: "mesa-flexora-uni", nameEn: "", name: "Mesa flexora unilateral", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLegCurl(lm) },
  { id: "cadeira-flexora", nameEn: "", name: "Cadeira flexora", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado, sentado", analyze: (lm) => analyzeLegCurl(lm) },
  { id: "flexora-em-pe", nameEn: "", name: "Flexora em pé", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLegCurl(lm) },
  { id: "stiff-pt", nameEn: "", name: "Stiff", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "stiff-halter", nameEn: "", name: "Stiff com halter", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "terra-romeno-posterior", nameEn: "", name: "Terra romeno (posterior)", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "good-morning-posterior", nameEn: "", name: "Good morning (posterior)", muscleGroup: "hamstrings", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  // Glúteo
  { id: "hip-thrust-pt", nameEn: "", name: "Hip thrust", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado, costas no banco", analyze: (lm) => analyzeHipThrust(lm) },
  { id: "glute-bridge-pt", nameEn: "", name: "Glute bridge", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado, deitado", analyze: (lm) => analyzeHipThrust(lm) },
  { id: "elevacao-pelvica-uni", nameEn: "", name: "Elevação pélvica unilateral", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHipThrust(lm) },
  { id: "coice-cabo", nameEn: "", name: "Coice no cabo (kickback)", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "coice-unilateral", nameEn: "", name: "Coice unilateral", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "maq-gluteo", nameEn: "", name: "Máquina de glúteo", muscleGroup: "glutes", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeHinge(lm) },
  { id: "cadeira-abdutora", nameEn: "", name: "Cadeira abdutora", muscleGroup: "glutes", cameraPosition: "front", positioningTip: "De frente, sentado", analyze: (lm) => analyzeAbduction(lm) },
  { id: "abducao-elastico", nameEn: "", name: "Abdução com elástico", muscleGroup: "glutes", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeAbduction(lm) },
  { id: "caminhada-lateral-elastico", nameEn: "", name: "Caminhada lateral com elástico", muscleGroup: "glutes", cameraPosition: "front", positioningTip: "De frente", analyze: (lm) => analyzeAbduction(lm) },
  // Panturrilha
  { id: "panturrilha-pe", nameEn: "", name: "Panturrilha em pé", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  { id: "panturrilha-sentado", nameEn: "", name: "Panturrilha sentado", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  { id: "panturrilha-legpress", nameEn: "", name: "Panturrilha no leg press", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  { id: "panturrilha-unilateral", nameEn: "", name: "Panturrilha unilateral", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  { id: "panturrilha-smith-pt", nameEn: "", name: "Panturrilha no Smith", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  { id: "panturrilha-donkey", nameEn: "", name: "Panturrilha donkey", muscleGroup: "calves", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeCalfRaise(lm) },
  // Funcionais perna
  { id: "agachamento-unilateral", nameEn: "", name: "Agachamento unilateral (pistol)", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "trx-squat", nameEn: "", name: "TRX squat", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "afundo-pausa", nameEn: "", name: "Afundo com pausa", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  { id: "agachamento-elastico", nameEn: "", name: "Agachamento com elástico", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
  { id: "step-up-avancado", nameEn: "", name: "Step-up avançado", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeLunge(lm) },
  { id: "agachamento-tempo", nameEn: "", name: "Agachamento com tempo controlado", muscleGroup: "quadriceps", cameraPosition: "side", positioningTip: "De lado", analyze: (lm) => analyzeSquat(lm) },
]
