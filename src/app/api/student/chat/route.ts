import { streamText } from "ai"
import { aiModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { messages, sessionId } = await req.json()

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

  // Get workout session if provided
  let workoutContext = ""
  if (sessionId) {
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        template: { select: { name: true, type: true } },
        sets: {
          include: {
            session: {
              include: {
                template: {
                  include: {
                    exercises: {
                      include: { exercise: { select: { name: true, muscle: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (workoutSession) {
      const exerciseNames = workoutSession.template.exercises
        ? (workoutSession as unknown as { template: { exercises: Array<{ exercise: { name: string; muscle: string } }> } }).template.exercises
            .map((e) => `${e.exercise.name} (${e.exercise.muscle})`)
            .join(", ")
        : ""

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
    messages,
  })

  return result.toTextStreamResponse()
}
