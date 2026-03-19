import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { WorkoutPlayer } from "./workout-player"

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
    return <EmptyDay dayOfWeek={dayOfWeek} />
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

  const lastSetsMap: Record<string, { setNumber: number; reps: number; loadKg: number }[]> = {}
  if (lastSession) {
    for (const set of lastSession.sets) {
      if (!lastSetsMap[set.exerciseId]) lastSetsMap[set.exerciseId] = []
      lastSetsMap[set.exerciseId].push({ setNumber: set.setNumber, reps: set.reps, loadKg: set.loadKg })
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
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          loadKg: s.loadKg,
        })),
      } : null}
      completedToday={completedToday ? {
        durationMin: completedToday.durationMin,
        rpe: completedToday.rpe,
      } : null}
    />
  )
}

/* ═══ EMPTY DAY ═══ */
function EmptyDay({ dayOfWeek }: { dayOfWeek: number }) {
  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
        <span className="text-3xl">🏖️</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Dia de Descanso</h2>
      <p className="text-neutral-500 text-sm max-w-xs">
        Nenhum treino prescrito para {dayNames[dayOfWeek].toLowerCase()}.
        Aproveite para recuperar e voltar mais forte!
      </p>
    </div>
  )
}
