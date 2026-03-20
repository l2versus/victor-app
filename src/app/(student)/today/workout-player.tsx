"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Play, ChevronLeft, ChevronRight, Check, Dumbbell, Clock,
  Flame, Trophy, X, Zap,
} from "lucide-react"
import { useRestTimer } from "@/hooks/use-rest-timer"
import { useSwipe } from "@/hooks/use-swipe"
import { BodyFocusBadges } from "@/components/student/muscle-info-card"

interface ExerciseData {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string | null
  sets: number
  reps: string
  restSeconds: number
  loadKg: number | null
  notes: string | null
  supersetGroup: string | null
  lastSets: { setNumber: number; reps: number; loadKg: number }[]
}

interface CompletedSet {
  exerciseId: string
  setNumber: number
  reps: number
  loadKg: number
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
}

type Phase = "preview" | "active" | "rest" | "summary" | "done"

export function WorkoutPlayer({
  templateId,
  templateName,
  templateType,
  exercises,
  totalSets,
  activeSession,
  completedToday,
}: WorkoutPlayerProps) {
  const [phase, setPhase] = useState<Phase>(
    completedToday ? "done" : activeSession ? "active" : "preview"
  )
  const [sessionId, setSessionId] = useState<string | null>(activeSession?.id || null)
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
  const [elapsed, setElapsed] = useState(0)
  const [nextExName, setNextExName] = useState("")
  const startTimeRef = useRef<Date | null>(
    activeSession ? new Date(activeSession.startedAt) : null
  )
  const timerRef = useRef<NodeJS.Timeout>(null)

  const totalCompleted = Array.from(completedSets.values()).reduce((sum, arr) => sum + arr.length, 0)
  const progress = totalSets > 0 ? totalCompleted / totalSets : 0
  const currentEx = exercises[currentExIdx]

  // Elapsed timer
  useEffect(() => {
    if (phase === "active" || phase === "rest") {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000))
        }
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [phase])

  // Rest timer
  const restTimer = useRestTimer(() => {
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

  // Start workout
  async function handleStart() {
    try {
      const res = await fetch("/api/student/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })
      const data = await res.json()
      if (data.session) {
        setSessionId(data.session.id)
        startTimeRef.current = new Date()
        setPhase("active")
      }
    } catch {
      setError("Não foi possível iniciar o treino. Tente novamente.")
    }
  }

  // Complete a set
  const handleCompleteSet = useCallback(async (exerciseId: string, setNumber: number, reps: number, loadKg: number) => {
    if (!sessionId) return

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50)
    }

    try {
      await fetch(`/api/student/sessions/${sessionId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, setNumber, reps, loadKg }),
      })

      let newExSetsCount = 0
      let newTotalCount = 0

      setCompletedSets((prev) => {
        const next = new Map(prev)
        const existing = next.get(exerciseId) || []
        next.set(exerciseId, [...existing, { exerciseId, setNumber, reps, loadKg }])
        newExSetsCount = existing.length + 1
        newTotalCount = Array.from(next.values()).reduce((sum, arr) => sum + arr.length, 0)
        return next
      })

      // Check if all sets for this exercise are done (counts from updater)
      const prescribedSets = exercises.find((e) => e.id === exerciseId)?.sets || 0

      if (newExSetsCount >= prescribedSets) {
        // Move to next exercise or summary
        if (currentExIdx < exercises.length - 1) {
          setNextExName(exercises[currentExIdx + 1].name)
          setPhase("rest")
          restTimer.start(currentEx.restSeconds)
        } else {
          // Check if ALL sets done
          if (newTotalCount >= totalSets) {
            setPhase("summary")
          }
        }
      } else {
        // Rest between sets
        setPhase("rest")
        restTimer.start(currentEx.restSeconds)
      }
    } catch {
      setError("Erro ao salvar série. Tente novamente.")
    }
  }, [sessionId, completedSets, exercises, currentExIdx, currentEx, totalCompleted, totalSets, restTimer])

  // Finish workout
  async function handleFinish() {
    if (!sessionId) return
    try {
      await fetch(`/api/student/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString(), rpe }),
      })
      setPhase("done")
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
        {/* Hero */}
        <div className="flex flex-col items-center text-center pb-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/15 flex items-center justify-center mb-5 animate-pulse-glow" style={{ "--tw-shadow-color": "rgba(16,185,129,0.3)" } as React.CSSProperties}>
            <Check className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Treino Concluído</h2>
          <p className="text-neutral-500 text-sm">{templateName}</p>
        </div>

        {/* Stats row */}
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

        {/* Exercises completed list */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
          <h3 className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3">Exercícios realizados</h3>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-3 py-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-neutral-300 truncate flex-1">{ex.name}</span>
                <span className="text-[10px] text-neutral-600">{ex.sets}x{ex.reps}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer message */}
        <p className="text-center text-xs text-neutral-600 pb-2">
          Descanse bem e volte amanha para o proximo treino
        </p>
      </div>
    )
  }

  // ═══ PREVIEW STATE ═══
  if (phase === "preview") {
    return (
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
            <span>{error}</span>
          </div>
        )}
        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
            <Dumbbell className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">{templateType}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{templateName}</h1>
          <p className="text-neutral-500 text-sm">
            {exercises.length} exercício{exercises.length !== 1 ? "s" : ""} · {totalSets} séries · ~{Math.round(totalSets * 1.5)}min
          </p>
        </div>

        {/* Body Focus Area — interactive muscle badges with educational info */}
        {(() => {
          const muscles = [...new Set(exercises.map(e => e.muscle))]
          return <BodyFocusBadges muscles={muscles} />
        })()}

        {/* Exercise List Preview */}
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/15 to-red-900/5 flex items-center justify-center text-red-400 text-xs font-bold border border-red-500/10 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                <p className="text-[11px] text-neutral-500">{ex.muscle} · {ex.sets}×{ex.reps}</p>
              </div>
              {ex.loadKg && (
                <span className="text-[10px] text-neutral-600 px-2 py-0.5 rounded-full bg-white/[0.04]">
                  {ex.loadKg}kg
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-base shadow-xl shadow-red-600/25 hover:from-red-500 hover:to-red-600 active:scale-[0.98] transition-all duration-300"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          Iniciar Treino
        </button>
      </div>
    )
  }

  // ═══ REST TIMER OVERLAY ═══
  if (phase === "rest") {
    const circumference = 2 * Math.PI * 54
    const offset = circumference * (1 - restTimer.progress)

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl animate-slide-up">
        {/* Timer Circle */}
        <div className="relative w-48 h-48 mb-8 animate-timer-pulse">
          <svg className="w-full h-full timer-circle" viewBox="0 0 120 120">
            {/* Track */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
            {/* Progress */}
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="url(#timerGradient)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-white tabular-nums">{restTimer.remaining}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Descanso</p>
          </div>
        </div>

        {/* Next exercise info */}
        {nextExName && (
          <div className="text-center mb-8">
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Próximo</p>
            <p className="text-sm text-neutral-300 font-medium">{nextExName}</p>
          </div>
        )}

        {/* Skip Button */}
        <button
          onClick={() => { restTimer.skip(); setPhase("active") }}
          className="px-6 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-neutral-400 text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all active:scale-95"
        >
          Pular
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

        {/* RPE Selector */}
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

        {/* Finish Button */}
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
  const currentSetNumber = exCompletedSets.length + 1
  const isExerciseDone = exCompletedSets.length >= currentEx.sets

  return (
    <div className="space-y-4" {...swipe}>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm animate-slide-up">
          <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
          <span>{error}</span>
        </div>
      )}
      {/* ═══ FLOATING PROGRESS PILL ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-xs text-neutral-500 tabular-nums">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{totalCompleted}/{totalSets}</span>
          <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ═══ EXERCISE NAVIGATION ═══ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentExIdx((i) => Math.max(0, i - 1))}
          disabled={currentExIdx === 0}
          className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
          {currentExIdx + 1} / {exercises.length}
        </span>
        <button
          onClick={() => setCurrentExIdx((i) => Math.min(exercises.length - 1, i + 1))}
          disabled={currentExIdx === exercises.length - 1}
          className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ═══ EXERCISE CARD ═══ */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 swipe-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600/20 to-red-800/10 flex items-center justify-center text-red-400 border border-red-500/15">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{currentEx.name}</h2>
            <p className="text-xs text-neutral-500">{currentEx.muscle} · {currentEx.equipment}</p>
          </div>
          {isExerciseDone && (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center animate-set-complete">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
          )}
        </div>

        {/* Instructions */}
        {currentEx.instructions && (
          <p className="text-xs text-neutral-500 mb-4 leading-relaxed border-l-2 border-red-500/20 pl-3">
            {currentEx.instructions}
          </p>
        )}

        {/* Sets Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 mb-1">
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider text-center">Série</span>
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider text-center">Reps</span>
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider text-center">Kg</span>
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider text-center"></span>
          </div>

          {Array.from({ length: currentEx.sets }, (_, i) => {
            const setNum = i + 1
            const completed = exCompletedSets.find((s) => s.setNumber === setNum)
            const lastSet = currentEx.lastSets.find((s) => s.setNumber === setNum)
            const suggestedLoad = lastSet?.loadKg || currentEx.loadKg || 0
            const suggestedReps = parseInt(currentEx.reps) || 10

            return (
              <SetRow
                key={setNum}
                setNumber={setNum}
                prescribedReps={suggestedReps}
                suggestedLoad={suggestedLoad}
                completed={completed}
                isCurrent={setNum === currentSetNumber && !isExerciseDone}
                onComplete={(reps, loadKg) => handleCompleteSet(currentEx.id, setNum, reps, loadKg)}
              />
            )
          })}
        </div>

        {/* Notes */}
        {currentEx.notes && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80">{currentEx.notes}</p>
          </div>
        )}
      </div>

      {/* All done button */}
      {totalCompleted >= totalSets && (
        <button
          onClick={() => setPhase("summary")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all animate-slide-up"
        >
          <Trophy className="w-5 h-5" />
          Finalizar Treino
        </button>
      )}
    </div>
  )
}

