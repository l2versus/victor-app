"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Camera,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Crosshair,
  Zap,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  EXERCISE_GROUPS,
  EXERCISE_RULES,
  type ExerciseRule,
  type PostureFeedback,
  type Point,
  TOTAL_EXERCISES_WITH_POSTURE,
} from "@/lib/posture-rules"

type AnalyzerState = "idle" | "loading" | "ready" | "analyzing" | "error"

const defaultExercise = EXERCISE_RULES[0] ?? {
  id: "squat",
  name: "Agachamento",
  nameEn: "Squat",
  muscleGroup: "quadriceps" as const,
  cameraPosition: "side" as const,
  positioningTip: "Posicione-se de lado",
  analyze: () => [{ status: "warning" as const, message: "Exercicio nao carregado" }],
}

export function PostureAnalyzer() {
  const [state, setState] = useState<AnalyzerState>("idle")
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRule>(defaultExercise)
  const [feedback, setFeedback] = useState<PostureFeedback[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [showSelector, setShowSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [showPositionGuide, setShowPositionGuide] = useState(false)
  const [fps, setFps] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const selectedExerciseRef = useRef<ExerciseRule>(defaultExercise)
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() })

  // Keep ref in sync with state
  useEffect(() => {
    selectedExerciseRef.current = selectedExercise
  }, [selectedExercise])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (poseLandmarkerRef.current) {
        try { (poseLandmarkerRef.current as { close: () => void }).close() } catch { /* ignore */ }
        poseLandmarkerRef.current = null
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (poseLandmarkerRef.current) {
      try { (poseLandmarkerRef.current as { close: () => void }).close() } catch { /* ignore */ }
      poseLandmarkerRef.current = null
    }
    if (mountedRef.current) {
      setState("idle")
      setFeedback([])
      setFps(0)
    }
  }, [])

  async function startAnalysis() {
    setState("loading")
    setErrorMsg("")
    setShowPositionGuide(false)

    try {
      // Request camera — prefer back camera on mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Load MediaPipe PoseLandmarker (100% client-side, no API key)
      const vision = await import("@mediapipe/tasks-vision")
      const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      )

      // Try GPU first, fall back to CPU lite model for older devices
      let poseLandmarker: InstanceType<typeof PoseLandmarker>
      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })
      } catch {
        poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })
      }

      poseLandmarkerRef.current = poseLandmarker
      setState("analyzing")

      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const drawingUtils = new DrawingUtils(ctx)
      let lastTimestamp = -1

      function detect() {
        if (!video || !canvas || !ctx || !poseLandmarkerRef.current) return
        const landmarker = poseLandmarkerRef.current as typeof poseLandmarker

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const now = performance.now()
        if (now === lastTimestamp) {
          animFrameRef.current = requestAnimationFrame(detect)
          return
        }
        lastTimestamp = now

        // FPS counter
        fpsCounterRef.current.frames++
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          if (mountedRef.current) setFps(fpsCounterRef.current.frames)
          fpsCounterRef.current.frames = 0
          fpsCounterRef.current.lastTime = now
        }

        try {
          const results = landmarker.detectForVideo(video, now)

          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0] as Point[]

            // Draw skeleton with exercise-themed colors
            drawingUtils.drawConnectors(landmarks as never, PoseLandmarker.POSE_CONNECTIONS, {
              color: "rgba(255, 255, 255, 0.35)",
              lineWidth: 2,
            })
            drawingUtils.drawLandmarks(landmarks as never, {
              color: "rgba(220, 38, 38, 0.85)",
              lineWidth: 1,
              radius: 3,
            })

            // Run exercise-specific biomechanical analysis
            const exerciseFeedback = selectedExerciseRef.current.analyze(landmarks)
            if (mountedRef.current) setFeedback(exerciseFeedback)

            // Draw feedback on canvas overlay
            drawFeedbackOnCanvas(ctx, exerciseFeedback, canvas.width, canvas.height)
          } else {
            if (mountedRef.current) {
              setFeedback([{
                status: "warning",
                message: "Nenhuma pessoa detectada — entre no quadro da camera",
              }])
            }
          }
        } catch {
          // Skip frames with detection errors
        }

        animFrameRef.current = requestAnimationFrame(detect)
      }

      detect()
    } catch (err) {
      console.error("Posture analyzer error:", err)
      const msg = err instanceof Error ? err.message : "Erro"
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setErrorMsg("Permissao de camera negada. Habilite nas configuracoes do navegador.")
      } else if (msg.includes("NotFound")) {
        setErrorMsg("Camera nao encontrada. Verifique se o dispositivo tem camera.")
      } else {
        setErrorMsg("Erro ao iniciar: " + msg)
      }
      setState("error")
      stopCamera()
    }
  }

  function drawFeedbackOnCanvas(
    ctx: CanvasRenderingContext2D,
    fb: PostureFeedback[],
    w: number,
    h: number,
  ) {
    const panelHeight = Math.min(40 + fb.length * 26, h * 0.4)
    // Semi-transparent panel at top
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
    ctx.fillRect(0, 0, w, panelHeight)

    // Gradient bottom edge
    const grad = ctx.createLinearGradient(0, panelHeight - 8, 0, panelHeight)
    grad.addColorStop(0, "rgba(0, 0, 0, 0.75)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, panelHeight - 8, w, 8)

    const fontSize = Math.max(11, Math.min(14, w * 0.028))

    fb.forEach((item, i) => {
      const y = 20 + i * 26
      if (y > panelHeight - 10) return // don't overflow

      const color =
        item.status === "correct"
          ? "#22c55e"
          : item.status === "warning"
            ? "#eab308"
            : "#ef4444"

      // Status dot
      ctx.beginPath()
      ctx.arc(16, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Message
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${fontSize}px -apple-system, sans-serif`
      const maxTextWidth = w - 80
      const text = item.message.length > 50 ? item.message.slice(0, 47) + "..." : item.message
      ctx.fillText(text, 28, y + 4, maxTextWidth)

      // Angle badge
      if (item.angle !== undefined) {
        ctx.fillStyle = color
        ctx.font = `${fontSize - 1}px -apple-system, sans-serif`
        ctx.fillText(`${Math.round(item.angle)}°`, w - 42, y + 4)
      }
    })
  }

  // ─── Filtered exercise groups for search ────────────────────────────────
  const filteredGroups = searchQuery.trim()
    ? EXERCISE_GROUPS.map(group => ({
        ...group,
        exercises: group.exercises.filter(
          ex =>
            ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      })).filter(group => group.exercises.length > 0)
    : EXERCISE_GROUPS

  return (
    <div className="space-y-3">
      {/* ─── Exercise selector (grouped by muscle) ─── */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSelector(!showSelector)
            setSearchQuery("")
          }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white hover:bg-white/[0.08] transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Crosshair className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">
              <span className="text-neutral-400">Exercicio: </span>
              <span className="font-semibold text-red-400">{selectedExercise.name}</span>
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-neutral-500 shrink-0 transition-transform", showSelector && "rotate-180")} />
        </button>

        {showSelector && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#0e0e0e] border border-white/[0.1] overflow-hidden z-30 max-h-[60vh] flex flex-col shadow-2xl">
            {/* Search */}
            <div className="p-2 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Buscar entre ${TOTAL_EXERCISES_WITH_POSTURE} exercicios...`}
                  className="w-full pl-8 pr-3 py-2 bg-white/[0.05] rounded-lg text-sm text-white placeholder:text-neutral-600 border-0 outline-none focus:ring-1 focus:ring-red-600/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Groups */}
            <div className="overflow-y-auto overscroll-contain flex-1">
              {filteredGroups.map(group => (
                <div key={group.id}>
                  {/* Group header */}
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider hover:bg-white/[0.03] transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform",
                        (expandedGroup === group.id || searchQuery) && "rotate-90",
                      )}
                    />
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                    <span className="ml-auto text-neutral-600 font-normal normal-case text-[10px]">
                      {group.exercises.length}
                    </span>
                  </button>

                  {/* Exercises in group */}
                  {(expandedGroup === group.id || searchQuery) && (
                    <div className="pb-1">
                      {group.exercises.map(rule => (
                        <button
                          key={rule.id}
                          onClick={() => {
                            setSelectedExercise(rule)
                            setShowSelector(false)
                            setSearchQuery("")
                            setExpandedGroup(null)
                            // Show positioning guide for the selected exercise
                            setShowPositionGuide(true)
                          }}
                          className={cn(
                            "w-full px-4 pl-9 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2",
                            selectedExercise.id === rule.id
                              ? "text-red-400 bg-red-600/10"
                              : "text-neutral-300 hover:bg-white/[0.04] active:bg-white/[0.06]",
                          )}
                        >
                          <div className="min-w-0">
                            <span className="block truncate">{rule.name}</span>
                            <span className="text-[10px] text-neutral-600">{rule.nameEn}</span>
                          </div>
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded shrink-0",
                              rule.cameraPosition === "side"
                                ? "bg-blue-600/20 text-blue-400"
                                : rule.cameraPosition === "front"
                                  ? "bg-purple-600/20 text-purple-400"
                                  : "bg-amber-600/20 text-amber-400",
                            )}
                          >
                            {rule.cameraPosition === "side"
                              ? "LATERAL"
                              : rule.cameraPosition === "front"
                                ? "FRONTAL"
                                : "AMBOS"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Positioning guide (shown when exercise changes) ─── */}
      {showPositionGuide && state === "idle" && (
        <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-sm">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 text-xs font-medium">Como se posicionar:</p>
            <p className="text-blue-200/70 text-xs mt-0.5">{selectedExercise.positioningTip}</p>
          </div>
          <button
            onClick={() => setShowPositionGuide(false)}
            className="text-blue-500/50 hover:text-blue-400 shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── Camera / Canvas area ─── */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            state === "analyzing" ? "invisible" : "visible",
          )}
        />
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            state !== "analyzing" && "hidden",
          )}
        />

        {/* FPS badge */}
        {state === "analyzing" && fps > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-neutral-400 font-mono z-10">
            {fps} FPS
          </div>
        )}

        {/* Idle overlay */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/90">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center px-8">
              <p className="text-sm text-neutral-300 font-medium">{selectedExercise.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{selectedExercise.positioningTip}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm text-neutral-300">Carregando modelo de IA...</p>
              <p className="text-[10px] text-neutral-600 mt-1">33 pontos do corpo • GPU acelerado</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <p className="text-sm text-neutral-400 text-center">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* ─── Action button ─── */}
      {state === "idle" || state === "error" ? (
        <button
          onClick={startAnalysis}
          className="w-full py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
        >
          <Zap className="w-4 h-4" />
          Analisar Postura — {selectedExercise.name}
        </button>
      ) : state === "analyzing" ? (
        <button
          onClick={stopCamera}
          className="w-full py-3.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Parar Analise
        </button>
      ) : null}

      {/* ─── Feedback cards (below canvas, mobile-friendly) ─── */}
      {feedback.length > 0 && state === "analyzing" && (
        <div className="space-y-1.5">
          {feedback.map((fb, i) => (
            <div
              key={`${fb.message}-${i}`}
              className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm",
                fb.status === "correct"
                  ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-300"
                  : fb.status === "warning"
                    ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-300"
                    : "bg-red-600/10 border-red-500/20 text-red-300",
              )}
            >
              {fb.status === "correct" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : fb.status === "warning" ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-[13px] leading-tight">{fb.message}</p>
                {fb.angle !== undefined && (
                  <p className="text-[10px] opacity-60 mt-0.5">
                    Angulo: {Math.round(fb.angle)}°{fb.targetAngle && ` (ideal: ${fb.targetAngle})`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Footer info ─── */}
      <div className="flex items-center justify-between text-[10px] text-neutral-600 px-1">
        <span>100% no dispositivo • privacidade total</span>
        <span>{TOTAL_EXERCISES_WITH_POSTURE} exercicios</span>
      </div>
    </div>
  )
}
