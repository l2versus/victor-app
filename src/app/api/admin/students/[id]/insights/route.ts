import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/students/{id}/insights
// Returns: workout preview (weekly plans + exercises) + load evolution data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const student = await prisma.student.findFirst({
      where: { id, trainerId: trainer.id },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // 1) Weekly plans with full exercise data (for preview + PDF)
    const plans = await prisma.studentWorkoutPlan.findMany({
      where: { studentId: id, active: true },
      include: {
        template: {
          include: {
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true, name: true, muscle: true, equipment: true,
                    instructions: true, imageUrl: true, gifUrl: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { dayOfWeek: "asc" },
    })

    const weekPlans = plans.map((p) => ({
      dayOfWeek: p.dayOfWeek,
      templateName: p.template.name,
      templateType: p.template.type,
      exercises: p.template.exercises.map((we) => ({
        id: we.exercise.id,
        name: we.exercise.name,
        muscle: we.exercise.muscle,
        equipment: we.exercise.equipment,
        instructions: we.exercise.instructions,
        imageUrl: we.exercise.imageUrl || we.exercise.gifUrl,
        sets: we.sets,
        reps: we.reps,
        restSeconds: we.restSeconds,
        loadKg: we.loadKg,
        notes: we.notes,
        technique: we.technique,
      })),
    }))

    // 2) Load evolution — last 30 sessions with sets
    const sessions = await prisma.workoutSession.findMany({
      where: { studentId: id, completedAt: { not: null } },
      orderBy: { startedAt: "asc" },
      take: 60,
      select: {
        id: true,
        startedAt: true,
        sets: {
          select: { exerciseId: true, loadKg: true, reps: true, setNumber: true },
        },
      },
    })

    // Group by exercise → track max load per session
    const exerciseMap = new Map<string, { name: string; history: { date: string; maxLoad: number; volume: number }[] }>()

    // Build name lookup from plans
    const nameMap = new Map<string, string>()
    for (const p of weekPlans) {
      for (const ex of p.exercises) {
        nameMap.set(ex.id, ex.name)
      }
    }

    for (const sess of sessions) {
      const dateStr = sess.startedAt.toISOString().split("T")[0]
      const exerciseSets = new Map<string, { maxLoad: number; volume: number }>()

      for (const set of sess.sets) {
        const current = exerciseSets.get(set.exerciseId) || { maxLoad: 0, volume: 0 }
        current.maxLoad = Math.max(current.maxLoad, set.loadKg)
        current.volume += set.loadKg * set.reps
        exerciseSets.set(set.exerciseId, current)
      }

      for (const [exId, data] of exerciseSets) {
        if (!exerciseMap.has(exId)) {
          exerciseMap.set(exId, { name: nameMap.get(exId) || exId, history: [] })
        }
        exerciseMap.get(exId)!.history.push({ date: dateStr, maxLoad: data.maxLoad, volume: data.volume })
      }
    }

    const evolution = Array.from(exerciseMap.entries()).map(([id, data]) => ({
      exerciseId: id,
      exerciseName: data.name,
      history: data.history,
    }))

    return NextResponse.json({ weekPlans, evolution })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
