import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"

// GET: List all workout plans for a student
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    // Verify student belongs to trainer
    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    const plans = await prisma.studentWorkoutPlan.findMany({
      where: { studentId: id },
      include: {
        template: { select: { id: true, name: true, type: true } },
      },
      orderBy: { dayOfWeek: "asc" },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST: Assign or update a workout plan for a weekday
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params
    const body = await req.json()

    // Verify student
    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    if (body.dayOfWeek == null || !body.templateId) {
      return NextResponse.json({ error: "dayOfWeek e templateId obrigatórios" }, { status: 400 })
    }

    // Verify template belongs to trainer
    const template = await prisma.workoutTemplate.findFirst({
      where: { id: body.templateId, trainerId: trainer.id },
    })
    if (!template) {
      return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 })
    }

    const plan = await prisma.studentWorkoutPlan.upsert({
      where: { studentId_dayOfWeek: { studentId: id, dayOfWeek: body.dayOfWeek } },
      update: { templateId: body.templateId, active: true },
      create: { studentId: id, templateId: body.templateId, dayOfWeek: body.dayOfWeek },
      include: {
        template: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE: Remove a workout plan for a weekday
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const dayOfWeek = parseInt(searchParams.get("dayOfWeek") || "-1")

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: "dayOfWeek inválido" }, { status: 400 })
    }

    // Verify student
    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    await prisma.studentWorkoutPlan.delete({
      where: { studentId_dayOfWeek: { studentId: id, dayOfWeek } },
    }).catch(() => null) // Ignore if not found

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
