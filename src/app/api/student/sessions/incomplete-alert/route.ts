import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/student/sessions/incomplete-alert
// Notifies the trainer that a student finished workout with incomplete exercises
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { sessionId, skippedExercises } = body as {
      sessionId: string
      skippedExercises: { id: string; name: string; setsCompleted: number; setsPrescribed: number }[]
    }

    if (!sessionId || !skippedExercises?.length) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Get student and trainer info
    const student = await prisma.student.findFirst({
      where: { userId: session.userId },
      include: { user: true, trainer: { include: { user: true } } },
    })

    if (!student?.trainer) {
      return NextResponse.json({ ok: true }) // No trainer to notify
    }

    // Build alert message
    const skippedList = skippedExercises
      .map(e => `• ${e.name}: ${e.setsCompleted}/${e.setsPrescribed} séries`)
      .join("\n")

    const alertContent = `⚠️ ${student.user.name} finalizou o treino com exercícios incompletos:\n\n${skippedList}`

    // Create a notification for the trainer
    await prisma.notification.create({
      data: {
        userId: student.trainer.userId,
        title: `Treino incompleto — ${student.user.name}`,
        body: alertContent,
        type: "WORKOUT_INCOMPLETE",
      },
    })

    // Also save as direct message so it appears in chat
    await prisma.directMessage.create({
      data: {
        senderId: session.userId,
        receiverId: student.trainer.userId,
        content: alertContent,
        channel: "SYSTEM",
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Incomplete alert error:", error)
    return NextResponse.json({ ok: true }) // Non-blocking — don't fail the workout finish
  }
}
