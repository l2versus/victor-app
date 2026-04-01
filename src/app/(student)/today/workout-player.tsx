"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Play, ChevronLeft, ChevronRight, Check, Dumbbell, Clock,
  Flame, Trophy, X, Zap, Plus, Pencil, Trash2, ChevronDown, Box, AlertTriangle,
} from "lucide-react"
import { useRestTimer } from "@/hooks/use-rest-timer"
import { useSwipe } from "@/hooks/use-swipe"
import { BodyFocusBadges } from "@/components/student/muscle-info-card"
import { Exercise3DButton } from "@/components/student/exercise-3d-viewer"
import { useCelebration, type CelebrationType } from "@/components/student/celebration"
// Spotify removed — was breaking layout
import { RMCalculatorButton } from "@/components/student/rm-calculator"
import { ExerciseDetailModal } from "@/components/student/exercise-detail-modal"
import { SafeImage } from "@/components/ui/safe-image"
import { ShareWorkoutCard } from "@/components/student/share-workout-card"

// ═══ HELPERS ═══
/** Format kg: 80 → "80", 80.5 → "80.5", 80.0 → "80" */
function fmtKg(v: number): string {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)
}

// ═══ BRAND FLAGS ═══
const BRAND_FLAGS: Record<string, string> = {
  "Hammer Strength": "🇺🇸", "Hammer Strength MTS": "🇺🇸",
  "Hoist": "🇺🇸", "Hoist ROC-IT": "🇺🇸",
  "Nautilus": "🇺🇸", "Nautilus Impact": "🇺🇸", "Nautilus Inspiration": "🇺🇸",
  "Life Fitness": "🇺🇸", "Life Fitness Insignia": "🇺🇸",
  "Cybex Prestige": "🇺🇸", "Matrix": "🇹🇼",
  "Panatta": "🇮🇹", "Panatta Monolith": "🇮🇹", "Panatta Inspiration": "🇮🇹",
  "Stark Strong": "🇧🇷", "ICG": "🇩🇪",
}

// ═══ TYPES ═══

type Technique = "NORMAL" | "DROP_SET" | "REST_PAUSE" | "PYRAMID" | "REVERSE_PYRAMID" | "FST7" | "MYO_REPS"

interface ExerciseData {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string | null
  imageUrl: string | null
  gifUrl: string | null
  videoUrl: string | null
  machineBrand: string | null
  machine3dModel: string | null
  sets: number
  reps: string
  restSeconds: number
  loadKg: number | null
  notes: string | null
  supersetGroup: string | null
  suggestedMachine: string | null
  technique: Technique
  lastSets: { setNumber: number; reps: number; loadKg: number; technique: string }[]
}

interface CompletedSet {
  id?: string
  exerciseId: string
  setNumber: number
  reps: number
  loadKg: number
  technique: Technique
  isExtra: boolean
}

interface WorkoutPlayerProps {
  studentId: string
  templateId: string
  templateName: string
  templateType: string
  exercises: ExerciseData[]
  totalSets: number
  activeSession: {
    id: string
    startedAt: string
    completedSets: CompletedSet[]
  } | null
  completedToday: {
    durationMin: number | null
    rpe: number | null
  } | null
  isScheduledToday?: boolean
  viewingDayName?: string
  userName?: string
  userAvatar?: string | null
}

type Phase = "preview" | "active" | "rest" | "summary" | "done"

// ═══ TECHNIQUE HELPERS ═══

const TECHNIQUE_INFO: Record<Technique, { label: string; shortLabel: string; color: string; description: string }> = {
  NORMAL: { label: "Normal", shortLabel: "Normal", color: "text-neutral-400", description: "Séries padrão" },
  DROP_SET: { label: "Drop Set", shortLabel: "Drop", color: "text-purple-400", description: "Reduza o peso e continue sem descanso" },
  REST_PAUSE: { label: "Rest-Pause", shortLabel: "R-P", color: "text-cyan-400", description: "Pause 10-15s e faça mais reps" },
  PYRAMID: { label: "Pirâmide", shortLabel: "Pir", color: "text-amber-400", description: "Aumente o peso a cada série" },
  REVERSE_PYRAMID: { label: "Pirâmide Invertida", shortLabel: "PirInv", color: "text-orange-400", description: "Comece pesado e reduza" },
  FST7: { label: "FST-7", shortLabel: "FST7", color: "text-rose-400", description: "7 séries, 30s descanso (fascia stretch)" },
  MYO_REPS: { label: "Myo-Reps", shortLabel: "Myo", color: "text-emerald-400", description: "Série ativadora + mini-séries de 3-5 reps" },
}

