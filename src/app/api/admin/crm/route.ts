import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm — list leads
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { trainerId: trainer.id }
    if (status) where.status = status

    const [leads, stats] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          followUps: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { followUps: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // Pipeline stats
      Promise.all([
        prisma.lead.count({ where: { trainerId: trainer.id, status: "NEW" } }),
        prisma.lead.count({ where: { trainerId: trainer.id, status: "CONTACTED" } }),
        prisma.lead.count({ where: { trainerId: trainer.id, status: "TRIAL" } }),
        prisma.lead.count({ where: { trainerId: trainer.id, status: "NEGOTIATING" } }),
        prisma.lead.count({ where: { trainerId: trainer.id, status: "CONVERTED" } }),
        prisma.lead.count({ where: { trainerId: trainer.id, status: "LOST" } }),
      ]),
    ])

    const pipeline = {
      NEW: stats[0], CONTACTED: stats[1], TRIAL: stats[2],
      NEGOTIATING: stats[3], CONVERTED: stats[4], LOST: stats[5],
      total: stats.reduce((a, b) => a + b, 0),
    }

    return NextResponse.json({ leads, pipeline })
  } catch (error) {
    console.error("GET /api/admin/crm error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm — create lead
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { name, phone, email, source, notes, value } = body
    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

    const lead = await prisma.lead.create({
      data: {
        trainerId: trainer.id,
        name,
        phone: phone || null,
        email: email || null,
        source: source || "OTHER",
        notes: notes || null,
        value: value ? parseFloat(value) : null,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm?id=xxx — update lead
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const body = await req.json()

    // Verify ownership
    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        source: body.source ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
        value: body.value !== undefined ? (body.value ? parseFloat(body.value) : null) : undefined,
      },
    })

    // If adding a follow-up
    if (body.followUp) {
      await prisma.leadFollowUp.create({
        data: {
          leadId: id,
          type: body.followUp.type || "NOTE",
          content: body.followUp.content,
          dueDate: body.followUp.dueDate ? new Date(body.followUp.dueDate) : null,
        },
      })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("PATCH /api/admin/crm error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/admin/crm?id=xxx — delete lead
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    await prisma.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/crm error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