/* ═══ SET ROW ═══ */
function SetRow({
  setNumber,
  prescribedReps,
  suggestedLoad,
  completed,
  isCurrent,
  onComplete,
}: {
  setNumber: number
  prescribedReps: number
  suggestedLoad: number
  completed: CompletedSet | undefined
  isCurrent: boolean
  onComplete: (reps: number, loadKg: number) => void
}) {
  const [reps, setReps] = useState(prescribedReps)
  const [loadKg, setLoadKg] = useState(suggestedLoad)

  if (completed) {
    return (
      <div className="grid grid-cols-4 gap-2 items-center py-2 px-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <span className="text-center text-sm font-bold text-emerald-400">{setNumber}</span>
        <span className="text-center text-sm text-emerald-300">{completed.reps}</span>
        <span className="text-center text-sm text-emerald-300">{completed.loadKg}</span>
        <div className="flex justify-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center animate-set-complete">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-4 gap-2 items-center py-2 px-2 rounded-xl transition-all duration-300 ${
      isCurrent ? "bg-red-500/5 border border-red-500/15 animate-pulse-glow" : "bg-white/[0.02] border border-white/[0.04]"
    }`}>
      <span className={`text-center text-sm font-bold ${isCurrent ? "text-red-400" : "text-neutral-500"}`}>
        {setNumber}
      </span>
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(parseInt(e.target.value) || 0)}
        className="w-full text-center text-sm font-medium text-white bg-transparent border-b border-white/10 focus:border-red-500/50 outline-none py-1 transition-colors"
      />
      <input
        type="number"
        step="0.5"
        value={loadKg}
        onChange={(e) => setLoadKg(parseFloat(e.target.value) || 0)}
        className="w-full text-center text-sm font-medium text-white bg-transparent border-b border-white/10 focus:border-red-500/50 outline-none py-1 transition-colors"
      />
      <div className="flex justify-center">
        <button
          onClick={() => onComplete(reps, loadKg)}
          disabled={!isCurrent}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isCurrent
              ? "bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"
              : "bg-white/[0.03] border border-white/[0.06] text-neutral-700"
          }`}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
