import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { WorkoutPlayer } from "./workout-player"
// Spotify removed
import { Moon, Dumbbell, Droplets, Heart, BedDouble, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBrazilDayOfWeek, getBrazilTodayRange } from "@/lib/timezone"
import { LiveTrainingBanner } from "@/components/community/live-training"

export const metadata: Metadata = {
  title: "Treino de Hoje",
  robots: { index: false, follow: false },
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const DAY_NAMES_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })
  if (!student) redirect("/login")

  const today = getBrazilDayOfWeek()
  const params = await searchParams
  const rawDay = params.day !== undefined ? parseInt(params.day) : today
  const dayOfWeek = isNaN(rawDay) || rawDay < 0 || rawDay > 6 ? today : rawDay
  const isScheduledToday = dayOfWeek === today

  // Fetch all week plans (for day selector) + selected day's full plan in parallel
  const [weekPlans, plan] = await Promise.all([
    prisma.studentWorkoutPlan.findMany({
      where: { studentId: student.id, active: true },
      include: { template: { select: { name: true } } },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.studentWorkoutPlan.findUnique({
      where: { studentId_dayOfWeek: { studentId: student.id, dayOfWeek } },
      include: {
        template: {
          include: {
            exercises: {
              include: {
                exercise: {
                  select: { id: true, name: true, muscle: true, equipment: true, instructions: true, imageUrl: true, gifUrl: true, videoUrl: true, machineBrand: true, machine3dModel: true },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    }),
  ])

  const weekSchedule = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    hasWorkout: weekPlans.some((p) => p.dayOfWeek === i),
    templateName: weekPlans.find((p) => p.dayOfWeek === i)?.template.name || null,
  }))

  if (!plan || !plan.active) {
    const totalSessions = await prisma.workoutSession.count({
      where: { studentId: student.id, completedAt: { not: null } },
    })

    let nextWorkout: { day: string; name: string } | null = null
    for (let offset = 1; offset <= 7; offset++) {
      const checkDay = (dayOfWeek + offset) % 7
      const found = weekPlans.find((p) => p.dayOfWeek === checkDay)
      if (found) {
        nextWorkout = { day: DAY_NAMES_FULL[checkDay], name: found.template.name }
        break
      }
    }

    return (
      <div className="space-y-4">
        <WeekDaySelector weekSchedule={weekSchedule} selectedDay={dayOfWeek} today={today} />
        <LiveTrainingBanner />
        <EmptyDay
          dayOfWeek={dayOfWeek}
          isToday={isScheduledToday}
          nextWorkout={nextWorkout}
          totalSessions={totalSessions}
        />
      </div>
    )
  }

  // Check for active/completed sessions today (Brazil timezone)
  const { start: todayDate, end: tomorrow } = getBrazilTodayRange()

  const [activeSession, completedToday, lastSession] = await Promise.all([
    // Find ANY active session (not just today) — prevents orphaned sessions
    prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId: plan.templateId,
        completedAt: null,
      },
      include: { sets: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId: plan.templateId,
        startedAt: { gte: todayDate, lt: tomorrow },
        completedAt: { not: null },
      },
      select: { id: true, durationMin: true, rpe: true },
    }),
    prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId: plan.templateId,
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      include: { sets: true },
    }),
  ])

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
    imageUrl: we.exercise.imageUrl,
    gifUrl: we.exercise.gifUrl,
    videoUrl: we.exercise.videoUrl,
    machineBrand: we.exercise.machineBrand,
    machine3dModel: we.exercise.machine3dModel,
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
    <div className="space-y-4">
      <WeekDaySelector weekSchedule={weekSchedule} selectedDay={dayOfWeek} today={today} />
      <LiveTrainingBanner />
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
        isScheduledToday={isScheduledToday}
        viewingDayName={DAY_NAMES_FULL[dayOfWeek]}
      />
    </div>
  )
}

/* ═══ WEEK DAY SELECTOR — Navigate between workout days ═══ */
function WeekDaySelector({
  weekSchedule,
  selectedDay,
  today,
}: {
  weekSchedule: { day: number; hasWorkout: boolean; templateName: string | null }[]
  selectedDay: number
  today: number
}) {
  return (
    <div className="flex gap-1.5 justify-center pt-3 pb-1 px-1">
      {weekSchedule.map((ws) => {
        const isSelected = ws.day === selectedDay
        const isToday = ws.day === today
        const href = ws.day === today ? "/today" : `/today?day=${ws.day}`

        return (
          <Link
            key={ws.day}
            href={href}
            scroll={false}
            prefetch={true}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 max-w-[50px] py-2.5 rounded-xl transition-all duration-200 relative",
              isSelected
                ? ws.hasWorkout
                  ? "bg-red-600/15 border border-red-500/30 shadow-lg shadow-red-600/10"
                  : "bg-blue-600/10 border border-blue-500/25 shadow-lg shadow-blue-600/10"
                : ws.hasWorkout
                ? "bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
                : "border border-transparent hover:bg-white/[0.03]",
              "active:scale-95"
            )}
          >
            <span className={cn(
              "text-[9px] font-semibold uppercase tracking-[0.12em]",
              isSelected ? "text-white" : isToday ? "text-neutral-300" : "text-neutral-600"
            )}>
              {DAY_NAMES[ws.day]}
            </span>
            {ws.hasWorkout ? (
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center",
                isSelected ? "bg-red-500/20" : "bg-transparent"
              )}>
                <Dumbbell className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  isSelected ? "text-red-400 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]" : "text-neutral-500"
                )} />
              </div>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSelected ? "bg-blue-400" : "bg-neutral-800"
                )} />
              </div>
            )}
            {isToday && (
              <div className={cn(
                "absolute -bottom-1 w-1 h-1 rounded-full",
                isSelected ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" : "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.6)]"
              )} />
            )}
          </Link>
        )
      })}
    </div>
  )
}

/* ═══ EMPTY DAY — Rest day / no workout assigned ═══ */
function EmptyDay({
  dayOfWeek,
  isToday,
  nextWorkout,
  totalSessions,
}: {
  dayOfWeek: number
  isToday: boolean
  nextWorkout: { day: string; name: string } | null
  totalSessions: number
}) {
  const tips = [
    { icon: Droplets, text: "Hidrate-se — ao menos 2L de água ao longo do dia" },
    { icon: BedDouble, text: "Priorize 7-9h de sono para recuperação muscular" },
    { icon: Heart, text: "Alongamentos leves melhoram mobilidade e circulação" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center pt-4 pb-1 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/15 to-indigo-800/10 border border-blue-500/15 flex items-center justify-center mb-5">
          <Moon className="w-9 h-9 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          {isToday ? "Dia de Recuperação" : "Sem Treino"}
        </h2>
        <p className="text-neutral-500 text-sm">
          {DAY_NAMES_FULL[dayOfWeek]} — sem treino prescrito
        </p>
      </div>

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

      {isToday && (
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
      )}

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
