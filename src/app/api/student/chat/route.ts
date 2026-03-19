import { streamText } from "ai"
import { aiModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkFeature } from "@/lib/subscription"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { messages, sessionId } = await req.json()

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages required" }, { status: 400 })
  }
  // Strip system-role messages and limit conversation length
  const safeMessages = messages
    .filter((m: unknown) => {
      if (typeof m !== "object" || m === null) return false
      const msg = m as Record<string, unknown>
      return (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string"
    })
    .slice(-20)

  // Get student data for context
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true } },
    },
  })

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 })
  }

  // Feature gate: only Pro/Elite plans have AI chat
  const hasAI = await checkFeature(student.id, "hasAI")
  if (!hasAI) {
    return Response.json(
      { error: "Seu plano atual não inclui o chat com IA. Faça upgrade para o plano Pro ou Elite para desbloquear!" },
      { status: 403 }
    )
  }

  // Get workout session if provided
  let workoutContext = ""
  if (sessionId) {
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId, studentId: student.id },
      include: {
        template: {
          include: {
            exercises: {
              include: { exercise: { select: { name: true, muscle: true } } },
            },
          },
        },
      },
    })

    if (workoutSession) {
      const exerciseNames = workoutSession.template.exercises
        .map((e) => `${e.exercise.name} (${e.exercise.muscle})`)
        .join(", ")

      workoutContext = `
Treino realizado: ${workoutSession.template.name} (${workoutSession.template.type})
Duracao: ${workoutSession.durationMin || "nao registrado"} min
Exercicios: ${exerciseNames}
RPE geral: ${workoutSession.rpe || "nao informado"}`
    }
  }

  const systemPrompt = `${SYSTEM_PROMPTS.postWorkout}

Dados do aluno:
Nome: ${student.user.name}
Objetivo: ${student.goals || "nao definido"}
Restricoes: ${student.restrictions ? JSON.stringify(student.restrictions) : "nenhuma"}
${workoutContext}`

  const result = streamText({
    model: aiModel,
    system: systemPrompt,
    messages: safeMessages,
  })

  return result.toTextStreamResponse()
}
