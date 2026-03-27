import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { handleOnefitMessage } from "@/lib/onefit-sales-bot"
import { sendOnefitMessage, verifyOnefitWebhook } from "@/lib/zapi-onefit"

// POST /api/webhooks/onefit-zapi — webhooks Z-API para instância ONEFIT B2B
export async function POST(req: NextRequest) {
  try {
    // ─── Verificar Client-Token ───────────────────────────────
    if (!verifyOnefitWebhook(req)) {
      console.warn("[ONEFIT Z-API Webhook] Client-Token inválido — rejeitando")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Z-API envia vários tipos — só nos interessa "ReceivedCallback"
    const type: string = body.type || ""
    if (type !== "ReceivedCallback") {
      return NextResponse.json({ received: true })
    }

    if (body.fromMe === true) return NextResponse.json({ received: true })

    const phone: string = body.phone || ""
    const senderName: string = body.senderName || body.chatName || `WA ${phone.slice(-4)}`
    const messageContent: string = body.text?.message || body.image?.caption || ""

    // Ignorar grupos
    if (phone.includes("-") || !phone || !messageContent) {
      return NextResponse.json({ received: true })
    }

    console.log(`[ONEFIT Z-API] 📩 ${phone} (${senderName}): "${messageContent.slice(0, 80)}"`)

    // ─── Responde 200 imediatamente — processamento pesado no after() ───
    after(async () => {
      try {
        const reply = await handleOnefitMessage(phone, messageContent, senderName)
        console.log(`[ONEFIT Z-API] 🤖 Reply: "${reply.slice(0, 80)}"`)
        const sent = await sendOnefitMessage(phone, reply)
        console.log(`[ONEFIT Z-API] ${sent ? "✅ Sent" : "❌ Send failed"} → ${phone}`)
      } catch (err) {
        console.error("[ONEFIT Z-API] after() error:", err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[ONEFIT Z-API Webhook] ❌ Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    handler: "onefit-zapi",
    timestamp: new Date().toISOString(),
  })
}
