import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// GET /api/student/schedule — list student's appointments
export async function GET(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const where: Record<string, unknown> = { studentId: student.id }
    if (start && end) {
      where.date = { gte: new Date(start), lte: new Date(end) }
    } else {
      // Default: from today onwards
      where.date = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }

    const slots = await prisma.scheduleSlot.findMany({
      where,
      include: {
        trainer: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { date: "asc" },
      take: 50,
    })

    return NextResponse.json({ slots })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH /api/student/schedule?id=xxx — student confirms/cancels appointment
export async function PATCH(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Verify this slot belongs to the student
    const slot = await prisma.scheduleSlot.findUnique({ where: { id } })
    if (!slot || slot.studentId !== student.id) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const { status: newStatus } = body

    // Student can only confirm or cancel
    if (!["CONFIRMED", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json({ error: "Ação não permitida" }, { status: 400 })
    }

    // Can only change from SCHEDULED status
    if (slot.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Agendamento já foi " + slot.status.toLowerCase() }, { status: 400 })
    }

    const updated = await prisma.scheduleSlot.update({
      where: { id },
      data: { status: newStatus },
      include: {
        trainer: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    // Notify trainer about student's response
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: slot.trainerId },
      select: { userId: true },
    })
    if (trainer) {
      const studentName = student.user.name
      const dateStr = new Date(slot.date).toLocaleDateString("pt-BR", {
        weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
      await prisma.notification.create({
        data: {
          userId: trainer.userId,
          type: newStatus === "CONFIRMED" ? "schedule_confirmed" : "schedule_cancelled",
          title: newStatus === "CONFIRMED" ? "Agendamento confirmado" : "Agendamento cancelado",
          body: newStatus === "CONFIRMED"
            ? `${studentName} confirmou o agendamento de ${dateStr}`
            : `${studentName} cancelou o agendamento de ${dateStr}`,
          metadata: { slotId: slot.id },
        },
      })
    }

    return NextResponse.json({ slot: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
