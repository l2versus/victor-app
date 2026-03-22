import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// POST /api/student/checkin — student checks in via QR code
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const body = await req.json().catch(() => ({}))
    const { token } = body

    // Validate QR token format: trainerId:date:checkin or "auto"
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "QR Code inválido" }, { status: 400 })
    }

    // "auto" token = student checks in with their own trainer
    if (token !== "auto") {
      const [trainerId] = token.split(":")
      if (!trainerId) {
        return NextResponse.json({ error: "QR Code inválido" }, { status: 400 })
      }

      // Verify trainer exists and student belongs to them
      if (student.trainerId !== trainerId) {
        return NextResponse.json({ error: "Você não pertence a esta academia" }, { status: 403 })
      }
    }

    // Check if already checked in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const existing = await prisma.checkIn.findFirst({
      where: {
        studentId: student.id,
        createdAt: { gte: todayStart },
      },
    })

    if (existing) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        checkIn: existing,
        message: "Você já fez check-in hoje!",
      })
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        studentId: student.id,
        trainerId: student.trainerId,
        method: "QR",
      },
    })

    return NextResponse.json({ checkIn, message: "Check-in realizado com sucesso!" }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// GET /api/student/checkin — student's check-in history
export async function GET() {
  try {
    const { student } = await requireStudent()

    const checkIns = await prisma.checkIn.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    // Check if checked in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const checkedInToday = checkIns.some(c => new Date(c.createdAt) >= todayStart)

    // Streak calculation
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 60; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)

      const hasCheckIn = checkIns.some(c => {
        const cd = new Date(c.createdAt)
        return cd >= dayStart && cd <= dayEnd
      })

      if (hasCheckIn) streak++
      else if (i > 0) break // Allow today to not have check-in yet
    }

    // This month count
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthCount = checkIns.filter(c => new Date(c.createdAt) >= monthStart).length

    return NextResponse.json({
      checkIns,
      checkedInToday,
      streak,
      thisMonthCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
