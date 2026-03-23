import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getStudentContextByPhone,
  generateBotResponse,
  sendWhatsAppMessage,
} from "@/lib/whatsapp-bot"

// ═══════════════════════════════════════════════════════════════
// GET — WhatsApp webhook verification (Meta requires this)
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// POST — Receive incoming WhatsApp messages
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extract message data from WhatsApp Cloud API format
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Only process incoming messages (not status updates)
    if (!value?.messages?.[0]) {
      return NextResponse.json({ received: true })
    }

    const message = value.messages[0]
    const from = message.from // phone number (e.g., "5585996985823")
    const messageText = message.text?.body || ""
    const messageType = message.type // text, image, audio, etc.
    const messageId = message.id
    const timestamp = message.timestamp

    // Only handle text messages for now
    if (messageType !== "text" || !messageText) {
      // For non-text: acknowledge but don't process
      await sendWhatsAppMessage(from, "Recebi! Por enquanto só consigo ler mensagens de texto pelo app. Me manda por escrito? 📝")
      return NextResponse.json({ received: true })
    }

    console.log(`[WhatsApp] Message from ${from}: ${messageText.slice(0, 50)}...`)

    // ─── Find student by phone ───────────────────────────────
    const studentData = await getStudentContextByPhone(from)

    if (!studentData) {
      // Unknown number → auto-capture as Lead in CRM
      const trainer = await prisma.trainerProfile.findFirst({ select: { id: true, userId: true } })
      if (trainer) {
        // Check if lead already exists with this phone
        const existingLead = await prisma.lead.findFirst({
          where: { trainerId: trainer.id, phone: { contains: from.slice(-8) } },
        })

        if (!existingLead) {
          // Extract name from WhatsApp profile if available
          const contactName = value?.contacts?.[0]?.profile?.name || `WhatsApp ${from.slice(-4)}`

          await prisma.lead.create({
            data: {
              trainerId: trainer.id,
              name: contactName,
              phone: from,
              source: "WHATSAPP",
              status: "NEW",
              notes: `Primeira mensagem: "${messageText.slice(0, 200)}"`,
            },
          })

          // Notify admin about new lead
          await prisma.notification.create({
            data: {
              userId: trainer.userId,
              type: "new_lead",
              title: "Novo lead via WhatsApp!",
              body: `${contactName} (${from}) mandou mensagem. Adicionado ao CRM automaticamente.`,
              metadata: { phone: from, message: messageText.slice(0, 100) },
            },
          })
        }
      }

      await sendWhatsAppMessage(from,
        "Oi! Sou o Victor Oliveira, personal trainer. " +
        "Vi que ainda não é meu aluno — vou te responder em breve! " +
        "Se quiser conhecer meu trabalho: " +
        `${process.env.NEXT_PUBLIC_APP_URL || "victorapp.com.br"}/site 💪`
      )
      return NextResponse.json({ received: true, leadCaptured: true })
    }

    // ─── Get trainer user ID ─────────────────────────────────
    const trainer = await prisma.trainerProfile.findFirst({
      select: { userId: true },
    })

    // ─── Save incoming message to DirectMessage ──────────────
    await prisma.directMessage.create({
      data: {
        senderId: studentData.userId,
        receiverId: trainer?.userId || studentData.userId,
        content: messageText,
        channel: "WHATSAPP",
      },
    })

    // ─── Generate Claude response ────────────────────────────
    const botResponse = await generateBotResponse(messageText, studentData.context)

    // ─── Send response via WhatsApp ──────────────────────────
    await sendWhatsAppMessage(from, botResponse)

    // ─── Save bot response to DirectMessage ──────────────────
    if (trainer) {
      await prisma.directMessage.create({
        data: {
          senderId: trainer.userId,
          receiverId: studentData.userId,
          content: botResponse,
          channel: "WHATSAPP_BOT",
        },
      })
    }

    // ─── Notify Victor in-app ────────────────────────────────
    if (trainer) {
      await prisma.notification.create({
        data: {
          userId: trainer.userId,
          type: "NEW_MESSAGE",
          title: `💬 ${studentData.context.name} (WhatsApp)`,
          body: messageText.slice(0, 100),
          sentVia: JSON.stringify(["app"]),
          metadata: JSON.stringify({
            studentId: studentData.studentId,
            channel: "whatsapp",
            botResponse: botResponse.slice(0, 200),
          }),
        },
      })
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
