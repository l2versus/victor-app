import { NextRequest, NextResponse } from "next/server"
import { handleOnefitMessage } from "@/lib/onefit-sales-bot"
import { sendOnefitMessage } from "@/lib/evolution-onefit"

// POST /api/webhooks/onefit-evolution — receive Evolution API webhooks for ONEFIT B2B
export async function POST(req: NextRequest) {
  try {
    // ─── Webhook secret validation ───
    const webhookSecret = process.env.ONEFIT_EVOLUTION_WEBHOOK_SECRET
    if (webhookSecret) {
      const apiKey = req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "")
      if (apiKey !== webhookSecret) {
        console.warn("[ONEFIT Evolution] Invalid webhook secret — rejecting")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await req.json()
    console.log("[ONEFIT Evolution] Webhook received:", JSON.stringify(body).slice(0, 300))

    // Normalizar evento (Evolution v2 usa formatos diferentes)
    const event = (body.event || "").replace(/\./g, "_").toUpperCase()
    console.log(`[ONEFIT Evolution] Event: ${event}`)

    // ─── CONNECTION UPDATE ───
    if (event === "CONNECTION_UPDATE") {
      const state = body.data?.state || body.state
      console.log(`[ONEFIT Evolution] Connection: ${state}`)
      return NextResponse.json({ received: true })
    }

    // ─── MESSAGES UPDATE (status: delivered, read) ───
    if (event === "MESSAGES_UPDATE") {
      return NextResponse.json({ received: true })
    }

    // ─── MESSAGES UPSERT (new incoming message) ───
    if (event !== "MESSAGES_UPSERT") {
      console.log(`[ONEFIT Evolution] Ignoring event: ${event}`)
      return NextResponse.json({ received: true })
    }

    // Extract message data
    const data = Array.isArray(body.data) ? body.data[0] : body.data
    if (!data) {
      console.log("[ONEFIT Evolution] No data in webhook body")
      return NextResponse.json({ received: true })
    }

    const msg = data.message || data
    const key = data.key || msg.key || {}
    const fromMe = key.fromMe === true

    // Ignorar mensagens enviadas por nos
    if (fromMe) {
      console.log("[ONEFIT Evolution] Ignoring own message")
      return NextResponse.json({ received: true })
    }

    // Extract phone and content
    const remoteJid = key.remoteJid || ""
    const phone = remoteJid
      .replace("@s.whatsapp.net", "")
      .replace("@g.us", "")

    // Ignorar grupos
    if (remoteJid.includes("@g.us")) {
      return NextResponse.json({ received: true })
    }

    const messageContent =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      data.message?.imageMessage?.caption ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      ""

    if (!messageContent || !phone) {
      console.log("[ONEFIT Evolution] No content or phone, raw keys:", JSON.stringify({ key, hasMsg: !!msg, dataKeys: Object.keys(data) }))
      return NextResponse.json({ received: true })
    }

    const pushName =
      data.pushName || msg.pushName || body.pushName || `WhatsApp ${phone.slice(-4)}`

    console.log(
      `[ONEFIT Evolution] 📩 Message from ${phone} (${pushName}): "${messageContent.slice(0, 80)}"`
    )

    // ─── Handle message with ONEFIT sales bot ───
    const reply = await handleOnefitMessage(phone, messageContent, pushName)
    console.log(`[ONEFIT Evolution] 🤖 Bot reply: "${reply.slice(0, 80)}..."`)

    // ─── Send reply via ONEFIT Evolution instance ───
    const sent = await sendOnefitMessage(phone, reply)
    if (!sent) {
      console.error(`[ONEFIT Evolution] ❌ Failed to send reply to ${phone}`)
    } else {
      console.log(`[ONEFIT Evolution] ✅ Reply sent to ${phone}`)
    }

    return NextResponse.json({ received: true, processed: true, sent })
  } catch (error) {
    console.error("[ONEFIT Evolution Webhook] ❌ Error:", error)
    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    )
  }
}

// GET — health check for testing webhook URL
export async function GET() {
  return NextResponse.json({
    status: "ok",
    handler: "onefit-evolution",
    timestamp: new Date().toISOString(),
  })
}
