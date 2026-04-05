"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Share2, Copy, Check, X, Swords, Trophy, ArrowLeft, Flame, MessageCircle, Gift, Send } from "lucide-react"
import {
  type BattleState,
  type BattleRole,
  type DataMessage,
  generateRoomId,
  getBattleLink,
  createBattleState,
  FitVSConnection,
  calculateBattleScore,
  determineWinner,
} from "@/lib/fitvs"
import { calculateAngle, LANDMARKS } from "@/lib/posture-rules"
import {
  STICKERS,
  GIFTS,
  FitVSSocialManager,
  rarityColor,
  rarityGlow,
  type FloatingItem,
} from "@/lib/fitvs-social"
import { LandmarkSmoother } from "@/lib/landmark-smoother"
import { ALL_EXERCISE_RULES as EXERCISE_RULES } from "@/lib/posture-rules-all"
import { getRepConfig } from "@/lib/posture-tracker"
import Link from "next/link"

// ─── Exercise picker (simplified for battles) ──────────────────────────────

const BATTLE_EXERCISES = [
  { id: "squat", name: "Agachamento", icon: "🦵" },
  { id: "push_up", name: "Flexão", icon: "💪" },
  { id: "bicep_curl_dumbbell", name: "Rosca Bíceps", icon: "💪" },
  { id: "shoulder_press_dumbbell", name: "Desenvolvimento", icon: "🏋️" },
  { id: "deadlift_conventional", name: "Levantamento Terra", icon: "🏋️" },
  { id: "lunge_forward", name: "Avanço", icon: "🦵" },
  { id: "lateral_raise_dumbbell", name: "Elevação Lateral", icon: "💪" },
  { id: "tricep_pushdown_cable", name: "Tríceps Pulley", icon: "💪" },
]

