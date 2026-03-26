import { NextRequest, NextResponse } from "next/server"
import { handleOnefitMessage } from "@/lib/onefit-sales-bot"
import { sendOnefitMessage } from "@/lib/evolution-onefit"

// POST /api/webhooks/onefit-evolution — receive Evolution API webhooks for ONEFIT B2B
export async function POST(req: NextRequest) {
  try {
    // TODO: Add webhook secret validation after initial setup is confirmed working

    const body = await req.json()

    // Normalizar evento (Evolution v2 usa formatos diferentes)
    const event = (body.event || "").replace(/\./g, "_").toUpperCase()

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
      return NextResponse.json({ received: true })
    }

    // Extract message data
    const data = Array.isArray(body.data) ? body.data[0] : body.data
    if (!data) return NextResponse.json({ received: true })

    const msg = data.message || data
    const key = data.key || msg.key || {}
    const fromMe = key.fromMe === true

    // Ignorar mensagens enviadas por nos
    if (fromMe) return NextResponse.json({ received: true })

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
      console.log("[ONEFIT Evolution] No content or phone, raw data:", JSON.stringify(body).slice(0, 500))
      return NextResponse.json({ received: true })
    }

    const pushName =
      data.pushName || msg.pushName || body.pushName || `WhatsApp ${phone.slice(-4)}`

    console.log(
      `[ONEFIT Evolution] Message from ${phone} (${pushName}): ${messageContent.slice(0, 50)}`
    )

    // ─── Handle message with ONEFIT sales bot ───
    const reply = await handleOnefitMessage(phone, messageContent, pushName)

    // ─── Send reply via ONEFIT Evolution instance ───
    await sendOnefitMessage(phone, reply)

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    console.error("[ONEFIT Evolution Webhook] Error:", error)
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    )
  }
}
