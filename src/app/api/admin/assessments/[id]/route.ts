import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTrainerProfile } from "@/lib/admin"

// GET /api/admin/assessments/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const assessment = await prisma.assessment.findFirst({
      where: { id, student: { trainerId: trainer.id } },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("GET /api/admin/assessments/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 })
  }
}

// PATCH /api/admin/assessments/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.assessment.findFirst({
      where: { id, student: { trainerId: trainer.id } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        data: body.data ?? undefined,
        title: body.title ?? undefined,
        notes: body.notes ?? undefined,
      },
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("PATCH /api/admin/assessments/[id] error:", error)
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 })
  }
}

// DELETE /api/admin/assessments/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const existing = await prisma.assessment.findFirst({
      where: { id, student: { trainerId: trainer.id } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    await prisma.assessment.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/assessments/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 })
  }
}
