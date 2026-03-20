import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { aiModel } from "@/lib/ai"
import { generateText } from "ai"

// POST /api/student/nutrition/ai — AI nutrition suggestion based on today's meals + recent workouts
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const hasAccess = await checkFeature(student.id, "hasNutrition")
    if (!hasAccess) {
      return NextResponse.json({ error: "Plano Pro ou Elite necessário" }, { status: 403 })
    }

    const body = await req.json()
    const { meals, totalCalories, protein, carbs, fat, waterMl } = body

    // Fetch student goal + recent workouts for context
    const [studentData, recentSessions] = await Promise.all([
      prisma.student.findUnique({
        where: { id: student.id },
        select: { goals: true, weight: true, gender: true },
      }),
      prisma.workoutSession.findMany({
        where: {
          studentId: student.id,
          completedAt: { not: null },
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: { template: { select: { name: true, type: true } } },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ])

    const mealsSummary = (meals as Array<{ name: string; foods: Array<{ name: string; calories: number }> }>)
      .map((m) => `${m.name}: ${m.foods.map((f) => f.name).join(", ")}`)
      .join(" | ")

    const workoutsSummary = recentSessions.length
      ? recentSessions.map((s) => `${s.template.name} (${s.template.type})`).join(", ")
      : "Nenhum treino esta semana"

    const prompt = `Aluno: peso ${studentData?.weight ?? "?"}kg, objetivo "${studentData?.goals ?? "não informado"}".
Treinos recentes: ${workoutsSummary}.
Ingestão hoje: ${totalCalories}kcal | Proteína: ${protein}g | Carb: ${carbs}g | Gordura: ${fat}g | Água: ${waterMl}ml.
Refeições: ${mealsSummary || "Nenhuma refeição registrada"}.

Analise a nutrição do dia cruzando com o objetivo e os treinos recentes. Dê sugestões práticas e objetivas.
Seja direto. Máximo 3 parágrafos curtos. Sem markdown. Em português brasileiro.`

    const { text } = await generateText({
      model: aiModel,
      system: `Você é nutricionista esportivo parceiro do personal trainer Victor Oliveira.
Analise ingestão calórica e macros do aluno e sugira ajustes baseados no objetivo e treinos.
Seja direto, prático e motivador. Use português brasileiro casual. Sem julgamentos negativos.`,
      prompt,
    })

    // Save suggestion to today's log
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await prisma.nutritionLog.updateMany({
      where: { studentId: student.id, date: today },
      data: { aiSuggestion: text.trim() },
    })

    return NextResponse.json({ suggestion: text.trim() })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
