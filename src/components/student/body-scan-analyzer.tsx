"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Camera,
  SwitchCamera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ChevronRight,
  Activity,
  Ruler,
  MessageSquare,
  Dumbbell,
  XCircle,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface FrontMeasurements {
  shoulderPx: number
  hipPx: number
  waistPx: number
  torsoPx: number
  legPx: number
}

interface SideMeasurements {
  chestDepthPx: number
  waistDepthPx: number
  hipDepthPx: number
  headForwardPx: number // forward head posture
  trunkLeanDeg: number  // trunk lean angle (kyphosis/lordosis indicator)
}

interface CombinedMeasurements extends FrontMeasurements {
  side: SideMeasurements | null
}

interface Ratios {
  shoulderWaist: number
  shoulderHip: number
  waistHip: number
  legTorso: number
  // Side ratios (when available)
  chestToWaistDepth?: number  // chest depth vs waist depth
  gluteProjection?: number    // hip depth vs waist depth
}

interface PostureScore {
  headForward: "good" | "moderate" | "poor"
  trunkAlignment: "good" | "moderate" | "poor"
  overallScore: number // 0-100
  notes: string[]
}

type BodyShape = "V_SHAPE" | "TRAPEZOID" | "X_SHAPE" | "RECTANGLE" | "PEAR"
type Step = "camera_front" | "camera_side" | "result"

// ─── Body shape data ──────────────────────────────────────────────────────────

const SHAPE_INFO: Record<BodyShape, { label: string; icon: string; color: string; tip: string }> = {
  V_SHAPE: {
    label: "Formato V (Triângulo Invertido)",
    icon: "▽",
    color: "text-red-400",
    tip: "Ombros bem mais largos que o quadril. Foco: pernas e glúteos para equilibrar.",
  },
  TRAPEZOID: {
    label: "Trapezoide",
    icon: "⬡",
    color: "text-amber-400",
    tip: "Ombros mais largos que o quadril com cintura definida. Shape atlético ideal.",
  },
  X_SHAPE: {
    label: "Formato X (Ampulheta)",
    icon: "✦",
    color: "text-purple-400",
    tip: "Ombros e quadril equilibrados com cintura marcada. Continue o treino atual.",
  },
  RECTANGLE: {
    label: "Retângulo",
    icon: "▬",
    color: "text-blue-400",
    tip: "Ombros e quadril alinhados. Foco: definição de cintura e volume nos ombros.",
  },
  PEAR: {
    label: "Formato Pera",
    icon: "▼",
    color: "text-green-400",
    tip: "Quadril mais largo que ombros. Foco: desenvolvimento de ombros e costas.",
  },
}

function classifyShape(ratios: Ratios): BodyShape {
  const { shoulderHip, waistHip } = ratios
  if (shoulderHip > 1.25) return "V_SHAPE"
  if (shoulderHip > 1.10) return "TRAPEZOID"
  if (shoulderHip >= 0.85 && waistHip < 0.80) return "X_SHAPE"
  if (shoulderHip >= 0.85) return "RECTANGLE"
  return "PEAR"
}

function generateLocalAnalysis(ratios: Ratios, shape: BodyShape, posture: PostureScore | null): string {
  const info = SHAPE_INFO[shape]
  const lines = [`Formato: ${info.label}.`, info.tip]
  if (ratios.shoulderHip > 1.2) lines.push("Excelente largura de ombros!")
  if (ratios.waistHip < 0.75) lines.push("Cintura proporcional ao quadril.")
  if (ratios.legTorso > 1.1) lines.push("Boa proporção perna/tronco.")
  if (ratios.chestToWaistDepth && ratios.chestToWaistDepth > 1.15) {
    lines.push("Boa projeção peitoral na vista lateral.")
  }
  if (posture) {
    if (posture.overallScore >= 80) lines.push("Postura geral boa!")
    else if (posture.overallScore >= 50) lines.push("Postura com pontos de atenção.")
    posture.notes.forEach(n => lines.push(n))
  }
  return lines.join(" ")
}

// ─── Landmark math ────────────────────────────────────────────────────────────

function dist(a: Landmark, b: Landmark, w: number, h: number) {
  return Math.hypot((a.x - b.x) * w, (a.y - b.y) * h)
}

