import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAuth()

    // Get trainer scope — isolate to same trainer's students
    let trainerId: string | undefined
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { trainerId: true },
      })
      trainerId = student?.trainerId
    } else {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      trainerId = trainer?.id
    }

    if (!trainerId) {
      return NextResponse.json({ live: [] })
    }

    // Active sessions: startedAt not null, completedAt IS null
    // Query window must cover the auto-complete threshold (4h) to enable stale cleanup
    const threeHoursAgo = new Date(Date.now() - 4.5 * 60 * 60 * 1000)

    const activeSessions = await prisma.workoutSession.findMany({
      where: {
        completedAt: null,
        startedAt: { gte: threeHoursAgo },
        student: {
          trainerId,
          status: "ACTIVE",
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
        template: {
          select: { name: true },
        },
      },
      orderBy: { startedAt: "asc" },
    })

    const now = Date.now()

    // Auto-complete stale sessions (> 4 hours without finishing)
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000)
    const staleSessions = activeSessions.filter(s => s.startedAt < fourHoursAgo)
    if (staleSessions.length > 0) {
      await prisma.workoutSession.updateMany({
        where: { id: { in: staleSessions.map(s => s.id) } },
        data: {
          completedAt: new Date(),
          notes: "Finalizado automaticamente — sessão expirada (4h sem atividade)",
        },
      })
    }

    // Return only non-stale sessions
    const activeLive = activeSessions.filter(s => s.startedAt >= fourHoursAgo)

    const live = activeLive.map((s) => {
      const durationMin = Math.floor((now - s.startedAt.getTime()) / 60000)
      return {
        studentId: s.studentId,
        name: s.student.user.name,
        avatar: s.student.user.avatar,
        workoutName: s.template.name,
        durationMin,
        startedAt: s.startedAt.toISOString(),
        isStale: durationMin > 120, // Flag sessions > 2h as potentially forgotten
      }
    })

    return NextResponse.json({ live })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown"
    if (message === "Unauthorized" || message === "SessionExpired") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
