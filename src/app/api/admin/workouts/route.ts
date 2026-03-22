import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import type { ExerciseTechnique } from "@/generated/prisma/enums"

// GET /api/admin/workouts?search=&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { trainerId: trainer.id }
    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const [workouts, total] = await Promise.all([
      prisma.workoutTemplate.findMany({
        where,
        include: {
          exercises: {
            include: { exercise: { select: { name: true, muscle: true } } },
            orderBy: { order: "asc" },
          },
          _count: { select: { sessions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutTemplate.count({ where }),
    ])

    return NextResponse.json({
      workouts,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch workouts"
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("GET /api/admin/workouts error:", error)
    return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 })
  }
}

// POST /api/admin/workouts — create workout template with exercises
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const body = await req.json()
    const { name, type, notes, exercises } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 })
    }

    // Resolve exerciseName → exerciseId if needed (AI-generated workouts send names)
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
        technique?: string
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
          technique: (ex.technique || "NORMAL") as ExerciseTechnique,
        }
      })
    )

    const validExercises = resolvedExercises.filter(Boolean)
    if (validExercises.length === 0) {
      return NextResponse.json({ error: "No valid exercises found" }, { status: 400 })
    }

    const workout = await prisma.workoutTemplate.create({
      data: {
        name,
        type,
        notes: notes || null,
        trainerId: trainer.id,
        exercises: {
          create: validExercises as Array<{
            exerciseId: string; sets: number; reps: string; restSeconds: number;
            loadKg: number | null; notes: string | null; order: number; supersetGroup: string | null;
            suggestedMachine: string | null;
          }>,
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ workout }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workout"
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 })
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 })
    console.error("POST /api/admin/workouts error:", error)
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 })
  }
}
