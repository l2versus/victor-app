import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function POST(
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
    })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    if (!body.exerciseId || body.setNumber == null || body.reps == null || body.loadKg == null) {
      return NextResponse.json({ error: "Campos obrigatórios: exerciseId, setNumber, reps, loadKg" }, { status: 400 })
    }

    const set = await prisma.sessionSet.create({
      data: {
        sessionId: id,
        exerciseId: body.exerciseId,
        setNumber: body.setNumber,
        reps: body.reps,
        loadKg: body.loadKg,
        rpe: body.rpe ?? null,
        completed: true,
      },
    })

    return NextResponse.json({ set }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
