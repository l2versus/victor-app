"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Camera, X, Loader2, ChevronRight, Check, AlertTriangle,
  Save, RotateCcw, SwitchCamera, PersonStanding,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LANDMARKS, type Point, detectCameraView } from "@/lib/posture-rules"
import {
  buildAssessmentResult,
  type AssessmentResult,
  type PosturalFinding,
} from "@/lib/postural-assessment-engine"
import { CORRECTIVE_NAMES } from "@/lib/postural-corrective-map"
import Link from "next/link"

type Step = "instructions" | "camera_front" | "camera_lateral" | "processing" | "result"

interface HistoryItem {
  id: string
  overallScore: number
  severeCount: number
  moderateCount: number
  mildCount: number
  createdAt: string
}

export function PosturalAssessmentWizard({ history }: { history: HistoryItem[] }) {
  const [step, setStep] = useState<Step>("instructions")
  const [frontalLandmarks, setFrontalLandmarks] = useState<Point[] | null>(null)
  const [lateralLandmarks, setLateralLandmarks] = useState<Point[] | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [viewValid, setViewValid] = useState(false)
  const [validationMsg, setValidationMsg] = useState("")
  const poseLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)

  // ═══ CAMERA ═══

  const startCamera = useCallback(async () => {
    setCameraReady(false)
    setViewValid(false)
    setError("")
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch {
      setError("Permissão de câmera negada. Habilite nas configurações.")
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setCameraReady(false)
  }, [])

  // Load MediaPipe PoseLandmarker
  const loadPoseLandmarker = useCallback(async () => {
    if (poseLandmarkerRef.current) return
    try {
      const vision = await import("@mediapipe/tasks-vision")
      const { PoseLandmarker, FilesetResolver } = vision
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      })
      poseLandmarkerRef.current = landmarker
    } catch {
      // Fallback to CPU
      try {
        const vision = await import("@mediapipe/tasks-vision")
        const { PoseLandmarker, FilesetResolver } = vision
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        })
        poseLandmarkerRef.current = landmarker
      } catch (err) {
        console.error("[PosturalAssessment] Failed to load PoseLandmarker:", err)
        setError("Erro ao carregar modelo de IA. Tente recarregar a página.")
      }
    }
  }, [])

  // Start camera when entering camera steps
  useEffect(() => {
    if (step === "camera_front" || step === "camera_lateral") {
      startCamera()
      loadPoseLandmarker()
      return () => stopCamera()
    }
  }, [step, startCamera, stopCamera, loadPoseLandmarker])

  // Live preview validation loop
  useEffect(() => {
    if (!cameraReady || (step !== "camera_front" && step !== "camera_lateral")) return

    const expectedView = step === "camera_front" ? "front" : "side"
    let running = true

    const checkLoop = () => {
      if (!running || !videoRef.current || !poseLandmarkerRef.current) {
        animFrameRef.current = requestAnimationFrame(checkLoop)
        return
      }

      try {
        const landmarker = poseLandmarkerRef.current as { detect: (img: HTMLVideoElement) => { landmarks: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> } }

        // Use VIDEO mode for preview — switch temporarily
        const result = landmarker.detect(videoRef.current)
        if (result.landmarks && result.landmarks[0]) {
          const lm = result.landmarks[0] as Point[]
          const viewResult = detectCameraView(lm)

          // Check minimum visibility
          const keyPoints = [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP]
          const allVisible = keyPoints.every(idx => lm[idx] && (lm[idx].z === undefined || Math.abs(lm[idx].z!) < 0.8))

          if (!allVisible) {
            setViewValid(false)
            setValidationMsg("Corpo não totalmente visível. Afaste-se da câmera.")
          } else if (expectedView === "front" && viewResult.view !== "front") {
            setViewValid(false)
            setValidationMsg("Posicione-se de frente para a câmera")
          } else if (expectedView === "side" && viewResult.view !== "side") {
            setViewValid(false)
            setValidationMsg("Posicione-se de lado para a câmera")
          } else {
            setViewValid(true)
            setValidationMsg("")
          }
        } else {
          setViewValid(false)
          setValidationMsg("Nenhuma pessoa detectada. Afaste-se ~2m.")
        }
      } catch {
        // Silently retry
      }

      if (running) animFrameRef.current = requestAnimationFrame(checkLoop)
    }

    // Start with delay to let camera stabilize
    const timeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(checkLoop)
    }, 1000)

    return () => {
      running = false
      clearTimeout(timeout)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [cameraReady, step])

  // ═══ CAPTURE ═══

  async function handleCapture() {
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)

    try {
      const landmarker = poseLandmarkerRef.current as { detect: (img: HTMLCanvasElement) => { landmarks: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> } }
      const result = landmarker.detect(canvas)

      if (!result.landmarks || !result.landmarks[0]) {
        setError("Nenhuma pessoa detectada. Tente novamente.")
        return
      }

      const lm = result.landmarks[0] as Point[]

      if (step === "camera_front") {
        setFrontalLandmarks(lm)
        stopCamera()
        setStep("camera_lateral")
      } else if (step === "camera_lateral") {
        setLateralLandmarks(lm)
        stopCamera()
        processResults(frontalLandmarks!, lm)
      }
    } catch (err) {
      console.error("[PosturalAssessment] Capture error:", err)
      setError("Erro na análise. Tente novamente.")
    }
  }

  function skipLateral() {
    stopCamera()
    processResults(frontalLandmarks!, null)
  }

  function processResults(frontal: Point[], lateral: Point[] | null) {
    setStep("processing")
    const assessmentResult = buildAssessmentResult(frontal, lateral)
    setResult(assessmentResult)
    setStep("result")
  }

  // ═══ SAVE ═══

  async function handleSave() {
    if (!result || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/student/postural-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao salvar")
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar avaliação")
    } finally {
      setSaving(false)
    }
  }

  function restart() {
    setStep("instructions")
    setFrontalLandmarks(null)
    setLateralLandmarks(null)
    setResult(null)
    setSaved(false)
    setError("")
  }

  // ═══ RENDER ═══

  // --- Instructions ---
  if (step === "instructions") {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 flex items-center justify-center mx-auto">
            <PersonStanding className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Avaliação Postural</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Análise de 12 desvios posturais baseada em evidência científica.
            Kendall (2005), Sahrmann (2002), NASM CPT.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Como funciona</h3>
          {[
            { n: "1", t: "Vista Frontal", d: "Fique de frente, braços relaxados ao lado" },
            { n: "2", t: "Vista Lateral", d: "Perfil, postura natural (pode pular)" },
            { n: "3", t: "Resultado", d: "Score 0-100, desvios e exercícios corretivos" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">{s.n}</div>
              <div>
                <p className="text-xs font-semibold text-white">{s.t}</p>
                <p className="text-[10px] text-neutral-500">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
          <p className="text-[10px] text-amber-300/80 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Use roupa justa ou top esportivo. Fundo neutro, boa iluminação. Afaste-se ~2m da câmera. <strong>Não substitui avaliação médica.</strong></span>
          </p>
        </div>

        <button
          onClick={() => setStep("camera_front")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/20 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] transition-all"
        >
          <Camera className="w-4 h-4" />
          Iniciar Avaliação
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Histórico</h3>
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <p className="text-xs text-neutral-400">
                    {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    {h.severeCount > 0 && <span className="text-[9px] text-red-400">{h.severeCount} grave</span>}
                    {h.moderateCount > 0 && <span className="text-[9px] text-orange-400">{h.moderateCount} moderado</span>}
                    {h.mildCount > 0 && <span className="text-[9px] text-amber-400">{h.mildCount} leve</span>}
                  </div>
                </div>
                <ScoreBadge score={h.overallScore} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // --- Camera (Front / Lateral) ---
  if (step === "camera_front" || step === "camera_lateral") {
    const isFront = step === "camera_front"
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              {isFront ? "Vista Frontal" : "Vista Lateral"}
            </h2>
            <p className="text-[10px] text-neutral-500">
              {isFront ? "Fique de frente, braços ao lado do corpo" : "Posicione-se de perfil"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}
              className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-400">
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button onClick={() => { stopCamera(); setStep("instructions") }}
              className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/[0.08]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Silhouette guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={cn(
              "border-2 border-dashed rounded-3xl transition-colors duration-300",
              isFront ? "w-[45%] h-[85%]" : "w-[30%] h-[85%]",
              viewValid ? "border-emerald-500/50" : "border-neutral-600/50"
            )} />
          </div>

          {/* Validation message */}
          {validationMsg && (
            <div className="absolute bottom-14 left-4 right-4">
              <div className="px-3 py-2 rounded-xl bg-black/70 backdrop-blur-sm text-center">
                <p className="text-[10px] text-amber-400">{validationMsg}</p>
              </div>
            </div>
          )}

          {/* Capture button */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={handleCapture}
              disabled={!cameraReady}
              className={cn(
                "w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-90",
                viewValid
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-neutral-600 bg-white/10"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full transition-colors",
                viewValid ? "bg-emerald-500" : "bg-neutral-700"
              )} />
            </button>
          </div>
        </div>

        {/* Skip lateral */}
        {step === "camera_lateral" && (
          <button onClick={skipLateral}
            className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            Pular vista lateral →
          </button>
        )}
      </div>
    )
  }

  // --- Processing ---
  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-sm text-neutral-400">Analisando postura...</p>
      </div>
    )
  }

  // --- Result ---
  if (step === "result" && result) {
    const frontalFindings = result.findings.filter(f => f.view === "frontal")
    const lateralFindings = result.findings.filter(f => f.view === "lateral")
    const abnormalFindings = result.findings.filter(f => f.severity !== "normal")
    const [tab, setTab] = useState<"frontal" | "lateral">("frontal")

    return (
      <div className="space-y-4">
        {/* Score */}
        <div className="text-center space-y-2">
          <ScoreRing score={result.overallScore} />
          <h2 className="text-lg font-bold text-white">Avaliação Completa</h2>
          <div className="flex items-center justify-center gap-3">
            {result.severeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-semibold border border-red-500/20">
                {result.severeCount} grave{result.severeCount > 1 ? "s" : ""}
              </span>
            )}
            {result.moderateCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-semibold border border-orange-500/20">
                {result.moderateCount} moderado{result.moderateCount > 1 ? "s" : ""}
              </span>
            )}
            {result.mildCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                {result.mildCount} leve{result.mildCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Findings tabs */}
        <div className="flex gap-1">
          <button onClick={() => setTab("frontal")}
            className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
              tab === "frontal" ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-neutral-500 border border-transparent"
            )}>
            Frontal ({frontalFindings.length})
          </button>
          {lateralFindings.length > 0 && (
            <button onClick={() => setTab("lateral")}
              className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
                tab === "lateral" ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-neutral-500 border border-transparent"
              )}>
              Lateral ({lateralFindings.length})
            </button>
          )}
        </div>

        {/* Findings list */}
        <div className="space-y-2">
          {(tab === "frontal" ? frontalFindings : lateralFindings).map(f => (
            <FindingRow key={f.key} finding={f} />
          ))}
        </div>

        {/* Corrective exercises */}
        {abnormalFindings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Exercícios Corretivos Recomendados
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {result.correctiveExerciseIds.map(id => (
                <Link key={id} href={`/posture?exercise=${encodeURIComponent(CORRECTIVE_NAMES[id] || id)}`}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/15 hover:bg-emerald-500/20 transition-colors">
                  {CORRECTIVE_NAMES[id] || id}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl bg-neutral-800/30 border border-white/[0.04] p-3">
          <p className="text-[9px] text-neutral-600 leading-relaxed">
            Esta avaliação é um screening automatizado e não substitui diagnóstico médico ou
            avaliação presencial por fisioterapeuta. Precisão estimada: ~85% (correlação com
            captura de movimento clínica). Baseado em: Kendall (2005), Sahrmann (2002), NASM CPT.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={restart}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs font-semibold hover:bg-white/[0.06] transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            Nova Avaliação
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
              saved
                ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-[0.98]"
            )}>
            {saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> :
             saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             <><Save className="w-3.5 h-3.5" /> Salvar Resultado</>}
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}
      </div>
    )
  }

  return null
}

// ═══ Sub-components ═══

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/20"
    : score >= 60 ? "text-amber-400 bg-amber-500/15 border-amber-500/20"
    : score >= 40 ? "text-orange-400 bg-orange-500/15 border-orange-500/20"
    : "text-red-400 bg-red-500/15 border-red-500/20"

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border tabular-nums", color)}>
      {score}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f87171"

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider">score</span>
      </div>
    </div>
  )
}

function FindingRow({ finding }: { finding: PosturalFinding }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className={cn("w-2 h-2 rounded-full shrink-0", {
        "bg-emerald-400": finding.severity === "normal",
        "bg-amber-400": finding.severity === "mild",
        "bg-orange-400": finding.severity === "moderate",
        "bg-red-400": finding.severity === "severe",
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white">{finding.label}</p>
        <p className="text-[10px] text-neutral-500">
          {finding.measuredValue.toFixed(1)}° — ref: {finding.referenceNormal}
        </p>
      </div>
      <span className={cn("text-[10px] font-semibold", finding.colorClass)}>
        {finding.severityLabel}
      </span>
    </div>
  )
}
