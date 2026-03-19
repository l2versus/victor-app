import { generateText } from "ai"
import { aiModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  await requireAdmin()

  const { studentId, assessmentId, rawText } = await req.json()

  let anamnesisData = rawText || ""

  // If assessmentId provided, load from DB
  if (assessmentId) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    })
    if (assessment) {
      anamnesisData = typeof assessment.data === "string"
        ? assessment.data
        : JSON.stringify(assessment.data, null, 2)
    }
  }

  // If studentId provided, also get student context
  let studentContext = ""
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true } } },
    })
    if (student) {
      studentContext = `Aluno: ${student.user.name}, ${student.weight || "?"}kg, ${student.height || "?"}cm, Objetivo: ${student.goals || "?"}`
    }
  }

  const result = await generateText({
    model: aiModel,
    system: SYSTEM_PROMPTS.anamnesisAnalyzer,
    messages: [
      {
        role: "user",
        content: `${studentContext}\n\nAnamnese:\n${anamnesisData}`,
      },
    ],
  })

  return Response.json({ analysis: result.text })
}
