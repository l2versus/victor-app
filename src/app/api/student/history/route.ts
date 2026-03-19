import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { studentId: student.id, completedAt: { not: null } },
        include: {
          template: { select: { name: true, type: true } },
          sets: {
            include: { session: { select: { id: true } } },
          },
          _count: { select: { sets: true } },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null } },
      }),
    ])

    return NextResponse.json({
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
