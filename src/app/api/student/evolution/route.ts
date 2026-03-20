import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 6)

    // All completed sessions in last 6 months
    const sessions = await prisma.workoutSession.findMany({
      where: {
        studentId: student.id,
        completedAt: { not: null },
        startedAt: { gte: sixMonthsAgo },
      },
      include: {
        sets: {
          select: { exerciseId: true, reps: true, loadKg: true, setNumber: true },
        },
        template: { select: { name: true, type: true } },
      },
      orderBy: { startedAt: "asc" },
    })

    // Exercise names
    const exerciseIds = [
      ...new Set(sessions.flatMap((s) => s.sets.map((set) => set.exerciseId))),
    ]
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true, muscle: true },
    })
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

    // ═══ 1. Weekly frequency (sessions per week) ═══
    const weeklyFrequency: { week: string; sessions: number }[] = []
    for (let w = 25; w >= 0; w--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - w * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 7)

      const count = sessions.filter(
        (s) => s.startedAt >= weekStart && s.startedAt < weekEnd
      ).length

      const label = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`
      weeklyFrequency.push({ week: label, sessions: count })
    }

    // ═══ 2. Load progression per exercise (top 8 most used) ═══
    const exerciseUsage = new Map<string, number>()
    for (const s of sessions) {
      for (const set of s.sets) {
        exerciseUsage.set(set.exerciseId, (exerciseUsage.get(set.exerciseId) || 0) + 1)
      }
    }
    const topExercises = [...exerciseUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id)

    const loadProgression: Record<
      string,
      { exerciseName: string; muscle: string; data: { date: string; maxLoad: number }[] }
    > = {}

    for (const exId of topExercises) {
      const ex = exerciseMap.get(exId)
      if (!ex) continue

      const dataPoints: { date: string; maxLoad: number }[] = []
      for (const s of sessions) {
        const setsForEx = s.sets.filter((set) => set.exerciseId === exId)
        if (setsForEx.length === 0) continue
        const maxLoad = Math.max(...setsForEx.map((set) => set.loadKg))
        dataPoints.push({
          date: s.startedAt.toISOString().split("T")[0],
          maxLoad,
        })
      }

      if (dataPoints.length >= 2) {
        loadProgression[exId] = {
          exerciseName: ex.name,
          muscle: ex.muscle,
          data: dataPoints,
        }
      }
    }

    // ═══ 3. RPE trend over time ═══
    const rpeTrend = sessions
      .filter((s) => s.rpe !== null)
      .map((s) => ({
        date: s.startedAt.toISOString().split("T")[0],
        rpe: s.rpe!,
        template: s.template.name,
      }))

    // ═══ 4. Volume trend (total reps × load per session) ═══
    const volumeTrend = sessions.map((s) => {
      const volume = s.sets.reduce((acc, set) => acc + set.reps * set.loadKg, 0)
      const totalSets = s.sets.length
      return {
        date: s.startedAt.toISOString().split("T")[0],
        volume: Math.round(volume),
        sets: totalSets,
        template: s.template.name,
        duration: s.durationMin,
      }
    })

    // ═══ 5. Muscle distribution (pie chart data) ═══
    const muscleVolume = new Map<string, number>()
    for (const s of sessions) {
      for (const set of s.sets) {
        const ex = exerciseMap.get(set.exerciseId)
        if (!ex) continue
        const vol = set.reps * set.loadKg
        muscleVolume.set(ex.muscle, (muscleVolume.get(ex.muscle) || 0) + vol)
      }
    }
    const muscleDistribution = [...muscleVolume.entries()]
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)

    // ═══ 6. Summary stats ═══
    const totalVolume = volumeTrend.reduce((a, v) => a + v.volume, 0)
    const totalSessions = sessions.length
    const avgDuration =
      sessions.filter((s) => s.durationMin).length > 0
        ? Math.round(
            sessions.filter((s) => s.durationMin).reduce((a, s) => a + (s.durationMin || 0), 0) /
              sessions.filter((s) => s.durationMin).length
          )
        : null
    const totalSets = sessions.reduce((a, s) => a + s.sets.length, 0)

    return NextResponse.json({
      weeklyFrequency,
      loadProgression,
      rpeTrend,
      volumeTrend,
      muscleDistribution,
      summary: {
        totalSessions,
        totalVolume,
        totalSets,
        avgDuration,
        periodDays: Math.ceil((now.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24)),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
