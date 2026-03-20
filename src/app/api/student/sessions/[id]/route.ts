import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkAndCreateAchievements } from "@/lib/achievements"

export async function PATCH(
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

    const durationMin = session.startedAt
      ? Math.round((Date.now() - session.startedAt.getTime()) / 60000)
      : null

    const updated = await prisma.workoutSession.update({
      where: { id },
      data: {
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        rpe: body.rpe ?? undefined,
        notes: body.notes ?? undefined,
        durationMin: body.durationMin ?? durationMin,
      },
    })

    // Check achievements and return them for celebration UI
    let achievements: { type: string; message: string; detail?: string }[] = []
    try {
      achievements = await checkAndCreateAchievements(student.id, id)
    } catch { /* non-blocking */ }

    return NextResponse.json({ session: updated, achievements })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
