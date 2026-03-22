import { generateText } from "ai"
import { premiumModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  const trainer = await prisma.trainerProfile.findUnique({ where: { userId: session.userId } })
  if (!trainer) return Response.json({ error: "Trainer not found" }, { status: 404 })

  const { studentId, objective, level, restrictions, equipment, days, focus } = await req.json()

  // Get student context if provided
  let studentContext = ""
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId, trainerId: trainer.id },
      include: {
        user: { select: { name: true } },
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 5,
          include: { template: { select: { name: true, type: true } } },
        },
        feedbacks: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { summary: true, rpe: true, painReported: true },
        },
      },
    })

    if (student) {
      const recentWorkouts = student.sessions
        .map((s: { template: { name: string; type: string } }) => `${s.template.name} (${s.template.type})`)
        .join(", ")

      const recentFeedback = student.feedbacks
        .map((f: { summary: string | null }) => f.summary || "sem resumo")
        .join("; ")

      studentContext = `
Aluno: ${student.user.name}
Peso: ${student.weight || "?"} kg | Altura: ${student.height || "?"} cm
Objetivo: ${student.goals || objective}
Restricoes: ${student.restrictions ? JSON.stringify(student.restrictions) : restrictions || "nenhuma"}
Treinos recentes: ${recentWorkouts || "nenhum"}
Feedback recente: ${recentFeedback || "nenhum"}`
    }
  }

  // Get available exercises for context
  const exerciseList = await prisma.exercise.findMany({
    select: { name: true, muscle: true, equipment: true },
    take: 200,
  })

  const exerciseNames = exerciseList
    .map((e: { name: string; muscle: string; equipment: string }) => `${e.name} [${e.muscle}/${e.equipment}]`)
    .join("\n")

  const prompt = `Gere um treino com as seguintes especificacoes:
Objetivo: ${objective}
Nivel: ${level}
Restricoes: ${restrictions || "nenhuma"}
Equipamentos: ${equipment || "academia completa"}
Foco: ${focus || "geral"}
Dias por semana: ${days || "3-4"}
${studentContext}

EXERCICIOS DISPONIVEIS NA BIBLIOTECA (USE ESTES NOMES EXATOS):
${exerciseNames}

IMPORTANTE: Use APENAS exercicios da lista acima. Se nao encontrar exatamente, use o mais proximo.`

  const result = await generateText({
    model: premiumModel,
    system: SYSTEM_PROMPTS.workoutGenerator,
    messages: [{ role: "user", content: prompt }],
  })

  let workout
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    workout = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return Response.json(
      { error: "Failed to parse AI response", raw: result.text },
      { status: 422 }
    )
  }

  return Response.json({ workout })
}
