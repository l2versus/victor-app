import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month" // week | month | all

    // Calculate date range
    const now = new Date()
    let dateFrom: Date | undefined
    if (period === "week") {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === "month") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    // "all" = no date filter

    const dateFilter = dateFrom ? { startedAt: { gte: dateFrom } } : {}
    const completedFilter = { completedAt: { not: null } }

    // Get all active students with their sessions
    const students = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { name: true, avatar: true } },
        sessions: {
          where: { ...completedFilter, ...dateFilter },
          include: {
            sets: true,
          },
        },
      },
    })

    // Calculate ranking metrics for each student
    const ranked = students.map((student) => {
      const sessions = student.sessions
      const totalSessions = sessions.length

      // Volume total (reps × loadKg across all sets)
      let totalVolume = 0
      for (const session of sessions) {
        for (const set of session.sets) {
          if (set.completed) {
            totalVolume += set.reps * set.loadKg
          }
        }
      }

      // Weekly streak — count consecutive weeks with at least 1 session
      let streakWeeks = 0
      if (sessions.length > 0) {
        const weekSet = new Set<string>()
        for (const s of sessions) {
          const d = s.startedAt
          const yearWeek = `${d.getFullYear()}-W${Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}`
          weekSet.add(yearWeek)
        }

        // Count streak from current week backwards
        const currentWeekDate = new Date(now)
        for (let i = 0; i < 52; i++) {
          const checkDate = new Date(currentWeekDate.getTime() - i * 7 * 24 * 60 * 60 * 1000)
          const yearWeek = `${checkDate.getFullYear()}-W${Math.ceil(((checkDate.getTime() - new Date(checkDate.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(checkDate.getFullYear(), 0, 1).getDay() + 1) / 7)}`
          if (weekSet.has(yearWeek)) {
            streakWeeks++
          } else if (i > 0) {
            break
          }
        }
      }

      // Consistency % — sessions done / expected (based on workout plan days)
      const daysInPeriod = dateFrom
        ? Math.ceil((now.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))
        : 90
      const expectedSessions = Math.max(1, Math.round((daysInPeriod / 7) * 3)) // assume 3x/week
      const consistency = Math.min(100, Math.round((totalSessions / expectedSessions) * 100))

      return {
        studentId: student.id,
        name: student.user.name,
        avatar: student.user.avatar,
        totalVolume: Math.round(totalVolume),
        totalSessions,
        streakWeeks,
        consistency,
        // Composite score for ranking
        score: Math.round(totalVolume * 0.4 + totalSessions * 100 * 0.3 + streakWeeks * 200 * 0.2 + consistency * 10 * 0.1),
      }
    })

    // Sort by composite score (descending)
    ranked.sort((a, b) => b.score - a.score)

    // Add position
    const ranking = ranked.map((r, i) => ({ ...r, position: i + 1 }))

    return NextResponse.json({ ranking, period })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
