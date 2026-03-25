import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkAndCreateAchievements } from "@/lib/achievements"
import { sendWhatsAppMessage } from "@/lib/whatsapp-bot"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params
    const body = await req.json()

    // Verify session belongs to student
    const session = await prisma.workoutSession.findFirst({
      where: { id, studentId: student.id },
      include: { template: { select: { name: true, type: true } } },
    })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    const durationMin = session.startedAt
      ? Math.round((Date.now() - session.startedAt.getTime()) / 60000)
      : null

    const updated = await prisma.workoutSession.update({
      where: { id },
      data: {
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        rpe: body.rpe ?? undefined,
        notes: body.notes ?? undefined,
        durationMin: body.durationMin ?? durationMin,
      },
    })

    // Check achievements and return them for celebration UI
    let achievements: { type: string; message: string; detail?: string }[] = []
    try {
      achievements = await checkAndCreateAchievements(student.id, id)
    } catch { /* non-blocking */ }

    // ─── BOT PÓS-TREINO: manda msg no WhatsApp como se fosse o Victor ───
    triggerPostWorkoutBot(student.id, session.template?.name || "treino", durationMin).catch(() => {})

    return NextResponse.json({ session: updated, achievements })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// ─── Post-workout bot: mensagem humanizada fingindo ser o Victor ───
async function triggerPostWorkoutBot(studentId: string, workoutName: string, durationMin: number | null) {
  const studentUser = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true, phone: true } } },
  })

  if (!studentUser?.user?.phone) return

  const { normalizePhone } = await import("@/lib/phone")
  const phone = normalizePhone(studentUser.user.phone)
  if (!phone) return

  const firstName = studentUser.user.name.split(" ")[0]
  const durText = durationMin ? `${durationMin} min` : ""

  // Mensagens variadas pra não parecer robô — escolhe aleatoriamente
  const messages = [
    `E aí ${firstName}, como foi o ${workoutName} hoje? Sentiu algo diferente? ${durText ? `Vi que tu mandou ${durText}, show!` : ""} 💪`,
    `Fala ${firstName}! Acabou o treino? Como tá se sentindo? ${durText ? `${durText} de treino é compromisso!` : ""}`,
    `${firstName}! Vi que tu treinou agora. Como foi? Alguma dor ou desconforto?`,
    `Opa ${firstName}, beleza? Como foi o treino hoje? Manda o feedback que eu ajusto pra próxima 💪`,
    `E aí ${firstName}! Bora saber como foi — sentiu pegada hoje? ${durText ? `${durText} bem investidos!` : ""}`,
  ]

  const message = messages[Math.floor(Math.random() * messages.length)]

  // Delay de 30-90 min pra parecer natural (usando setTimeout simples)
  const delayMs = (30 + Math.floor(Math.random() * 60)) * 60 * 1000

  setTimeout(async () => {
    try {
      const sent = await sendWhatsAppMessage(phone, message)
      if (sent) {
        // Salvar no DirectMessage como se fosse o Victor
        const trainer = await prisma.trainerProfile.findFirst({ select: { userId: true } })
        if (trainer) {
          await prisma.directMessage.create({
            data: {
              senderId: trainer.userId,
              receiverId: studentUser.userId,
              content: message,
              channel: "WHATSAPP_BOT",
            },
          })
        }
      }
    } catch (err) {
      console.error("[PostWorkoutBot] Error:", err)
    }
  }, delayMs)
}

// DELETE /api/student/sessions/[id] — Discard (abandon) an incomplete session
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params

    const session = await prisma.workoutSession.findFirst({
      where: { id, studentId: student.id },
    })
    if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })

    // Delete associated sets first, then session
    await prisma.sessionSet.deleteMany({ where: { sessionId: id } })
    await prisma.workoutSession.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
