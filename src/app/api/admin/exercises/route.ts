import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/exercises?muscle=&search=&page=1&limit=50
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)

    // Bulk lookup by IDs (for template library exercise resolution)
    const ids = searchParams.get("ids")
    if (ids) {
      const idList = ids.split(",").filter(Boolean)
      const exercises = await prisma.exercise.findMany({
        where: { id: { in: idList } },
        select: { id: true, name: true, muscle: true, equipment: true },
      })
      return NextResponse.json({ exercises })
    }

    const muscle = searchParams.get("muscle") || ""
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (muscle) {
      where.muscle = muscle
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ muscle: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.exercise.count({ where }),
    ])

    // Get distinct muscle groups for filter dropdown
    const muscleGroups = await prisma.exercise.findMany({
      select: { muscle: true },
      distinct: ["muscle"],
      orderBy: { muscle: "asc" },
    })

    const response = NextResponse.json({
      exercises,
      total,
      page,
      pages: Math.ceil(total / limit),
      muscles: muscleGroups.map((m) => m.muscle),
    })
    // Exercise library rarely changes — cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600")
    return response
  } catch (error) {
    console.error("GET /api/admin/exercises error:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

// POST /api/admin/exercises — create custom exercise
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, muscle, equipment, instructions, videoUrl } = body

    if (!name || !muscle || !equipment) {
      return NextResponse.json(
        { error: "Name, muscle group, and equipment are required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscle,
        equipment,
        instructions: instructions || null,
        videoUrl: videoUrl || null,
        isCustom: true,
      },
    })

    return NextResponse.json({ exercise }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/exercises error:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/exercises?id=xxx — update exercise media
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const body = await req.json()
    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        instructions: body.instructions ?? undefined,
        machine3dModel: body.machine3dModel ?? undefined,
        gifUrl: body.gifUrl ?? undefined,
        videoUrl: body.videoUrl ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
        machineBrand: body.machineBrand ?? undefined,
      },
    })

    return NextResponse.json({ exercise })
  } catch (error) {
    console.error("PATCH /api/admin/exercises error:", error)
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 })
  }
}
