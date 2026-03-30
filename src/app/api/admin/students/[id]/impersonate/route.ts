import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, generateToken } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// POST /api/admin/students/[id]/impersonate — generate a temporary student token
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    // Verify the student belongs to this trainer
    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
      include: { user: { select: { id: true, email: true, sessionVersion: true } } },
    })

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Generate a short-lived student token (1 hour only)
    const token = generateToken({
      userId: student.user.id,
      email: student.user.email,
      role: "STUDENT",
      sv: student.user.sessionVersion,
    }, "1h")

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Impersonate error:", error)
    const msg = error instanceof Error ? error.message : "Erro interno"
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: msg, detail: String(error) }, { status })
  }
}
