"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Camera, X, Loader2, Check, AlertTriangle,
  Save, RotateCcw, SwitchCamera, Dumbbell, Share2,
  ChevronDown, ArrowDown, ArrowUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LANDMARKS, type Point } from "@/lib/posture-rules"
import {
  detectSquatPhase,
  analyzeSquatRep,
  buildSquatAssessment,
  type SquatRepResult,
  type SquatAssessmentResult,
  type SquatPhase,
} from "@/lib/overhead-squat-engine"

type Step = "instructions" | "camera" | "result"

export function OverheadSquatWizard() {
  const [step, setStep] = useState<Step>("instructions")
  const [result, setResult] = useState<SquatAssessmentResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const poseLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)

  // Squat tracking
  const [repCount, setRepCount] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<SquatPhase["phase"]>("standing")
  const [kneeAngle, setKneeAngle] = useState(180)
  const [isRecording, setIsRecording] = useState(false)
  const repsRef = useRef<SquatRepResult[]>([])
  const phaseRef = useRef<SquatPhase["phase"]>("standing")
  const phaseTimestampRef = useRef<number>(0)
  const bottomLandmarksRef = useRef<Point[] | null>(null)
  const deepestAngleRef = useRef<number>(999)
  const targetReps = 5
  const MIN_PHASE_MS = 300 // debounce: minimum ms before accepting phase change

  // ═══ CAMERA ═══

  const startCamera = useCallback(async () => {
    setCameraReady(false)
    setError("")
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
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
    } catch (err) {
      console.error("[OverheadSquat] Camera error:", err)
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError": setError("Permissão de câmera negada."); break
          case "NotFoundError": setError("Nenhuma câmera encontrada."); break
          case "NotReadableError": setError("Câmera em uso por outro app."); break
          default: setError(`Erro de câmera: ${err.message}`)
        }
      } else {
        setError("Erro ao acessar câmera.")
      }
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

  const loadPoseLandmarker = useCallback(async () => {
    if (poseLandmarkerRef.current) return
    try {
      const vision = await import("@mediapipe/tasks-vision")
      const { PoseLandmarker, FilesetResolver } = vision
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      const landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })
      poseLandmarkerRef.current = landmarker
      setModelReady(true)
    } catch (gpuErr) {
      console.warn("[OverheadSquat] GPU delegate failed, falling back to CPU:", gpuErr)
      try {
        const vision = await import("@mediapipe/tasks-vision")
        const { PoseLandmarker, FilesetResolver } = vision
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })
        poseLandmarkerRef.current = landmarker
        setModelReady(true)
      } catch (err) {
        console.error("[OverheadSquat] PoseLandmarker failed:", err)
        setError("Erro ao carregar modelo de IA.")
      }
    }
  }, [])

  useEffect(() => {
    if (step === "camera") {
      startCamera()
      loadPoseLandmarker()
      return () => stopCamera()
    }
  }, [step, startCamera, stopCamera, loadPoseLandmarker])

  // ═══ REAL-TIME ANALYSIS LOOP ═══

  useEffect(() => {
    if (!cameraReady || step !== "camera" || !isRecording) return
    let running = true
    let lastTime = 0
    let consecutiveErrors = 0

    const loop = (timestamp: number) => {
      if (!running || !videoRef.current || !poseLandmarkerRef.current) {
        if (running) animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      // Throttle to ~15fps for performance
      if (timestamp - lastTime < 66) {
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }
      lastTime = timestamp

      try {
        const landmarker = poseLandmarkerRef.current as {
          detectForVideo: (img: HTMLVideoElement, ts: number) => {
            landmarks: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>
          }
        }
        const result = landmarker.detectForVideo(videoRef.current!, timestamp)

        consecutiveErrors = 0

        if (result.landmarks?.[0]) {
          const lm = result.landmarks[0] as Point[]
          const L = LANDMARKS

          // Calculate knee angle for phase detection
          const angle = Math.round(
            (180 / Math.PI) * Math.abs(
              Math.atan2(lm[L.LEFT_ANKLE].y - lm[L.LEFT_KNEE].y, lm[L.LEFT_ANKLE].x - lm[L.LEFT_KNEE].x) -
              Math.atan2(lm[L.LEFT_HIP].y - lm[L.LEFT_KNEE].y, lm[L.LEFT_HIP].x - lm[L.LEFT_KNEE].x)
            )
          )

          setKneeAngle(angle)

          const candidatePhase = detectSquatPhase(angle, phaseRef.current)

          // Debounce: only accept phase change after MIN_PHASE_MS in current phase
          const now = performance.now()
          const dwellOk = (now - phaseTimestampRef.current) >= MIN_PHASE_MS
          const newPhase = (candidatePhase !== phaseRef.current && dwellOk)
            ? candidatePhase
            : phaseRef.current

          // Track deepest angle during descent to avoid losing fast "bottom" phases
          if ((phaseRef.current === "descending" || phaseRef.current === "bottom") && angle < deepestAngleRef.current) {
            if (angle < 120) { // near-bottom zone: capture landmarks at deepest point
              deepestAngleRef.current = angle
              bottomLandmarksRef.current = lm
            }
          }

          if (newPhase !== phaseRef.current) {
            // Detect bottom of squat — capture landmarks for analysis
            if (newPhase === "bottom") {
              bottomLandmarksRef.current = lm
              deepestAngleRef.current = angle
            }

            // Detect completed rep: ascending → standing (after passing through bottom)
            if (newPhase === "standing" && phaseRef.current === "ascending" && bottomLandmarksRef.current) {
              const repNum = repsRef.current.length + 1
              const rep = analyzeSquatRep(bottomLandmarksRef.current, null, repNum)
              repsRef.current.push(rep)
              setRepCount(repNum)
              bottomLandmarksRef.current = null
              deepestAngleRef.current = 999

              // Auto-finish after target reps
              if (repNum >= targetReps) {
                finishAssessment()
                running = false
                return
              }
            }

            phaseRef.current = newPhase
            phaseTimestampRef.current = now
            setCurrentPhase(newPhase)
          }
        }
      } catch (err) {
        console.error("[OverheadSquat] Analysis loop error:", err)
        consecutiveErrors++
        if (consecutiveErrors > 30) {
          setError("Erro na análise. Reposicione-se ou reinicie a câmera.")
          running = false
          return
        }
      }

      if (running) animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => { running = false; if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [cameraReady, step, isRecording])

  function startRecording() {
    repsRef.current = []
    bottomLandmarksRef.current = null
    deepestAngleRef.current = 999
    phaseRef.current = "standing"
    phaseTimestampRef.current = performance.now()
    setRepCount(0)
    setIsRecording(true)
  }

  const finishingRef = useRef(false)
  function finishAssessment() {
    if (finishingRef.current) return
    finishingRef.current = true
    setIsRecording(false)
    stopCamera()
    if (repsRef.current.length === 0) {
      setError("Nenhuma repetição detectada. Tente novamente.")
      setStep("instructions")
      finishingRef.current = false
      return
    }
    const assessment = buildSquatAssessment(repsRef.current)
    setResult(assessment)
    setStep("result")
    finishingRef.current = false
  }

  async function handleSave() {
    if (!result || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/student/postural-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontalAngles: { type: "overhead_squat", ...result },
          lateralAngles: null,
          findings: result.allCheckpoints.map(c => ({
            key: c.key,
            label: c.label,
            view: c.view,
            measuredValue: c.measuredValue,
            referenceNormal: c.threshold,
            severity: c.passed ? "normal" : "moderate",
            severityLabel: c.passed ? "Normal" : "Compensação",
            colorClass: c.passed ? "text-emerald-400" : "text-orange-400",
            correctiveExerciseIds: c.correctiveExercises,
            reference: c.reference,
          })),
          overallScore: result.overallScore,
          severeCount: 0,
          moderateCount: result.allCheckpoints.filter(c => !c.passed).length,
          mildCount: 0,
          correctiveExerciseIds: [...new Set(result.allCheckpoints.filter(c => !c.passed).flatMap(c => c.correctiveExercises))],
        }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setSaved(true)
    } catch {
      setError("Erro ao salvar avaliação")
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!result) return
    const lines = [
      `🏋️ Overhead Squat Assessment (NASM) — Score: ${result.overallScore}/100`,
      `📊 ${result.totalReps} repetições analisadas`,
      "",
      ...result.allCheckpoints.map(c =>
        `${c.passed ? "✅" : "🔴"} ${c.label}: ${c.passed ? "OK" : c.description}`
      ),
      "",
      result.consistentCompensations.length > 0
        ? `⚠️ Compensações consistentes: ${result.consistentCompensations.length}`
        : "✅ Sem compensações consistentes",
      "",
      "📱 Victor App — NASM Overhead Squat por IA",
    ]
    const text = lines.join("\n")
    if (navigator.share) {
      try { await navigator.share({ title: "Overhead Squat Assessment", text }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert("Copiado!")
      } catch {
        setError("Não foi possível copiar.")
      }
    }
  }

  // ═══ RENDER ═══

  if (step === "instructions") {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/15 flex items-center justify-center mx-auto">
            <Dumbbell className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Overhead Squat Assessment</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Protocolo NASM — 2 checkpoints frontais analisados em tempo real durante o agachamento overhead.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Protocolo</h3>
          {[
            { n: "1", t: "Posicione a câmera", d: "De frente, corpo inteiro visível, ~2m de distância" },
            { n: "2", t: "Braços acima da cabeça", d: "Mantenha os braços estendidos overhead" },
            { n: "3", t: "Faça 5 agachamentos", d: "Desça até paralelo ou mais, velocidade normal" },
            { n: "4", t: "Resultado automático", d: "IA analisa compensações em cada repetição" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-orange-600/15 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">{s.n}</div>
              <div>
                <p className="text-xs font-semibold text-white">{s.t}</p>
                <p className="text-[10px] text-neutral-500">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-orange-500/5 border border-orange-500/15 p-3">
          <h4 className="text-[10px] text-orange-300 font-semibold mb-1.5">2 Checkpoints Frontais NASM:</h4>
          <div className="grid grid-cols-2 gap-1">
            {["Pés (rotação)", "Joelhos (valgo)"].map(c => (
              <span key={c} className="text-[9px] text-neutral-500 flex items-center gap-1">
                <ChevronDown className="w-2.5 h-2.5 text-orange-400/50" />{c}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => setStep("camera")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/20 active:scale-[0.98] transition-all">
          <Camera className="w-4 h-4" />
          Iniciar Assessment
        </button>
      </div>
    )
  }

  if (step === "camera") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Overhead Squat</h2>
            <p className="text-[10px] text-neutral-500">
              {isRecording ? `Rep ${repCount}/${targetReps}` : "Posicione-se e clique Iniciar"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}
              className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-400">
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button onClick={() => { stopCamera(); setStep("instructions"); setIsRecording(false) }}
              className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />{error}
          </div>
        )}

        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/[0.08]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Phase indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-sm", {
                "bg-neutral-800/80 text-neutral-400": currentPhase === "standing",
                "bg-orange-600/80 text-white": currentPhase === "descending",
                "bg-red-600/80 text-white": currentPhase === "bottom",
                "bg-emerald-600/80 text-white": currentPhase === "ascending",
              })}>
                {currentPhase === "standing" && "Em pé"}
                {currentPhase === "descending" && <><ArrowDown className="w-3 h-3 inline mr-1" />Descendo</>}
                {currentPhase === "bottom" && "Fundo ✓"}
                {currentPhase === "ascending" && <><ArrowUp className="w-3 h-3 inline mr-1" />Subindo</>}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-bold tabular-nums">
                {repCount}/{targetReps}
              </div>
            </div>
          )}

          {/* Rep progress bar */}
          {isRecording && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${(repCount / targetReps) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {!isRecording ? (
          <button onClick={startRecording} disabled={!cameraReady || !modelReady}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold text-sm shadow-xl shadow-orange-600/20 active:scale-[0.98] transition-all disabled:opacity-50">
            {!modelReady ? <><Loader2 className="w-4 h-4 animate-spin" />Carregando IA...</> :
             <><Dumbbell className="w-4 h-4" />Iniciar — Faça {targetReps} agachamentos</>}
          </button>
        ) : (
          <button onClick={finishAssessment}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs font-semibold">
            Finalizar com {repCount} rep{repCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    )
  }

  if (step === "result" && result) {
    return (
      <div className="space-y-4">
        {/* Score */}
        <div className="text-center space-y-2">
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none"
                stroke={result.overallScore >= 80 ? "#34d399" : result.overallScore >= 60 ? "#fbbf24" : "#fb923c"}
                strokeWidth="6" strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - result.overallScore / 100)}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white tabular-nums">{result.overallScore}</span>
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">score</span>
            </div>
          </div>
          <h2 className="text-base font-bold text-white">Overhead Squat Assessment</h2>
          <p className="text-[10px] text-neutral-500">
            {result.totalReps} repetições · {result.avgCompensations} compensações/rep
          </p>
        </div>

        {/* Checkpoints */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Checkpoints NASM (Frontal)</h3>
          {result.allCheckpoints.map(c => (
            <div key={c.key} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", {
                  "bg-emerald-500/20": c.passed,
                  "bg-red-500/20": !c.passed,
                })}>
                  {c.passed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{c.label}</p>
                  <p className="text-[10px] text-neutral-500">{c.description}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", {
                  "text-emerald-400 bg-emerald-500/10": c.passed,
                  "text-red-400 bg-red-500/10": !c.passed,
                })}>
                  {c.passed ? "OK" : "Falha"}
                </span>
              </div>

              {/* Show overactive/underactive muscles if failed */}
              {!c.passed && (
                <div className="pl-9 space-y-1">
                  <p className="text-[9px] text-red-400/70">
                    Hiperativos: {c.overactiveMusclePT.join(", ")}
                  </p>
                  <p className="text-[9px] text-emerald-400/70">
                    Hipoativos: {c.underactiveMusclePT.join(", ")}
                  </p>
                  <p className="text-[8px] text-neutral-700">Ref: {c.reference}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Consistent compensations warning */}
        {result.consistentCompensations.length > 0 && (
          <div className="rounded-xl bg-orange-500/5 border border-orange-500/15 p-3">
            <p className="text-[10px] text-orange-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Compensações consistentes ({">"}50% das reps):
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {result.consistentCompensations.map(key => {
                const cp = result.allCheckpoints.find(c => c.key === key)
                return (
                  <span key={key} className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[9px] font-medium border border-orange-500/15">
                    {cp?.label || key}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl bg-neutral-800/30 border border-white/[0.04] p-3">
          <p className="text-[9px] text-neutral-600 leading-relaxed">
            Protocolo NASM Overhead Squat Assessment. Identifica compensações
            neuromusculares. Não substitui avaliação presencial por profissional.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => { setStep("instructions"); setResult(null); setSaved(false) }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs font-semibold">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
              saved ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                : "bg-orange-600 text-white shadow-lg shadow-orange-600/20 active:scale-[0.98]"
            )}>
            {saved ? <><Check className="w-3.5 h-3.5" /> Salvo!</> :
             saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             <><Save className="w-3.5 h-3.5" /> Salvar</>}
          </button>
          <button onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs font-semibold active:scale-[0.98]">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>
        )}
      </div>
    )
  }

  return null
}
