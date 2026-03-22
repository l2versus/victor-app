import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { WorkoutPlayer } from "./workout-player"
import { SpotifyMiniPlayer } from "@/components/student/spotify-player"
import { Moon, Dumbbell, Droplets, Heart, BedDouble, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Treino de Hoje",
  robots: { index: false, follow: false },
}

export default async function TodayPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })

  if (!student) redirect("/login")

  const dayOfWeek = new Date().getDay()

  // Find today's plan
  const plan = await prisma.studentWorkoutPlan.findUnique({
    where: { studentId_dayOfWeek: { studentId: student.id, dayOfWeek } },
    include: {
      template: {
        include: {
          exercises: {
            include: {
              exercise: {
                select: { id: true, name: true, muscle: true, equipment: true, instructions: true },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!plan || !plan.active) {
    // Query extra data for a richer rest day screen
    const [weekPlans, totalSessions] = await Promise.all([
      prisma.studentWorkoutPlan.findMany({
        where: { studentId: student.id, active: true },
        include: { template: { select: { name: true } } },
        orderBy: { dayOfWeek: "asc" },
      }),
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null } },
      }),
    ])

    // Build week schedule
    const weekSchedule = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      hasWorkout: weekPlans.some((p) => p.dayOfWeek === i),
    }))

    // Find the next workout day
    let nextWorkout: { day: string; name: string } | null = null
    const dayNamesFull = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
    for (let offset = 1; offset <= 7; offset++) {
      const checkDay = (dayOfWeek + offset) % 7
      const found = weekPlans.find((p) => p.dayOfWeek === checkDay)
      if (found) {
        nextWorkout = { day: dayNamesFull[checkDay], name: found.template.name }
        break
      }
    }

    return (
      <EmptyDay
        dayOfWeek={dayOfWeek}
        weekSchedule={weekSchedule}
        nextWorkout={nextWorkout}
        totalSessions={totalSessions}
      />
    )
  }

  // Check for active session today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const activeSession = await prisma.workoutSession.findFirst({
    where: {
      studentId: student.id,
      templateId: plan.templateId,
      startedAt: { gte: today, lt: tomorrow },
      completedAt: null,
    },
    include: { sets: true },
  })

  // Completed session today?
  const completedToday = await prisma.workoutSession.findFirst({
    where: {
      studentId: student.id,
      templateId: plan.templateId,
      startedAt: { gte: today, lt: tomorrow },
      completedAt: { not: null },
    },
    select: { id: true, durationMin: true, rpe: true },
  })

  // Last session load suggestions
  const lastSession = await prisma.workoutSession.findFirst({
    where: {
      studentId: student.id,
      templateId: plan.templateId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    include: { sets: true },
  })

  const lastSetsMap: Record<string, { setNumber: number; reps: number; loadKg: number; technique: string }[]> = {}
  if (lastSession) {
    for (const set of lastSession.sets) {
      if (!lastSetsMap[set.exerciseId]) lastSetsMap[set.exerciseId] = []
      lastSetsMap[set.exerciseId].push({ setNumber: set.setNumber, reps: set.reps, loadKg: set.loadKg, technique: set.technique })
    }
  }

  const exercises = plan.template.exercises.map((we) => ({
    id: we.exercise.id,
    name: we.exercise.name,
    muscle: we.exercise.muscle,
    equipment: we.exercise.equipment,
    instructions: we.exercise.instructions,
    sets: we.sets,
    reps: we.reps,
    restSeconds: we.restSeconds,
    loadKg: we.loadKg,
    notes: we.notes,
    supersetGroup: we.supersetGroup,
    suggestedMachine: we.suggestedMachine,
    technique: we.technique,
    lastSets: lastSetsMap[we.exercise.id] || [],
  }))

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)

  return (
    <WorkoutPlayer
      studentId={student.id}
      templateId={plan.templateId}
      templateName={plan.template.name}
      templateType={plan.template.type}
      exercises={exercises}
      totalSets={totalSets}
      activeSession={activeSession ? {
        id: activeSession.id,
        startedAt: activeSession.startedAt.toISOString(),
        completedSets: activeSession.sets.map((s) => ({
          id: s.id,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          loadKg: s.loadKg,
          technique: s.technique,
          isExtra: s.isExtra,
        })),
      } : null}
      completedToday={completedToday ? {
        durationMin: completedToday.durationMin,
        rpe: completedToday.rpe,
      } : null}
    />
  )
}

/* ═══ EMPTY DAY — Professional Rest Day Screen ═══ */
function EmptyDay({
  dayOfWeek,
  weekSchedule,
  nextWorkout,
  totalSessions,
}: {
  dayOfWeek: number
  weekSchedule: { day: number; hasWorkout: boolean }[]
  nextWorkout: { day: string; name: string } | null
  totalSessions: number
}) {
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const dayNamesFull = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

  const tips = [
    { icon: Droplets, text: "Hidrate-se — ao menos 2L de água ao longo do dia" },
    { icon: BedDouble, text: "Priorize 7-9h de sono para recuperação muscular" },
    { icon: Heart, text: "Alongamentos leves melhoram mobilidade e circulação" },
  ]

  return (
    <div className="space-y-5">
      {/* ═══ Hero ═══ */}
      <div className="flex flex-col items-center pt-6 pb-1 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/15 to-indigo-800/10 border border-blue-500/15 flex items-center justify-center mb-5">
          <Moon className="w-9 h-9 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Dia de Recuperação</h2>
        <p className="text-neutral-500 text-sm">
          {dayNamesFull[dayOfWeek]} — sem treino prescrito
        </p>
      </div>

      {/* ═══ Week overview ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
        <h3 className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3">Sua semana</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekSchedule.map((ws) => (
            <div key={ws.day} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] ${ws.day === dayOfWeek ? "text-white font-bold" : "text-neutral-600"}`}>
                {dayNames[ws.day]}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                ws.day === dayOfWeek
                  ? "bg-blue-500/15 border border-blue-500/25"
                  : ws.hasWorkout
                  ? "bg-red-600/10 border border-red-500/15"
                  : "bg-white/[0.03] border border-white/[0.04]"
              }`}>
                {ws.day === dayOfWeek ? (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                ) : ws.hasWorkout ? (
                  <Dumbbell className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <span className="text-neutral-700 text-[10px]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Next workout card ═══ */}
      {nextWorkout && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600/15 to-red-900/5 border border-red-500/15 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Próximo treino</p>
              <p className="text-sm font-medium text-white truncate">{nextWorkout.name}</p>
              <p className="text-xs text-neutral-500">{nextWorkout.day}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0" />
          </div>
        </div>
      )}

      {/* ═══ Recovery tips ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
        <h3 className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-4">Dicas de recuperação</h3>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                <tip.icon className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed pt-1">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Spotify — Até no descanso tem música ═══ */}
      <SpotifyMiniPlayer />

      {/* ═══ Session count ═══ */}
      {totalSessions > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-neutral-600">
            Você já completou <span className="text-neutral-400 font-medium">{totalSessions}</span> {totalSessions === 1 ? "sessão" : "sessões"} de treino
          </p>
        </div>
      )}
    </div>
  )
}
