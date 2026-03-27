import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { processIncomingMessage } from "@/lib/whatsapp-processor"
import { sendWhatsAppMessage } from "@/lib/whatsapp-bot"

// GET — WhatsApp webhook verification (Meta requires this)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp] Webhook verified")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// POST — Receive incoming WhatsApp messages (Meta Cloud API)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value?.messages?.[0]) {
      return NextResponse.json({ received: true })
    }

    const message = value.messages[0]
    const from = message.from
    const messageText = message.text?.body || ""
    const messageType = message.type

    // Non-text: acknowledge but don't process
    if (messageType !== "text" || !messageText) {
      after(async () => {
        try {
          await sendWhatsAppMessage(from, "Recebi! Por enquanto só consigo ler mensagens de texto pelo app. Me manda por escrito?")
        } catch (err) {
          console.error("[WhatsApp Meta] Failed to send non-text reply:", err)
        }
      })
      return NextResponse.json({ received: true })
    }

    const contactName = value?.contacts?.[0]?.profile?.name || `WhatsApp ${from.slice(-4)}`

    console.log(`[WhatsApp Meta] ${from} (${contactName}): ${messageText.slice(0, 80)}`)

    // Processar em background
    after(async () => {
      try {
        const result = await processIncomingMessage({
          phone: from,
          senderName: contactName,
          content: messageText,
          provider: "meta",
        })
        console.log(`[WhatsApp Meta] Result:`, JSON.stringify(result))
      } catch (err) {
        console.error("[WhatsApp Meta] Processing error:", err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[WhatsApp Meta Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