export function FitVSBattle({ initialRoomId, userName }: { initialRoomId: string | null; userName: string }) {
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState("squat")
  const [targetReps, setTargetReps] = useState(5)

  // Refs for video/canvas
  const myVideoRef = useRef<HTMLVideoElement>(null)
  const myCanvasRef = useRef<HTMLCanvasElement>(null)
  const opponentVideoRef = useRef<HTMLVideoElement>(null)
  const connectionRef = useRef<FitVSConnection | null>(null)
  const animFrameRef = useRef<number>(0)
  const smootherRef = useRef(new LandmarkSmoother())
  const poseLandmarkerRef = useRef<unknown>(null)
  const myStreamRef = useRef<MediaStream | null>(null)
  const battleRef = useRef<BattleState | null>(null)

  // Guards
  const joinPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownStartedRef = useRef(false)
  const recordedBlobRef = useRef<Blob | null>(null)

  // Recording
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  // Social layer (stickers, gifts, chat)
  const socialRef = useRef(new FitVSSocialManager())
  const [chatMessages, setChatMessages] = useState<typeof socialRef.current.messages>([])
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [totalGiftXP, setTotalGiftXP] = useState(0)

  useEffect(() => {
    battleRef.current = battle
  }, [battle])

  // Social manager update callback
  useEffect(() => {
    socialRef.current.onUpdate = () => {
      setChatMessages([...socialRef.current.messages])
      setFloatingItems([...socialRef.current.floatingItems])
    }
  }, [])

  // Animate floating items
  useEffect(() => {
    if (floatingItems.length === 0) return
    const interval = setInterval(() => {
      const now = Date.now()
      const active = socialRef.current.floatingItems.filter(item => now - item.startTime < item.duration + 200)
      if (active.length !== floatingItems.length) {
        socialRef.current.floatingItems = active
        setFloatingItems([...active])
      }
    }, 100)
    return () => clearInterval(interval)
  }, [floatingItems.length])

  // Auto-join if room ID in URL
  useEffect(() => {
    if (initialRoomId) {
      joinRoom(initialRoomId)
    }
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanup() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (joinPollRef.current) { clearTimeout(joinPollRef.current); joinPollRef.current = null }
    countdownStartedRef.current = false
    connectionRef.current?.close()
    myStreamRef.current?.getTracks().forEach(t => t.stop())
    if (poseLandmarkerRef.current) {
      try { (poseLandmarkerRef.current as { close: () => void }).close() } catch { /* */ }
    }
    recorderRef.current?.stop()
  }

  // ─── Create Room (Host) ────────────────────────────────────────────────

  async function createRoom() {
    const roomId = generateRoomId()
    const state = createBattleState("host", roomId)
    state.exerciseId = selectedExerciseId
    state.exerciseName = BATTLE_EXERCISES.find(e => e.id === selectedExerciseId)?.name || "Exercício"
    state.targetReps = targetReps
    setBattle(state)

    // Create room on server
    await fetch("/api/student/fitvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action: "create" }),
    })

    // Save exercise config
    await fetch("/api/student/fitvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        action: "config",
        data: JSON.stringify({ exerciseId: selectedExerciseId, exerciseName: state.exerciseName, targetReps }),
      }),
    })

    // Start camera + MediaPipe
    await startCamera(state)

    // Create WebRTC offer
    const conn = new FitVSConnection()
    connectionRef.current = conn
    await conn.attachLocalStream(myStreamRef.current!)

    conn.onRemoteStream = (stream) => {
      if (opponentVideoRef.current) {
        opponentVideoRef.current.srcObject = stream
        opponentVideoRef.current.play().catch(() => {})
      }
    }

    conn.onData = (msg) => handlePeerMessage(msg)
    conn.onConnectionChange = (connected) => {
      setBattle(prev => prev ? { ...prev, connected, status: connected ? "countdown" : prev.status } : prev)
      if (connected && !countdownStartedRef.current) { countdownStartedRef.current = true; startCountdown() }
    }

    const offer = await conn.createOffer()
    await fetch("/api/student/fitvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action: "offer", data: offer }),
    })

    // Poll for guest's answer
    pollForAnswer(roomId, conn)
  }

  // ─── Join Room (Guest) ─────────────────────────────────────────────────

  async function joinRoom(roomId: string) {
    // Check room exists and get config
    const res = await fetch(`/api/student/fitvs?roomId=${roomId}`)
    if (!res.ok) return

    const data = await res.json()
    if (!data.exists || !data.hasOffer) {
      // Poll until offer is available (cleanup cancels via joinPollRef)
      joinPollRef.current = setTimeout(() => joinRoom(roomId), 1000)
      return
    }

    const state = createBattleState("guest", roomId)
    state.exerciseId = data.exerciseId || "squat"
    state.exerciseName = data.exerciseName || "Exercício"
    state.targetReps = data.targetReps || 5
    setBattle(state)

    await startCamera(state)

    const conn = new FitVSConnection()
    connectionRef.current = conn
    await conn.attachLocalStream(myStreamRef.current!)

    conn.onRemoteStream = (stream) => {
      if (opponentVideoRef.current) {
        opponentVideoRef.current.srcObject = stream
        opponentVideoRef.current.play().catch(() => {})
      }
    }

    conn.onData = (msg) => handlePeerMessage(msg)
    conn.onConnectionChange = (connected) => {
      setBattle(prev => prev ? { ...prev, connected, status: connected ? "countdown" : prev.status } : prev)
      if (connected && !countdownStartedRef.current) { countdownStartedRef.current = true; startCountdown() }
    }

    // Accept offer and send answer
    const answer = await conn.acceptOffer(data.offer)
    await fetch("/api/student/fitvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action: "answer", data: answer }),
    })

    // Send name
    conn.send({ type: "name", payload: userName })
  }

  // ─── Poll for answer (Host only) ──────────────────────────────────────

  function pollForAnswer(roomId: string, conn: FitVSConnection) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/student/fitvs?roomId=${roomId}`)
        const data = await res.json()
        if (data.hasAnswer && data.answer) {
          clearInterval(interval)
          await conn.acceptAnswer(data.answer)
          conn.send({ type: "name", payload: userName })
        }
      } catch { /* retry */ }
    }, 1000)

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000)
  }

  // ─── Handle peer messages ─────────────────────────────────────────────

  function handlePeerMessage(msg: DataMessage) {
    if (msg.type === "score") {
      setBattle(prev => prev ? {
        ...prev,
        opponentScore: msg.score,
        opponentReps: msg.reps,
        opponentFormGrade: msg.grade,
      } : prev)
    } else if (msg.type === "name" && msg.payload) {
      setBattle(prev => prev ? { ...prev, opponentName: msg.payload! } : prev)
    } else if (msg.type === "finish") {
      finishBattle()
    }
  }

  // ─── Countdown ────────────────────────────────────────────────────────

  function startCountdown() {
    let count = 3
    setBattle(prev => prev ? { ...prev, status: "countdown", countdown: count } : prev)

    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setBattle(prev => prev ? { ...prev, countdown: count } : prev)
      } else {
        clearInterval(interval)
        setBattle(prev => prev ? { ...prev, status: "fighting", countdown: 0 } : prev)
        startAnalysis()
      }
    }, 1000)
  }

  // ─── Camera + MediaPipe ───────────────────────────────────────────────

  async function startCamera(state: BattleState) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      audio: false,
    })
    myStreamRef.current = stream

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream
      await myVideoRef.current.play()
    }
  }

  async function startAnalysis() {
    const canvas = myCanvasRef.current
    const video = myVideoRef.current
    if (!canvas || !video) return

    smootherRef.current.reset()

    // Load MediaPipe
    const vision = await import("@mediapipe/tasks-vision")
    const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision
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
        runningMode: "VIDEO",
        numPoses: 1,
      })
    } catch {
      poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })
    }
    poseLandmarkerRef.current = poseLandmarker

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const drawingUtils = new DrawingUtils(ctx)
    let lastTimestamp = -1
    let myReps = 0
    let phase: "idle" | "down" | "up" = "idle"
    let totalFormScore = 0
    let formFrames = 0

    // Start canvas recording for sharing
    try {
      const canvasStream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30)
      const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find(m => MediaRecorder.isTypeSupported(m)) || ""
      const recorder = new MediaRecorder(canvasStream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 4_000_000 })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(1000)
      recorderRef.current = recorder
    } catch { /* recording optional */ }

    function detect() {
      if (!video || !canvas || !ctx || !poseLandmarkerRef.current) return
      const landmarker = poseLandmarkerRef.current as typeof poseLandmarker
      const b = battleRef.current
      if (!b || b.status !== "fighting") return

      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight

      const now = performance.now()
      if (now === lastTimestamp) { animFrameRef.current = requestAnimationFrame(detect); return }
      lastTimestamp = now

      try {
        const results = landmarker.detectForVideo(video, now)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (results.landmarks && results.landmarks.length > 0) {
          const raw = results.landmarks[0] as import("@/lib/posture-rules").Point[]
          const landmarks = smootherRef.current.smooth(raw)

          // Draw skeleton
          drawingUtils.drawConnectors(landmarks as never, PoseLandmarker.POSE_CONNECTIONS, {
            color: "rgba(34, 197, 94, 0.8)", lineWidth: 3,
          })
          drawingUtils.drawLandmarks(landmarks as never, {
            color: "rgba(34, 197, 94, 1)", lineWidth: 1, radius: 4,
          })

          // Find exercise rule for analysis
          const exerciseRule = EXERCISE_RULES.find(r => r.id === b.exerciseId) || EXERCISE_RULES[0]
          const repConfig = getRepConfig(exerciseRule.muscleGroup, exerciseRule.id)
          const [ai1, ai2, ai3] = repConfig.anglePoints
          const p1 = landmarks[ai1], p2 = landmarks[ai2], p3 = landmarks[ai3]

          if (p1 && p2 && p3 && (p1.visibility ?? 0) > 0.3 && (p2.visibility ?? 0) > 0.3 && (p3.visibility ?? 0) > 0.3) {
            const angle = calculateAngle(p1, p2, p3)

            // Rep counting (reset to idle after rep to prevent inflation)
            if (angle < repConfig.downThreshold && phase === "idle") {
              phase = "down"
            } else if (angle > repConfig.upThreshold && phase === "down") {
              phase = "idle"
              myReps++
            }

            // Form scoring (how close to target angle at bottom)
            if (phase === "down") {
              const diff = Math.abs(angle - repConfig.targetAngle)
              const frameScore = Math.max(0, 100 - diff * 2)
              totalFormScore += frameScore
              formFrames++
            }
          }

          const avgForm = formFrames > 0 ? Math.round(totalFormScore / formFrames) : 50
          const battleScore = calculateBattleScore(avgForm, myReps, b.targetReps)
          const grade = avgForm >= 90 ? "S" : avgForm >= 80 ? "A" : avgForm >= 60 ? "B" : avgForm >= 40 ? "C" : "D"

          // Update local state
          setBattle(prev => prev ? { ...prev, myScore: battleScore, myReps: myReps, myFormGrade: grade } : prev)

          // Send score to opponent
          connectionRef.current?.send({
            type: "score", score: battleScore, reps: myReps, grade, timestamp: Date.now(),
          })

          // Draw score overlay on canvas
          drawBattleOverlay(ctx, canvas.width, canvas.height, myReps, battleScore, grade, b.targetReps)

          // Auto-finish when target reps reached
          if (myReps >= b.targetReps) {
            connectionRef.current?.send({ type: "finish" })
            finishBattle()
            return
          }
        }
      } catch { /* skip frame */ }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    detect()
  }

  function drawBattleOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, reps: number, score: number, grade: string, target: number) {
    // Rep counter bottom-right
    const fontSize = Math.max(36, w * 0.12)
    ctx.font = `bold ${fontSize}px -apple-system, sans-serif`
    ctx.textAlign = "right"
    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.fillText(`${reps}/${target}`, w - 8, h - 8)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(`${reps}/${target}`, w - 10, h - 10)

    // Score top-left
    ctx.textAlign = "left"
    ctx.font = `bold ${Math.max(18, w * 0.06)}px -apple-system, sans-serif`
    ctx.fillStyle = "rgba(0,0,0,0.7)"
    ctx.fillRect(0, 0, w * 0.4, 40)
    ctx.fillStyle = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"
    ctx.fillText(`${score}pts  ${grade}`, 8, 28)
    ctx.textAlign = "left"
  }

  function finishBattle() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = 0
    recorderRef.current?.stop()

    // Generate recorded video URL (revoke previous to prevent leak)
    setTimeout(() => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: "video/mp4" })
        recordedBlobRef.current = blob
        if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        setRecordedUrl(URL.createObjectURL(blob))
      }
    }, 500)

    setBattle(prev => {
      if (!prev) return prev
      const winner = determineWinner(prev.myScore, prev.opponentScore)
      return { ...prev, status: "finished", winner }
    })
  }

  // ─── Copy link ────────────────────────────────────────────────────────

  async function copyLink() {
    if (!battle) return
    const link = getBattleLink(battle.roomId)
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (!battle) return
    const link = getBattleLink(battle.roomId)
    if (navigator.share) {
      await navigator.share({ title: "FitVS Battle", text: `Me desafie no ${battle.exerciseName}!`, url: link })
    } else {
      copyLink()
    }
  }

  // ─── Share recorded video ─────────────────────────────────────────────

  async function shareVideo() {
    const blob = recordedBlobRef.current
    if (!blob) return
    const file = new File([blob], "fitvs-battle.mp4", { type: "video/mp4" })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "FitVS Battle" })
    } else {
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "fitvs-battle.mp4"
      a.click()
    }
  }

  // ═══ RENDER ═══════════════════════════════════════════════════════════

  // ─── No battle yet — TikTok-style lobby ────────────────────────────────
  if (!battle) {
    const selectedEx = BATTLE_EXERCISES.find(e => e.id === selectedExerciseId) || BATTLE_EXERCISES[0]
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Link href="/posture" className="p-2 -ml-2">
            <X className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-sm font-bold text-white">FitVS</h1>
          <div className="w-9" />
        </div>

        {/* Main visual — exercise card */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-6xl">{selectedEx.icon}</div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">{selectedEx.name}</h2>
            <p className="text-neutral-500 text-sm mt-1">{targetReps} repetições • quem faz melhor ganha</p>
          </div>

          {/* Exercise swiper (horizontal scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-2 max-w-full px-2 scrollbar-hide">
            {BATTLE_EXERCISES.map(ex => (
              <button
                key={ex.id}
                onClick={() => setSelectedExerciseId(ex.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all",
                  selectedExerciseId === ex.id
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70",
                )}
              >
                <span>{ex.icon}</span>
                <span>{ex.name}</span>
              </button>
            ))}
          </div>

          {/* Reps selector (simple pills) */}
          <div className="flex gap-3">
            {[3, 5, 8, 10].map(n => (
              <button
                key={n}
                onClick={() => setTargetReps(n)}
                className={cn(
                  "w-11 h-11 rounded-full text-sm font-black transition-all",
                  targetReps === n
                    ? "bg-emerald-500 text-white scale-110"
                    : "bg-white/10 text-white/50",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom CTA — one big button like TikTok "Go Live" */}
        <div className="px-6 pb-8 space-y-3">
          <button
            onClick={async () => {
              await createRoom()
              // Auto-share immediately after creating
              setTimeout(() => shareLink(), 500)
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-base active:scale-[0.96] transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5" />
            Convidar Amigo
          </button>
          <p className="text-[10px] text-neutral-600 text-center">O convite será enviado por WhatsApp, Instagram ou link</p>
        </div>
      </div>
    )
  }

  // ─── Waiting for opponent — TikTok style (full screen with camera) ─────
  if (battle.status === "waiting") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Full screen camera preview */}
        <div className="flex-1 relative">
          <video ref={myVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3">
            <button onClick={() => { cleanup(); setBattle(null) }} className="p-2 -ml-2">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] text-white font-bold">AGUARDANDO</span>
            </div>
            <div className="w-9" />
          </div>

          {/* Center — waiting message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full border-3 border-white/30 border-t-emerald-400 animate-spin" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">Esperando oponente...</p>
              <p className="text-white/50 text-xs mt-1">{battle.exerciseName} • {battle.targetReps} reps</p>
            </div>
          </div>

          {/* Bottom — share again */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 space-y-3">
            <button
              onClick={shareLink}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-bold text-sm active:scale-[0.96] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Enviar convite novamente
            </button>
            <button
              onClick={copyLink}
              className="w-full py-2.5 rounded-xl text-white/60 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Countdown ─────────────────────────────────────────────────────────
  if (battle.status === "countdown") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400 text-sm mb-4">{battle.exerciseName} • {battle.targetReps} reps</p>
          <div className="text-[120px] font-black text-emerald-400 animate-pulse">
            {battle.countdown > 0 ? battle.countdown : "GO!"}
          </div>
          <p className="text-neutral-500 text-sm mt-4">vs {battle.opponentName}</p>
        </div>
      </div>
    )
  }

  // ─── Fighting (TikTok VS split screen) ────────────────────────────────
  if (battle.status === "fighting") {
    const myWinning = battle.myScore >= battle.opponentScore
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* VS Badge center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-white font-black text-xs">VS</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-stretch h-10">
          <div className={cn("flex-1 flex items-center justify-center text-xs font-bold", myWinning ? "bg-emerald-600/80" : "bg-red-600/40")}>
            <span className="text-white">{userName}: {battle.myScore}pts</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className={cn("flex-1 flex items-center justify-center text-xs font-bold", !myWinning ? "bg-emerald-600/80" : "bg-red-600/40")}>
            <span className="text-white">{battle.opponentName}: {battle.opponentScore}pts</span>
          </div>
        </div>

        {/* Split screen */}
        <div className="flex-1 flex flex-col">
          {/* My video (top half) */}
          <div className="flex-1 relative overflow-hidden">
            <video ref={myVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover invisible" />
            <canvas ref={myCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-1 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-emerald-300 font-bold">
              {userName} • {battle.myReps}/{battle.targetReps} reps • {battle.myFormGrade}
            </div>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />

          {/* Opponent video (bottom half) */}
          <div className="flex-1 relative overflow-hidden bg-zinc-900">
            <video ref={opponentVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-1 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-cyan-300 font-bold">
              {battle.opponentName} • {battle.opponentReps}/{battle.targetReps} reps • {battle.opponentFormGrade}
            </div>
            {!battle.connected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-neutral-500 text-sm">Conectando...</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SOCIAL OVERLAY — Stickers, Chat, Gifts ═══ */}

        {/* Floating stickers/gifts animation */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingItems.map(item => {
            const pos = socialRef.current.getProgress(item)
            return (
              <div
                key={item.id}
                className="absolute transition-none"
                style={{
                  left: `${pos.x}%`,
                  bottom: `${100 - pos.y}%`,
                  opacity: pos.opacity,
                  transform: `scale(${pos.scale})`,
                  fontSize: `${24 * item.size}px`,
                  pointerEvents: "none",
                }}
              >
                {item.emoji}
              </div>
            )
          })}
        </div>

        {/* Live chat messages (floating up like TikTok) */}
        <div className="absolute bottom-16 left-2 right-16 z-20 flex flex-col-reverse gap-0.5 max-h-[30%] overflow-hidden pointer-events-none">
          {chatMessages.slice(-8).reverse().map(msg => (
            <div key={msg.id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm max-w-full animate-in slide-in-from-bottom-2 duration-300">
              {msg.gift ? (
                <span className="text-[10px] text-amber-300 truncate">
                  <span className="font-bold">{msg.userName}</span> enviou {msg.gift.emoji} {msg.gift.label} para {msg.giftTarget === "player1" ? "P1" : "P2"} (+{msg.gift.xpValue}XP)
                </span>
              ) : msg.sticker ? (
                <span className="text-[10px] text-white truncate">
                  <span className="font-bold text-emerald-300">{msg.userName}</span> {msg.sticker.emoji}
                </span>
              ) : (
                <span className="text-[10px] text-white truncate">
                  <span className="font-bold text-cyan-300">{msg.userName}</span>: {msg.text}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Sticker quick bar (right side, vertical) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
          {STICKERS.slice(0, 6).map(sticker => (
            <button
              key={sticker.id}
              onClick={() => socialRef.current.addSticker(userName, sticker)}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-lg hover:bg-black/70 active:scale-90 transition-all"
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
          <button
            onClick={() => setShowGiftPanel(!showGiftPanel)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all",
              showGiftPanel ? "bg-amber-600/80 text-white" : "bg-black/50 backdrop-blur-sm text-amber-300 hover:bg-black/70",
            )}
            title="Enviar presente"
          >
            <Gift className="w-4 h-4" />
          </button>
        </div>

        {/* Gift panel (slides up from bottom) */}
        {showGiftPanel && (
          <div className="absolute bottom-14 left-0 right-0 z-30 bg-black/90 backdrop-blur-md rounded-t-2xl border-t border-white/10 p-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> Presentes
              </p>
              <button onClick={() => setShowGiftPanel(false)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {GIFTS.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => {
                    socialRef.current.addGift(userName, gift, "player1")
                    setTotalGiftXP(prev => prev + gift.xpValue)
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 rounded-xl border bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 transition-all",
                    rarityColor(gift.rarity),
                    rarityGlow(gift.rarity),
                  )}
                >
                  <span className="text-xl">{gift.emoji}</span>
                  <span className="text-[8px] text-neutral-400">{gift.label}</span>
                  <span className="text-[7px] text-amber-400/70">+{gift.xpValue}XP</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input bar */}
        <div className="absolute bottom-1 left-1 right-12 z-20 flex gap-1">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && chatInput.trim()) {
                socialRef.current.addMessage(userName, chatInput.trim())
                setChatInput("")
              }
            }}
            placeholder="Manda um salve..."
            className="flex-1 px-2 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-white placeholder:text-neutral-600 border border-white/10 outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={() => {
              if (chatInput.trim()) {
                socialRef.current.addMessage(userName, chatInput.trim())
                setChatInput("")
              }
            }}
            className="p-1.5 rounded-full bg-emerald-600/80 text-white active:scale-90"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Gift XP counter */}
        {totalGiftXP > 0 && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-amber-600/80 text-white text-[10px] font-bold">
            ⚡ {totalGiftXP} XP recebido
          </div>
        )}

        {/* Stop button */}
        <div className="absolute bottom-1 right-1 z-20">
          <button
            onClick={() => { connectionRef.current?.send({ type: "finish" }); finishBattle() }}
            className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-500 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─── Finished — Results ────────────────────────────────────────────────
  if (battle.status === "finished") {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 space-y-3">
          {battle.winner === "me" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-amber-400">VITÓRIA!</h1>
            </>
          ) : battle.winner === "opponent" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-red-400">DERROTA</h1>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto">
                <Swords className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-cyan-400">EMPATE!</h1>
            </>
          )}

          <p className="text-neutral-500 text-sm">{battle.exerciseName} • {battle.targetReps} reps</p>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("rounded-xl p-4 text-center", battle.winner === "me" ? "bg-emerald-600/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/[0.06]")}>
            <p className="text-xs text-neutral-400">{userName}</p>
            <p className="text-3xl font-black text-white mt-1">{battle.myScore}</p>
            <p className="text-xs text-neutral-500 mt-1">{battle.myReps} reps • Grade {battle.myFormGrade}</p>
          </div>
          <div className={cn("rounded-xl p-4 text-center", battle.winner === "opponent" ? "bg-emerald-600/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/[0.06]")}>
            <p className="text-xs text-neutral-400">{battle.opponentName}</p>
            <p className="text-3xl font-black text-white mt-1">{battle.opponentScore}</p>
            <p className="text-xs text-neutral-500 mt-1">{battle.opponentReps} reps • Grade {battle.opponentFormGrade}</p>
          </div>
        </div>

        {/* Share / Download recorded video */}
        {recordedUrl && (
          <div className="space-y-2">
            <video src={recordedUrl} controls className="w-full rounded-xl" />
            <button
              onClick={shareVideo}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm hover:from-pink-500 hover:to-purple-500 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar nas Redes
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => { cleanup(); setBattle(null); chunksRef.current = []; if (recordedUrl) URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); recordedBlobRef.current = null }}
            className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm font-semibold hover:bg-white/[0.10] transition-colors"
          >
            Nova Batalha
          </button>
          <Link
            href="/posture"
            className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neutral-400 text-sm text-center hover:text-white transition-colors"
          >
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  return null
}