function calcFrontMeasurements(lm: Landmark[], w: number, h: number): FrontMeasurements {
  const rawShoulderPx = dist(lm[11], lm[12], w, h)
  const rawHipPx = dist(lm[23], lm[24], w, h)
  const rawRatio = rawShoulderPx / rawHipPx

  const SHOULDER_CORRECTION = 1.08
  const HIP_CORRECTION = rawRatio < 1.3 ? 1.50 : rawRatio < 1.6 ? 1.45 : 1.55

  const shoulderPx = rawShoulderPx * SHOULDER_CORRECTION
  const hipPx = rawHipPx * HIP_CORRECTION
  const waistRatio = rawRatio < 1.3 ? 0.78 : 0.82
  const waistPx = Math.min(shoulderPx, hipPx) * waistRatio

  const shoulderY = (lm[11].y + lm[12].y) / 2
  const hipY = (lm[23].y + lm[24].y) / 2
  const ankleY = (lm[27].y + lm[28].y) / 2
  const torsoPx = Math.abs(hipY - shoulderY) * h
  const legPx = Math.abs(ankleY - hipY) * h
  return { shoulderPx, hipPx, waistPx, torsoPx, legPx }
}

function calcSideMeasurements(lm: Landmark[], w: number, h: number): SideMeasurements {
  // Side view: measure front-to-back depths using Z and X coordinates
  // In side view, the X axis represents depth (front-to-back)

  // Chest depth: distance between front chest and back at shoulder level
  // Using landmarks 11 (left shoulder) and 12 (right shoulder) - in side view one is front, one is back
  const shoulderSpread = Math.abs(lm[11].x - lm[12].x) * w
  const chestDepthPx = Math.max(shoulderSpread, dist(lm[11], lm[12], w, h) * 0.7)

  // Waist depth: estimated from hip and shoulder midpoint depth
  const hipSpread = Math.abs(lm[23].x - lm[24].x) * w
  const waistDepthPx = (chestDepthPx + hipSpread) * 0.45

  // Hip depth (glute projection)
  const hipDepthPx = Math.max(hipSpread, dist(lm[23], lm[24], w, h) * 0.7)

  // Forward head posture: ear (landmark 7/8) vs shoulder (11/12) X offset
  // In side view, if head is forward of shoulders, indicates FHP
  const earX = (lm[7]?.x ?? lm[0]?.x ?? 0)
  const shoulderX = (lm[11].x + lm[12].x) / 2
  const headForwardPx = (earX - shoulderX) * w // positive = forward head

  // Trunk lean: angle from hip to shoulder vs vertical
  const shoulderMidX = (lm[11].x + lm[12].x) / 2
  const shoulderMidY = (lm[11].y + lm[12].y) / 2
  const hipMidX = (lm[23].x + lm[24].x) / 2
  const hipMidY = (lm[23].y + lm[24].y) / 2
  const dx = (shoulderMidX - hipMidX) * w
  const dy = (hipMidY - shoulderMidY) * h
  const trunkLeanDeg = Math.atan2(Math.abs(dx), dy) * (180 / Math.PI)

  return { chestDepthPx, waistDepthPx, hipDepthPx, headForwardPx, trunkLeanDeg }
}

function calcPostureScore(side: SideMeasurements): PostureScore {
  const notes: string[] = []
  let score = 100

  // Forward head posture
  let headForward: "good" | "moderate" | "poor" = "good"
  if (Math.abs(side.headForwardPx) > 30) {
    headForward = "poor"
    score -= 30
    notes.push("Cabeça projetada à frente — trabalhe retração cervical.")
  } else if (Math.abs(side.headForwardPx) > 15) {
    headForward = "moderate"
    score -= 15
    notes.push("Leve anteriorização da cabeça — atenção à postura no dia a dia.")
  }

  // Trunk alignment
  let trunkAlignment: "good" | "moderate" | "poor" = "good"
  if (side.trunkLeanDeg > 12) {
    trunkAlignment = "poor"
    score -= 30
    notes.push("Inclinação significativa do tronco — possível hipercifose ou hiperlordose.")
  } else if (side.trunkLeanDeg > 6) {
    trunkAlignment = "moderate"
    score -= 15
    notes.push("Leve inclinação do tronco — fortaleça core e extensores.")
  }

  return {
    headForward,
    trunkAlignment,
    overallScore: Math.max(0, score),
    notes,
  }
}

