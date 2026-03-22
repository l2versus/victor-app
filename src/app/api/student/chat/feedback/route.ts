import { generateText } from "ai"
import { premiumModel } from "@/lib/ai"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkFeature } from "@/lib/subscription"
import { NextRequest } from "next/server"

// Save structured feedback after chat completion
export async function POST(req: NextRequest) {
  try {
  const session = await requireAuth()
  if (session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { sessionId, messages } = await req.json()

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 })
  }

  // Feature gate: only Pro/Elite plans have AI feedback
  const hasAI = await checkFeature(student.id, "hasAI")
  if (!hasAI) {
    return Response.json(
      { error: "Seu plano não inclui feedback por IA" },
      { status: 403 }
    )
  }

  // Verify session belongs to this student
  if (sessionId) {
    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId, studentId: student.id },
    })
    if (!workoutSession) {
      return Response.json({ error: "Sessão não encontrada" }, { status: 404 })
    }
  }

  // Use AI to extract structured data from conversation
  const extractionResult = await generateText({
    model: premiumModel,
    system: `Extraia dados estruturados da conversa pos-treino. Responda APENAS com JSON valido:
{
  "rpe": number|null (1-10),
  "energyLevel": "baixo"|"medio"|"alto"|null,
  "sleepHours": number|null,
  "nutritionNote": string|null,
  "painReported": [{"area": string, "severity": "leve"|"moderada"|"intensa"}]|null,
  "loadChanges": [{"exercise": string, "change": "aumentou"|"diminuiu"|"manteve", "detail": string}]|null,
  "summary": string (resumo de 2-3 frases do feedback)
}`,
    messages: [
      {
        role: "user",
        content: `Conversa:\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")}`,
      },
    ],
  })

  let structured
  try {
    const jsonMatch = extractionResult.text.match(/\{[\s\S]*\}/)
    structured = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    structured = { summary: "Feedback registrado sem extracao automatica." }
  }

  // Upsert feedback
  const feedback = await prisma.workoutFeedback.upsert({
    where: { sessionId },
    create: {
      sessionId,
      studentId: student.id,
      state: "COMPLETED",
      rpe: structured.rpe,
      energyLevel: structured.energyLevel,
      sleepHours: structured.sleepHours,
      nutritionNote: structured.nutritionNote,
      painReported: structured.painReported,
      loadChanges: structured.loadChanges,
      summary: structured.summary,
      tokensUsed: 1,
    },
    update: {
      state: "COMPLETED",
      rpe: structured.rpe,
      energyLevel: structured.energyLevel,
      sleepHours: structured.sleepHours,
      nutritionNote: structured.nutritionNote,
      painReported: structured.painReported,
      loadChanges: structured.loadChanges,
      summary: structured.summary,
      tokensUsed: { increment: 1 },
    },
  })

  // Save conversation messages
  for (const msg of messages) {
    await prisma.feedbackMessage.create({
      data: {
        feedbackId: feedback.id,
        role: msg.role,
        content: msg.content,
      },
    })
  }

  return Response.json({ success: true, feedback })
  } catch (error) {
    console.error("[Feedback] Error:", error)
    const message = error instanceof Error ? error.message : "Erro interno"
    if (message === "Unauthorized") {
      return Response.json({ error: message }, { status: 401 })
    }
    return Response.json({ error: "Erro ao salvar feedback" }, { status: 500 })
  }
}
