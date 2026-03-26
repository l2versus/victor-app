import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// POST /api/admin/impersonate — generate a short-lived student token for preview
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // Verify student belongs to this trainer
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, email: true, name: true, sessionVersion: true } } },
    })

    if (!student || student.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Generate short-lived token (15 minutes) for impersonation
    // SECURITY: Include sv (session version) so token is invalidated when student logs in.
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.json({ error: "JWT not configured" }, { status: 500 })
    }

    const impersonateToken = jwt.sign(
      {
        userId: student.user.id,
        email: student.user.email,
        role: "STUDENT" as const,
        sv: student.user.sessionVersion,
        impersonatedBy: session.userId,
      },
      secret,
      { expiresIn: "15m" }
    )

    return NextResponse.json({
      token: impersonateToken,
      studentName: student.user.name,
    })
  } catch (error) {
    console.error("POST /api/admin/impersonate error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
