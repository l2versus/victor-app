import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// POST — criar nova série (com suporte a technique e isExtra)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params
    const body = await req.json()

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
        technique: body.technique ?? "NORMAL",
        isExtra: body.isExtra ?? false,
      },
    })

    return NextResponse.json({ set }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH — editar série já completada (reps, loadKg, rpe, technique)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params
    const body = await req.json()

    if (!body.setId) {
      return NextResponse.json({ error: "Campo obrigatório: setId" }, { status: 400 })
    }

    // Verificar que a sessão pertence ao aluno
    const session = await prisma.workoutSession.findFirst({
      where: { id, studentId: student.id },
    })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    // Verificar que o set pertence a essa sessão
    const existingSet = await prisma.sessionSet.findFirst({
      where: { id: body.setId, sessionId: id },
    })

    if (!existingSet) {
      return NextResponse.json({ error: "Série não encontrada" }, { status: 404 })
    }

    const updated = await prisma.sessionSet.update({
      where: { id: body.setId },
      data: {
        ...(body.reps != null && { reps: body.reps }),
        ...(body.loadKg != null && { loadKg: body.loadKg }),
        ...(body.rpe !== undefined && { rpe: body.rpe }),
        ...(body.technique && { technique: body.technique }),
      },
    })

    return NextResponse.json({ set: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE — remover série extra
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { student } = await requireStudent()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const setId = searchParams.get("setId")

    if (!setId) {
      return NextResponse.json({ error: "Campo obrigatório: setId" }, { status: 400 })
    }

    const session = await prisma.workoutSession.findFirst({
      where: { id, studentId: student.id },
    })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    const existingSet = await prisma.sessionSet.findFirst({
      where: { id: setId, sessionId: id, isExtra: true },
    })

    if (!existingSet) {
      return NextResponse.json({ error: "Só é possível remover séries extras" }, { status: 400 })
    }

    await prisma.sessionSet.delete({ where: { id: setId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
