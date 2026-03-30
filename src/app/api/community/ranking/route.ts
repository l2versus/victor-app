import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    // Get student's trainerId for isolation
    let trainerId: string | undefined
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { trainerId: true },
      })
      trainerId = student?.trainerId ?? undefined
    } else {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      trainerId = trainer?.id
    }

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

    const dateFilter = dateFrom ? { startedAt: { gte: dateFrom } } : {}
    const completedFilter = { completedAt: { not: null } }

    // Get only students from the same trainer (data isolation)
    // Optimized: separate queries to avoid loading all sets into memory
    const students = await prisma.student.findMany({
      where: { status: "ACTIVE", ...(trainerId ? { trainerId } : {}) },
      select: {
        id: true,
        user: { select: { name: true, avatar: true } },
      },
    })

    const studentIds = students.map(s => s.id)

    // Batch: session counts + dates per student (for streak calc)
    const [sessionsByStudent, volumeByStudent] = await Promise.all([
      prisma.workoutSession.findMany({
        where: {
          studentId: { in: studentIds },
          ...completedFilter,
          ...dateFilter,
        },
        select: { studentId: true, startedAt: true },
      }),
      // Volume aggregation: sum(reps * loadKg) per student via raw sets query
      prisma.sessionSet.findMany({
        where: {
          completed: true,
          session: {
            studentId: { in: studentIds },
            ...completedFilter,
            ...dateFilter,
          },
        },
        select: { reps: true, loadKg: true, session: { select: { studentId: true } } },
      }),
    ])

    // Build maps
    const sessionMap = new Map<string, Date[]>()
    for (const s of sessionsByStudent) {
      if (!sessionMap.has(s.studentId)) sessionMap.set(s.studentId, [])
      sessionMap.get(s.studentId)!.push(s.startedAt)
    }

    const volumeMap = new Map<string, number>()
    for (const set of volumeByStudent) {
      const sid = set.session.studentId
      volumeMap.set(sid, (volumeMap.get(sid) || 0) + set.reps * set.loadKg)
    }

    // Calculate ranking metrics for each student
    const ranked = students.map((student) => {
      const sessionDates = sessionMap.get(student.id) || []
      const totalSessions = sessionDates.length
      const totalVolume = volumeMap.get(student.id) || 0

      // Weekly streak — count consecutive weeks with at least 1 session
      let streakWeeks = 0
      if (sessionDates.length > 0) {
        const weekSet = new Set<string>()
        for (const d of sessionDates) {
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

    const response = NextResponse.json({ ranking, period })
    // Rankings change slowly — cache for 2 minutes, stale-while-revalidate for 10 minutes
    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600")
    return response
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
