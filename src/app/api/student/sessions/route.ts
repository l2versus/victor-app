import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ error: "templateId obrigatório" }, { status: 400 })
    }

    // Verify template exists
    const template = await prisma.workoutTemplate.findUnique({ where: { id: templateId } })
    if (!template) {
      return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 })
    }

    // Check if there's already an active session today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId,
        startedAt: { gte: today, lt: tomorrow },
        completedAt: null,
      },
      include: { sets: true },
    })

    if (existing) {
      return NextResponse.json({ session: existing })
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
