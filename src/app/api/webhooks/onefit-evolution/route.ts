import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { handleOnefitMessage } from "@/lib/onefit-sales-bot"
import { sendOnefitMessage } from "@/lib/evolution-onefit"

// POST /api/webhooks/onefit-evolution — receive Evolution API webhooks for ONEFIT B2B
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Normalizar evento — Evolution v2 pode enviar "messages.upsert" ou "MESSAGES_UPSERT"
    const event = (body.event || "").replace(/\./g, "_").toUpperCase()

    // Ignorar eventos que não são mensagens novas
    if (event === "CONNECTION_UPDATE") {
      const state = body.data?.state || body.state
      console.log(`[ONEFIT Evolution] Connection: ${state}`)
      return NextResponse.json({ received: true })
    }
    if (event !== "MESSAGES_UPSERT") {
      return NextResponse.json({ received: true })
    }

    const data = Array.isArray(body.data) ? body.data[0] : body.data
    if (!data) return NextResponse.json({ received: true })

    const key = data.key || {}
    if (key.fromMe === true) return NextResponse.json({ received: true })

    const remoteJid = key.remoteJid || ""
    if (remoteJid.includes("@g.us")) return NextResponse.json({ received: true })

    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "")

    const msgObj = data.message || {}
    const messageContent =
      msgObj.conversation ||
      msgObj.extendedTextMessage?.text ||
      msgObj.imageMessage?.caption ||
      ""

    if (!messageContent || !phone) {
      console.log("[ONEFIT Evolution] No content or phone — keys:", Object.keys(msgObj).join(","))
      return NextResponse.json({ received: true })
    }

    const pushName = data.pushName || body.pushName || `WA ${phone.slice(-4)}`
    console.log(`[ONEFIT Evolution] 📩 ${phone} (${pushName}): "${messageContent.slice(0, 80)}"`)

    // ─── Responde 200 IMEDIATAMENTE para o webhook ───
    // O processamento pesado (IA + Evolution send) acontece DEPOIS da resposta
    after(async () => {
      try {
        const reply = await handleOnefitMessage(phone, messageContent, pushName)
        console.log(`[ONEFIT Evolution] 🤖 Reply: "${reply.slice(0, 80)}"`)
        const sent = await sendOnefitMessage(phone, reply)
        console.log(`[ONEFIT Evolution] ${sent ? "✅ Sent" : "❌ Send failed"} → ${phone}`)
      } catch (err) {
        console.error("[ONEFIT Evolution] after() error:", err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[ONEFIT Evolution Webhook] ❌ Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
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
