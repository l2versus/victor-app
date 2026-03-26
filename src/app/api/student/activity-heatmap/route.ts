import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()

    // Last 4 months of data
    const since = new Date()
    since.setMonth(since.getMonth() - 4)
    since.setHours(0, 0, 0, 0)

    const sessions = await prisma.workoutSession.findMany({
      where: {
        studentId: student.id,
        completedAt: { not: null },
        startedAt: { gte: since },
      },
      select: {
        startedAt: true,
      },
      orderBy: { startedAt: "asc" },
    })

    // Group by date (YYYY-MM-DD in Brazil timezone UTC-3)
    const countByDate = new Map<string, number>()

    for (const s of sessions) {
      // Convert to Brazil time (UTC-3) for date grouping
      const brazilTime = new Date(s.startedAt.getTime() - 3 * 60 * 60 * 1000)
      const dateStr = brazilTime.toISOString().slice(0, 10)
      countByDate.set(dateStr, (countByDate.get(dateStr) || 0) + 1)
    }

    const data = Array.from(countByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
