import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/webhooks/crm?token=xxx — incoming webhook (ManyChat, Zapier, etc.)
// This is a PUBLIC endpoint — no auth required, validated by token
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 401 })
  }

  try {
    const webhook = await prisma.crmWebhook.findUnique({
      where: { token },
    })

    if (!webhook || !webhook.active) {
      return NextResponse.json({ error: "Invalid or inactive webhook" }, { status: 403 })
    }

    const payload = await req.json()

    // Log the incoming webhook
    const log = await prisma.crmWebhookLog.create({
      data: {
        webhookId: webhook.id,
        payload,
        status: "processing",
      },
    })

    try {
      let result: { leadId?: string; action: string } = { action: webhook.action }

      if (webhook.action === "create_lead") {
        // ─── CREATE LEAD ───
        // Supports ManyChat, Zapier, Make, n8n, custom payloads
        // Field mapping: tries multiple common field names
        const name = payload.name || payload.full_name || payload.first_name
          || payload.nome || payload.lead_name
          || (payload.first_name && payload.last_name ? `${payload.first_name} ${payload.last_name}` : null)
          || "Lead via Webhook"

        const phone = payload.phone || payload.telefone || payload.whatsapp
          || payload.phone_number || payload.cel || payload.mobile || null

        const email = payload.email || payload.e_mail || payload.mail || null

        // Detect source from payload or webhook config
        const configObj = webhook.config as Record<string, string> | null
        const source = payload.source || configObj?.defaultSource || "MANYCHAT"

        const value = payload.value || payload.valor || payload.expected_value || null

        const notes = payload.notes || payload.message || payload.observacoes
          || payload.custom_fields
            ? `Webhook: ${JSON.stringify(payload.custom_fields || payload.notes || "")}`
            : null

        // Check for duplicate by phone
        let lead = null
        if (phone) {
          const { phoneSearchSuffix } = await import("@/lib/phone")
          const suffix = phoneSearchSuffix(phone)
          lead = suffix ? await prisma.lead.findFirst({
            where: {
              trainerId: webhook.trainerId,
              phone: { contains: suffix },
            },
          }) : null
        }

        if (!lead) {
          lead = await prisma.lead.create({
            data: {
              trainerId: webhook.trainerId,
              name,
              phone: phone ? (await import("@/lib/phone")).normalizePhone(phone) : null,
              email,
              source: ["WALK_IN", "REFERRAL", "INSTAGRAM", "WHATSAPP", "WEBSITE", "MANYCHAT", "FACEBOOK", "TIKTOK", "OTHER"]
                .includes(source) ? source : "OTHER",
              notes,
              value: value ? parseFloat(String(value)) : null,
            },
          })

          await prisma.crmActivity.create({
            data: {
              leadId: lead.id,
              action: "CREATED",
              details: `Lead criado via webhook "${webhook.name}"`,
            },
          })
        } else {
          // Update existing lead with new info
          await prisma.leadFollowUp.create({
            data: {
              leadId: lead.id,
              type: "NOTE",
              content: `Novo contato via ${webhook.name}: ${notes || "sem detalhes"}`,
            },
          })
          await prisma.lead.update({
            where: { id: lead.id },
            data: { lastContactAt: new Date() },
          })
        }

        result.leadId = lead.id

      } else if (webhook.action === "update_lead") {
        // ─── UPDATE LEAD ───
        const leadId = payload.lead_id || payload.leadId
        const phone = payload.phone || payload.telefone

        let lead = null
        if (leadId) {
          lead = await prisma.lead.findFirst({
            where: { id: leadId, trainerId: webhook.trainerId },
          })
        } else if (phone) {
          lead = await prisma.lead.findFirst({
            where: { trainerId: webhook.trainerId, phone: { contains: phone.replace(/\D/g, "") } },
          })
        }

        if (!lead) {
          await prisma.crmWebhookLog.update({
            where: { id: log.id },
            data: { status: "error", response: "Lead not found" },
          })
          return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const updateData: Record<string, unknown> = {}
        if (payload.status) updateData.status = payload.status
        if (payload.temperature) updateData.temperature = payload.temperature
        if (payload.notes) updateData.notes = payload.notes
        if (payload.tags) updateData.tags = payload.tags
        if (payload.value) updateData.value = parseFloat(String(payload.value))

        if (Object.keys(updateData).length > 0) {
          await prisma.lead.update({ where: { id: lead.id }, data: updateData })
        }

        result.leadId = lead.id

      } else {
        // ─── CUSTOM ACTION ───
        // Just log the payload for manual processing
        result.action = "custom_logged"
      }

      // Mark log as success
      await prisma.crmWebhookLog.update({
        where: { id: log.id },
        data: { status: "success", response: JSON.stringify(result) },
      })

      return NextResponse.json({ success: true, ...result })

    } catch (processError) {
      await prisma.crmWebhookLog.update({
        where: { id: log.id },
        data: { status: "error", response: String(processError) },
      })
      throw processError
    }

  } catch (error) {
    console.error("POST /api/webhooks/crm error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// GET /api/webhooks/crm?token=xxx — health check
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 401 })

  const webhook = await prisma.crmWebhook.findUnique({ where: { token } })
  if (!webhook) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

  return NextResponse.json({ status: "ok", name: webhook.name, action: webhook.action, active: webhook.active })
}