function calcRatios(front: FrontMeasurements, side: SideMeasurements | null): Ratios {
  const r2 = (n: number) => Math.round(n * 100) / 100
  const ratios: Ratios = {
    shoulderWaist: r2(front.shoulderPx / front.waistPx),
    shoulderHip: r2(front.shoulderPx / front.hipPx),
    waistHip: r2(front.waistPx / front.hipPx),
    legTorso: r2(front.legPx / front.torsoPx),
  }
  if (side) {
    ratios.chestToWaistDepth = r2(side.chestDepthPx / side.waistDepthPx)
    ratios.gluteProjection = r2(side.hipDepthPx / side.waistDepthPx)
  }
  return ratios
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BodySvg({ shape }: { shape: BodyShape }) {
  const colors: Record<BodyShape, string> = {
    V_SHAPE: "#dc2626", TRAPEZOID: "#d97706", X_SHAPE: "#9333ea",
    RECTANGLE: "#2563eb", PEAR: "#16a34a",
  }
  const paths: Record<BodyShape, string> = {
    V_SHAPE:   "M50,20 L80,20 L75,50 L60,55 L45,50 L20,20 Z",
    TRAPEZOID: "M45,20 L75,20 L72,55 L28,55 Z",
    X_SHAPE:   "M40,20 L80,20 L65,50 L80,80 L40,80 L55,50 Z",
    RECTANGLE: "M40,20 L80,20 L80,80 L40,80 Z",
    PEAR:      "M45,20 L75,20 L70,50 L85,80 L35,80 L50,50 Z",
  }
  const c = colors[shape]
  return (
    <svg viewBox="0 0 120 100" className="w-16 h-16 shrink-0" fill="none">
      <path d={paths[shape]} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="60" cy="12" r="7" fill={c} fillOpacity={0.25} stroke={c} strokeWidth={1} />
    </svg>
  )
}

function RatioBar({ label, value, ideal }: { label: string; value: number; ideal: string }) {
  const pct = Math.min(100, Math.max(0, (value / 2) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-mono font-semibold">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-neutral-600">Ideal: {ideal}</p>
    </div>
  )
}

function PostureIndicator({ label, status }: { label: string; status: "good" | "moderate" | "poor" }) {
  const config = {
    good: { color: "text-emerald-400", bg: "bg-emerald-600/15", label: "Bom" },
    moderate: { color: "text-amber-400", bg: "bg-amber-600/15", label: "Atenção" },
    poor: { color: "text-red-400", bg: "bg-red-600/15", label: "Corrigir" },
  }
  const c = config[status]
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", c.bg, c.color)}>{c.label}</span>
    </div>
  )
}

// ─── Body Fat Estimation ──────────────────────────────────────────────────────

interface BodyFatResult {
  deurenberg: number | null
  navy: number | null
  average: number | null
  bmi: number | null
  category: string
}

function estimateBodyFat(opts: {
  weight?: number; height?: number; gender?: string; birthDate?: string
  waistHipRatio?: number
}): BodyFatResult {
  const { weight, height, gender, birthDate, waistHipRatio } = opts
  if (!weight || !height) return { deurenberg: null, navy: null, average: null, bmi: null, category: "Dados insuficientes" }

  const heightM = height > 3 ? height / 100 : height
  const bmi = weight / (heightM * heightM)
  const isMale = gender === "MALE" || gender === "Masculino"
  const sex = isMale ? 1 : 0

  let age = 30
  if (birthDate) {
    const bd = new Date(birthDate)
    const now = new Date()
    age = now.getFullYear() - bd.getFullYear()
    if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
  }

  const deurenberg = Math.round((1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4) * 10) / 10
  const whCorrection = waistHipRatio ? (waistHipRatio - 0.80) * 15 : 0
  const navy = Math.round(((1.61 * bmi + 0.13 * age - 12.1 * sex - 13.9) + whCorrection) * 10) / 10
  const avg = Math.round(((deurenberg + navy) / 2) * 10) / 10

  let category: string
  if (isMale) {
    category = avg < 6 ? "Essencial" : avg < 14 ? "Atlético" : avg < 18 ? "Fitness" : avg < 25 ? "Normal" : "Acima"
  } else {
    category = avg < 14 ? "Essencial" : avg < 21 ? "Atlético" : avg < 25 ? "Fitness" : avg < 32 ? "Normal" : "Acima"
  }

  return { deurenberg, navy, average: avg, bmi: Math.round(bmi * 10) / 10, category }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BodyScanAnalyzer({ weight, height, gender, birthDate }: {
  weight?: number; height?: number; gender?: string; birthDate?: string
}) {
  const [step, setStep] = useState<Step>("camera_front")
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "active" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  // Front scan data
  const [frontMeasurements, setFrontMeasurements] = useState<FrontMeasurements | null>(null)
  const [frontImageData, setFrontImageData] = useState<string | null>(null)

  // Side scan data
  const [sideMeasurements, setSideMeasurements] = useState<SideMeasurements | null>(null)
  const [postureScore, setPostureScore] = useState<PostureScore | null>(null)

  // Combined results
  const [ratios, setRatios] = useState<Ratios | null>(null)
  const [bodyShape, setBodyShape] = useState<BodyShape | null>(null)
  const [aiCoachAnalysis, setAiCoachAnalysis] = useState("")
  const [processingStage, setProcessingStage] = useState("")
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showFrontPhoto, setShowFrontPhoto] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frontCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const facingModeRef = useRef<"user" | "environment">("environment")

  useEffect(() => { facingModeRef.current = facingMode }, [facingMode])
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  async function startCamera() {
    setCameraState("loading")
    setErrorMsg("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingModeRef.current }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (mountedRef.current) setCameraState("active")
    } catch {
      if (mountedRef.current) {
        setCameraState("error")
        setErrorMsg("Câmera indisponível. Verifique as permissões do navegador.")
      }
    }
  }

  async function switchCamera() {
    const next = facingMode === "user" ? "environment" : "user"
    facingModeRef.current = next
    setFacingMode(next)
    stopCamera()
    await startCamera()
  }

  // ─── MediaPipe detection ────────────────────────────────────────────────────

  async function loadPoseLandmarker() {
    const vision = await import("@mediapipe/tasks-vision")
    const { PoseLandmarker, FilesetResolver } = vision
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    )
    try {
      return await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      })
    } catch {
      return await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      })
    }
  }

  function drawSkeleton(ctx: CanvasRenderingContext2D, lm: Landmark[], W: number, H: number) {
    const connections = [
      [11, 12], [11, 23], [12, 24], [23, 24],
      [23, 25], [24, 26], [25, 27], [26, 28],
      [11, 13], [12, 14], [13, 15], [14, 16],
    ]
    ctx.strokeStyle = "#dc2626"
    ctx.lineWidth = 2.5
    ctx.shadowColor = "#dc2626"
    ctx.shadowBlur = 6
    for (const [a, b] of connections) {
      if (!lm[a] || !lm[b]) continue
      ctx.beginPath()
      ctx.moveTo(lm[a].x * W, lm[a].y * H)
      ctx.lineTo(lm[b].x * W, lm[b].y * H)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.fillStyle = "#ef4444"
    for (const p of lm) {
      if ((p.visibility ?? 0) < 0.3) continue
      ctx.beginPath()
      ctx.arc(p.x * W, p.y * H, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ─── Capture handlers ───────────────────────────────────────────────────────

  async function captureFront() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setProcessing(true)
    setProcessingStage("Capturando foto frontal...")
    setErrorMsg("")

    try {
      const W = video.videoWidth || 640
      const H = video.videoHeight || 480
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0, W, H)

      setProcessingStage("Carregando visão computacional...")
      const poseLandmarker = await loadPoseLandmarker()

      setProcessingStage("Detectando landmarks frontais...")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (poseLandmarker as any).detect(canvas) as { landmarks: Landmark[][] }
      poseLandmarker.close()

      if (!result.landmarks || result.landmarks.length === 0) {
        setErrorMsg("Nenhuma pessoa detectada. Afaste-se ~2m e fique de frente.")
        return
      }

      const lm = result.landmarks[0] as Landmark[]
      const keyLandmarks = [11, 12, 23, 24, 27, 28]
      if (!keyLandmarks.every(i => (lm[i]?.visibility ?? 0) > 0.3)) {
        setErrorMsg("Corpo não totalmente visível. Garanta cabeça, tronco e pernas apareçam.")
        return
      }

      setProcessingStage("Calculando proporções frontais...")
      const front = calcFrontMeasurements(lm, W, H)

      // Draw skeleton on canvas
      drawSkeleton(ctx, lm, W, H)

      // Save front photo as data URL
      const frontDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      // Save to separate canvas for display
      if (frontCanvasRef.current) {
        frontCanvasRef.current.width = W
        frontCanvasRef.current.height = H
        const fCtx = frontCanvasRef.current.getContext("2d")!
        fCtx.drawImage(canvas, 0, 0)
      }

      stopCamera()

      if (mountedRef.current) {
        setFrontMeasurements(front)
        setFrontImageData(frontDataUrl)
        setStep("camera_side")
        setCameraState("idle")
        setProcessingStage("")
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("Erro ao processar. Tente novamente.")
    } finally {
      if (mountedRef.current) {
        setProcessing(false)
        setProcessingStage("")
      }
    }
  }

  async function captureSide() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !frontMeasurements) return

    setProcessing(true)
    setProcessingStage("Capturando foto lateral...")
    setErrorMsg("")

    try {
      const W = video.videoWidth || 640
      const H = video.videoHeight || 480
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0, W, H)

      setProcessingStage("Detectando landmarks laterais...")
      const poseLandmarker = await loadPoseLandmarker()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (poseLandmarker as any).detect(canvas) as { landmarks: Landmark[][] }
      poseLandmarker.close()

      let side: SideMeasurements | null = null
      let posture: PostureScore | null = null

      if (result.landmarks && result.landmarks.length > 0) {
        const lm = result.landmarks[0] as Landmark[]
        setProcessingStage("Analisando profundidade e postura...")
        side = calcSideMeasurements(lm, W, H)
        posture = calcPostureScore(side)
        drawSkeleton(ctx, lm, W, H)
      }

      stopCamera()

      // Calculate combined ratios
      const r = calcRatios(frontMeasurements, side)
      const shape = classifyShape(r)
      const localAnalysis = generateLocalAnalysis(r, shape, posture)

      if (mountedRef.current) {
        setSideMeasurements(side)
        setPostureScore(posture)
        setRatios(r)
        setBodyShape(shape)
        setAiCoachAnalysis(localAnalysis)
        setStep("result")
        setProcessingStage("")
      }

      // AI coach — non-blocking
      setProcessingStage("Coach IA analisando...")
      try {
        const res = await fetch("/api/student/body-scan/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ratios: r,
            bodyShape: shape,
            measurements: frontMeasurements,
            sideMeasurements: side,
            postureScore: posture,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (mountedRef.current && data.analysis) setAiCoachAnalysis(data.analysis)
        }
      } catch { /* local analysis already shown */ }
    } catch (err) {
      console.error(err)
      setErrorMsg("Erro na captura lateral. Tente novamente.")
    } finally {
      if (mountedRef.current) {
        setProcessing(false)
        setProcessingStage("")
      }
    }
  }

  function skipSide() {
    if (!frontMeasurements) return
    stopCamera()
    const r = calcRatios(frontMeasurements, null)
    const shape = classifyShape(r)
    const localAnalysis = generateLocalAnalysis(r, shape, null)
    setRatios(r)
    setBodyShape(shape)
    setAiCoachAnalysis(localAnalysis)
    setStep("result")

    // AI coach
    fetch("/api/student/body-scan/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratios: r, bodyShape: shape, measurements: frontMeasurements }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.analysis && mountedRef.current) setAiCoachAnalysis(data.analysis) })
      .catch(() => {})
  }

  async function saveScan() {
    if (!frontMeasurements || !ratios || !bodyShape) return
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch("/api/student/body-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurements: frontMeasurements,
          ratios,
          bodyShape,
          aiAnalysis: aiCoachAnalysis,
          notes: postureScore ? `Postura: ${postureScore.overallScore}/100. ${postureScore.notes.join(" ")}` : null,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      setSaved(true)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setStep("camera_front")
    setCameraState("idle")
    setFrontMeasurements(null)
    setFrontImageData(null)
    setSideMeasurements(null)
    setPostureScore(null)
    setRatios(null)
    setBodyShape(null)
    setAiCoachAnalysis("")
    setProcessingStage("")
    setSaved(false)
    setSaveError(false)
    setErrorMsg("")
    setShowFrontPhoto(true)
    const canvas = canvasRef.current
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    const fCanvas = frontCanvasRef.current
    if (fCanvas) fCanvas.getContext("2d")?.clearRect(0, 0, fCanvas.width, fCanvas.height)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ─ RESULT VIEW ─ */}
      {step === "result" && ratios && bodyShape && (() => {
        const info = SHAPE_INFO[bodyShape]
        return (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                Resultado do Scan
              </h2>
              <button onClick={reset}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors py-2.5 px-3 -mr-3 rounded-xl">
                <RotateCcw className="w-3.5 h-3.5" /> Novo scan
              </button>
            </div>

            {/* Dual photo viewer */}
            {(frontImageData || canvasRef.current) && (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowFrontPhoto(true)}
                    className={cn("flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all",
                      showFrontPhoto ? "bg-red-600/20 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
                    )}>
                    Frontal
                  </button>
                  <button
                    onClick={() => setShowFrontPhoto(false)}
                    className={cn("flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all",
                      !showFrontPhoto ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
                    )}>
                    Lateral {sideMeasurements ? "" : "(pulada)"}
                  </button>
                </div>
              </div>
            )}

            {/* Body shape + AI coach */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <BodySvg shape={bodyShape} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-0.5">Formato corporal</p>
                <p className={cn("font-bold text-sm leading-tight", info.color)}>{info.label}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  Scan {sideMeasurements ? "completo (frente + lateral)" : "frontal"}
                </p>
              </div>
            </div>

            {/* AI Coach diagnosis */}
            <div className="rounded-2xl border border-red-600/20 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(24,24,27,0.5) 100%)" }}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
                <div className="w-6 h-6 rounded-lg bg-red-600/25 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-red-400" />
                </div>
                <p className="text-xs font-bold text-red-300">Coach Virtual — Diagnóstico</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-neutral-200 leading-relaxed">{aiCoachAnalysis}</p>
              </div>
            </div>

            {/* Posture Analysis (if side scan done) */}
            {postureScore && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 mb-3">
                  <Eye className="w-3.5 h-3.5" />
                  Análise Postural
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                    postureScore.overallScore >= 80 ? "bg-emerald-600/15 text-emerald-400" :
                    postureScore.overallScore >= 50 ? "bg-amber-600/15 text-amber-400" :
                    "bg-red-600/15 text-red-400"
                  )}>
                    {postureScore.overallScore}/100
                  </span>
                </p>
                <PostureIndicator label="Posição da cabeça" status={postureScore.headForward} />
                <PostureIndicator label="Alinhamento do tronco" status={postureScore.trunkAlignment} />
                {postureScore.notes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {postureScore.notes.map((n, i) => (
                      <p key={i} className="text-[10px] text-neutral-500 leading-relaxed">• {n}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Body Fat */}
            {(() => {
              const bf = estimateBodyFat({ weight, height, gender, birthDate, waistHipRatio: ratios.waistHip })
              if (!bf.average) return null
              const bfColor = bf.category === "Atlético" ? "text-emerald-400"
                : bf.category === "Fitness" ? "text-blue-400"
                : bf.category === "Normal" ? "text-amber-400"
                : bf.category === "Acima" ? "text-red-400"
                : "text-purple-400"
              return (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 mb-3">
                    <Activity className="w-3.5 h-3.5" />
                    Composição corporal estimada
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-xl bg-white/[0.03]">
                      <p className="text-lg font-black text-white">{bf.average}%</p>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Gordura</p>
                      <p className={cn("text-[9px] font-semibold mt-0.5", bfColor)}>{bf.category}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/[0.03]">
                      <p className="text-lg font-black text-white">{bf.bmi}</p>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider">IMC</p>
                      <p className="text-[9px] text-neutral-600 mt-0.5">{weight}kg</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/[0.03]">
                      <p className="text-lg font-black text-white">{Math.round(weight! * (1 - bf.average! / 100))}kg</p>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Massa magra</p>
                      <p className="text-[9px] text-neutral-600 mt-0.5">estimada</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-neutral-700 text-center mt-2">
                    Deurenberg ({bf.deurenberg}%) + Navy ({bf.navy}%) · Para precisão use bioimpedância
                  </p>
                </div>
              )
            })()}

            {/* Ratios */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5">
              <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                Proporções corporais
              </p>
              <RatioBar label="Ombro / Cintura" value={ratios.shoulderWaist} ideal="1.2–1.4 (V-shape)" />
              <RatioBar label="Ombro / Quadril" value={ratios.shoulderHip} ideal="1.0–1.25 (atlético)" />
              <RatioBar label="Cintura / Quadril" value={ratios.waistHip} ideal="< 0.80 (definição)" />
              <RatioBar label="Perna / Tronco" value={ratios.legTorso} ideal="1.0–1.2 (proporcional)" />
              {ratios.chestToWaistDepth && (
                <RatioBar label="Peito / Cintura (profundidade)" value={ratios.chestToWaistDepth} ideal="> 1.15 (peitoral desenvolvido)" />
              )}
              {ratios.gluteProjection && (
                <RatioBar label="Glúteo / Cintura (projeção)" value={ratios.gluteProjection} ideal="> 1.10 (glúteo desenvolvido)" />
              )}
            </div>

            {/* Tip */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-xs font-semibold text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                Sobre o {info.label}
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">{info.tip}</p>
            </div>

            {/* Save */}
            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">Erro ao salvar. Verifique sua conexão e tente novamente.</p>
              </div>
            )}
            <button onClick={saveScan} disabled={saving || saved}
              className={cn(
                "w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
                saved ? "bg-green-600/20 text-green-400 border border-green-500/20"
                  : "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
              )}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" />
                : saved ? <><CheckCircle2 className="w-4 h-4" />Scan salvo!</>
                : <><Save className="w-4 h-4" />Salvar scan</>}
            </button>
          </>
        )
      })()}

      {/* ─ CAMERA VIEW ─ */}
      {(step === "camera_front" || step === "camera_side") && (
        <>
          {/* Progress indicator */}
          <div className="flex gap-2">
            <div className={cn("flex-1 h-1 rounded-full transition-all",
              step === "camera_front" ? "bg-red-500" : "bg-red-500")}>
            </div>
            <div className={cn("flex-1 h-1 rounded-full transition-all",
              step === "camera_side" ? "bg-blue-500" : "bg-white/10")}>
            </div>
          </div>

          {/* Guide tip */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                step === "camera_front" ? "bg-red-600/15 text-red-400" : "bg-blue-600/15 text-blue-400"
              )}>
                {step === "camera_front" ? "Foto 1 de 2" : "Foto 2 de 2"}
              </span>
              <span className="text-xs font-semibold text-white">
                {step === "camera_front" ? "Posição frontal" : "Posição lateral"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {step === "camera_front"
                ? "Fique de FRENTE para a câmera. Corpo inteiro visível, braços levemente afastados, a ~2m."
                : "Agora fique de LADO (perfil). Mesma distância, corpo reto, braços naturais."}
            </p>
          </div>

          {/* Front photo preview (when on side step) */}
          {step === "camera_side" && frontImageData && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-900/20 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">Foto frontal capturada! Agora a lateral.</p>
            </div>
          )}

          {/* Camera viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5"
            style={{ aspectRatio: "3/4", maxHeight: "60vh" }}>
            {cameraState === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                <svg viewBox="0 0 80 120" className="w-20 h-32 opacity-15" fill="white">
                  {step === "camera_front" ? (
                    <>
                      <circle cx="40" cy="12" r="10" />
                      <line x1="40" y1="22" x2="40" y2="70" stroke="white" strokeWidth="4" />
                      <line x1="20" y1="35" x2="60" y2="35" stroke="white" strokeWidth="4" />
                      <line x1="40" y1="70" x2="25" y2="110" stroke="white" strokeWidth="4" />
                      <line x1="40" y1="70" x2="55" y2="110" stroke="white" strokeWidth="4" />
                    </>
                  ) : (
                    <>
                      <circle cx="40" cy="12" r="10" />
                      <line x1="40" y1="22" x2="42" y2="70" stroke="white" strokeWidth="4" />
                      <line x1="42" y1="35" x2="55" y2="50" stroke="white" strokeWidth="3" />
                      <line x1="42" y1="70" x2="38" y2="110" stroke="white" strokeWidth="4" />
                      <line x1="42" y1="70" x2="46" y2="110" stroke="white" strokeWidth="4" />
                    </>
                  )}
                </svg>
                <button onClick={startCamera}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 active:scale-[0.97] transition-all shadow-lg shadow-red-600/30 min-h-[48px]">
                  <Camera className="w-4 h-4" />
                  Abrir câmera
                </button>
              </div>
            )}

            {cameraState === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                <p className="text-xs text-neutral-500">Iniciando câmera...</p>
              </div>
            )}

            {cameraState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <p className="text-xs text-neutral-300 text-center font-medium">{errorMsg}</p>
                <button onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 min-h-[44px]">
                  Tentar novamente
                </button>
              </div>
            )}

            <video ref={videoRef}
              className={cn("absolute inset-0 w-full h-full object-cover", cameraState !== "active" && "invisible")}
              autoPlay playsInline muted />

            {/* Ghost silhouette */}
            {cameraState === "active" && (
              <svg viewBox="0 0 80 120" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                preserveAspectRatio="xMidYMid meet" fill="white">
                {step === "camera_front" ? (
                  <>
                    <circle cx="40" cy="10" r="9" />
                    <line x1="40" y1="19" x2="40" y2="65" stroke="white" strokeWidth="3" />
                    <line x1="18" y1="32" x2="62" y2="32" stroke="white" strokeWidth="3" />
                    <line x1="40" y1="65" x2="24" y2="105" stroke="white" strokeWidth="3" />
                    <line x1="40" y1="65" x2="56" y2="105" stroke="white" strokeWidth="3" />
                  </>
                ) : (
                  <>
                    <circle cx="40" cy="10" r="9" />
                    <line x1="40" y1="19" x2="42" y2="65" stroke="white" strokeWidth="3" />
                    <line x1="42" y1="32" x2="55" y2="48" stroke="white" strokeWidth="2.5" />
                    <line x1="42" y1="65" x2="38" y2="105" stroke="white" strokeWidth="3" />
                    <line x1="42" y1="65" x2="46" y2="105" stroke="white" strokeWidth="3" />
                  </>
                )}
              </svg>
            )}

            {cameraState === "active" && (
              <button onClick={switchCamera} aria-label="Trocar câmera"
                className="absolute top-3 right-3 w-11 h-11 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform">
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {errorMsg && cameraState === "active" && (
              <div className="absolute bottom-24 inset-x-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-amber-500/30">
                <p className="text-xs text-amber-200 text-center">{errorMsg}</p>
              </div>
            )}

            {cameraState === "active" && (
              <div className="absolute bottom-5 inset-x-0 flex justify-center">
                <button
                  onClick={step === "camera_front" ? captureFront : captureSide}
                  disabled={processing}
                  className="w-[72px] h-[72px] rounded-full bg-red-600 border-4 border-white/25 flex items-center justify-center shadow-2xl shadow-red-600/50 hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50"
                  aria-label="Capturar">
                  {processing ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <div className="w-9 h-9 rounded-full bg-white/20" />}
                </button>
              </div>
            )}
          </div>

          {/* Skip side button */}
          {step === "camera_side" && !processing && (
            <button onClick={skipSide}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
              Pular foto lateral (menos preciso)
            </button>
          )}

          {processing && processingStage && (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
              <p className="text-xs text-neutral-400">{processingStage}</p>
            </div>
          )}

          {errorMsg && !processing && cameraState !== "active" && cameraState !== "error" && (
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </>
      )}

      {/* Canvases — always in DOM */}
      <canvas ref={frontCanvasRef}
        className={cn("w-full rounded-2xl border border-white/5", step === "result" && showFrontPhoto ? "block" : "hidden")} />
      <canvas ref={canvasRef}
        className={cn("w-full rounded-2xl border border-white/5", step === "result" && !showFrontPhoto ? "block" : "hidden")} />
    </div>
  )
}
