import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/workouts/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const workout = await prisma.workoutTemplate.findFirst({
      where: { id, trainerId: trainer.id },
      include: {
        exercises: {
          include: { exercise: { select: { id: true, name: true, muscle: true, equipment: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { sessions: true } },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("GET /api/admin/workouts/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch workout" }, { status: 500 })
  }
}

// PATCH /api/admin/workouts/[id] — update workout template + exercises
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.workoutTemplate.findFirst({
      where: { id, trainerId: trainer.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    const { name, type, notes, exercises } = body

    // Update template fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (notes !== undefined) updateData.notes = notes || null

    // If exercises provided, replace all exercises
    if (exercises && Array.isArray(exercises)) {
      const resolvedExercises = await Promise.all(
        exercises.map(async (ex: {
          exerciseId?: string
          exerciseName?: string
          sets: number
          reps: string
          restSeconds: number
          loadKg?: number
          notes?: string
          order: number
          supersetGroup?: string
          suggestedMachine?: string
        }, index: number) => {
          let exerciseId = ex.exerciseId
          if (!exerciseId && ex.exerciseName) {
            const found = await prisma.exercise.findFirst({
              where: { name: { contains: ex.exerciseName, mode: "insensitive" } },
            })
            exerciseId = found?.id
          }
          if (!exerciseId) return null
          return {
            exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || "10",
            restSeconds: ex.restSeconds || 60,
            loadKg: ex.loadKg || null,
            notes: ex.notes || null,
            order: ex.order ?? index,
            supersetGroup: ex.supersetGroup || null,
            suggestedMachine: ex.suggestedMachine || null,
          }
        })
      )

      const validExercises = resolvedExercises.filter(Boolean) as Array<{
        exerciseId: string; sets: number; reps: string; restSeconds: number;
        loadKg: number | null; notes: string | null; order: number;
        supersetGroup: string | null; suggestedMachine: string | null;
      }>

      // Delete old exercises and create new ones in a transaction
      await prisma.$transaction([
        prisma.workoutExercise.deleteMany({ where: { templateId: id } }),
        prisma.workoutTemplate.update({
          where: { id },
          data: {
            ...updateData,
            exercises: { create: validExercises },
          },
        }),
      ])
    } else {
      await prisma.workoutTemplate.update({
        where: { id },
        data: updateData,
      })
    }

    const workout = await prisma.workoutTemplate.findUnique({
      where: { id },
      include: {
        exercises: {
          include: { exercise: { select: { id: true, name: true, muscle: true } } },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("PATCH /api/admin/workouts/[id] error:", error)
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 })
  }
}

// DELETE /api/admin/workouts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const existing = await prisma.workoutTemplate.findFirst({
      where: { id, trainerId: trainer.id },
      include: { _count: { select: { sessions: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Warn if workout has active sessions
    if (existing._count.sessions > 0) {
      // Soft delete: just remove exercises and unlink from students
      await prisma.$transaction([
        prisma.workoutExercise.deleteMany({ where: { templateId: id } }),
        prisma.studentWorkoutPlan.deleteMany({ where: { templateId: id } }),
        prisma.workoutTemplate.delete({ where: { id } }),
      ])
    } else {
      await prisma.$transaction([
        prisma.workoutExercise.deleteMany({ where: { templateId: id } }),
        prisma.workoutTemplate.delete({ where: { id } }),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/workouts/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 })
  }
}
