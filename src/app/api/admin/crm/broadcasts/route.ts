import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/broadcasts — list broadcasts
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const broadcasts = await prisma.crmBroadcast.findMany({
      where: { trainerId: trainer.id },
      include: { _count: { select: { recipients: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ broadcasts })
  } catch (error) {
    console.error("GET /api/admin/crm/broadcasts error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/broadcasts — create broadcast + count/send
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { name, content, filters, action } = body

    // ─── COUNT recipients (preview before send) ───
    if (action === "count") {
      const where = buildLeadFilter(trainer.id, filters)
      const count = await prisma.lead.count({ where })
      const leads = await prisma.lead.findMany({
        where,
        select: { id: true, name: true, phone: true, temperature: true },
        take: 10,
      })
      return NextResponse.json({ count, preview: leads })
    }

    // ─── CREATE broadcast ───
    if (!name || !content) {
      return NextResponse.json({ error: "Nome e conteúdo são obrigatórios" }, { status: 400 })
    }

    const broadcast = await prisma.crmBroadcast.create({
      data: {
        trainerId: trainer.id,
        name,
        content,
        filters: filters || null,
        status: "DRAFT",
      },
    })

    return NextResponse.json({ broadcast }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm/broadcasts error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm/broadcasts?id=xxx — send broadcast
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const broadcast = await prisma.crmBroadcast.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!broadcast) return NextResponse.json({ error: "Broadcast não encontrado" }, { status: 404 })

    const body = await req.json()

    // ─── SEND broadcast ───
    if (body.action === "send") {
      if (broadcast.status !== "DRAFT") {
        return NextResponse.json({ error: "Broadcast já foi enviado" }, { status: 400 })
      }

      const filters = (broadcast.filters || {}) as Record<string, unknown>
      const where = buildLeadFilter(trainer.id, filters)
      const leads = await prisma.lead.findMany({
        where,
        select: { id: true, name: true, phone: true },
      })

      // Create recipients
      await prisma.crmBroadcastRecipient.createMany({
        data: leads.map(l => ({
          broadcastId: id,
          leadId: l.id,
          status: "pending",
        })),
      })

      // Marcar como SENDING antes do loop
      await prisma.crmBroadcast.update({
        where: { id },
        data: { status: "SENDING" },
      })

      let sentCount = 0
      let failedCount = 0

      const { sendWhatsAppMessage } = await import("@/lib/whatsapp-bot")

      for (const lead of leads) {
        if (lead.phone) {
          try {
            // Substituir variáveis no conteúdo
            const msg = broadcast.content
              .replace(/\{\{nome\}\}/gi, lead.name.split(" ")[0])
              .replace(/\{\{nome_completo\}\}/gi, lead.name)

            const sent = await sendWhatsAppMessage(lead.phone, msg)
            if (sent) {
              sentCount++
              await prisma.crmBroadcastRecipient.updateMany({
                where: { broadcastId: id, leadId: lead.id },
                data: { status: "sent", sentAt: new Date() },
              })
            } else {
              failedCount++
              await prisma.crmBroadcastRecipient.updateMany({
                where: { broadcastId: id, leadId: lead.id },
                data: { status: "failed" },
              })
            }
          } catch {
            failedCount++
            await prisma.crmBroadcastRecipient.updateMany({
              where: { broadcastId: id, leadId: lead.id },
              data: { status: "failed" },
            })
          }
        } else {
          failedCount++
          await prisma.crmBroadcastRecipient.updateMany({
            where: { broadcastId: id, leadId: lead.id },
            data: { status: "failed" },
          })
        }
      }

      await prisma.crmBroadcast.update({
        where: { id },
        data: {
          status: failedCount === leads.length ? "FAILED" : "COMPLETED",
          sentCount,
          failedCount,
        },
      })

      return NextResponse.json({ sent: sentCount, failed: failedCount })
    }

    // ─── CANCEL broadcast ───
    if (body.action === "cancel") {
      await prisma.crmBroadcast.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
      return NextResponse.json({ success: true })
    }

    // ─── UPDATE broadcast ───
    await prisma.crmBroadcast.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        content: body.content ?? undefined,
        filters: body.filters ?? undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /api/admin/crm/broadcasts error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/admin/crm/broadcasts?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const broadcast = await prisma.crmBroadcast.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!broadcast) return NextResponse.json({ error: "Broadcast não encontrado" }, { status: 404 })

    await prisma.crmBroadcast.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/crm/broadcasts error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// Helper: build lead filter from broadcast filters
function buildLeadFilter(trainerId: string, filters: Record<string, unknown> | null) {
  const where: Record<string, unknown> = {
    trainerId,
    status: { notIn: ["CONVERTED", "LOST"] },
    phone: { not: null },
  }

  if (filters) {
    if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
      where.status = { in: filters.statuses }
    }
    if (Array.isArray(filters.temperatures) && filters.temperatures.length > 0) {
      where.temperature = { in: filters.temperatures }
    }
    if (Array.isArray(filters.tags) && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }
    if (typeof filters.minScore === "number" && filters.minScore > 0) {
      where.score = { gte: filters.minScore }
    }
  }

  return where
}
