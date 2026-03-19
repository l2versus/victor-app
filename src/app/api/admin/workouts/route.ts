import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

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

    const workout = await prisma.workoutTemplate.create({
      data: {
        name,
        type,
        notes: notes || null,
        trainerId: trainer.id,
        exercises: {
          create: exercises.map((ex: {
            exerciseId: string
            sets: number
            reps: string
            restSeconds: number
            loadKg?: number
            notes?: string
            order: number
            supersetGroup?: string
          }, index: number) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || "10",
            restSeconds: ex.restSeconds || 60,
            loadKg: ex.loadKg || null,
            notes: ex.notes || null,
            order: ex.order ?? index,
            supersetGroup: ex.supersetGroup || null,
          })),
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
    console.error("POST /api/admin/workouts error:", error)
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 })
  }
}
