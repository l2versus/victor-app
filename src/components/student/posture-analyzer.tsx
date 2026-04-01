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
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ExerciseRule,
  type PostureFeedback,
  type Point,
  type CameraPosition,
  type ViewDetectionResult,
  detectCameraView,
} from "@/lib/posture-rules"
import {
  type TrackerState,
  createTrackerState,
  updateTracker,
  calculateSetScore,
  getRepConfig,
  getPositioningGuide,
} from "@/lib/posture-tracker"
import {
  ALL_EXERCISE_GROUPS as EXERCISE_GROUPS,
  ALL_EXERCISE_RULES as EXERCISE_RULES,
  TOTAL_EXERCISES_WITH_POSTURE,
} from "@/lib/posture-rules-all"
// Machine3DGuide — disabled until 3D models are properly mapped to exercises
// import dynamic from "next/dynamic"
// const Machine3DGuide = dynamic(
//   () => import("@/components/student/machine-3d-guide").then(m => ({ default: m.Machine3DGuide })),
//   { ssr: false }
// )

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

export function PostureAnalyzer({ initialExercise }: { initialExercise?: string } = {}) {
  const [state, setState] = useState<AnalyzerState>("idle")
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRule>(() => {
    if (initialExercise) {
      const nameLower = initialExercise.toLowerCase()
      const match = EXERCISE_RULES.find(r => r.name.toLowerCase() === nameLower)
        || EXERCISE_RULES.find(r => r.name.toLowerCase().includes(nameLower) || nameLower.includes(r.name.toLowerCase()))
      if (match) return match
    }
    return defaultExercise
  })
  const [feedback, setFeedback] = useState<PostureFeedback[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [showSelector, setShowSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  // showPositionGuide removed — replaced by mandatory angle selector
  const [fps, setFps] = useState(0)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [detectedView, setDetectedView] = useState<ViewDetectionResult | null>(null)
  /** User-selected camera angle — REQUIRED before starting analysis */
  const [selectedAngle, setSelectedAngle] = useState<"side" | "front" | "back" | "floor">("side")
  const selectedAngleRef = useRef<"side" | "front" | "back" | "floor">("side")
  // ═══ Rep counter + Score + Speed ═══
  const trackerRef = useRef<TrackerState>(createTrackerState())
  const [repCount, setRepCount] = useState(0)
  const [repPhase, setRepPhase] = useState<string>("")
  const [eccentricSpeed, setEccentricSpeed] = useState(0)
  const [concentricSpeed, setConcentricSpeed] = useState(0)
  const [setScore, setSetScore] = useState<{ score: number; grade: string; gradeColor: string; details: string } | null>(null)
  // ═══ Feedback history for post-exercise replay ═══
  const [feedbackHistory, setFeedbackHistory] = useState<{ time: number; items: PostureFeedback[] }[]>([])
  const [showReplay, setShowReplay] = useState(false)
  const analysisStartRef = useRef<number>(0)
  // ═══ Video recording for replay ═══
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const recordedMimeRef = useRef<string>("video/mp4")
  // ═══ 3D Machine Guide — disabled until models are mapped ═══

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

  useEffect(() => {
    selectedAngleRef.current = selectedAngle
  }, [selectedAngle])

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
        if (!mountedRef.current) return // Guard against unmounted state update
        if (recordedChunksRef.current.length > 0) {
          const mime = recordedMimeRef.current
          const blob = new Blob(recordedChunksRef.current, { type: mime })
          recordedBlobRef.current = blob
          setRecordedVideoUrl(URL.createObjectURL(blob))
        }
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (mountedRef.current) {
      // Calculate final set score before resetting
      const finalScore = calculateSetScore(trackerRef.current)
      if (trackerRef.current.reps > 0) {
        setSetScore(finalScore)
      }
      setState("idle")
      setFeedback([])
      setFps(0)
      setDetectedView(null)
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
    // Reset tracker for new set
    trackerRef.current = createTrackerState()
    setRepCount(0)
    setRepPhase("")
    setEccentricSpeed(0)
    setConcentricSpeed(0)
    setSetScore(null)
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
      // Recording is deferred until canvas is ready (see startCanvasRecording below)
      // This ensures the recorded video includes skeleton + feedback overlays
      setRecordedVideoUrl(null)
      recordedBlobRef.current = null
      recordedChunksRef.current = []

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
      let recorderStarted = false

      function startCanvasRecording() {
        if (recorderStarted || !canvas) return
        recorderStarted = true
        try {
          // Record from CANVAS (includes skeleton + feedback overlays) not raw camera
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const canvasStream = (canvas as any).captureStream(30) // 30 fps
          const mimeOptions = [
            "video/mp4",
            "video/mp4;codecs=avc1",
            "video/webm;codecs=h264",
            "video/webm;codecs=vp9",
            "video/webm",
          ]
          const supportedMime = mimeOptions.find(m => MediaRecorder.isTypeSupported(m)) || ""
          recordedMimeRef.current = supportedMime || "video/mp4"
          const recorder = new MediaRecorder(canvasStream, {
            ...(supportedMime ? { mimeType: supportedMime } : {}),
            videoBitsPerSecond: 1_000_000,
          })
          recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
          recorder.start(1000)
          mediaRecorderRef.current = recorder
        } catch {
          mediaRecorderRef.current = null
        }
      }

      function detect() {
        if (!video || !canvas || !ctx || !poseLandmarkerRef.current) return
        const landmarker = poseLandmarkerRef.current as typeof poseLandmarker

        // Only update dimensions when changed (avoids resetting canvas state + breaking captureStream)
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight

        // Start recording from canvas on first frame (dimensions now set)
        if (!recorderStarted) startCanvasRecording()

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

            // Detect camera angle from landmark patterns (validates user's choice)
            const viewResult = detectCameraView(landmarks)
            if (mountedRef.current && viewResult.confidence > 0.3) {
              setDetectedView(viewResult)
            }

            // Warn if detected angle doesn't match selected angle
            const userAngle = selectedAngleRef.current
            const detAngle = viewResult.view
            const angleMismatch =
              viewResult.confidence > 0.5 &&
              detAngle !== "unknown" &&
              detAngle !== userAngle &&
              // floor is compatible with side (floor exercises seen from side)
              !(userAngle === "side" && detAngle === "floor") &&
              !(userAngle === "floor" && detAngle === "side")

            // Run exercise-specific biomechanical analysis (pass user-selected angle)
            let exerciseFeedback = selectedExerciseRef.current.analyze(landmarks, selectedAngleRef.current)

            // Prepend mismatch warning if camera doesn't match selection
            if (angleMismatch) {
              const viewLabels: Record<string, string> = { side: "Lateral", front: "Frontal", back: "Posterior", floor: "Chão" }
              exerciseFeedback = [
                {
                  status: "warning" as const,
                  message: `Você selecionou ${viewLabels[userAngle] || userAngle} mas a câmera parece estar em ${viewResult.label}`,
                },
                ...exerciseFeedback,
              ]
            }

            // ═══ Update rep tracker (counter + score + speed) ═══
            const exercise = selectedExerciseRef.current
            const repConfig = getRepConfig(exercise.muscleGroup, exercise.id)
            const prevReps = trackerRef.current.reps
            updateTracker(trackerRef.current, landmarks, repConfig, exerciseFeedback)

            if (mountedRef.current) {
              // Update rep count if changed
              if (trackerRef.current.reps !== prevReps) {
                setRepCount(trackerRef.current.reps)
              }
              // Update phase label (throttled — only when phase changes)
              const phaseLabel = trackerRef.current.phase === "eccentric" ? repConfig.downLabel
                : trackerRef.current.phase === "concentric" ? repConfig.upLabel : ""
              setRepPhase(phaseLabel)
              // Update speed (only when we have data)
              if (trackerRef.current.lastEccentricMs > 0) {
                setEccentricSpeed(trackerRef.current.lastEccentricMs)
              }
              if (trackerRef.current.lastConcentricMs > 0) {
                setConcentricSpeed(trackerRef.current.lastConcentricMs)
              }
            }
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

            // Draw feedback + detected view + rep counter + ROM zone on canvas
            drawFeedbackOnCanvas(ctx, exerciseFeedback, canvas.width, canvas.height, viewResult, trackerRef.current, repConfig, landmarks)
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
    viewResult?: ViewDetectionResult,
    tracker?: TrackerState,
    repConfig?: ReturnType<typeof getRepConfig>,
    landmarks?: Point[],
  ) {
    // Reset canvas state at entry to prevent leaks between frames
    ctx.textAlign = "left"
    ctx.setLineDash([])

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

    // ═══ REP COUNTER — large number at bottom-right (only after first rep) ═══
    if (tracker && tracker.reps > 0) {
      const repFontSize = Math.max(48, w * 0.08)
      const repX = w - 16
      const repY = h - 16

      // Big rep number
      ctx.font = `bold ${repFontSize}px -apple-system, sans-serif`
      ctx.textAlign = "right"
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillText(String(tracker.reps), repX + 2, repY + 2) // shadow
      ctx.fillStyle = "#ffffff"
      ctx.fillText(String(tracker.reps), repX, repY)

      // "REPS" label
      ctx.font = `bold ${Math.max(12, w * 0.02)}px -apple-system, sans-serif`
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.fillText("REPS", repX, repY - repFontSize * 0.85)

      // Phase label (Descendo / Subindo)
      if (tracker.phase !== "idle") {
        const phaseLabel = repConfig
          ? (tracker.phase === "eccentric" ? repConfig.downLabel : repConfig.upLabel)
          : ""
        if (phaseLabel) {
          ctx.font = `bold ${Math.max(14, w * 0.025)}px -apple-system, sans-serif`
          ctx.fillStyle = tracker.phase === "eccentric" ? "rgba(234, 179, 8, 0.9)" : "rgba(34, 197, 94, 0.9)"
          ctx.fillText(phaseLabel, repX, repY - repFontSize * 0.85 - Math.max(16, w * 0.025))
        }
      }

      // Speed info (eccentric / concentric)
      if (tracker.lastEccentricMs > 0) {
        const speedY = repY - repFontSize * 0.85 - Math.max(36, w * 0.05)
        const eccSec = (tracker.lastEccentricMs / 1000).toFixed(1)
        const conSec = tracker.lastConcentricMs > 0 ? (tracker.lastConcentricMs / 1000).toFixed(1) : "—"
        ctx.font = `${Math.max(11, w * 0.018)}px -apple-system, sans-serif`
        const isGoodEcc = tracker.lastEccentricMs >= 1500 && tracker.lastEccentricMs <= 4500
        ctx.fillStyle = isGoodEcc ? "rgba(34, 197, 94, 0.8)" : "rgba(234, 179, 8, 0.8)"
        ctx.fillText(`↓${eccSec}s  ↑${conSec}s`, repX, speedY)
      }

      ctx.textAlign = "left" // Reset
    }

    // ═══ ROM TARGET ZONE — dashed horizontal line at joint level ═══
    if (repConfig && landmarks && landmarks.length > 0) {
      const [, pivotIdx] = repConfig.anglePoints
      const pivot = landmarks[pivotIdx]
      if (pivot && (pivot.visibility ?? 0) > 0.3) {
        const lineY = pivot.y * h
        ctx.setLineDash([8, 6])
        ctx.strokeStyle = "rgba(34, 197, 94, 0.5)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, lineY)
        ctx.lineTo(w, lineY)
        ctx.stroke()
        ctx.setLineDash([]) // Reset

        // Small label
        ctx.font = `${Math.max(10, w * 0.016)}px -apple-system, sans-serif`
        ctx.fillStyle = "rgba(34, 197, 94, 0.6)"
        ctx.fillText("ROM alvo", 8, lineY - 4)
      }
    }
    // Always reset lineDash after ROM zone block
    ctx.setLineDash([])

    // Draw detected view badge at bottom-left of canvas (appears in recorded video)
    if (viewResult && viewResult.view !== "unknown") {
      const badgeFontSize = Math.max(16, w * 0.028)
      const badgeText = `${viewResult.icon} ${viewResult.label}`
      const badgePadX = 10
      const badgePadY = 6
      ctx.font = `bold ${badgeFontSize}px -apple-system, sans-serif`
      const textWidth = ctx.measureText(badgeText).width

      const bx = 8
      const by = h - badgeFontSize - badgePadY * 2 - 8

      // Badge background color based on view type
      const bgColors: Record<string, string> = {
        side: "rgba(37, 99, 235, 0.75)",
        front: "rgba(147, 51, 234, 0.75)",
        back: "rgba(22, 163, 74, 0.75)",
        floor: "rgba(217, 119, 6, 0.75)",
      }
      ctx.fillStyle = bgColors[viewResult.view] || "rgba(0, 0, 0, 0.6)"
      ctx.beginPath()
      const bw = textWidth + badgePadX * 2
      const bh = badgeFontSize + badgePadY * 2
      const br = 6
      ctx.roundRect(bx, by, bw, bh, br)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.fillText(badgeText, bx + badgePadX, by + badgePadY + badgeFontSize * 0.85)
    }
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
                  placeholder={`Buscar entre ${TOTAL_EXERCISES_WITH_POSTURE} exercícios...`}
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
                            // Set default angle based on exercise's preferred camera position
                            const defaultAngle = rule.cameraPosition === "side-or-front" ? "side"
                              : rule.cameraPosition === "any" ? "side"
                              : rule.cameraPosition as "side" | "front" | "back"
                            setSelectedAngle(defaultAngle)
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
                              rule.cameraPosition === "side" ? "bg-blue-600/20 text-blue-400"
                                : rule.cameraPosition === "front" ? "bg-purple-600/20 text-purple-400"
                                : rule.cameraPosition === "back" ? "bg-green-600/20 text-green-400"
                                : "bg-amber-600/20 text-amber-400",
                            )}
                          >
                            {rule.cameraPosition === "side" ? "LATERAL"
                              : rule.cameraPosition === "front" ? "FRONTAL"
                              : rule.cameraPosition === "back" ? "COSTAS"
                              : rule.allowedPositions ? `${rule.allowedPositions.length} ÂNGULOS`
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

      {/* ─── Camera Angle Selector — user MUST choose before starting ─── */}
      {state === "idle" && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <p className="text-[11px] text-neutral-400 font-medium">Ângulo da câmera</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 p-2">
            {([
              { key: "side" as const, label: "Lateral", icon: "👤", desc: "Profundidade e tronco", color: "blue" },
              { key: "front" as const, label: "Frontal", icon: "🧍", desc: "Simetria e joelhos", color: "purple" },
              { key: "back" as const, label: "Costas", icon: "🔙", desc: "Escápulas e glúteos", color: "green" },
              { key: "floor" as const, label: "Chão", icon: "⬇️", desc: "Flexões e pranchas", color: "amber" },
            ] as const).map((opt) => {
              const isActive = selectedAngle === opt.key
              const isAllowed = !selectedExercise.allowedPositions || selectedExercise.allowedPositions.includes(opt.key as CameraPosition)
              const colorMap = {
                blue: { active: "bg-blue-600/20 border-blue-500/40 text-blue-300", dot: "bg-blue-400" },
                purple: { active: "bg-purple-600/20 border-purple-500/40 text-purple-300", dot: "bg-purple-400" },
                green: { active: "bg-green-600/20 border-green-500/40 text-green-300", dot: "bg-green-400" },
                amber: { active: "bg-amber-600/20 border-amber-500/40 text-amber-300", dot: "bg-amber-400" },
              }
              const colors = colorMap[opt.color]
              return (
                <button
                  key={opt.key}
                  disabled={!isAllowed}
                  onClick={() => setSelectedAngle(opt.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all",
                    !isAllowed && "opacity-25 cursor-not-allowed",
                    isActive
                      ? `${colors.active} border`
                      : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]",
                  )}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[10px] font-semibold">{opt.label}</span>
                  <span className="text-[8px] text-neutral-600 leading-tight">{opt.desc}</span>
                  {isActive && <span className={cn("w-1.5 h-1.5 rounded-full mt-0.5", colors.dot)} />}
                </button>
              )
            })}
          </div>
          {/* Positioning tip based on selected angle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.01] border-t border-white/[0.04]">
            <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <p className="text-[10px] text-neutral-500">
              {selectedAngle === "side" ? "Posicione a câmera de LADO, corpo inteiro visível" :
               selectedAngle === "front" ? "Posicione a câmera na sua FRENTE, de pé" :
               selectedAngle === "back" ? "Posicione a câmera nas suas COSTAS" :
               "Coloque a câmera no CHÃO, na altura do corpo"}
            </p>
          </div>
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

        {/* Camera switch + FPS + Detected angle badges */}
        {state === "analyzing" && (
          <>
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
            {/* Detected camera angle badge — bottom left */}
            {detectedView && detectedView.view !== "unknown" && (
              <div className={cn(
                "absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold backdrop-blur-sm transition-all",
                detectedView.view === "side"  ? "bg-blue-600/70 text-blue-100" :
                detectedView.view === "front" ? "bg-purple-600/70 text-purple-100" :
                detectedView.view === "back"  ? "bg-green-600/70 text-green-100" :
                detectedView.view === "floor" ? "bg-amber-600/70 text-amber-100" :
                "bg-black/60 text-neutral-300"
              )}>
                <span>{detectedView.icon}</span>
                <span>{detectedView.label}</span>
              </div>
            )}
          </>
        )}

        {/* Idle overlay with animated positioning guide */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
            {/* Animated silhouette guide */}
            <PositioningGuide
              muscleGroup={selectedExercise.muscleGroup}
              exerciseId={selectedExercise.id}
            />
            <div className="text-center px-8">
              <p className="text-sm text-neutral-300 font-medium">{selectedExercise.name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Ângulo: <span className="text-white font-medium">
                  {selectedAngle === "side" ? "👤 Lateral" :
                   selectedAngle === "front" ? "🧍 Frontal" :
                   selectedAngle === "back" ? "🔙 Costas" :
                   "⬇️ Chão"}
                </span>
              </p>
            </div>
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
          Analisar — {selectedAngle === "side" ? "👤 Lateral" : selectedAngle === "front" ? "🧍 Frontal" : selectedAngle === "back" ? "🔙 Costas" : "⬇️ Chão"}
        </button>
      ) : state === "analyzing" ? (
        <button
          onClick={stopCamera}
          className="w-full py-3.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Parar Análise
        </button>
      ) : null}

      {/* ─── Rep Counter + Speed (below canvas during analysis) ─── */}
      {state === "analyzing" && (
        <div className="flex items-center justify-between px-1">
          {/* Rep counter */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-black text-white tabular-nums">{repCount}</p>
              <p className="text-[9px] text-neutral-500 -mt-0.5">REPS</p>
            </div>
            {repPhase && (
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                repPhase.includes("Desc") || repPhase.includes("Pux") || repPhase.includes("Contr")
                  ? "bg-yellow-500/15 text-yellow-400"
                  : "bg-emerald-500/15 text-emerald-400",
              )}>
                {repPhase}
              </span>
            )}
          </div>

          {/* Speed indicators */}
          <div className="flex items-center gap-3 text-[10px]">
            {eccentricSpeed > 0 && (
              <div className="text-center">
                <p className={cn(
                  "text-sm font-bold tabular-nums",
                  eccentricSpeed >= 1500 && eccentricSpeed <= 4500
                    ? "text-emerald-400"
                    : eccentricSpeed < 1500
                      ? "text-yellow-400"
                      : "text-blue-400",
                )}>
                  {(eccentricSpeed / 1000).toFixed(1)}s
                </p>
                <p className="text-neutral-600">↓ exc.</p>
              </div>
            )}
            {concentricSpeed > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-white tabular-nums">{(concentricSpeed / 1000).toFixed(1)}s</p>
                <p className="text-neutral-600">↑ conc.</p>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* ─── SET SCORE — shown after analysis stops ─── */}
      {setScore && state === "idle" && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={cn("text-4xl font-black", setScore.gradeColor)}>{setScore.grade}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{setScore.score}</span>
                  <span className="text-xs text-neutral-500">/ 100</span>
                </div>
                <p className="text-[10px] text-neutral-500">{setScore.details}</p>
              </div>
            </div>
            {/* Score bar */}
            <div className="w-24 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  setScore.score >= 80 ? "bg-emerald-500" :
                  setScore.score >= 60 ? "bg-yellow-500" : "bg-red-500",
                )}
                style={{ width: `${setScore.score}%` }}
              />
            </div>
          </div>
          {/* Speed summary */}
          {(eccentricSpeed > 0 || concentricSpeed > 0) && (
            <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.04] text-[10px]">
              {eccentricSpeed > 0 && (
                <span className={cn(
                  eccentricSpeed >= 1500 && eccentricSpeed <= 4500
                    ? "text-emerald-400" : "text-yellow-400",
                )}>
                  ↓ Excêntrica: {(eccentricSpeed / 1000).toFixed(1)}s
                  {eccentricSpeed >= 1500 && eccentricSpeed <= 4500 ? " ✓" : " (ideal: 2-4s)"}
                </span>
              )}
              {concentricSpeed > 0 && (
                <span className="text-neutral-400">
                  ↑ Concêntrica: {(concentricSpeed / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}
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
                  download={`postura-${selectedExercise.name.replace(/\s/g, "-")}-${new Date().toISOString().slice(0, 10)}.${recordedMimeRef.current.includes("mp4") ? "mp4" : "webm"}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white hover:bg-white/[0.1] active:scale-[0.97] transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </a>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={async () => {
                      const blob = recordedBlobRef.current
                      if (!blob) return
                      const ext = recordedMimeRef.current.includes("mp4") ? "mp4" : "webm"
                      const fileName = `postura-${selectedExercise.name.replace(/\s/g, "-")}-${new Date().toISOString().slice(0, 10)}.${ext}`
                      const file = new File([blob], fileName, { type: blob.type })
                      try {
                        await navigator.share({ title: `Correção Postural - ${selectedExercise.name}`, files: [file] })
                      } catch { /* user cancelled share */ }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600/15 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-600/25 active:scale-[0.97] transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                )}
                <button
                  onClick={() => { setShowReplay(false); setRecordedVideoUrl(null); recordedBlobRef.current = null }}
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
        <span>{TOTAL_EXERCISES_WITH_POSTURE} exercícios</span>
      </div>
    </div>
  )
}

// ═══ Animated Positioning Guide Component ═══════════════════════════════════

function PositioningGuide({ muscleGroup, exerciseId }: { muscleGroup: string; exerciseId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const guide = getPositioningGuide(muscleGroup as Parameters<typeof getPositioningGuide>[0], exerciseId)
    let t = 0
    const speed = 0.015

    function draw() {
      if (!ctx || !canvas) return
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Interpolate between start and end frames using sine wave (smooth back-and-forth)
      const progress = (Math.sin(t) + 1) / 2 // 0-1 oscillating
      t += speed

      const startPts = guide.startFrame.points
      const endPts = guide.endFrame.points
      const connections = guide.startFrame.connections

      // Interpolate points
      const currentPts = startPts.map((sp, i) => {
        const ep = endPts[i]
        if (!ep) return sp // Guard against mismatched array lengths
        return [
          sp[0] + (ep[0] - sp[0]) * progress,
          sp[1] + (ep[1] - sp[1]) * progress,
        ] as [number, number]
      })

      // Draw connections (skeleton lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      for (const [a, b] of connections) {
        ctx.beginPath()
        ctx.moveTo(currentPts[a][0] * w, currentPts[a][1] * h)
        ctx.lineTo(currentPts[b][0] * w, currentPts[b][1] * h)
        ctx.stroke()
      }

      // Draw joints (landmark dots)
      for (const pt of currentPts) {
        ctx.beginPath()
        ctx.arc(pt[0] * w, pt[1] * h, 5, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)"
        ctx.fill()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [muscleGroup, exerciseId])

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={160}
      className="w-[120px] h-[160px] opacity-80"
    />
  )
}
