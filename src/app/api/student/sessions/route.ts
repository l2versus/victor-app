import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { getBrazilTodayRange } from "@/lib/timezone"
import { getStudentFeatures } from "@/lib/subscription"

/** Get the Monday 00:00 (UTC-3 / Brazil) of the current week */
function getWeekStartBrazil(): Date {
  const now = new Date()
  // Brazil = UTC-3
  const brazilOffset = -3 * 60
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const brazilNow = new Date(utcMs + brazilOffset * 60000)
  const day = brazilNow.getDay() // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(brazilNow)
  monday.setDate(monday.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  // Convert back to UTC
  return new Date(monday.getTime() - brazilOffset * 60000 - now.getTimezoneOffset() * 60000)
}

export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ error: "templateId obrigatório" }, { status: 400 })
    }

    // ── B2C feature gate: weekly session limit ──
    const features = await getStudentFeatures(student.id)
    if (features.maxSessionsWeek !== null) {
      const weekStart = getWeekStartBrazil()
      const sessionsThisWeek = await prisma.workoutSession.count({
        where: {
          studentId: student.id,
          startedAt: { gte: weekStart },
          completedAt: { not: null }, // only count completed sessions
        },
      })
      if (sessionsThisWeek >= features.maxSessionsWeek) {
        return NextResponse.json(
          {
            error: "Limite de treinos atingido",
            limit: features.maxSessionsWeek,
            used: sessionsThisWeek,
            upgradeUrl: "/upgrade",
          },
          { status: 403 }
        )
      }
    }

    // Verify template exists and belongs to student's trainer
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template || template.trainerId !== student.trainerId) {
      return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 })
    }

    // Check if there's ANY active (uncompleted) session for this student
    // Priority: same template first, then any template
    const existingAny = await prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        completedAt: null,
      },
      include: { sets: true },
      orderBy: { startedAt: "desc" },
    })

    if (existingAny) {
      // If same template → resume it
      if (existingAny.templateId === templateId) {
        return NextResponse.json({ session: existingAny })
      }

      // Different template but old session with 0 sets → auto-discard the old one
      const oldSets = existingAny.sets.length
      if (oldSets === 0) {
        await prisma.workoutSession.delete({ where: { id: existingAny.id } })
      } else {
        // Old session has progress → auto-complete it (save the work)
        await prisma.workoutSession.update({
          where: { id: existingAny.id },
          data: {
            completedAt: new Date(),
            durationMin: Math.round((Date.now() - existingAny.startedAt.getTime()) / 60000),
            notes: "Finalizado automaticamente ao iniciar novo treino",
          },
        })
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        studentId: student.id,
        templateId,
      },
      include: { sets: true },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
