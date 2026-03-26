import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/admin/students/[id] — student detail with sessions & workouts
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await context.params

    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
      include: {
        user: { select: { name: true, email: true, phone: true, active: true, avatar: true, createdAt: true } },
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            template: { select: { name: true, type: true } },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/admin/students/[id] — update student data
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await context.params

    const existing = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      email,
      phone,
      password,
      birthDate,
      gender,
      weight,
      height,
      goals,
      restrictions,
      notes,
    } = body

    const student = await prisma.$transaction(async (tx) => {
      // Update user fields
      const userData: Record<string, unknown> = {}
      if (name) userData.name = name
      if (email) userData.email = email
      if (phone !== undefined) userData.phone = phone || null
      if (password) userData.password = await hashPassword(password)

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData,
        })
      }

      // Update student fields
      const studentData: Record<string, unknown> = {}
      if (birthDate !== undefined) studentData.birthDate = birthDate ? new Date(birthDate) : null
      if (gender !== undefined) studentData.gender = gender || null
      if (weight !== undefined) studentData.weight = weight ? parseFloat(weight) : null
      if (height !== undefined) studentData.height = height ? parseFloat(height) : null
      if (goals !== undefined) studentData.goals = goals || null
      if (restrictions !== undefined) studentData.restrictions = restrictions || null
      if (notes !== undefined) studentData.notes = notes || null

      return tx.student.update({
        where: { id },
        data: studentData,
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      })
    })

    return NextResponse.json({ student })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/admin/students/[id] — permanently delete student and user
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await context.params

    const existing = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
      select: { id: true, userId: true, user: { select: { name: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Delete student (cascade) and then user
    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } })
      await tx.user.delete({ where: { id: existing.userId } })
    })

    return NextResponse.json({ success: true, deletedName: existing.user.name })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH /api/admin/students/[id] — toggle active/inactive
export async function PATCH(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await context.params

    const existing = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
      include: { user: { select: { active: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const newActive = !existing.user.active
    const newStatus = newActive ? "ACTIVE" : "INACTIVE"

    const student = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.userId },
        data: { active: newActive },
      })

      return tx.student.update({
        where: { id },
        data: { status: newStatus },
        include: {
          user: { select: { name: true, email: true, phone: true, active: true } },
        },
      })
    })

    return NextResponse.json({ student })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
