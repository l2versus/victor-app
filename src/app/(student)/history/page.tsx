import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { HistoryClient } from "./history-client"

export const metadata: Metadata = {
  title: "Histórico",
  robots: { index: false, follow: false },
}

export default async function HistoryPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })

  if (!student) redirect("/login")

  // Last 90 days of sessions
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const sessions = await prisma.workoutSession.findMany({
    where: { studentId: student.id, completedAt: { not: null } },
    include: {
      template: { select: { name: true, type: true } },
      _count: { select: { sets: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  })

  // Heatmap data
  const recentSessions = await prisma.workoutSession.findMany({
    where: { studentId: student.id, completedAt: { not: null }, startedAt: { gte: ninetyDaysAgo } },
    select: { startedAt: true },
  })
  const heatmap: Record<string, number> = {}
  for (const s of recentSessions) {
    const key = s.startedAt.toISOString().split("T")[0]
    heatmap[key] = (heatmap[key] || 0) + 1
  }

  // Streak
  let streak = 0
  const now = new Date()
  for (let w = 0; w < 52; w++) {
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 7)
    const count = await prisma.workoutSession.count({
      where: { studentId: student.id, completedAt: { not: null }, startedAt: { gte: weekStart, lt: weekEnd } },
    })
    if (count > 0) streak++
    else break
  }

  return (
    <HistoryClient
      sessions={sessions.map((s) => ({
        id: s.id,
        templateName: s.template.name,
        templateType: s.template.type,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt!.toISOString(),
        durationMin: s.durationMin,
        rpe: s.rpe,
        setsCount: s._count.sets,
      }))}
      heatmap={Object.entries(heatmap).map(([date, count]) => ({ date, count }))}
      streak={streak}
    />
  )
}
