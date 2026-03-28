import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { processIncomingMessage } from "@/lib/whatsapp-processor"
import { getBotConfig, verifyBotWebhook } from "@/lib/bot-config"

/**
 * POST /api/webhooks/zapi/[bot] — Webhook Z-API por bot
 *
 * Cada instância Z-API aponta pra sua URL:
 * - /api/webhooks/zapi/victor  → Bot do personal trainer
 * - /api/webhooks/zapi/nutri   → Bot do nutricionista
 * - /api/webhooks/zapi/b2b     → Bot do Emmanuel (vendas B2B)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bot: string }> }
) {
  const { bot: botSlug } = await params
  const bot = getBotConfig(botSlug)

  if (!bot) {
    console.warn(`[Webhook] Bot desconhecido: ${botSlug}`)
    return NextResponse.json({ error: "Unknown bot" }, { status: 404 })
  }

  try {
    if (!verifyBotWebhook(bot, req)) {
      console.warn(`[${bot.name}] Webhook token inválido — rejeitando`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    console.log(`[${bot.name}] RAW:`, JSON.stringify(body).slice(0, 500))

    // Ignorar mensagens enviadas por nós
    if (body.fromMe === true) {
      return NextResponse.json({ received: true })
    }

    // Extrair dados
    const phone: string = body.phone || body.chatId?.replace("@c.us", "") || ""
    const senderName: string =
      body.senderName || body.chatName || body.sender?.pushName || `WhatsApp ${phone.slice(-4)}`
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
      return NextResponse.json({ received: true })
    }

    console.log(`[${bot.name}] ${phone} (${senderName}): "${messageContent.slice(0, 80)}"`)

    // Processar em background
    after(async () => {
      try {
        const result = await processIncomingMessage({
          phone,
          senderName,
          content: messageContent,
          provider: "zapi",
          botType: bot.type,
        })
        console.log(`[${bot.name}] Result:`, JSON.stringify(result))
      } catch (err) {
        console.error(`[${bot.name}] Processing error:`, err)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`[${bot.name}] Webhook error:`, error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// GET — health check
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bot: string }> }
) {
  const { bot: botSlug } = await params
  const bot = getBotConfig(botSlug)

  if (!bot) {
    return NextResponse.json({ error: "Unknown bot" }, { status: 404 })
  }

  return NextResponse.json({
    status: "ok",
    bot: bot.type,
    name: bot.name,
    timestamp: new Date().toISOString(),
  })
}
