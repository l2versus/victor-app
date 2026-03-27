import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { processIncomingMessage } from "@/lib/whatsapp-processor"

// POST /api/webhooks/evolution — receive Evolution API webhooks
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (webhookSecret) {
      const apiKey = req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "")
      if (apiKey !== webhookSecret) {
        console.warn("[Evolution Webhook] Invalid or missing secret — rejecting")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await req.json()

    const event = (body.event || "").replace(/\./g, "_").toUpperCase()

    // Only process new messages
    if (event === "CONNECTION_UPDATE") {
      console.log(`[Evolution] Connection: ${body.data?.state || body.state}`)
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
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "")

    // Ignorar grupos
    if (remoteJid.includes("@g.us")) return NextResponse.json({ received: true })

    const msgObj = data.message || {}
    const messageContent =
      msgObj.conversation ||
      msgObj.extendedTextMessage?.text ||
      msgObj.imageMessage?.caption ||
      ""

    if (!messageContent || !phone) {
      return NextResponse.json({ received: true })
    }

    const pushName = data.pushName || `WhatsApp ${phone.slice(-4)}`

    console.log(`[Evolution] ${phone} (${pushName}): ${messageContent.slice(0, 80)}`)

    // Processar em background (antes era síncrono, causava timeout)
    after(async () => {
      try {
        const result = await processIncomingMessage({
          phone,
          senderName: pushName,
          content: messageContent,
          provider: "evolution",
        })
        console.log(`[Evolution] Result:`, JSON.stringify(result))
      } catch (err) {
        console.error("[Evolution] Processing error:", err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Evolution Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
