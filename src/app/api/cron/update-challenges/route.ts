import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/cron/update-challenges — Auto-calculate challenge progress from real workout data
// Runs every 6 hours via Vercel Cron
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not set — rejecting request")
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 1. Auto-expire challenges past their endDate
  await prisma.challenge.updateMany({
    where: { status: "ACTIVE", endDate: { lt: now } },
    data: { status: "COMPLETED" },
  })

  // 2. Get all active challenges with entries
  const challenges = await prisma.challenge.findMany({
    where: { status: "ACTIVE" },
    include: { entries: { select: { id: true, studentId: true } } },
  })

  let updated = 0

  for (const challenge of challenges) {
    if (challenge.entries.length === 0) continue

    const studentIds = challenge.entries.map((e) => e.studentId)
    const start = challenge.startDate
    const end = challenge.endDate

    // Calculate metric per student based on challenge.metric
    const metric = challenge.metric

    if (metric === "volume_total") {
      // Volume = sum of (loadKg * reps) per completed set within challenge period
      for (const entry of challenge.entries) {
        const sets = await prisma.sessionSet.findMany({
          where: {
            completed: true,
            session: {
              studentId: entry.studentId,
              completedAt: { gte: start, lte: end },
            },
          },
          select: { loadKg: true, reps: true },
        })

        const totalVolume = sets.reduce((sum, s) => sum + s.loadKg * s.reps, 0)

        await prisma.challengeEntry.update({
          where: { id: entry.id },
          data: { value: Math.round(totalVolume) },
        })
        updated++
      }
    } else if (metric === "sessoes_total") {
      // COUNT completed sessions within full challenge period
      for (const entry of challenge.entries) {
        const count = await prisma.workoutSession.count({
          where: {
            studentId: entry.studentId,
            completedAt: { gte: start, lte: end, not: null },
          },
        })
        await prisma.challengeEntry.update({
          where: { id: entry.id },
          data: { value: count },
        })
        updated++
      }
    } else if (metric === "sessoes_semana") {
      // COUNT completed sessions in the current week only (Mon-Sun)
      const today = now < end ? now : end
      const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - mondayOffset)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      for (const entry of challenge.entries) {
        const count = await prisma.workoutSession.count({
          where: {
            studentId: entry.studentId,
            completedAt: { gte: weekStart, lt: weekEnd, not: null },
          },
        })
        await prisma.challengeEntry.update({
          where: { id: entry.id },
          data: { value: count },
        })
        updated++
      }
    } else if (metric === "streak_dias") {
      // Count consecutive days with at least one completed session (from endDate backwards)
      for (const entry of challenge.entries) {
        const sessions = await prisma.workoutSession.findMany({
          where: {
            studentId: entry.studentId,
            completedAt: { gte: start, lte: end, not: null },
          },
          select: { completedAt: true },
          orderBy: { completedAt: "desc" },
        })

        // Get unique dates
        const uniqueDays = new Set(
          sessions.map((s) => s.completedAt!.toISOString().slice(0, 10))
        )
        const sortedDays = [...uniqueDays].sort().reverse()

        let streak = 0
        const streakBase = now < end ? now : end
        const today = streakBase.toISOString().slice(0, 10)
        let checkDate = today

        for (const day of sortedDays) {
          if (day === checkDate || (streak === 0 && day <= today)) {
            streak++
            // Move to previous day
            const d = new Date(day)
            d.setDate(d.getDate() - 1)
            checkDate = d.toISOString().slice(0, 10)
          } else {
            break
          }
        }

        await prisma.challengeEntry.update({
          where: { id: entry.id },
          data: { value: streak },
        })
        updated++
      }
    } else if (metric === "consistencia") {
      // Consistency = (sessions completed / total days in period) * 100
      for (const entry of challenge.entries) {
        const count = await prisma.workoutSession.count({
          where: {
            studentId: entry.studentId,
            completedAt: { gte: start, lte: end, not: null },
          },
        })

        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        const elapsed = Math.max(1, Math.ceil((Math.min(now.getTime(), end.getTime()) - start.getTime()) / (1000 * 60 * 60 * 24)))
        const consistency = Math.round((count / elapsed) * 100)

        await prisma.challengeEntry.update({
          where: { id: entry.id },
          data: { value: Math.min(consistency, 100) },
        })
        updated++
      }
    }
    // For unknown metrics, skip (value stays manual)
  }

  console.log(`[Cron] update-challenges: ${updated} entries updated across ${challenges.length} active challenges`)

  return NextResponse.json({ ok: true, updated, challenges: challenges.length })
}
