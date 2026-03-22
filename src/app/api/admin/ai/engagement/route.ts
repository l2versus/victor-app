import { generateText } from "ai"
import { freeModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTrainerProfile } from "@/lib/admin"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const { studentId, type } = await req.json()

  // type: "inactive" | "congratulate" | "milestone" | "custom"

  if (studentId) {
    // Single student message
    const student = await prisma.student.findFirst({
      where: { id: studentId, trainerId: trainer.id },
      include: {
        user: { select: { name: true } },
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 10,
          select: { startedAt: true, completedAt: true, durationMin: true },
        },
      },
    })

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    const lastSession = student.sessions[0]
    const daysSinceLastWorkout = lastSession
      ? Math.floor((Date.now() - new Date(lastSession.startedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const totalSessions = student.sessions.length
    const completedSessions = student.sessions.filter((s: { completedAt: Date | null }) => s.completedAt).length

    const prompt = `Gere uma mensagem para o aluno:
Nome: ${student.user.name}
Tipo: ${type}
Dias sem treinar: ${daysSinceLastWorkout ?? "nunca treinou"}
Total de sessoes: ${totalSessions}
Sessoes completas: ${completedSessions}
Objetivo: ${student.goals || "nao definido"}`

    const result = await generateText({
      model: freeModel,
      system: SYSTEM_PROMPTS.engagement,
      messages: [{ role: "user", content: prompt }],
    })

    return Response.json({ message: result.text, studentName: student.user.name })
  }

  // Bulk: generate messages for all students needing engagement
  const students = await prisma.student.findMany({
    where: { trainerId: trainer.id, status: "ACTIVE" },
    include: {
      user: { select: { name: true } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { startedAt: true },
      },
    },
  })

  const now = Date.now()
  type StudentWithSessions = (typeof students)[number] & { daysSince: number }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withDays: StudentWithSessions[] = students.map((s: any) => {
    const lastDate = s.sessions[0]?.startedAt
    const daysSince = lastDate
      ? Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    return { ...s, daysSince }
  })

  const needsEngagement = withDays
    .filter((s: StudentWithSessions) => s.daysSince >= 3)
    .sort((a: StudentWithSessions, b: StudentWithSessions) => b.daysSince - a.daysSince)
    .slice(0, 10)

  const messages = []
  for (const student of needsEngagement) {
    const result = await generateText({
      model: freeModel,
      system: SYSTEM_PROMPTS.engagement,
      messages: [
        {
          role: "user",
          content: `Mensagem de reengajamento para ${student.user.name}. Dias sem treinar: ${student.daysSince}. Objetivo: ${student.goals || "nao definido"}.`,
        },
      ],
    })
    messages.push({
      studentId: student.id,
      studentName: student.user.name,
      daysSince: student.daysSince,
      message: result.text,
    })
  }

  return Response.json({ messages })
}
