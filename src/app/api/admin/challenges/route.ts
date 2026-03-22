import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/challenges
export async function GET() {
  try {
    await requireAdmin()

    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { entries: true } },
        entries: {
          include: { student: { include: { user: { select: { name: true } } } } },
          orderBy: { value: "desc" },
          take: 10,
        },
      },
    })

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error("GET /api/admin/challenges error:", error)
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

// POST /api/admin/challenges
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()

    const { title, description, metric, targetValue, startDate, endDate } = body

    if (!title || !metric || !startDate || !endDate) {
      return NextResponse.json(
        { error: "title, metric, startDate, and endDate are required" },
        { status: 400 }
      )
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description: description || null,
        metric,
        targetValue: targetValue || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/challenges error:", error)
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}
