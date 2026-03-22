import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/student/extra-activities?month=2026-03
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const month = new URL(req.url).searchParams.get("month")

    const where: Record<string, unknown> = { studentId: student.id }
    if (month) {
      const [year, m] = month.split("-").map(Number)
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      }
    }

    const activities = await prisma.extraActivity.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("GET /api/student/extra-activities error:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

// POST /api/student/extra-activities
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const body = await req.json()
    const { type, name, durationMin, caloriesBurned, distance, heartRateAvg, notes, date } = body

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 })
    }

    const activity = await prisma.extraActivity.create({
      data: {
        studentId: student.id,
        type,
        name,
        durationMin: durationMin ? Number(durationMin) : null,
        caloriesBurned: caloriesBurned ? Number(caloriesBurned) : null,
        distance: distance ? Number(distance) : null,
        heartRateAvg: heartRateAvg ? Number(heartRateAvg) : null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error("POST /api/student/extra-activities error:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}

// DELETE /api/student/extra-activities?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const activity = await prisma.extraActivity.findUnique({ where: { id } })
    if (!activity || activity.studentId !== student.id) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    await prisma.extraActivity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/student/extra-activities error:", error)
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 })
  }
}
