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
  SwitchCamera,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ExerciseRule,
  type PostureFeedback,
  type Point,
} from "@/lib/posture-rules"
import {
  ALL_EXERCISE_GROUPS as EXERCISE_GROUPS,
  ALL_EXERCISE_RULES as EXERCISE_RULES,
  TOTAL_EXERCISES_WITH_POSTURE,
} from "@/lib/posture-rules-all"

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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  // ═══ Feedback history for post-exercise replay ═══
  const [feedbackHistory, setFeedbackHistory] = useState<{ time: number; items: PostureFeedback[] }[]>([])
  const [showReplay, setShowReplay] = useState(false)
  const analysisStartRef = useRef<number>(0)
  // ═══ Video recording for replay ═══
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const facingModeRef = useRef<"user" | "environment">("user")
  const mountedRef = useRef(true)
  const selectedExerciseRef = useRef<ExerciseRule>(defaultExercise)
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() })

  // Keep refs in sync with state
  useEffect(() => {
    selectedExerciseRef.current = selectedExercise
  }, [selectedExercise])

  useEffect(() => {
    facingModeRef.current = facingMode
  }, [facingMode])

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
    // Stop video recording and generate replay URL
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
          setRecordedVideoUrl(URL.createObjectURL(blob))
        }
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (mountedRef.current) {
      setState("idle")
      setFeedback([])
      setFps(0)
      // Always show replay when analysis stops — video is always recorded
      setShowReplay(true)
    }
  }, [])

  async function switchCamera() {
    const newMode = facingMode === "user" ? "environment" : "user"
    setFacingMode(newMode)
    facingModeRef.current = newMode

    // If currently analyzing, restart with new camera
    if (state === "analyzing") {
      stopCamera()
      // Small delay to let cleanup finish before restarting
      setTimeout(() => {
        startAnalysis()
      }, 300)
    }
  }

  async function startAnalysis() {
    setState("loading")
    setErrorMsg("")
    setShowPositionGuide(false)
    setFeedbackHistory([])
    setShowReplay(false)
    analysisStartRef.current = Date.now()

    try {
      // Request camera — frontal (user) by default so the student sees the corrections live
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingModeRef.current },
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

      // ═══ Start video recording for replay ═══
      setRecordedVideoUrl(null)
      recordedChunksRef.current = []
      try {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
        recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
        recorder.start(1000) // chunk every 1s
        mediaRecorderRef.current = recorder
      } catch {
        // MediaRecorder not supported — skip recording silently
        mediaRecorderRef.current = null
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
            if (mountedRef.current) {
              setFeedback(exerciseFeedback)
              // Record errors/warnings for post-exercise replay (every 2s to save memory)
              const hasIssues = exerciseFeedback.some(f => f.status !== "correct")
              if (hasIssues) {
                const elapsed = Math.round((Date.now() - analysisStartRef.current) / 1000)
                setFeedbackHistory(prev => {
                  // Only record if last entry was >2s ago
                  if (prev.length > 0 && elapsed - prev[prev.length - 1].time < 2) return prev
                  return [...prev, { time: elapsed, items: exerciseFeedback.filter(f => f.status !== "correct") }]
                })
              }
            }

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
    // ═══ LARGE TEXT MODE — readable from 2-3 meters away ═══
    // Only show warnings and errors on canvas (correct = no distraction)
    const importantFb = fb.filter(f => f.status !== "correct")
    if (importantFb.length === 0) {
      // All correct — show big green checkmark at top
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(0, 0, w, 60)
      ctx.font = `bold ${Math.max(28, w * 0.045)}px -apple-system, sans-serif`
      ctx.fillStyle = "#22c55e"
      ctx.fillText("✓ Postura correta", 16, 42)
      return
    }

    // Scale: 30-44px — MUCH bigger for distance readability
    const fontSize = Math.max(28, Math.min(44, w * 0.055))
    const lineHeight = fontSize + 16
    const paddingTop = 20
    const paddingLeft = 16

    // Show max 3 items to avoid covering the whole screen
    const visibleFb = importantFb.slice(0, 3)
    const panelHeight = paddingTop + visibleFb.length * lineHeight + 12

    // Dark panel at top — high contrast
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)"
    ctx.fillRect(0, 0, w, panelHeight)

    // Color bar at top (red if error, yellow if warning)
    const hasError = visibleFb.some(f => f.status === "error")
    ctx.fillStyle = hasError ? "rgba(239, 68, 68, 0.9)" : "rgba(234, 179, 8, 0.8)"
    ctx.fillRect(0, 0, w, 4)

    visibleFb.forEach((item, i) => {
      const y = paddingTop + i * lineHeight + lineHeight * 0.65

      const isError = item.status === "error"
      const emoji = isError ? "✗" : "⚠"
      const color = isError ? "#ef4444" : "#eab308"

      // Emoji indicator (large)
      ctx.fillStyle = color
      ctx.font = `bold ${fontSize}px -apple-system, sans-serif`
      ctx.fillText(emoji, paddingLeft, y)

      // Message text — BOLD WHITE, big enough to read from 3m
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${fontSize}px -apple-system, sans-serif`
      const textX = paddingLeft + fontSize + 8
      const maxTextWidth = w - textX - 16
      const maxChars = Math.floor(maxTextWidth / (fontSize * 0.52))
      const text = item.message.length > maxChars ? item.message.slice(0, maxChars - 1) + "…" : item.message
      ctx.fillText(text, textX, y, maxTextWidth)
    })

    // Bottom gradient fade
    const grad = ctx.createLinearGradient(0, panelHeight - 10, 0, panelHeight)
    grad.addColorStop(0, "rgba(0, 0, 0, 0.85)")
    grad.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, panelHeight - 10, w, 10)
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
      {/* aspect-[3/4] on mobile (portrait), aspect-[4/3] on wider screens */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] sm:aspect-[4/3]">
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

        {/* Camera switch + FPS badge */}
        {state === "analyzing" && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <button
              onClick={switchCamera}
              className="p-1.5 rounded-lg bg-black/60 text-neutral-300 hover:text-white hover:bg-black/80 active:scale-90 transition-all"
              title={facingMode === "user" ? "Trocar para camera traseira" : "Trocar para camera frontal"}
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            {fps > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-neutral-400 font-mono">
                {fps} FPS
              </span>
            )}
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
            {/* Camera toggle in idle */}
            <button
              onClick={switchCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-neutral-400 hover:text-white transition-colors active:scale-95"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              {facingMode === "user" ? "Camera frontal" : "Camera traseira"}
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm text-neutral-300">Carregando modelo de IA...</p>
              <p className="text-[10px] text-neutral-600 mt-1">Análise biomecânica • GPU acelerado</p>
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

      {/* ─── Feedback cards (below canvas, LARGER for readability) ─── */}
      {feedback.length > 0 && state === "analyzing" && (
        <div className="space-y-2">
          {feedback.map((fb, i) => (
            <div
              key={`${fb.message}-${i}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-2xl border",
                fb.status === "correct"
                  ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-300"
                  : fb.status === "warning"
                    ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-300"
                    : "bg-red-600/10 border-red-500/20 text-red-300",
              )}
            >
              {fb.status === "correct" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : fb.status === "warning" ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{fb.message}</p>
                {fb.angle !== undefined && (
                  <p className="text-[11px] opacity-60 mt-0.5">
                    Angulo: {Math.round(fb.angle)}°{fb.targetAngle && ` (ideal: ${fb.targetAngle})`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── REPLAY — Video + feedback (always shows after analysis stops) ─── */}
      {showReplay && state === "idle" && (recordedVideoUrl || feedbackHistory.length > 0) && (
        <div className={cn(
          "rounded-2xl border overflow-hidden",
          feedbackHistory.length > 0
            ? "border-amber-500/20 bg-amber-600/[0.06]"
            : "border-emerald-500/20 bg-emerald-600/[0.06]"
        )}>
          {/* Header */}
          <div className={cn(
            "px-4 py-3 flex items-center justify-between border-b",
            feedbackHistory.length > 0 ? "border-amber-500/10" : "border-emerald-500/10"
          )}>
            <div className="flex items-center gap-2">
              {feedbackHistory.length > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">Correções da sessão</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                    {feedbackHistory.length} pontos
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-300">Execução correta!</span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowReplay(false)}
              className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Fechar
            </button>
          </div>

          {/* Video player — ALWAYS visible when recorded */}
          {recordedVideoUrl && (
            <div className="p-3 space-y-2">
              <video
                src={recordedVideoUrl}
                controls
                playsInline
                className="w-full rounded-xl bg-black"
                style={{ maxHeight: "280px" }}
              />
              {/* Save + share buttons */}
              <div className="flex gap-2">
                <a
                  href={recordedVideoUrl}
                  download={`postura-${selectedExercise.name.replace(/\s/g, "-")}-${new Date().toISOString().slice(0, 10)}.webm`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white hover:bg-white/[0.1] active:scale-[0.97] transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar vídeo
                </a>
                <button
                  onClick={() => { setShowReplay(false); setRecordedVideoUrl(null) }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-500 hover:bg-white/[0.06] transition-all"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Error timeline (only if there were errors) */}
          {feedbackHistory.length > 0 && (
            <>
              <div className="max-h-48 overflow-y-auto divide-y divide-amber-500/10">
                {feedbackHistory.map((entry, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-[10px] text-amber-400/60 font-mono mb-1">
                      ⏱ {Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, "0")}
                    </p>
                    {entry.items.map((fb, j) => (
                      <div key={j} className="flex items-start gap-2 mt-1">
                        {fb.status === "error" ? (
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        )}
                        <p className="text-xs text-neutral-300">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-amber-500/10 bg-amber-600/[0.03]">
                <p className="text-[10px] text-neutral-500 text-center">
                  Revise antes da proxima serie
                </p>
              </div>
            </>
          )}
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
