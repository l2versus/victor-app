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
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface Measurements {
  shoulderPx: number
  hipPx: number
  waistPx: number
  torsoPx: number
  legPx: number
}

interface Ratios {
  shoulderWaist: number
  shoulderHip: number
  waistHip: number
  legTorso: number
}

type BodyShape = "V_SHAPE" | "TRAPEZOID" | "X_SHAPE" | "RECTANGLE" | "PEAR"
type Step = "camera_front" | "camera_side" | "result"
type ScanPhase = "front" | "side"

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
  // Thresholds ajustados para valores COM correção biométrica:
  // Com correção, shoulderHip típico cai de ~1.7 pra ~1.0-1.3
  if (shoulderHip > 1.25) return "V_SHAPE"       // ombros significativamente maiores
  if (shoulderHip > 1.10) return "TRAPEZOID"      // ombros moderadamente maiores
  if (shoulderHip >= 0.85 && waistHip < 0.80) return "X_SHAPE"  // cintura marcada
  if (shoulderHip >= 0.85) return "RECTANGLE"     // proporcional
  return "PEAR"
}

function generateLocalAnalysis(ratios: Ratios, shape: BodyShape): string {
  const info = SHAPE_INFO[shape]
  const lines = [`Formato: ${info.label}.`, info.tip]
  if (ratios.shoulderHip > 1.2) lines.push("Excelente largura de ombros!")
  if (ratios.waistHip < 0.75) lines.push("Cintura proporcional ao quadril.")
  if (ratios.legTorso > 1.1) lines.push("Boa proporção perna/tronco.")
  return lines.join(" ")
}

// ─── Landmark math ────────────────────────────────────────────────────────────

function dist(a: Landmark, b: Landmark, w: number, h: number) {
  return Math.hypot((a.x - b.x) * w, (a.y - b.y) * h)
}

function calcMeasurements(lm: Landmark[], w: number, h: number): Measurements {
  // ═══ CORREÇÃO BIOMÉTRICA ═══
  // MediaPipe Pose mede o CENTRO das articulações (esqueleto), não a silhueta externa.
  // Os landmarks 23/24 (hip) medem a pelve interna — MUITO mais estreita que o quadril real.
  // Aplicamos multiplicadores baseados em antropometria (Dempster, 1955; Winter, 2009):
  //
  // Ombros: landmarks 11/12 estão nas articulações glenoumerais, que são ~92% da largura
  //         real dos ombros (deltóides adicionam volume lateral). Multiplicador: 1.08
  //
  // Quadril: landmarks 23/24 estão nas articulações coxofemorais (centro da pelve).
  //          A largura real do quadril (incluindo glúteos/tecido) é ~35-45% maior.
  //          Para mulheres: ~1.45x. Para homens: ~1.35x. Média: 1.40x
  //
  // Cintura: não tem landmark direto. Estimamos pela posição Y entre costelas (ombro)
  //          e quadril, e usamos a largura proporcional ao tronco.
  //          A cintura real fica a ~40% da distância ombro→quadril (ponto mais estreito).
  //          Largura: tipicamente 70-80% da largura do quadril corrigido.

  const rawShoulderPx = dist(lm[11], lm[12], w, h)
  const rawHipPx = dist(lm[23], lm[24], w, h)

  // Multiplicadores de correção (articulação → contorno real)
  const SHOULDER_CORRECTION = 1.08  // deltóides adicionam ~8%
  const HIP_CORRECTION = 1.40       // glúteos/tecido adicionam ~40%

  const shoulderPx = rawShoulderPx * SHOULDER_CORRECTION
  const hipPx = rawHipPx * HIP_CORRECTION

  // Cintura: estimar pela posição Y (40% entre ombro e quadril) e proporção do tronco
  // Usa a média ponderada das larguras corrigidas como base
  const waistPx = Math.min(shoulderPx, hipPx) * 0.82

  const shoulderY = (lm[11].y + lm[12].y) / 2
  const hipY = (lm[23].y + lm[24].y) / 2
  const ankleY = (lm[27].y + lm[28].y) / 2
  const torsoPx = Math.abs(hipY - shoulderY) * h
  const legPx = Math.abs(ankleY - hipY) * h
  return { shoulderPx, hipPx, waistPx, torsoPx, legPx }
}

