import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/crm/broadcasts — list master broadcasts (trainerId = null)
export async function GET() {
  try {
    await requireMaster()

    const broadcasts = await prisma.crmBroadcast.findMany({
      where: { trainerId: null, nutritionistId: null },
      include: { _count: { select: { recipients: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ broadcasts })
  } catch (error) {
    console.error("GET /api/master/crm/broadcasts error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/master/crm/broadcasts — create broadcast or count recipients
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()

    const { name, content, filters, action } = body

    // COUNT recipients (preview before send)
    if (action === "count") {
      const where = buildSaasLeadFilter(filters)
      const count = await prisma.saasLead.count({ where })
      return NextResponse.json({ count })
    }

    // CREATE broadcast
    if (!name || !content) {
      return NextResponse.json({ error: "Nome e conteudo sao obrigatorios" }, { status: 400 })
    }

    const broadcast = await prisma.crmBroadcast.create({
      data: {
        trainerId: null,
        nutritionistId: null,
        name,
        content,
        filters: filters || null,
        status: "DRAFT",
      },
    })

    return NextResponse.json({ broadcast }, { status: 201 })
  } catch (error) {
    console.error("POST /api/master/crm/broadcasts error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/master/crm/broadcasts?id=xxx — send broadcast
export async function PATCH(req: NextRequest) {
  try {
    await requireMaster()
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const broadcast = await prisma.crmBroadcast.findFirst({
      where: { id, trainerId: null },
    })
    if (!broadcast) return NextResponse.json({ error: "Broadcast nao encontrado" }, { status: 404 })

    const body = await req.json()

    // SEND broadcast
    if (body.action === "send") {
      if (broadcast.status !== "DRAFT") {
        return NextResponse.json({ error: "Broadcast ja foi enviado" }, { status: 400 })
      }

      const filters = (broadcast.filters || {}) as Record<string, unknown>
      const where = buildSaasLeadFilter(filters)
      const leads = await prisma.saasLead.findMany({
        where,
        select: { id: true, name: true, phone: true },
      })

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
            const msg = broadcast.content
              .replace(/\{\{nome\}\}/gi, lead.name.split(" ")[0])
              .replace(/\{\{nome_completo\}\}/gi, lead.name)

            const sent = await sendWhatsAppMessage(lead.phone, msg)
            if (sent) {
              sentCount++
            } else {
              failedCount++
            }
          } catch {
            failedCount++
          }
        } else {
          failedCount++
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

    // CANCEL broadcast
    if (body.action === "cancel") {
      await prisma.crmBroadcast.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
      return NextResponse.json({ success: true })
    }

    // UPDATE broadcast
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
    console.error("PATCH /api/master/crm/broadcasts error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/master/crm/broadcasts?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await requireMaster()
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const broadcast = await prisma.crmBroadcast.findFirst({
      where: { id, trainerId: null },
    })
    if (!broadcast) return NextResponse.json({ error: "Broadcast nao encontrado" }, { status: 404 })

    await prisma.crmBroadcast.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/master/crm/broadcasts error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// Helper: build SaasLead filter from broadcast filters
function buildSaasLeadFilter(filters: Record<string, unknown> | null) {
  const where: Record<string, unknown> = {
    status: { notIn: ["CONVERTED", "LOST"] },
    phone: { not: null },
  }

  if (filters) {
    if (Array.isArray(filters.temperatures) && filters.temperatures.length > 0) {
      where.temperature = { in: filters.temperatures }
    }
    if (typeof filters.minScore === "number" && filters.minScore > 0) {
      where.score = { gte: filters.minScore }
    }
  }

  return where
}
