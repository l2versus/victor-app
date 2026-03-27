import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { processIncomingMessage } from "@/lib/whatsapp-processor"
import { verifyWebhook } from "@/lib/zapi"

// POST /api/webhooks/zapi — recebe webhooks Z-API (mensagens recebidas)
export async function POST(req: NextRequest) {
  try {
    if (!verifyWebhook(req)) {
      console.warn("[Z-API Webhook] Client-Token inválido — rejeitando")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    console.log("[Z-API Webhook] RAW BODY:", JSON.stringify(body).slice(0, 500))

    // Ignorar mensagens enviadas por nós
    if (body.fromMe === true) {
      return NextResponse.json({ received: true })
    }

    // Extrair telefone — Z-API manda "phone" ou "chatId"
    const phone: string = body.phone || body.chatId?.replace("@c.us", "") || ""

    // Extrair nome
    const senderName: string =
      body.senderName || body.chatName || body.sender?.pushName || `WhatsApp ${phone.slice(-4)}`

    // Extrair texto — Z-API pode enviar em diferentes campos
    const messageContent: string =
      body.text?.message ||
      body.body ||
      body.message?.text ||
      (typeof body.text === "string" ? body.text : "") ||
      (typeof body.caption === "string" ? body.caption : "") ||
      body.image?.caption ||
      ""

    // Ignorar grupos e mensagens vazias
    const isGroup = body.isGroup === true || phone.includes("-") || phone.includes("@g.us")
    if (isGroup || !phone || !messageContent) {
      console.log(`[Z-API] Ignorando: group=${isGroup}, phone=${phone}, msg=${!!messageContent}`)
      return NextResponse.json({ received: true })
    }

    console.log(`[Z-API] ${phone} (${senderName}): "${messageContent.slice(0, 80)}"`)

    // Responder 200 imediatamente, processar em background
    after(async () => {
      try {
        const result = await processIncomingMessage({
          phone,
          senderName,
          content: messageContent,
          provider: "zapi",
        })
        console.log(`[Z-API] Result:`, JSON.stringify(result))
      } catch (err) {
        console.error("[Z-API] Processing error:", err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Z-API Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({ status: "ok", handler: "zapi", timestamp: new Date().toISOString() })
}
