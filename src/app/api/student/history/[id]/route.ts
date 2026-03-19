import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params

    const session = await prisma.workoutSession.findFirst({
      where: { id, studentId: student.id },
      include: {
        template: {
          include: {
            exercises: {
              include: { exercise: { select: { name: true, muscle: true, equipment: true } } },
              orderBy: { order: "asc" },
            },
          },
        },
        sets: {
          orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
