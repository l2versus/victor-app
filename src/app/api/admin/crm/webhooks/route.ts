import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/webhooks — list webhooks + logs
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const showLogs = new URL(req.url).searchParams.get("logs") === "1"
    const webhookId = new URL(req.url).searchParams.get("webhookId")

    if (showLogs && webhookId) {
      const logs = await prisma.crmWebhookLog.findMany({
        where: { webhookId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      return NextResponse.json({ logs })
    }

    const webhooks = await prisma.crmWebhook.findMany({
      where: { trainerId: trainer.id },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("GET /api/admin/crm/webhooks error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/webhooks — create webhook
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { name, action, config } = body
    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

    const webhook = await prisma.crmWebhook.create({
      data: {
        trainerId: trainer.id,
        name,
        action: action || "create_lead",
        config: config || null,
      },
    })

    // Build the full webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const webhookUrl = `${baseUrl}/api/webhooks/crm?token=${webhook.token}`

    return NextResponse.json({ webhook, webhookUrl }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm/webhooks error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm/webhooks?id=xxx — toggle active / update
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmWebhook.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 })
    }

    const body = await req.json()

    const webhook = await prisma.crmWebhook.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        action: body.action ?? undefined,
        active: body.active ?? undefined,
        config: body.config ?? undefined,
      },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("PATCH /api/admin/crm/webhooks error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/admin/crm/webhooks?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmWebhook.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 })
    }

    await prisma.crmWebhook.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/crm/webhooks error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
