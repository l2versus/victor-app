import { NextRequest, NextResponse } from "next/server"
import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"

// GET /api/nutri/schedule?start=2026-03-01&end=2026-03-31
export async function GET(req: NextRequest) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const where: Record<string, unknown> = { nutritionistId: nutri.id }
    if (start && end) {
      where.date = { gte: new Date(start), lte: new Date(end) }
    }

    const slots = await prisma.scheduleSlot.findMany({
      where,
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("GET /api/nutri/schedule error:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}

// POST /api/nutri/schedule — create slot
export async function POST(req: NextRequest) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)
    const body = await req.json()

    const { studentId, title, date, duration, notes, recurring, color, sessionType, paidOutside } = body

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        nutritionistId: nutri.id,
        studentId: studentId || null,
        title: title || null,
        date: new Date(date),
        duration: duration || 60,
        notes: notes || null,
        recurring: recurring || false,
        color: color || null,
        sessionType: sessionType || "PRESENCIAL",
        paidOutside: paidOutside || false,
      },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    // Notify student about new appointment
    if (studentId) {
      const studentRecord = await prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      })
      if (studentRecord) {
        const slotDate = new Date(date)
        const dateStr = slotDate.toLocaleDateString("pt-BR", {
          weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
        })
        const typeLabels: Record<string, string> = {
          PRESENCIAL: "Consulta Presencial",
          ONLINE: "Consulta Online",
          CONSULTORIA: "Retorno",
        }
        const typeLabel = typeLabels[sessionType] || "Consulta Nutricional"
        await prisma.notification.create({
          data: {
            userId: studentRecord.userId,
            type: "schedule_new",
            title: "Nova consulta agendada",
            body: `Você tem uma nova consulta: ${title || typeLabel} em ${dateStr}. Confirme na sua agenda!`,
            metadata: { slotId: slot.id },
          },
        })
      }
    }

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error("POST /api/nutri/schedule error:", error)
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
  }
}

// PATCH /api/nutri/schedule?id=xxx — update slot
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Verify slot belongs to this nutritionist
    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id },
      select: { nutritionistId: true, studentId: true, date: true, title: true, status: true },
    })

    if (!existingSlot || existingSlot.nutritionistId !== nutri.id) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    }

    const body = await req.json()

    const slot = await prisma.scheduleSlot.update({
      where: { id },
      data: {
        studentId: body.studentId ?? undefined,
        title: body.title ?? undefined,
        date: body.date ? new Date(body.date) : undefined,
        duration: body.duration ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
        color: body.color ?? undefined,
        sessionType: body.sessionType ?? undefined,
        paidOutside: body.paidOutside ?? undefined,
      },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    // Notify student about status change
    if (body.status && existingSlot.studentId && body.status !== existingSlot.status) {
      const studentRecord = await prisma.student.findUnique({
        where: { id: existingSlot.studentId },
        select: { userId: true },
      })
      if (studentRecord) {
        const dateStr = new Date(existingSlot.date).toLocaleDateString("pt-BR", {
          weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
        })
        const statusMessages: Record<string, { title: string; body: string }> = {
          CONFIRMED: { title: "Consulta confirmada", body: `Sua consulta de ${dateStr} foi confirmada pela nutricionista!` },
          CANCELLED: { title: "Consulta cancelada", body: `Sua consulta de ${dateStr} foi cancelada.` },
          COMPLETED: { title: "Consulta concluida", body: `Sua consulta de ${dateStr} foi marcada como concluida.` },
          NO_SHOW: { title: "Falta registrada", body: `Voce nao compareceu a consulta de ${dateStr}.` },
        }
        const msg = statusMessages[body.status]
        if (msg) {
          await prisma.notification.create({
            data: {
              userId: studentRecord.userId,
              type: `schedule_${body.status.toLowerCase()}`,
              title: msg.title,
              body: msg.body,
              metadata: { slotId: id },
            },
          })
        }
      }
    }

    return NextResponse.json({ slot })
  } catch (error) {
    console.error("PATCH /api/nutri/schedule error:", error)
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 })
  }
}

// DELETE /api/nutri/schedule?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Verify slot belongs to this nutritionist
    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id },
      select: { nutritionistId: true },
    })

    if (!existingSlot || existingSlot.nutritionistId !== nutri.id) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    }

    await prisma.scheduleSlot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/nutri/schedule error:", error)
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 })
  }
}
