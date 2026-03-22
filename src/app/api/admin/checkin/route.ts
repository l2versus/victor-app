import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/checkin — list check-ins with filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    const studentId = searchParams.get("studentId")

    const where: Record<string, unknown> = { trainerId: trainer.id }

    if (dateStr) {
      const start = new Date(dateStr)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateStr)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lte: end }
    }

    if (studentId) {
      where.studentId = studentId
    }

    const [checkIns, todayCount, weekCount, monthCount] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        include: {
          student: {
            include: { user: { select: { name: true, avatar: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.checkIn.count({
        where: {
          trainerId: trainer.id,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.checkIn.count({
        where: {
          trainerId: trainer.id,
          createdAt: {
            gte: (() => {
              const d = new Date()
              d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
              d.setHours(0, 0, 0, 0)
              return d
            })(),
          },
        },
      }),
      prisma.checkIn.count({
        where: {
          trainerId: trainer.id,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    // Generate QR token for today
    const today = new Date().toISOString().split("T")[0]
    const qrToken = `${trainer.id}:${today}:checkin`

    return NextResponse.json({
      checkIns,
      stats: { today: todayCount, week: weekCount, month: monthCount },
      qrToken,
    })
  } catch (error) {
    console.error("GET /api/admin/checkin error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/checkin — manual check-in by admin
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const body = await req.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // Verify student belongs to trainer
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student || student.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        studentId,
        trainerId: trainer.id,
        method: "MANUAL",
      },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    return NextResponse.json({ checkIn }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/checkin error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