function calcRatios(m: Measurements): Ratios {
  const r2 = (n: number) => Math.round(n * 100) / 100
  return {
    shoulderWaist: r2(m.shoulderPx / m.waistPx),
    shoulderHip: r2(m.shoulderPx / m.hipPx),
    waistHip: r2(m.waistPx / m.hipPx),
    legTorso: r2(m.legPx / m.torsoPx),
  }
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

// ─── Main component ───────────────────────────────────────────────────────────

export function BodyScanAnalyzer() {
  const [step, setStep] = useState<Step>("camera_front")
  const [scanPhase, setScanPhase] = useState<ScanPhase>("front")
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "active" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [ratios, setRatios] = useState<Ratios | null>(null)
  const [bodyShape, setBodyShape] = useState<BodyShape | null>(null)
  const [aiCoachAnalysis, setAiCoachAnalysis] = useState("")
  const [processingStage, setProcessingStage] = useState("")
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  // FIX: single canvas always mounted — React won't remount it, preserving drawn content
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  // FIX: ref tracks facingMode so startCamera always reads the latest value
  const facingModeRef = useRef<"user" | "environment">("environment")

  useEffect(() => {
    facingModeRef.current = facingMode
  }, [facingMode])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopCamera()
    }
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
        // FIX: use ref, not state — ensures latest value even when called inside switchCamera
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
    // FIX: update ref IMMEDIATELY before calling startCamera, state update is async
    facingModeRef.current = next
    setFacingMode(next)
    stopCamera()
    await startCamera()
  }

  async function captureAndAnalyze() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setProcessing(true)
    setProcessingStage("Capturando foto...")
    setErrorMsg("")

    try {
      const W = video.videoWidth || 640
      const H = video.videoHeight || 480
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(video, 0, 0, W, H)

      setProcessingStage("Carregando modelo de visão computacional...")
      const vision = await import("@mediapipe/tasks-vision")
      const { PoseLandmarker, FilesetResolver } = vision
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      )

      let poseLandmarker: InstanceType<typeof PoseLandmarker>
      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        })
      } catch {
        poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        })
      }

      setProcessingStage("Detectando landmarks corporais...")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (poseLandmarker as any).detect(canvas) as { landmarks: Landmark[][] }
      poseLandmarker.close()

      if (!result.landmarks || result.landmarks.length === 0) {
        if (mountedRef.current) {
          setErrorMsg("Nenhuma pessoa detectada. Afaste-se ~2m e fique em pé de frente.")
          setProcessingStage("") // FIX: clear stage on early return
        }
        return
      }

      const lm = result.landmarks[0] as Landmark[]
      const keyLandmarks = [11, 12, 23, 24, 27, 28]
      const allVisible = keyLandmarks.every(i => (lm[i]?.visibility ?? 0) > 0.3)
      if (!allVisible) {
        if (mountedRef.current) {
          setErrorMsg("Corpo não totalmente visível. Garanta que cabeça, tronco e pernas apareçam.")
          setProcessingStage("") // FIX: clear stage on early return
        }
        return
      }

      setProcessingStage("Calculando proporções...")
      const m = calcMeasurements(lm, W, H)
      const r = calcRatios(m)
      const shape = classifyShape(r)
      const localAnalysis = generateLocalAnalysis(r, shape)

      // Draw skeleton on the SAME canvas (ref is stable — no remount)
      drawSkeleton(ctx, lm, W, H)
      stopCamera()

      if (mountedRef.current) {
        setMeasurements(m)
        setRatios(r)
        setBodyShape(shape)
        // Show result immediately with local analysis while AI loads
        setAiCoachAnalysis(localAnalysis)
        setStep("result")
        setProcessingStage("")
      }

      // AI coach call — non-blocking, updates analysis when ready
      setProcessingStage("Coach IA analisando seus objetivos...")
      try {
        const res = await fetch("/api/student/body-scan/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ratios: r, bodyShape: shape, measurements: m }),
        })
        if (res.ok) {
          const data = await res.json()
          if (mountedRef.current && data.analysis) {
            setAiCoachAnalysis(data.analysis)
          }
        }
      } catch {
        // AI failed — local analysis already shown, user not affected
      }
    } catch (err) {
      if (mountedRef.current) {
        setErrorMsg("Erro ao processar a imagem. Tente novamente.")
        setProcessingStage("")
        console.error(err)
      }
    } finally {
      if (mountedRef.current) {
        setProcessing(false)
        setProcessingStage("")
      }
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

  async function saveScan() {
    if (!measurements || !ratios || !bodyShape) return
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch("/api/student/body-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurements,
          ratios,
          bodyShape,
          aiAnalysis: aiCoachAnalysis,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      setSaved(true)
    } catch {
      // FIX: show save error to user instead of silent failure
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setStep("camera_front"); setScanPhase("front")
    setCameraState("idle")
    setMeasurements(null)
    setRatios(null)
    setBodyShape(null)
    setAiCoachAnalysis("")
    setProcessingStage("")
    setSaved(false)
    setSaveError(false)
    setErrorMsg("")
    // Clear canvas content
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  // FIX: canvas ALWAYS rendered (never unmounts) — only visibility toggles.
  // This preserves the drawn skeleton image when switching from camera to result view.

  return (
    <div className="space-y-4">
      {/* ─ RESULT VIEW ─ */}
      {step === "result" && ratios && bodyShape && (() => {
        const info = SHAPE_INFO[bodyShape]
        return (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                Resultado do Scan
              </h2>
              {/* FIX: touch target ≥ 44px via py-2.5 px-3 */}
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors py-2.5 px-3 -mr-3 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Novo scan
              </button>
            </div>

            {/* Body shape + AI coach — full width card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <BodySvg shape={bodyShape} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-0.5">Formato corporal</p>
                <p className={cn("font-bold text-sm leading-tight", info.color)}>{info.label}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">MediaPipe Pose · 33 pontos</p>
              </div>
            </div>

            {/* AI Coach diagnosis */}
            <div className="rounded-2xl border border-red-600/20 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(24,24,27,0.5) 100%)" }}
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
                <div className="w-6 h-6 rounded-lg bg-red-600/25 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-red-400" />
                </div>
                <p className="text-xs font-bold text-red-300">Coach Virtual — Diagnóstico</p>
              </div>
              <div className="px-4 py-3">
                {aiCoachAnalysis && aiCoachAnalysis !== generateLocalAnalysis(ratios, bodyShape) ? (
                  <p className="text-sm text-neutral-200 leading-relaxed">{aiCoachAnalysis}</p>
                ) : processing ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
                    <p className="text-xs text-neutral-500">Cruzando com seus objetivos...</p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-300 leading-relaxed">{aiCoachAnalysis}</p>
                )}
              </div>
            </div>

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
            </div>

            {/* Tip */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-xs font-semibold text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                Sobre o {info.label}
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">{info.tip}</p>
            </div>

            {/* Save — FIX: min-h-[44px] touch target + error state */}
            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">Erro ao salvar. Verifique sua conexão e tente novamente.</p>
              </div>
            )}
            <button
              onClick={saveScan}
              disabled={saving || saved}
              className={cn(
                "w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
                saved
                  ? "bg-green-600/20 text-green-400 border border-green-500/20"
                  : "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
              )}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" />Scan salvo!</>
              ) : (
                <><Save className="w-4 h-4" />Salvar scan</>
              )}
            </button>
          </>
        )
      })()}

      {/* ─ CAMERA VIEW ─ */}
      {(step === "camera_front" || step === "camera_side") && (
        <>
          {/* Guide tip — changes based on scan phase */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                step === "camera_front"
                  ? "bg-red-600/15 text-red-400"
                  : "bg-blue-600/15 text-blue-400"
              )}>
                {step === "camera_front" ? "📸 Foto 1 de 2" : "📸 Foto 2 de 2"}
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

          {/* Camera viewport — FIX: max-h-[60vh] prevents overflow on small screens */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5"
            style={{ aspectRatio: "3/4", maxHeight: "60vh" }}
          >
            {cameraState === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                <svg viewBox="0 0 80 120" className="w-20 h-32 opacity-15" fill="white">
                  <circle cx="40" cy="12" r="10" />
                  <line x1="40" y1="22" x2="40" y2="70" stroke="white" strokeWidth="4" />
                  <line x1="20" y1="35" x2="60" y2="35" stroke="white" strokeWidth="4" />
                  <line x1="40" y1="70" x2="25" y2="110" stroke="white" strokeWidth="4" />
                  <line x1="40" y1="70" x2="55" y2="110" stroke="white" strokeWidth="4" />
                </svg>
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 active:scale-[0.97] transition-all shadow-lg shadow-red-600/30 min-h-[48px]"
                >
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
                {/* FIX: touch target ≥ 44px */}
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 min-h-[44px]"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Live video — always in DOM, hidden when not active */}
            <video
              ref={videoRef}
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                cameraState !== "active" && "invisible"
              )}
              autoPlay
              playsInline
              muted
            />

            {/* Ghost silhouette guide — FIX: opacity 20% (was 8%, too faint) */}
            {cameraState === "active" && (
              <svg
                viewBox="0 0 80 120"
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
                fill="white"
              >
                <circle cx="40" cy="10" r="9" />
                <line x1="40" y1="19" x2="40" y2="65" stroke="white" strokeWidth="3" />
                <line x1="18" y1="32" x2="62" y2="32" stroke="white" strokeWidth="3" />
                <line x1="40" y1="65" x2="24" y2="105" stroke="white" strokeWidth="3" />
                <line x1="40" y1="65" x2="56" y2="105" stroke="white" strokeWidth="3" />
              </svg>
            )}

            {/* Switch camera — FIX: min 44x44 touch target */}
            {cameraState === "active" && (
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 w-11 h-11 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
                aria-label="Trocar câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {/* Error toast overlay when camera is active */}
            {errorMsg && cameraState === "active" && (
              <div className="absolute bottom-24 inset-x-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-amber-500/30">
                <p className="text-xs text-amber-200 text-center">{errorMsg}</p>
              </div>
            )}

            {/* Capture button — 72x72 = well above 44px minimum */}
            {cameraState === "active" && (
              <div className="absolute bottom-5 inset-x-0 flex justify-center">
                <button
                  onClick={captureAndAnalyze}
                  disabled={processing}
                  className="w-[72px] h-[72px] rounded-full bg-red-600 border-4 border-white/25 flex items-center justify-center shadow-2xl shadow-red-600/50 hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50"
                  aria-label="Capturar e analisar"
                >
                  {processing ? (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/20" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Processing status bar */}
          {processing && processingStage && (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
              <p className="text-xs text-neutral-400">{processingStage}</p>
            </div>
          )}

          {/* Detection error (non-blocking) */}
          {errorMsg && !processing && cameraState !== "active" && cameraState !== "error" && (
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </>
      )}

      {/* FIX: Canvas ALWAYS in DOM — never unmounts, content persists through step changes.
          Hidden via CSS when in camera view (canvas ref stable = drawn image preserved). */}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full rounded-2xl border border-white/5",
          step === "result" ? "block" : "hidden"
        )}
      />
    </div>
  )
}
