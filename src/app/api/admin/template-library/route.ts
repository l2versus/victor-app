import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/template-library?goal=HYPERTROPHY&level=BEGINNER
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const goal = searchParams.get("goal")
    const level = searchParams.get("level")

    const where: Record<string, unknown> = { isPublic: true }
    if (goal) where.goal = goal
    if (level) where.level = level

    const templates = await prisma.workoutTemplateLibrary.findMany({
      where,
      orderBy: { usageCount: "desc" },
    })

    // Resolve exercise names so the client doesn't need a separate fetch
    const allExerciseIds = new Set<string>()
    for (const t of templates) {
      const exercises = Array.isArray(t.exercises) ? t.exercises as { exerciseId?: string }[] : []
      for (const ex of exercises) {
        if (ex.exerciseId) allExerciseIds.add(ex.exerciseId)
      }
    }

    let exerciseNamesMap: Record<string, string> = {}
    if (allExerciseIds.size > 0) {
      const dbExercises = await prisma.exercise.findMany({
        where: { id: { in: Array.from(allExerciseIds) } },
        select: { id: true, name: true },
      })
      exerciseNamesMap = Object.fromEntries(dbExercises.map(ex => [ex.id, ex.name]))
    }

    const enrichedTemplates = templates.map(t => ({
      ...t,
      exercises: Array.isArray(t.exercises)
        ? (t.exercises as { exerciseId?: string }[]).map(ex => ({
            ...ex,
            exerciseName: ex.exerciseId ? exerciseNamesMap[ex.exerciseId] || null : null,
          }))
        : t.exercises,
    }))

    return NextResponse.json({ templates: enrichedTemplates })
  } catch (error) {
    console.error("GET /api/admin/template-library error:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

// POST /api/admin/template-library/copy — copy template to trainer's workout templates
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { templateId } = body
    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 })
    }

    const libraryTemplate = await prisma.workoutTemplateLibrary.findUnique({
      where: { id: templateId },
    })

    if (!libraryTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const exercises = libraryTemplate.exercises as Array<{
      exerciseId: string
      sets: number
      reps: string
      restSeconds: number
      loadKg?: number
      notes?: string
      order: number
      technique?: string
    }>

    // Create the workout template
    const template = await prisma.workoutTemplate.create({
      data: {
        name: libraryTemplate.name,
        type: libraryTemplate.goal,
        trainerId: trainer.id,
        notes: libraryTemplate.description,
        exercises: {
          create: exercises.map((ex, idx) => ({
            exercise: { connect: { id: ex.exerciseId } },
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds || 60,
            loadKg: ex.loadKg || null,
            notes: ex.notes || null,
            order: ex.order ?? idx,
            technique: (ex.technique || "NORMAL") as "NORMAL" | "DROP_SET" | "REST_PAUSE" | "PYRAMID" | "REVERSE_PYRAMID" | "FST7" | "MYO_REPS",
          })),
        },
      },
      include: { exercises: true },
    })

    // Increment usage count
    await prisma.workoutTemplateLibrary.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/template-library error:", error)
    return NextResponse.json({ error: "Failed to copy template" }, { status: 500 })
  }
}
