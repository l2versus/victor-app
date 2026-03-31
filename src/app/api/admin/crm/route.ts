import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { executeFlowTrigger } from "@/lib/bot-flow-executor"

// GET /api/admin/crm — list leads with filters
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const temperature = searchParams.get("temperature")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { trainerId: trainer.id }
    if (status) where.status = status
    if (temperature) where.temperature = temperature
    if (tag) where.tags = { has: tag }
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ]

    const [leads, stats, tempStats] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          followUps: { orderBy: { createdAt: "desc" }, take: 5 },
          _count: { select: { followUps: true, activities: true, conversations: true } },
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
      // Temperature stats
      Promise.all([
        prisma.lead.count({ where: { trainerId: trainer.id, temperature: "HOT", status: { notIn: ["CONVERTED", "LOST"] } } }),
        prisma.lead.count({ where: { trainerId: trainer.id, temperature: "WARM", status: { notIn: ["CONVERTED", "LOST"] } } }),
        prisma.lead.count({ where: { trainerId: trainer.id, temperature: "COLD", status: { notIn: ["CONVERTED", "LOST"] } } }),
      ]),
    ])

    const pipeline = {
      NEW: stats[0], CONTACTED: stats[1], TRIAL: stats[2],
      NEGOTIATING: stats[3], CONVERTED: stats[4], LOST: stats[5],
      total: stats.reduce((a, b) => a + b, 0),
    }

    const temperatures = { HOT: tempStats[0], WARM: tempStats[1], COLD: tempStats[2] }

    return NextResponse.json({ leads, pipeline, temperatures })
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

    const { name, phone, email, source, notes, value, temperature, tags } = body
    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

    const lead = await prisma.lead.create({
      data: {
        trainerId: trainer.id,
        name,
        phone: phone || null,
        email: email || null,
        source: source || "OTHER",
        temperature: temperature || "COLD",
        notes: notes || null,
        value: value ? parseFloat(value) : null,
        tags: tags || [],
      },
    })

    // Log activity
    await prisma.crmActivity.create({
      data: { leadId: lead.id, action: "CREATED", details: `Lead criado via ${source || "manual"}` },
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

    // Track changes for activity log
    const changes: string[] = []
    if (body.status && body.status !== existing.status) changes.push(`Status: ${existing.status} → ${body.status}`)
    if (body.temperature && body.temperature !== existing.temperature) changes.push(`Temp: ${existing.temperature} → ${body.temperature}`)

    const updateData: Record<string, unknown> = {
      name: body.name ?? undefined,
      phone: body.phone ?? undefined,
      email: body.email ?? undefined,
      source: body.source ?? undefined,
      status: body.status ?? undefined,
      temperature: body.temperature ?? undefined,
      notes: body.notes ?? undefined,
      tags: body.tags ?? undefined,
      assignedTo: body.assignedTo ?? undefined,
      lostReason: body.lostReason ?? undefined,
      value: body.value !== undefined ? (body.value ? parseFloat(body.value) : null) : undefined,
    }

    // Track conversion
    if (body.status === "CONVERTED" && existing.status !== "CONVERTED") {
      updateData.convertedAt = new Date()
    }

    // Update lastContactAt on follow-up
    if (body.followUp) {
      updateData.lastContactAt = new Date()
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    })

    // Log activity
    if (changes.length > 0) {
      await prisma.crmActivity.create({
        data: { leadId: id, action: "STATUS_CHANGED", details: changes.join("; ") },
      })
    }

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
      await prisma.crmActivity.create({
        data: { leadId: id, action: "NOTE_ADDED", details: body.followUp.content.substring(0, 100) },
      })
    }

    // Auto re-score se status ou dados relevantes mudaram
    if (body.status || body.followUp || body.value) {
      import("@/lib/lead-scoring").then(m => m.scoreAndNotify(id)).catch(() => {})
    }

    // Fire flow trigger on status change (fire-and-forget)
    if (body.status && body.status !== existing.status) {
      const botType = existing.nutritionistId ? "nutri" : "victor"
      executeFlowTrigger("status_change", {
        leadId: id,
        botType,
        leadName: existing.name,
        phone: existing.phone || "",
        oldStatus: existing.status,
        newStatus: body.status,
      }).catch(console.error)
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
