"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, X, Loader2, ChevronDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { EXERCISE_RULES, type ExerciseRule, type PostureFeedback, type Point } from "@/lib/posture-rules"

type AnalyzerState = "idle" | "loading" | "ready" | "analyzing" | "error"

export function PostureAnalyzer() {
  const [state, setState] = useState<AnalyzerState>("idle")
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRule>(EXERCISE_RULES[0])
  const [feedback, setFeedback] = useState<PostureFeedback[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [showSelector, setShowSelector] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const selectedExerciseRef = useRef<ExerciseRule>(EXERCISE_RULES[0])

  // Keep ref in sync with state
  useEffect(() => {
    selectedExerciseRef.current = selectedExercise
  }, [selectedExercise])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Stop camera without setState
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      // Close PoseLandmarker to free GPU/WASM resources
      if (poseLandmarkerRef.current) {
        try { (poseLandmarkerRef.current as { close: () => void }).close() } catch { /* ignore */ }
        poseLandmarkerRef.current = null
      }
    }
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    // Close PoseLandmarker to free GPU/WASM resources
    if (poseLandmarkerRef.current) {
      try { (poseLandmarkerRef.current as { close: () => void }).close() } catch { /* ignore */ }
      poseLandmarkerRef.current = null
    }
    if (mountedRef.current) {
      setState("idle")
      setFeedback([])
    }
  }

  async function startAnalysis() {
    setState("loading")
    setErrorMsg("")

    try {
      // Request camera (prefer back camera on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Load MediaPipe PoseLandmarker
      const vision = await import("@mediapipe/tasks-vision")
      const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      )

      const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })

      poseLandmarkerRef.current = poseLandmarker
      setState("analyzing")

      // Start detection loop
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const drawingUtils = new DrawingUtils(ctx)
      let lastTimestamp = -1

      function detect() {
        if (!video || !canvas || !ctx || !poseLandmarkerRef.current) return
        const landmarker = poseLandmarkerRef.current as InstanceType<typeof PoseLandmarker>

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const now = performance.now()
        if (now === lastTimestamp) {
          animFrameRef.current = requestAnimationFrame(detect)
          return
        }
        lastTimestamp = now

        try {
          const results = landmarker.detectForVideo(video, now)

          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0] as Point[]

            // Draw skeleton
            drawingUtils.drawConnectors(
              landmarks as never,
              PoseLandmarker.POSE_CONNECTIONS,
              { color: "rgba(255, 255, 255, 0.4)", lineWidth: 2 }
            )
            drawingUtils.drawLandmarks(landmarks as never, {
              color: "rgba(220, 38, 38, 0.8)",
              lineWidth: 1,
              radius: 3,
            })

            // Run exercise-specific analysis (use ref to avoid stale closure)
            const exerciseFeedback = selectedExerciseRef.current.analyze(landmarks)
            setFeedback(exerciseFeedback)

            // Draw feedback indicators on canvas
            drawFeedbackOnCanvas(ctx, exerciseFeedback, canvas.width, canvas.height)
          }
        } catch {
          // Skip frames with errors
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
        setErrorMsg("Erro ao iniciar camera: " + msg)
      }
      setState("error")
      stopCamera()
    }
  }

  function drawFeedbackOnCanvas(ctx: CanvasRenderingContext2D, fb: PostureFeedback[], w: number, h: number) {
    // Semi-transparent panel at top
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, w, 40 + fb.length * 28)

    fb.forEach((item, i) => {
      const y = 25 + i * 28
      const color = item.status === "correct" ? "#22c55e" : item.status === "warning" ? "#eab308" : "#ef4444"

      // Status dot
      ctx.beginPath()
      ctx.arc(20, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Message
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 14px sans-serif"
      ctx.fillText(item.message, 35, y + 5)

      // Angle if present
      if (item.angle !== undefined) {
        ctx.fillStyle = color
        ctx.font = "12px sans-serif"
        ctx.fillText(`${Math.round(item.angle)}°`, w - 50, y + 5)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="relative">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white hover:bg-white/[0.08] transition-colors"
        >
          <span>Exercicio: <span className="font-semibold text-red-400">{selectedExercise.name}</span></span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showSelector && "rotate-180")} />
        </button>
        {showSelector && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#111] border border-white/[0.08] overflow-hidden z-20">
            {EXERCISE_RULES.map(rule => (
              <button
                key={rule.id}
                onClick={() => { setSelectedExercise(rule); setShowSelector(false) }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-white/[0.05] transition-colors",
                  selectedExercise.id === rule.id ? "text-red-400 bg-red-600/10" : "text-neutral-300"
                )}
              >
                {rule.name} <span className="text-neutral-600 text-xs">({rule.nameEn})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Camera / Canvas area */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("absolute inset-0 w-full h-full object-cover", state === "analyzing" ? "invisible" : "visible")}
        />
        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 w-full h-full object-cover", state !== "analyzing" && "hidden")}
        />

        {/* Overlays */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/90">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm text-neutral-400 text-center px-6">
              Posicione-se de lado para a camera e clique para iniciar a analise de postura
            </p>
          </div>
        )}

        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            <p className="text-sm text-neutral-400">Carregando modelo de IA...</p>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <p className="text-sm text-neutral-400 text-center">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Action button */}
      {state === "idle" || state === "error" ? (
        <button
          onClick={startAnalysis}
          className="w-full py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Analisar Postura — {selectedExercise.name}
        </button>
      ) : state === "analyzing" ? (
        <button
          onClick={stopCamera}
          className="w-full py-3.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Parar Analise
        </button>
      ) : null}

      {/* Feedback list (below canvas) */}
      {feedback.length > 0 && state === "analyzing" && (
        <div className="space-y-2">
          {feedback.map((fb, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm",
                fb.status === "correct" ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-300" :
                fb.status === "warning" ? "bg-yellow-600/10 border-yellow-500/20 text-yellow-300" :
                "bg-red-600/10 border-red-500/20 text-red-300"
              )}
            >
              {fb.status === "correct" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> :
               fb.status === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
               <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p>{fb.message}</p>
                {fb.angle !== undefined && (
                  <p className="text-xs opacity-60 mt-0.5">
                    Angulo: {Math.round(fb.angle)}° {fb.targetAngle && `(ideal: ${fb.targetAngle})`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-[10px] text-neutral-600 text-center">
        A analise roda 100% no seu dispositivo. Nenhuma imagem e enviada para servidores.
      </p>
    </div>
  )
}
