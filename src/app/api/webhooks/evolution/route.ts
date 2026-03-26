import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getStudentContextByPhone,
  generateBotResponse,
} from "@/lib/whatsapp-bot"
import { sendTextMessage, INSTANCE_NAME } from "@/lib/evolution-api"

// POST /api/webhooks/evolution — receive Evolution API webhooks
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Verify webhook secret to prevent unauthorized requests.
    // Evolution API sends the apikey header when configured with a webhook secret.
    const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (webhookSecret) {
      const apiKey = req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "")
      if (apiKey !== webhookSecret) {
        console.warn("[Evolution Webhook] Invalid or missing secret — rejecting")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[Evolution Webhook] EVOLUTION_WEBHOOK_SECRET not set in production — rejecting all requests")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
    }

    const body = await req.json()

    // Normalizar evento (Evolution v2 usa formatos diferentes)
    const event = (body.event || "").replace(/\./g, "_").toUpperCase()

    // ─── CONNECTION UPDATE ───
    if (event === "CONNECTION_UPDATE") {
      const state = body.data?.state || body.state
      console.log(`[Evolution] Connection: ${state}`)
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

    // Ignorar mensagens enviadas por nós
    if (fromMe) return NextResponse.json({ received: true })

    // Extract phone and content
    const remoteJid = key.remoteJid || ""
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "")

    // Ignorar grupos
    if (remoteJid.includes("@g.us")) return NextResponse.json({ received: true })

    const messageContent =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      ""

    if (!messageContent || !phone) {
      return NextResponse.json({ received: true })
    }

    const pushName = msg.pushName || data.pushName || `WhatsApp ${phone.slice(-4)}`

    console.log(`[Evolution] Message from ${phone} (${pushName}): ${messageContent.slice(0, 50)}...`)

    // ─── Find student by phone ───
    const studentData = await getStudentContextByPhone(phone)

    if (!studentData) {
      // Unknown number → auto-capture as Lead in CRM
      // findFirst sem where: OK pra single-trainer (Victor app). Multi-trainer precisaria de routing.
      const trainer = await prisma.trainerProfile.findFirst({
        select: { id: true, userId: true },
        orderBy: { createdAt: "asc" }, // pega o primeiro trainer cadastrado (owner)
      })
      if (trainer) {
        const { phoneSearchSuffix } = await import("@/lib/phone")
        const existingLead = await prisma.lead.findFirst({
          where: { trainerId: trainer.id, phone: { contains: phoneSearchSuffix(phone) } },
        })

        if (!existingLead) {
          const lead = await prisma.lead.create({
            data: {
              trainerId: trainer.id,
              name: pushName,
              phone,
              source: "WHATSAPP",
              status: "NEW",
              notes: `Primeira mensagem: "${messageContent.slice(0, 200)}"`,
            },
          })

          await prisma.crmActivity.create({
            data: {
              leadId: lead.id,
              action: "CREATED",
              details: `Lead capturado via Evolution API (WhatsApp)`,
            },
          })

          await prisma.notification.create({
            data: {
              userId: trainer.userId,
              type: "new_lead",
              title: "Novo lead via WhatsApp!",
              body: `${pushName} (${phone}) mandou mensagem. Adicionado ao CRM.`,
              metadata: { phone, message: messageContent.slice(0, 100) },
            },
          })
        } else {
          // Update existing lead
          await prisma.leadFollowUp.create({
            data: {
              leadId: existingLead.id,
              type: "WHATSAPP",
              content: messageContent.slice(0, 500),
            },
          })
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: { lastContactAt: new Date() },
          })
        }
      }

      // ─── Bot de vendas Groq (IA) pra leads ───
      const { phoneSearchSuffix: pss } = await import("@/lib/phone")
      const leadForContext = await prisma.lead.findFirst({
        where: { phone: { contains: pss(phone) } },
        include: { followUps: { orderBy: { createdAt: "desc" }, take: 6, select: { content: true, type: true } } },
      })

      const history = leadForContext?.followUps?.map((f: { content: string }) => `Lead: ${f.content}`).reverse() || []

      // Tentar resposta IA (Groq)
      const { generateLeadResponse } = await import("@/lib/whatsapp-bot")
      let reply = await generateLeadResponse(messageContent, pushName, history)

      // Fallback se Groq falhar: menu interativo
      if (!reply) {
        reply = `Oi ${pushName.split(" ")[0]}! Sou o Victor Oliveira, personal trainer em Fortaleza 💪\n\n` +
          `Me conta: o que tu tá procurando?\n\n` +
          `1️⃣ Emagrecer\n2️⃣ Ganhar massa\n3️⃣ Condicionamento\n4️⃣ Preços\n5️⃣ Aula experimental grátis`
      }

      // Auto-classificar temperatura pela intenção
      const msgLower = messageContent.toLowerCase()
      const isHotIntent = /pre[cç]o|valor|quanto|custa|plano|mensalidade|experiment|testar|aula.*grat|gratis|assinar|comprar|pagar/.test(msgLower)
      if (isHotIntent && leadForContext) {
        await prisma.lead.update({
          where: { id: leadForContext.id },
          data: { temperature: "HOT" },
        })
      }

      await sendTextMessage(INSTANCE_NAME, phone, reply)

      // Auto-score lead recém-criado/atualizado
      const capturedLead = await prisma.lead.findFirst({
        where: { phone: { contains: (await import("@/lib/phone")).phoneSearchSuffix(phone) } },
        select: { id: true },
      })
      if (capturedLead) import("@/lib/lead-scoring").then(m => m.scoreAndNotify(capturedLead.id)).catch(() => {})

      return NextResponse.json({ received: true, leadCaptured: true })
    }

    // ─── Get trainer (owner) ───
    const trainer = await prisma.trainerProfile.findFirst({
      select: { userId: true },
      orderBy: { createdAt: "asc" },
    })

    // ─── Save incoming message ───
    await prisma.directMessage.create({
      data: {
        senderId: studentData.userId,
        receiverId: trainer?.userId || studentData.userId,
        content: messageContent,
        channel: "WHATSAPP",
      },
    })

    // ─── Generate Claude response ───
    const botResponse = await generateBotResponse(messageContent, studentData.context)

    // ─── Send via Evolution API ───
    await sendTextMessage(INSTANCE_NAME, phone, botResponse)

    // ─── Save bot response ───
    if (trainer) {
      await prisma.directMessage.create({
        data: {
          senderId: trainer.userId,
          receiverId: studentData.userId,
          content: botResponse,
          channel: "WHATSAPP_BOT",
        },
      })

      await prisma.notification.create({
        data: {
          userId: trainer.userId,
          type: "NEW_MESSAGE",
          title: `💬 ${studentData.context.name} (WhatsApp)`,
          body: messageContent.slice(0, 100),
          sentVia: JSON.stringify(["app"]),
          metadata: JSON.stringify({
            studentId: studentData.studentId,
            channel: "whatsapp_evolution",
            botResponse: botResponse.slice(0, 200),
          }),
        },
      })
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    console.error("[Evolution Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
