import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/schedule?start=2026-03-01&end=2026-03-31
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const where: Record<string, unknown> = { trainerId: trainer.id }
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
    console.error("GET /api/admin/schedule error:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}

// POST /api/admin/schedule — create slot
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { studentId, title, date, duration, notes, recurring, color } = body

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        trainerId: trainer.id,
        studentId: studentId || null,
        title: title || null,
        date: new Date(date),
        duration: duration || 60,
        notes: notes || null,
        recurring: recurring || false,
        color: color || null,
      },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/schedule error:", error)
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
  }
}

// PATCH /api/admin/schedule?id=xxx — update slot
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

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
      },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    return NextResponse.json({ slot })
  } catch (error) {
    console.error("PATCH /api/admin/schedule error:", error)
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 })
  }
}

// DELETE /api/admin/schedule?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await prisma.scheduleSlot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/schedule error:", error)
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 })
  }
}
