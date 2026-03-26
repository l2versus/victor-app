import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()
    const now = new Date()
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(now.getDate() - 90)
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(now.getDate() - 84)
    const oneYearAgo = new Date()
    oneYearAgo.setDate(now.getDate() - 364)

    // Run independent queries in parallel
    const [
      totalSessions,
      rpeAgg,
      recentSessions,
      streakSessions,
      allSets,
    ] = await Promise.all([
      // Total sessions
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null } },
      }),

      // Average RPE
      prisma.workoutSession.aggregate({
        where: { studentId: student.id, completedAt: { not: null }, rpe: { not: null } },
        _avg: { rpe: true },
      }),

      // Heatmap: sessions per day (last 90 days)
      prisma.workoutSession.findMany({
        where: {
          studentId: student.id,
          completedAt: { not: null },
          startedAt: { gte: ninetyDaysAgo },
        },
        select: { startedAt: true },
        orderBy: { startedAt: "asc" },
      }),

      // Streak: all sessions in last year (for weekly streak calc)
      prisma.workoutSession.findMany({
        where: {
          studentId: student.id,
          completedAt: { not: null },
          startedAt: { gte: oneYearAgo },
        },
        select: { startedAt: true },
        orderBy: { startedAt: "desc" },
      }),

      // All sets with session info (for PRs and volume)
      prisma.sessionSet.findMany({
        where: {
          session: { studentId: student.id, startedAt: { gte: twelveWeeksAgo } },
        },
        select: {
          exerciseId: true,
          reps: true,
          loadKg: true,
          session: { select: { startedAt: true } },
        },
      }),
    ])

    // Build heatmap data
    const heatmap: Record<string, number> = {}
    for (const s of recentSessions) {
      const key = s.startedAt.toISOString().split("T")[0]
      heatmap[key] = (heatmap[key] || 0) + 1
    }

    // Streak: consecutive weeks with at least 1 session (computed in-memory)
    const weekSet = new Set<number>()
    for (const s of streakSessions) {
      const diffMs = now.getTime() - s.startedAt.getTime()
      const weekIndex = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
      weekSet.add(weekIndex)
    }
    let streak = 0
    for (let w = 0; w < 52; w++) {
      if (weekSet.has(w)) {
        streak++
      } else {
        break
      }
    }

    // PRs: fetch top sets per exercise (limited to exercises with highest loads)
    const allPrSets = await prisma.sessionSet.findMany({
      where: { session: { studentId: student.id }, loadKg: { gt: 0 } },
      select: {
        exerciseId: true,
        loadKg: true,
        session: { select: { startedAt: true } },
      },
      orderBy: { loadKg: "desc" },
      take: 200,
    })

    const exerciseIds = [...new Set(allPrSets.map((s) => s.exerciseId))]
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true, muscle: true },
    })
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]))

    const prMap = new Map<string, { loadKg: number; date: Date }>()
    for (const set of allPrSets) {
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

    // Volume by week (last 12 weeks) — computed in-memory from allSets
    const volumeByWeek: { week: string; volume: number }[] = []
    for (let w = 11; w >= 0; w--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - w * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 7)

      let volume = 0
      for (const set of allSets) {
        const t = set.session.startedAt.getTime()
        if (t >= weekStart.getTime() && t < weekEnd.getTime()) {
          volume += set.reps * set.loadKg
        }
      }

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