function TechniqueBadge({ technique, size = "sm" }: { technique: Technique; size?: "sm" | "md" }) {
  if (technique === "NORMAL") return null
  const info = TECHNIQUE_INFO[technique]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${
      size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
    } font-medium ${info.color} bg-current/10 border-current/20`}
    style={{ backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}
    >
      <Zap className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {size === "sm" ? info.shortLabel : info.label}
    </span>
  )
}

// ═══ MAIN COMPONENT ═══

export function WorkoutPlayer({
  templateId,
  templateName,
  templateType,
  exercises,
  totalSets,
  activeSession,
  completedToday,
  isScheduledToday = true,
  viewingDayName,
  userName = "Atleta",
  userAvatar,
}: WorkoutPlayerProps) {
  const [phase, setPhase] = useState<Phase>(() => {
    if (completedToday) return "done"
    if (activeSession) {
      try {
        // Check if workout was discarded before navigation
        const discarded = sessionStorage.getItem(`workout_discarded_${activeSession.id}`)
        if (discarded === "true") return "preview" // Session was discarded, ignore activeSession
        // Check if workout was paused before navigation
        const paused = sessionStorage.getItem(`workout_paused_${activeSession.id}`)
        if (paused === "true") return "preview" // Stay paused on remount
      } catch {}
      return "active"
    }
    return "preview"
  })
  const [showShareCard, setShowShareCard] = useState(false)
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (!activeSession) return null
    // If this session was discarded, don't restore it
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(`workout_discarded_${activeSession.id}`) === "true") return null
    } catch {}
    return activeSession.id
  })
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [completedSets, setCompletedSets] = useState<Map<string, CompletedSet[]>>(
    () => {
      const map = new Map<string, CompletedSet[]>()
      if (activeSession) {
        for (const s of activeSession.completedSets) {
          const key = s.exerciseId
          if (!map.has(key)) map.set(key, [])
          map.get(key)!.push(s)
        }
      }
      return map
    }
  )
  const [rpe, setRpe] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Timer state — ONLY trust sessionStorage, never raw startedAt (could be hours ago)
  const [elapsed, setElapsed] = useState(() => {
    if (typeof window === "undefined" || !activeSession) return 0
    try {
      const saved = sessionStorage.getItem(`workout_elapsed_${activeSession.id}`)
      if (saved) return parseInt(saved, 10) || 0
    } catch {}
    return 0 // No saved data = start from 0
  })
  const [nextExName, setNextExName] = useState("")
  const startTimeRef = useRef<Date | null>(
    (() => {
      if (!activeSession) return null
      if (typeof window !== "undefined") {
        try {
          // If paused → timer stopped
          if (sessionStorage.getItem(`workout_paused_${activeSession.id}`) === "true") return null
          // If has saved elapsed → resuming, start from now
          if (sessionStorage.getItem(`workout_elapsed_${activeSession.id}`)) return new Date()
        } catch {}
      }
      // No sessionStorage data at all → fresh start from now (not startedAt from hours ago)
      return new Date()
    })()
  )
  const timerRef = useRef<NodeJS.Timeout>(null)
  const pausedElapsedRef = useRef(
    (() => {
      if (typeof window === "undefined" || !activeSession) return 0
      try {
        const saved = sessionStorage.getItem(`workout_elapsed_${activeSession.id}`)
        if (saved) return parseInt(saved, 10) || 0
      } catch {}
      return 0
    })()
  )

  const totalCompleted = Array.from(completedSets.values()).reduce((sum, arr) => sum + arr.length, 0)
  const progress = totalSets > 0 ? totalCompleted / totalSets : 0
  const currentEx = exercises[currentExIdx] ?? exercises[0]

  // Elapsed timer — only runs during active/rest, pauses correctly, persists across navigation
  useEffect(() => {
    if (phase === "active" || phase === "rest") {
      if (!startTimeRef.current) {
        startTimeRef.current = new Date()
      }
      // Clear pause flag in sessionStorage
      if (sessionId) {
        try {
          sessionStorage.removeItem(`workout_paused_${sessionId}`)
        } catch {}
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const sinceResume = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
          setElapsed(pausedElapsedRef.current + sinceResume)
        }
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
    // When going to preview (pause), save accumulated time
    if (phase === "preview" && startTimeRef.current) {
      const sinceResume = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      pausedElapsedRef.current += sinceResume
      startTimeRef.current = null
      if (timerRef.current) clearInterval(timerRef.current)
      // Persist pause state so navigation doesn't lose it
      if (sessionId) {
        try {
          sessionStorage.setItem(`workout_paused_${sessionId}`, "true")
          sessionStorage.setItem(`workout_elapsed_${sessionId}`, String(pausedElapsedRef.current))
        } catch {}
      }
    }
  }, [phase, sessionId])

  // Rest timer
  const restTimer = useRestTimer(() => {
    navigator.vibrate?.([200])
    setPhase("active")
  })

  // Auto-clear error after 5s
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  // Swipe
  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (currentExIdx < exercises.length - 1) setCurrentExIdx((i) => i + 1)
    },
    onSwipeRight: () => {
      if (currentExIdx > 0) setCurrentExIdx((i) => i - 1)
    },
  })

  // Start or resume workout
  async function handleStart() {
    // Resume from pause — session already exists
    if (sessionId) {
      setPhase("active")
      return
    }
    // New session
    try {
      const res = await fetch("/api/student/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erro ao iniciar treino")
      if (data.session) {
        // Clean up any previous discard flags
        if (activeSession?.id) {
          try { sessionStorage.removeItem(`workout_discarded_${activeSession.id}`) } catch {}
        }
        setSessionId(data.session.id)
        startTimeRef.current = new Date()
        pausedElapsedRef.current = 0
        setPhase("active")
      }
    } catch {
      setError("Não foi possível iniciar o treino. Tente novamente.")
    }
  }

  // Complete a set
  const handleCompleteSet = useCallback(async (
    exerciseId: string,
    setNumber: number,
    reps: number,
    rawLoadKg: number,
    technique: Technique = "NORMAL",
    isExtra: boolean = false,
  ) => {
    if (!sessionId) return
    const loadKg = Math.round(Math.min(Math.max(rawLoadKg, 0), 999) * 10) / 10

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50)
    }

    try {
      const res = await fetch(`/api/student/sessions/${sessionId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, setNumber, reps, loadKg, technique, isExtra }),
      })
      const data = await res.json()

      let newExSetsCount = 0
      let newTotalCount = 0

      setCompletedSets((prev) => {
        const next = new Map(prev)
        const existing = next.get(exerciseId) || []
        next.set(exerciseId, [...existing, {
          id: data.set?.id,
          exerciseId,
          setNumber,
          reps,
          loadKg,
          technique,
          isExtra,
        }])
        newExSetsCount = existing.length + 1
        newTotalCount = Array.from(next.values()).reduce((sum, arr) => sum + arr.length, 0)
        return next
      })

      const prescribedSets = exercises.find((e) => e.id === exerciseId)?.sets || 0

      if (newExSetsCount >= prescribedSets && !isExtra) {
        if (currentExIdx < exercises.length - 1) {
          setNextExName(exercises[currentExIdx + 1].name)
          setPhase("rest")
          restTimer.start(currentEx.restSeconds)
        } else if (newTotalCount >= totalSets) {
          setPhase("summary")
        }
      } else {
        // Rest between sets (shorter for techniques like FST7)
        const restTime = technique === "FST7" ? 30
          : technique === "REST_PAUSE" ? 15
          : technique === "MYO_REPS" ? 5
          : technique === "DROP_SET" ? 0
          : currentEx.restSeconds
        if (restTime > 0) {
          setPhase("rest")
          restTimer.start(restTime)
        }
      }
    } catch {
      setError("Erro ao salvar série. Tente novamente.")
    }
  }, [sessionId, exercises, currentExIdx, currentEx, totalSets, restTimer])

  // Edit an existing set
  const handleEditSet = useCallback(async (
    setId: string,
    reps: number,
    rawLoadKg: number,
    technique: Technique,
    exerciseId: string,
    setNumber: number,
  ) => {
    if (!sessionId) return
    const loadKg = Math.round(Math.min(Math.max(rawLoadKg, 0), 999) * 10) / 10
    try {
      const res = await fetch(`/api/student/sessions/${sessionId}/sets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, reps, loadKg, technique }),
      })
      if (!res.ok) throw new Error("Falha ao salvar")

      setCompletedSets((prev) => {
        const next = new Map(prev)
        const sets = next.get(exerciseId) || []
        const idx = sets.findIndex((s) => s.id === setId || (s.setNumber === setNumber && !s.id))
        if (idx >= 0) {
          sets[idx] = { ...sets[idx], reps, loadKg, technique }
          next.set(exerciseId, [...sets])
        }
        return next
      })
    } catch {
      setError("Erro ao editar série.")
    }
  }, [sessionId])

  // Delete extra set
  const handleDeleteSet = useCallback(async (setId: string, exerciseId: string) => {
    if (!sessionId || !setId) return
    try {
      const res = await fetch(`/api/student/sessions/${sessionId}/sets?setId=${setId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Falha ao deletar")
      setCompletedSets((prev) => {
        const next = new Map(prev)
        const sets = (next.get(exerciseId) || []).filter((s) => s.id !== setId)
        next.set(exerciseId, sets)
        return next
      })
    } catch {
      setError("Erro ao remover série.")
    }
  }, [sessionId])

  // Celebration
  const { celebrate, CelebrationUI } = useCelebration()

  // Finish workout
  async function handleFinish() {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/student/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString(), rpe }),
      })
      const data = await res.json()
      setPhase("done")

      // Clean up pause state from sessionStorage
      try {
        sessionStorage.removeItem(`workout_paused_${sessionId}`)
        sessionStorage.removeItem(`workout_elapsed_${sessionId}`)
      } catch {}

      if (data.achievements && data.achievements.length > 0) {
        const ach = data.achievements[0]
        const type: CelebrationType = ach.type.includes("PR") ? "pr"
          : ach.type.includes("STREAK") ? "streak"
          : ach.type.includes("LEVEL") ? "level_up"
          : "milestone"
        setTimeout(() => celebrate(type, ach.message, ach.detail || "Parabéns pela conquista!"), 800)
      }
    } catch {
      setError("Erro ao finalizar treino. Tente novamente.")
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // ═══ DONE STATE ═══
  if (phase === "done") {
    const rpeLabel = completedToday?.rpe
      ? completedToday.rpe <= 3 ? "Leve" : completedToday.rpe <= 6 ? "Moderado" : completedToday.rpe <= 8 ? "Intenso" : "Máximo"
      : null
    const rpeColor = completedToday?.rpe
      ? completedToday.rpe <= 3 ? "text-emerald-400" : completedToday.rpe <= 6 ? "text-amber-400" : completedToday.rpe <= 8 ? "text-orange-400" : "text-red-400"
      : ""

    return (
      <div className="space-y-5 pt-4">
        {CelebrationUI}
        <div className="flex flex-col items-center text-center pb-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/15 flex items-center justify-center mb-5 animate-pulse-glow" style={{ "--tw-shadow-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}>
            <Check className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Treino Concluído</h2>
          <p className="text-neutral-500 text-sm">{templateName}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{completedToday?.durationMin || "—"}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Minutos</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 text-center">
            <Dumbbell className="w-4 h-4 text-red-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{totalSets}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Séries</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-2" />
            <p className={`text-lg font-bold ${rpeColor || "text-neutral-600"}`}>{completedToday?.rpe || "—"}</p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">{rpeLabel || "RPE"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
          <h3 className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3">Exercícios realizados</h3>
          <div className="space-y-2">
            {exercises.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 py-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-neutral-300 truncate flex-1">{ex.name}</span>
                <div className="flex items-center gap-1.5">
                  <TechniqueBadge technique={ex.technique} />
                  <span className="text-[10px] text-neutral-600">{ex.sets}x{ex.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={() => setShowShareCard(true)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-red-600/20"
        >
          <Trophy className="w-4 h-4" />
          Compartilhar Treino
        </button>

        <p className="text-center text-xs text-neutral-600 pb-2">
          Descanse bem e volte amanhã para o próximo treino
        </p>

        {/* Share card modal */}
        {showShareCard && (
          <ShareWorkoutCard
            templateName={templateName}
            exerciseCount={exercises.length}
            totalVolume={Array.from(completedSets.values()).flat().reduce((sum, s) => sum + (s.reps * s.loadKg), 0)}
            durationMin={completedToday?.durationMin || 0}
            streak={0}
            userName={userName}
            userAvatar={userAvatar}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    )
  }

  // ═══ PREVIEW STATE ═══
  if (phase === "preview") {
    return (
      <div className="space-y-5">
        {/* ═══ STICKY START BUTTON — always visible ═══ */}
        <div className="sticky top-0 z-30 pt-2 pb-1 -mx-4 px-4 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-base shadow-xl shadow-red-600/25 hover:from-red-500 hover:to-red-600 active:scale-[0.98] transition-all duration-300"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {sessionId ? "Retomar Treino" : isScheduledToday ? "Iniciar Treino" : "Treinar Agora"}
          </button>
          {sessionId && activeSession && (
            <p className="text-center text-[10px] text-amber-400/70 mt-1">
              {totalCompleted} séries feitas · treino em andamento
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
            <span>{error}</span>
          </div>
        )}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
            <Dumbbell className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">{templateType}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{templateName}</h1>
          <p className="text-neutral-500 text-sm">
            {exercises.length} exercício{exercises.length !== 1 ? "s" : ""} · {totalSets} séries · ~{Math.round(totalSets * 1.5)}min
          </p>
        </div>

        {(() => {
          const muscles = [...new Set(exercises.map(e => e.muscle))]
          return <BodyFocusBadges muscles={muscles} />
        })()}

        <div className="space-y-3">
          {exercises.map((ex, i) => {
            const thumbnail = ex.imageUrl || null
            const hasVideo = !!ex.videoUrl
            const brandFlag = ex.machineBrand ? BRAND_FLAGS[ex.machineBrand] : null

            return (
              <div
                key={ex.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-white/[0.1] transition-all duration-300 cursor-pointer active:scale-[0.99] group/card"
                onClick={() => setExerciseDetail(ex)}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Main row — info left, thumbnail right */}
                <div className="flex gap-3 p-4">
                  {/* Left: exercise info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name + number */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center text-red-400 text-xs font-bold border border-red-500/15 shrink-0 shadow-sm shadow-red-600/10">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight group-hover/card:text-red-50 transition-colors">{ex.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <TechniqueBadge technique={ex.technique} />
                          <Exercise3DButton exerciseName={ex.name} />
                        </div>
                      </div>
                    </div>

                    {/* Sets / Load — pill style */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px]">
                        <span className="text-neutral-500">Séries</span>
                        <span className="text-white font-bold tabular-nums">{ex.sets}×{ex.reps}</span>
                      </span>
                      {ex.loadKg != null && ex.loadKg > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px]">
                          <span className="text-neutral-500">Carga</span>
                          <span className="text-white font-bold tabular-nums">{fmtKg(ex.loadKg)}kg</span>
                        </span>
                      )}
                    </div>

                    {/* Instructions */}
                    {ex.instructions && (
                      <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">{ex.instructions}</p>
                    )}

                    {/* Machine location */}
                    {ex.suggestedMachine && (
                      <p className="text-[10px] text-amber-400/70 truncate">📍 {ex.suggestedMachine}</p>
                    )}
                  </div>

                  {/* Right: machine thumbnail or exercise image */}
                  <div
                    className="w-24 h-24 rounded-xl overflow-hidden border border-white/[0.08] shrink-0 relative bg-neutral-900 cursor-pointer active:scale-95 transition-transform shadow-lg shadow-black/20"
                    onClick={e => { e.stopPropagation(); setExerciseDetail(ex) }}
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt={ex.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" loading="lazy" />
                    ) : ex.machine3dModel ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-600/10 to-red-900/5 gap-1">
                        <Box className="w-6 h-6 text-red-400" />
                        <span className="text-[8px] text-red-400 font-bold">3D</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                        <Dumbbell className="w-6 h-6 text-neutral-700" />
                      </div>
                    )}
                    {/* Play overlay when video exists */}
                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/card:bg-black/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-red-600/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-red-600/30 group-hover/card:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    )}
                    {/* Brand badge */}
                    {brandFlag && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white flex items-center gap-1">
                        <span>{brandFlag}</span>
                        <span className="truncate max-w-[60px]">{ex.machineBrand}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline GIF / Video preview */}
                {(ex.gifUrl || (ex.videoUrl && !ex.imageUrl)) && (
                  <div className="px-4 pb-2">
                    {ex.gifUrl ? (
                      <SafeImage src={ex.gifUrl} alt={ex.name} className="w-full rounded-xl max-h-48 object-contain bg-black" />
                    ) : ex.videoUrl ? (
                      <video src={ex.videoUrl} className="w-full rounded-xl max-h-48 object-contain bg-black" autoPlay loop muted playsInline />
                    ) : null}
                  </div>
                )}

                {/* Extra info row */}
                {(ex.notes || ex.technique !== "NORMAL") && (
                  <div className="px-4 pb-3 space-y-2">
                    {ex.notes && (
                      <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-300/80">{ex.notes}</p>
                      </div>
                    )}
                    {ex.technique !== "NORMAL" && (
                      <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <Zap className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-purple-300/80">{TECHNIQUE_INFO[ex.technique].description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!isScheduledToday && viewingDayName && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15">
            <Dumbbell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80">
              Treino de <span className="font-semibold text-amber-300">{viewingDayName}</span> — você pode treinar agora se quiser
            </p>
          </div>
        )}

        {/* Pending session reminder */}
        {sessionId && activeSession && (
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300">Treino em andamento</p>
              <p className="text-[10px] text-amber-400/60">
                {totalCompleted} séries feitas · Retome ou descarte
              </p>
            </div>
          </div>
        )}

        {/* ═══ EXERCISE DETAIL MODAL ═══ */}
        {exerciseDetail && (
          <ExerciseDetailModal exercise={exerciseDetail} onClose={() => setExerciseDetail(null)} />
        )}

        {/* ═══ VIDEO MODAL ═══ */}
        {videoModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-white truncate">{videoModal.name}</p>
                <button onClick={() => setVideoModal(null)} className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                {videoModal.url.includes("youtube.com") || videoModal.url.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoModal.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || ""}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : videoModal.url.includes("instagram.com") ? (
                  <div className="flex items-center justify-center h-full">
                    <a href={videoModal.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium">
                      Abrir no Instagram
                    </a>
                  </div>
                ) : (
                  <video src={videoModal.url} controls autoPlay className="w-full h-full" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══ REST TIMER OVERLAY ═══
  if (phase === "rest") {
    const circumference = 2 * Math.PI * 70
    const offset = circumference * (1 - restTimer.progress)

    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#030303]/98 backdrop-blur-3xl animate-slide-up">
        {/* Ambient glow behind timer */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-red-600/[0.06] blur-[100px]" />
        </div>

        <div className="relative w-60 h-60 mb-10 animate-timer-pulse animate-timer-glow">
          <svg className="w-full h-full timer-circle" viewBox="0 0 160 160">
            {/* Track */}
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
            {/* Background subtle track */}
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(220,38,38,0.08)" strokeWidth="4" />
            {/* Progress */}
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke="url(#timerGradient)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            {/* Glow circle */}
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke="url(#timerGradient)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear", opacity: 0.15, filter: "blur(8px)" }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-8xl font-bold text-white tabular-nums drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">{restTimer.remaining}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-[0.25em] mt-2 font-semibold">Descanso</p>
          </div>
        </div>

        {nextExName && (
          <div className="text-center mb-10 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[9px] text-neutral-600 uppercase tracking-[0.15em] mb-1 font-semibold">Próximo exercício</p>
            <p className="text-sm text-white font-bold">{nextExName}</p>
          </div>
        )}

        <button
          onClick={() => { restTimer.skip(); setPhase("active") }}
          className="px-10 py-3.5 rounded-xl border border-white/10 bg-white/[0.05] text-neutral-300 text-sm font-bold hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all active:scale-95 backdrop-blur-sm"
        >
          Pular Descanso
        </button>
      </div>
    )
  }

  // ═══ SUMMARY STATE ═══
  if (phase === "summary") {
    return (
      <div className="space-y-6 pt-4">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
            <span>{error}</span>
          </div>
        )}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Treino Finalizado!</h2>
          <p className="text-neutral-500 text-sm">{formatTime(elapsed)} · {totalCompleted} séries</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4 text-center">Como foi o treino? (RPE)</h3>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <button
                key={v}
                onClick={() => setRpe(v)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-90 ${
                  rpe === v
                    ? v <= 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : v <= 6 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : v <= 8 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/[0.03] text-neutral-500 border border-white/[0.06] hover:bg-white/[0.06]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-neutral-600">Fácil</span>
            <span className="text-[9px] text-neutral-600">Máximo</span>
          </div>
        </div>

        <button
          onClick={handleFinish}
          disabled={rpe === null}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${
            rpe !== null
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98]"
              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
          }`}
        >
          <Check className="w-5 h-5" />
          {rpe === null ? "Selecione o RPE acima" : "Concluir Treino"}
        </button>
      </div>
    )
  }

  // ═══ ACTIVE STATE ═══
  const exCompletedSets = completedSets.get(currentEx.id) || []
  const prescribedSetCount = currentEx.sets
  const isExerciseDone = exCompletedSets.filter(s => !s.isExtra).length >= prescribedSetCount

  return (
    <div className="space-y-4" {...swipe}>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm animate-slide-up">
          <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
          <span>{error}</span>
        </div>
      )}

      {/* Progress bar + controls — premium status bar */}
      <div className="space-y-2.5">
        {/* Full-width progress bar */}
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full progress-bar-premium transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span className="text-xs text-white font-bold tabular-nums">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <Dumbbell className="w-3 h-3 text-neutral-500" />
              <span className="text-xs font-bold tabular-nums">
                <span className="text-white">{totalCompleted}</span>
                <span className="text-neutral-600">/{totalSets}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPhase("preview")}
              className="text-[11px] text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] font-medium"
            >
              ⏸ Pausar
            </button>
            <button
              onClick={async () => {
                if (!confirm("Descartar treino? O progresso será apagado e você poderá iniciar novamente.")) return
                const discardId = sessionId
                if (discardId) {
                  // Mark as discarded FIRST so navigation can't restore it
                  try {
                    sessionStorage.setItem(`workout_discarded_${discardId}`, "true")
                    sessionStorage.removeItem(`workout_paused_${discardId}`)
                    sessionStorage.removeItem(`workout_elapsed_${discardId}`)
                  } catch {}
                  // Then delete from DB
                  try {
                    const res = await fetch(`/api/student/sessions/${discardId}`, { method: "DELETE" })
                    if (res.ok) {
                      // Delete succeeded — clean up the discard flag
                      try { sessionStorage.removeItem(`workout_discarded_${discardId}`) } catch {}
                    }
                    // If delete failed, the discard flag stays to prevent restoration
                  } catch {}
                }
                setSessionId(null)
                setPhase("preview")
                setElapsed(0)
                pausedElapsedRef.current = 0
                startTimeRef.current = null
                setCompletedSets(new Map())
                if (timerRef.current) clearInterval(timerRef.current)
              }}
              className="text-[11px] text-red-500/50 hover:text-red-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-red-500/10 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Navigation — pill style */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentExIdx((i) => Math.max(0, i - 1))}
          disabled={currentExIdx === 0}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1">
          {exercises.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentExIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentExIdx
                  ? "w-6 bg-red-500"
                  : (completedSets.get(exercises[idx].id)?.filter(s => !s.isExtra).length ?? 0) >= exercises[idx].sets
                  ? "w-1.5 bg-emerald-500/60"
                  : "w-1.5 bg-white/10 hover:bg-white/20"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentExIdx((i) => Math.min(exercises.length - 1, i + 1))}
          disabled={currentExIdx === exercises.length - 1}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Exercise Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden swipe-container shadow-xl shadow-black/20">
        {/* Exercise header — image banner or compact */}
        {(() => {
          const thumb = currentEx.gifUrl || currentEx.imageUrl
          if (thumb) return (
            <button
              onClick={() => setExerciseDetail(currentEx)}
              className="relative w-full h-28 overflow-hidden group"
            >
              <img src={thumb} alt={currentEx.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="text-lg font-bold text-white truncate drop-shadow-lg">{currentEx.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-neutral-300/80">{currentEx.muscle} · {currentEx.equipment}</p>
                  <TechniqueBadge technique={currentEx.technique} size="md" />
                </div>
              </div>
              {isExerciseDone && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center animate-set-complete">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </button>
          )
          return null
        })()}

        <div className="p-5">
        {/* Compact header when no image */}
        {!currentEx.gifUrl && !currentEx.imageUrl && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 min-w-0 flex items-start gap-3">
              {currentEx.machine3dModel ? (
                <button
                  onClick={() => setExerciseDetail(currentEx)}
                  className="w-14 h-14 rounded-xl overflow-hidden border border-red-500/20 shrink-0 bg-gradient-to-br from-red-600/15 to-red-900/10 flex flex-col items-center justify-center gap-0.5"
                >
                  <Box className="w-4 h-4 text-red-400" />
                  <span className="text-[8px] text-red-400 font-bold">3D</span>
                </button>
              ) : (
                <button
                  onClick={() => setExerciseDetail(currentEx)}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600/20 to-red-800/10 flex flex-col items-center justify-center text-red-400 border border-red-500/15 shrink-0 gap-0.5"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span className="text-[7px] text-neutral-400 font-bold">DETALHES</span>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{currentEx.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-neutral-500">{currentEx.muscle} · {currentEx.equipment}</p>
                  <TechniqueBadge technique={currentEx.technique} size="md" />
                  <RMCalculatorButton exerciseName={currentEx.name} />
                </div>
              </div>
            </div>
            {isExerciseDone && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center animate-set-complete">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
        )}

        {/* RM Calculator — show only when image header is used */}
        {(currentEx.gifUrl || currentEx.imageUrl) && (
          <div className="flex items-center gap-2 mb-4">
            <RMCalculatorButton exerciseName={currentEx.name} />
            <Exercise3DButton exerciseName={currentEx.name} />
          </div>
        )}

        {/* Technique description */}
        {currentEx.technique !== "NORMAL" && (
          <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <Zap className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-300/80">{TECHNIQUE_INFO[currentEx.technique].description}</p>
          </div>
        )}

        {/* Instructions */}
        {currentEx.instructions && (
          <p className="text-xs text-neutral-500 mb-4 leading-relaxed border-l-2 border-red-500/20 pl-3">
            {currentEx.instructions}
          </p>
        )}

        {/* Sets Grid — Header */}
        <div className="space-y-2">
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-2 mb-1 px-2">
            <span className="text-[8px] text-neutral-600 uppercase tracking-[0.15em] text-center font-semibold">Série</span>
            <span className="text-[8px] text-neutral-600 uppercase tracking-[0.15em] text-center font-semibold">Reps</span>
            <span className="text-[8px] text-neutral-600 uppercase tracking-[0.15em] text-center font-semibold">Total KG</span>
            <span className="text-[8px] text-neutral-600 uppercase tracking-[0.15em] text-center font-semibold">Técnica</span>
            <span className="text-[8px] text-neutral-600 uppercase tracking-[0.15em] text-center font-semibold"></span>
          </div>

          {/* Prescribed sets */}
          {Array.from({ length: prescribedSetCount }, (_, i) => {
            const setNum = i + 1
            const completed = exCompletedSets.find((s) => s.setNumber === setNum && !s.isExtra)
            const lastSet = currentEx.lastSets.find((s) => s.setNumber === setNum)
            const suggestedLoad = lastSet?.loadKg || currentEx.loadKg || 0
            const suggestedReps = parseInt(currentEx.reps) || 10

            return (
              <SetRow
                key={`prescribed-${setNum}`}
                setNumber={setNum}
                prescribedReps={suggestedReps}
                suggestedLoad={suggestedLoad}
                completed={completed}
                exerciseTechnique={currentEx.technique}
                lastSetTechnique={lastSet?.technique as Technique | undefined}
                onComplete={(reps, loadKg, technique) =>
                  handleCompleteSet(currentEx.id, setNum, reps, loadKg, technique, false)
                }
                onEdit={(reps, loadKg, technique) =>
                  completed?.id
                    ? handleEditSet(completed.id, reps, loadKg, technique, currentEx.id, setNum)
                    : undefined
                }
              />
            )
          })}

          {/* Extra sets */}
          {exCompletedSets
            .filter((s) => s.isExtra)
            .map((extra, i) => (
              <SetRow
                key={`extra-${extra.id || i}`}
                setNumber={prescribedSetCount + i + 1}
                prescribedReps={parseInt(currentEx.reps) || 10}
                suggestedLoad={extra.loadKg}
                completed={extra}
                exerciseTechnique={currentEx.technique}
                isExtra
                onComplete={() => {}}
                onEdit={(reps, loadKg, technique) =>
                  extra.id
                    ? handleEditSet(extra.id, reps, loadKg, technique, currentEx.id, extra.setNumber)
                    : undefined
                }
                onDelete={() => extra.id ? handleDeleteSet(extra.id, currentEx.id) : undefined}
              />
            ))}

          {/* Add extra set button */}
          <AddExtraSetButton
            exerciseId={currentEx.id}
            nextSetNumber={prescribedSetCount + exCompletedSets.filter(s => s.isExtra).length + 1}
            suggestedReps={parseInt(currentEx.reps) || 10}
            suggestedLoad={
              exCompletedSets.length > 0
                ? (exCompletedSets[exCompletedSets.length - 1]?.loadKg ?? currentEx.loadKg ?? 0)
                : (currentEx.loadKg ?? 0)
            }
            exerciseTechnique={currentEx.technique}
            onAdd={(reps, loadKg, technique) =>
              handleCompleteSet(
                currentEx.id,
                prescribedSetCount + exCompletedSets.filter(s => s.isExtra).length + 1,
                reps,
                loadKg,
                technique,
                true,
              )
            }
          />
        </div>

        {/* Notes */}
        {currentEx.notes && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80">{currentEx.notes}</p>
          </div>
        )}
        </div>{/* close p-5 */}
      </div>

      {/* All done button — check ALL exercises individually, not just total count */}
      {(() => {
        const allExercisesDone = exercises.every(ex => {
          const exSets = completedSets.get(ex.id) || []
          return exSets.filter(s => !s.isExtra).length >= ex.sets
        })
        const skippedExercises = exercises.filter(ex => {
          const exSets = completedSets.get(ex.id) || []
          return exSets.filter(s => !s.isExtra).length < ex.sets
        })

        if (allExercisesDone) {
          return (
            <button
              onClick={() => setPhase("summary")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all animate-slide-up"
            >
              <Trophy className="w-5 h-5" />
              Finalizar Treino
            </button>
          )
        }

        // Show finish anyway option after some exercises are done (at least 50% of sets)
        if (totalCompleted >= Math.ceil(totalSets * 0.5)) {
          return (
            <button
              onClick={() => {
                const names = skippedExercises.map(e => e.name).join(", ")
                if (confirm(`Exercícios incompletos:\n\n${names}\n\nFinalizar mesmo assim? O personal será notificado.`)) {
                  // Notify trainer about incomplete exercises
                  fetch("/api/student/sessions/incomplete-alert", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sessionId,
                      skippedExercises: skippedExercises.map(e => ({ id: e.id, name: e.name, setsCompleted: (completedSets.get(e.id) || []).filter(s => !s.isExtra).length, setsPrescribed: e.sets })),
                    }),
                  }).catch(() => {})
                  setPhase("summary")
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-600/15 border border-amber-500/20 text-amber-400 text-sm font-medium active:scale-[0.98] transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              Finalizar com {skippedExercises.length} exercício{skippedExercises.length > 1 ? "s" : ""} incompleto{skippedExercises.length > 1 ? "s" : ""}
            </button>
          )
        }

        return null
      })()}
    </div>
  )
}

// ═══ SET ROW — Editável, com technique picker ═══

function SetRow({
  setNumber,
  prescribedReps,
  suggestedLoad,
  completed,
  exerciseTechnique,
  lastSetTechnique,
  isExtra = false,
  onComplete,
  onEdit,
  onDelete,
}: {
  setNumber: number
  prescribedReps: number
  suggestedLoad: number
  completed: CompletedSet | undefined
  exerciseTechnique: Technique
  lastSetTechnique?: Technique
  isExtra?: boolean
  onComplete: (reps: number, loadKg: number, technique: Technique) => void
  onEdit?: (reps: number, loadKg: number, technique: Technique) => void
  onDelete?: () => void
}) {
  const defaultTechnique = exerciseTechnique !== "NORMAL" ? exerciseTechnique : (lastSetTechnique || "NORMAL")

  const [reps, setReps] = useState(completed?.reps ?? prescribedReps)
  const [loadStr, setLoadStr] = useState(completed?.loadKg ? String(completed.loadKg) : suggestedLoad ? String(suggestedLoad) : "")
  const [loadError, setLoadError] = useState(false)
  const [technique, setTechnique] = useState<Technique>(completed?.technique ?? defaultTechnique)
  const [editing, setEditing] = useState(false)
  const [showTechPicker, setShowTechPicker] = useState(false)

  const techInfo = TECHNIQUE_INFO[technique]

  // Completed + not editing
  if (completed && !editing) {
    return (
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-2 items-center py-2.5 px-2 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 group animate-set-complete-row relative overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-emerald-500/60" />
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          {isExtra && <span className="text-[7px] text-emerald-600 mt-0.5">extra</span>}
        </div>
        <span className="text-center text-[15px] font-bold text-white tabular-nums">{completed.reps}</span>
        <span className="text-center text-[15px] font-bold text-white tabular-nums">{fmtKg(completed.loadKg)}</span>
        <div className="flex justify-center">
          {completed.technique !== "NORMAL" ? (
            <TechniqueBadge technique={completed.technique} />
          ) : (
            <span className="text-[9px] text-neutral-700">—</span>
          )}
        </div>
        <div className="flex justify-center gap-1">
          <button
            onClick={() => {
              setReps(completed.reps)
              setLoadStr(String(completed.loadKg))
              setTechnique(completed.technique)
              setEditing(true)
            }}
            className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
            title="Editar série"
          >
            <Pencil className="w-3 h-3 text-neutral-400" />
          </button>
          {isExtra && onDelete && (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
              title="Remover série extra"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Editing or new set input
  const isActive = !completed || editing

  return (
    <div className="space-y-0">
      <div className={`grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-2 items-center py-2.5 px-2 rounded-xl transition-all duration-300 relative overflow-hidden ${
        isActive && !editing
          ? "bg-red-500/[0.06] border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.06)]"
          : editing
          ? "bg-amber-500/[0.06] border border-amber-500/20"
          : "bg-white/[0.02] border border-white/[0.04]"
      }`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${
          isActive && !editing ? "bg-red-500/60" : editing ? "bg-amber-500/60" : "bg-white/10"
        }`} />
        <div className="flex flex-col items-center">
          <span className={`text-[15px] font-bold tabular-nums ${
            isActive && !editing ? "text-red-400" : editing ? "text-amber-400" : "text-neutral-500"
          }`}>
            {setNumber}
          </span>
          {isExtra && <span className="text-[7px] text-neutral-600">extra</span>}
        </div>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          className="w-full text-center text-[15px] font-bold text-white bg-white/[0.04] rounded-lg border border-white/[0.08] focus:border-red-500/40 focus:bg-red-500/[0.06] outline-none py-1.5 transition-all tabular-nums"
        />
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          value={loadStr}
          onChange={(e) => {
            const v = e.target.value.replace(",", ".")
            if (v === "" || /^\d{0,3}\.?\d{0,1}$/.test(v)) { setLoadStr(v); setLoadError(false) }
          }}
          placeholder="kg"
          className={`w-full text-center text-[15px] font-bold text-white bg-white/[0.04] rounded-lg border outline-none py-1.5 transition-all tabular-nums ${
            loadError ? "border-red-500 bg-red-500/10 placeholder:text-red-400/60" : "border-white/[0.08] focus:border-red-500/40 focus:bg-red-500/[0.06]"
          }`}
        />
        <button
          onClick={() => setShowTechPicker(!showTechPicker)}
          className={`flex items-center justify-center gap-0.5 text-[9px] font-semibold rounded-lg py-1.5 px-1 transition-all ${techInfo.color} bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]`}
        >
          {technique === "NORMAL" ? "Normal" : TECHNIQUE_INFO[technique].shortLabel}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        <div className="flex justify-center">
          {editing ? (
            <button
              onClick={() => {
                if (!loadStr.trim()) { setLoadError(true); try { navigator.vibrate?.(30) } catch {} return }
                setLoadError(false)
                if (onEdit) onEdit(reps, parseFloat(loadStr) || 0, technique)
                setEditing(false)
              }}
              className="w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-amber-600/10"
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (!loadStr.trim()) { setLoadError(true); try { navigator.vibrate?.(30) } catch {} return }
                setLoadError(false)
                onComplete(reps, parseFloat(loadStr) || 0, technique)
              }}
              className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center transition-all duration-200 active:scale-90 hover:bg-red-600/30 shadow-lg shadow-red-600/10"
            >
              <Check className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Technique Picker Dropdown */}
      {showTechPicker && (
        <div className="mx-2 mt-1 rounded-xl border border-white/[0.08] bg-[#111] backdrop-blur-xl p-2 space-y-1 animate-slide-up">
          {(Object.keys(TECHNIQUE_INFO) as Technique[]).map((tech) => {
            const info = TECHNIQUE_INFO[tech]
            return (
              <button
                key={tech}
                onClick={() => { setTechnique(tech); setShowTechPicker(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                  technique === tech
                    ? "bg-white/[0.08] border border-white/[0.12]"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <Zap className={`w-3 h-3 ${info.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${info.color}`}>{info.label}</p>
                  <p className="text-[10px] text-neutral-600 truncate">{info.description}</p>
                </div>
                {technique === tech && <Check className="w-3 h-3 text-white shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ ADD EXTRA SET BUTTON ═══

function AddExtraSetButton({
  exerciseId,
  nextSetNumber,
  suggestedReps,
  suggestedLoad,
  exerciseTechnique,
  onAdd,
}: {
  exerciseId: string
  nextSetNumber: number
  suggestedReps: number
  suggestedLoad: number
  exerciseTechnique: Technique
  onAdd: (reps: number, loadKg: number, technique: Technique) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reps, setReps] = useState(suggestedReps)
  const [loadStr, setLoadStr] = useState(suggestedLoad ? String(suggestedLoad) : "")
  const [technique, setTechnique] = useState<Technique>(exerciseTechnique)
  const [loadError, setLoadError] = useState(false)

  if (!expanded) {
    return (
      <button
        onClick={() => {
          setReps(suggestedReps)
          setLoadStr(suggestedLoad ? String(suggestedLoad) : "")
          setExpanded(true)
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.08] text-neutral-500 text-xs font-medium hover:border-white/[0.15] hover:text-neutral-300 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar série extra
      </button>
    )
  }

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-2 items-center py-2 px-2 rounded-xl bg-blue-500/5 border border-blue-500/15 border-dashed">
      <span className="text-center text-sm font-bold text-blue-400">
        {nextSetNumber}
        <span className="text-[8px] text-blue-600 block">extra</span>
      </span>
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(parseInt(e.target.value) || 0)}
        className="w-full text-center text-sm font-medium text-white bg-transparent border-b border-white/10 focus:border-blue-500/50 outline-none py-1"
        autoFocus
      />
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        value={loadStr}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".")
          if (v === "" || /^\d{0,3}\.?\d{0,1}$/.test(v)) { setLoadStr(v); setLoadError(false) }
        }}
        placeholder="kg"
        className={`w-full text-center text-sm font-medium text-white bg-transparent border-b outline-none py-1 ${
          loadError ? "border-red-500 placeholder:text-red-400/60" : "border-white/10 focus:border-blue-500/50"
        }`}
      />
      <select
        value={technique}
        onChange={(e) => setTechnique(e.target.value as Technique)}
        className="text-[9px] text-white bg-transparent border border-white/10 rounded-lg py-1.5 px-1 outline-none"
      >
        {(Object.keys(TECHNIQUE_INFO) as Technique[]).map((tech) => (
          <option key={tech} value={tech} className="bg-[#111]">
            {TECHNIQUE_INFO[tech].shortLabel}
          </option>
        ))}
      </select>
      <div className="flex justify-center gap-1">
        <button
          onClick={() => {
            if (!loadStr.trim()) { setLoadError(true); try { navigator.vibrate?.(30) } catch {} return }
            setLoadError(false)
            onAdd(reps, parseFloat(loadStr) || 0, technique)
            setExpanded(false)
          }}
          className="w-11 h-11 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center transition-all active:scale-90"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
