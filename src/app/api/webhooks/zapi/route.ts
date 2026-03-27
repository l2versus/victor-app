import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getStudentContextByPhone,
  generateBotResponse,
} from "@/lib/whatsapp-bot"
import { sendTextMessage, verifyWebhook } from "@/lib/zapi"

// POST /api/webhooks/zapi — recebe webhooks Z-API (mensagens recebidas)
export async function POST(req: NextRequest) {
  try {
    // ─── Verificar Client-Token ───────────────────────────────
    if (!verifyWebhook(req)) {
      console.warn("[Z-API Webhook] Client-Token inválido — rejeitando")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // DEBUG — log completo do payload pra entender o formato Z-API
    console.log("[Z-API Webhook] RAW BODY:", JSON.stringify(body).slice(0, 500))

    // Ignorar mensagens enviadas por nós
    if (body.fromMe === true) {
      return NextResponse.json({ received: true })
    }

    // Extrair telefone — Z-API manda "phone" ou "chatId"
    const phone: string = body.phone || body.chatId?.replace("@c.us", "") || ""

    // Extrair nome
    const senderName: string = body.senderName || body.chatName || body.sender?.pushName || `WhatsApp ${phone.slice(-4)}`

    // Extrair texto — Z-API pode enviar em diferentes campos
    const messageContent: string =
      body.text?.message ||       // formato padrão "Ao receber"
      body.body ||                // formato alternativo
      body.message?.text ||       // outro formato
      body.text ||                // se text for string direta
      (typeof body.caption === "string" ? body.caption : "") ||
      body.image?.caption ||
      ""

    // Ignorar grupos e mensagens vazias
    const isGroup = body.isGroup === true || phone.includes("-") || phone.includes("@g.us")
    if (isGroup || !phone || !messageContent) {
      console.log(`[Z-API] Ignorando: group=${isGroup}, phone=${phone}, msg=${!!messageContent}`)
      return NextResponse.json({ received: true })
    }

    console.log(`[Z-API] 📩 ${phone} (${senderName}): "${messageContent.slice(0, 80)}"`)

    // ─── Responder 200 imediatamente, processar em background ───
    after(async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      try {
        await processMessage(phone, senderName, messageContent)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.error("[Z-API] Processing timed out (8s)")
        } else {
          console.error("[Z-API] Processing error:", err)
        }
      } finally {
        clearTimeout(timeout)
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Z-API Webhook] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// ─── PROCESSAMENTO DA MENSAGEM (roda em background via after()) ─────

async function processMessage(phone: string, senderName: string, messageContent: string) {
  const studentData = await getStudentContextByPhone(phone)

  if (!studentData) {
    // ─── Número desconhecido → capturar como Lead no CRM ───
    const trainer = await prisma.trainerProfile.findFirst({
      select: { id: true, userId: true },
      orderBy: { createdAt: "asc" },
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
            name: senderName,
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
            details: "Lead capturado via Z-API (WhatsApp)",
          },
        })

        await prisma.notification.create({
          data: {
            userId: trainer.userId,
            type: "new_lead",
            title: "Novo lead via WhatsApp!",
            body: `${senderName} (${phone}) mandou mensagem. Adicionado ao CRM.`,
            metadata: { phone, message: messageContent.slice(0, 100) },
          },
        })
      } else {
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

    // ─── Bot de vendas IA pra leads ───
    const { phoneSearchSuffix: pss } = await import("@/lib/phone")
    const leadForContext = await prisma.lead.findFirst({
      where: { phone: { contains: pss(phone) } },
      include: {
        followUps: { orderBy: { createdAt: "desc" }, take: 6, select: { content: true, type: true } },
      },
    })

    const history = leadForContext?.followUps?.map((f: { content: string }) => `Lead: ${f.content}`).reverse() || []
    const { generateLeadResponse } = await import("@/lib/whatsapp-bot")
    let reply = await generateLeadResponse(messageContent, senderName, history)

    if (!reply) {
      reply =
        `Oi ${senderName.split(" ")[0]}! Sou o Victor Oliveira, personal trainer em Fortaleza 💪\n\n` +
        `Me conta: o que tu tá procurando?\n\n` +
        `1️⃣ Emagrecer\n2️⃣ Ganhar massa\n3️⃣ Condicionamento\n4️⃣ Preços\n5️⃣ Aula experimental grátis`
    }

    // Auto-classificar temperatura
    const msgLower = messageContent.toLowerCase()
    const isHotIntent =
      /pre[cç]o|valor|quanto|custa|plano|mensalidade|experiment|testar|aula.*grat|gratis|assinar|comprar|pagar/.test(
        msgLower
      )
    if (isHotIntent && leadForContext) {
      await prisma.lead.update({ where: { id: leadForContext.id }, data: { temperature: "HOT" } })
    }

    await sendTextMessage(phone, reply)

    const capturedLead = await prisma.lead.findFirst({
      where: { phone: { contains: pss(phone) } },
      select: { id: true },
    })
    if (capturedLead) {
      import("@/lib/lead-scoring")
        .then((m) => m.scoreAndNotify(capturedLead.id))
        .catch(() => {})
    }
    return
  }

  // ─── Aluno conhecido ─────────────────────────────────────
  const trainer = await prisma.trainerProfile.findFirst({
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  })

  await prisma.directMessage.create({
    data: {
      senderId: studentData.userId,
      receiverId: trainer?.userId || studentData.userId,
      content: messageContent,
      channel: "WHATSAPP",
    },
  })

  const botResponse = await generateBotResponse(messageContent, studentData.context)
  await sendTextMessage(phone, botResponse)

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
          channel: "whatsapp_zapi",
          botResponse: botResponse.slice(0, 200),
        }),
      },
    })
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({ status: "ok", handler: "zapi", timestamp: new Date().toISOString() })
}
