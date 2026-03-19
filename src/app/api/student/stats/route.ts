import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()

    // Total sessions
    const totalSessions = await prisma.workoutSession.count({
      where: { studentId: student.id, completedAt: { not: null } },
    })

    // Average RPE
    const rpeAgg = await prisma.workoutSession.aggregate({
      where: { studentId: student.id, completedAt: { not: null }, rpe: { not: null } },
      _avg: { rpe: true },
    })

    // Heatmap: sessions per day (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const recentSessions = await prisma.workoutSession.findMany({
      where: {
        studentId: student.id,
        completedAt: { not: null },
        startedAt: { gte: ninetyDaysAgo },
      },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
    })

    // Build heatmap data: { date: "YYYY-MM-DD", count: N }
    const heatmap: Record<string, number> = {}
    for (const s of recentSessions) {
      const key = s.startedAt.toISOString().split("T")[0]
      heatmap[key] = (heatmap[key] || 0) + 1
    }

    // Streak: consecutive weeks with at least 1 session
    let streak = 0
    const now = new Date()
    for (let w = 0; w < 52; w++) {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - w * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 7)

      const count = await prisma.workoutSession.count({
        where: {
          studentId: student.id,
          completedAt: { not: null },
          startedAt: { gte: weekStart, lt: weekEnd },
        },
      })

      if (count > 0) {
        streak++
      } else {
        break
      }
    }

    // Personal Records (max load per exercise)
    const allSets = await prisma.sessionSet.findMany({
      where: { session: { studentId: student.id } },
      orderBy: { loadKg: "desc" },
      include: {
        session: { select: { startedAt: true } },
      },
    })

    // Get unique exercise IDs
    const exerciseIds = [...new Set(allSets.map((s) => s.exerciseId))]
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true, muscle: true },
    })
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

    // Build PR per exercise
    const prMap = new Map<string, { loadKg: number; date: Date }>()
    for (const set of allSets) {
      const existing = prMap.get(set.exerciseId)
      if (!existing || set.loadKg > existing.loadKg) {
        prMap.set(set.exerciseId, { loadKg: set.loadKg, date: set.session.startedAt })
      }
    }

    const prs = Array.from(prMap.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: exerciseMap.get(exerciseId)?.name || "",
        muscle: exerciseMap.get(exerciseId)?.muscle || "",
        loadKg: data.loadKg,
        date: data.date,
      }))
      .sort((a, b) => b.loadKg - a.loadKg)
      .slice(0, 10)

    // Volume by week (last 12 weeks)
    const volumeByWeek: { week: string; volume: number }[] = []
    for (let w = 11; w >= 0; w--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - w * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 7)

      const weekSets = await prisma.sessionSet.findMany({
        where: {
          session: {
            studentId: student.id,
            startedAt: { gte: weekStart, lt: weekEnd },
          },
        },
        select: { reps: true, loadKg: true },
      })

      const volume = weekSets.reduce((sum, s) => sum + s.reps * s.loadKg, 0)
      const label = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`
      volumeByWeek.push({ week: label, volume: Math.round(volume) })
    }

    return NextResponse.json({
      totalSessions,
      avgRpe: rpeAgg._avg.rpe ? Math.round(rpeAgg._avg.rpe * 10) / 10 : null,
      streak,
      heatmap: Object.entries(heatmap).map(([date, count]) => ({ date, count })),
      prs,
      volumeByWeek,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
