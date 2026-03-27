/**
 * WhatsApp Message Processor — CENTRALIZADO
 *
 * Toda mensagem recebida (Z-API, Evolution, Meta Cloud API) passa por aqui.
 * Elimina duplicação entre webhooks e unifica a lógica de:
 * 1. Identificar aluno vs lead
 * 2. Rotear para o admin correto (personal, nutri, academia, master)
 * 3. Gerar resposta IA
 * 4. Enviar resposta via provedor ativo
 * 5. Salvar no CRM + notificar admin
 */

import { prisma } from "./prisma"
import { BRAND } from "./branding"
import { normalizePhone, phoneSearchSuffix } from "./phone"
import {
  getStudentContextByPhone,
  generateBotResponse,
  generateLeadResponse,
} from "./whatsapp-bot"

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type WhatsAppProvider = "zapi" | "evolution" | "meta"

export interface IncomingMessage {
  phone: string
  senderName: string
  content: string
  provider: WhatsAppProvider
  /** raw payload pra debug */
  rawPayload?: unknown
}

export interface ProcessResult {
  success: boolean
  flow: "student" | "lead_new" | "lead_existing" | "no_trainer"
  replySent: boolean
  error?: string
}

// ═══════════════════════════════════════════════════════════════
// ENVIAR MENSAGEM — tenta provedor ativo, com fallback
// ═══════════════════════════════════════════════════════════════

async function trySendZapi(phone: string, message: string): Promise<boolean> {
  if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) return false
  try {
    const { sendTextMessage } = await import("./zapi")
    const sent = await sendTextMessage(phone, message)
    if (sent) console.log(`[WA Processor] Reply sent via Z-API to ${phone}`)
    return sent
  } catch (err) {
    console.warn("[WA Processor] Z-API error:", err)
    return false
  }
}

async function trySendEvolution(phone: string, message: string): Promise<boolean> {
  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) return false
  try {
    const { sendTextMessage, INSTANCE_NAME } = await import("./evolution-api")
    const sent = await sendTextMessage(INSTANCE_NAME, phone, message)
    if (sent) console.log(`[WA Processor] Reply sent via Evolution to ${phone}`)
    return sent
  } catch (err) {
    console.warn("[WA Processor] Evolution error:", err)
    return false
  }
}

async function trySendMeta(phone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return false
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      }
    )
    if (res.ok) {
      console.log(`[WA Processor] Reply sent via Meta Cloud API to ${phone}`)
      return true
    }
    console.error("[WA Processor] Meta send failed:", await res.text())
    return false
  } catch (err) {
    console.error("[WA Processor] Meta error:", err)
    return false
  }
}

const PROVIDER_SENDERS: Record<WhatsAppProvider, (phone: string, msg: string) => Promise<boolean>> = {
  zapi: trySendZapi,
  evolution: trySendEvolution,
  meta: trySendMeta,
}

async function sendReply(phone: string, message: string, preferredProvider: WhatsAppProvider): Promise<boolean> {
  // Tenta o provedor que recebeu a mensagem primeiro, depois os outros como fallback
  const order: WhatsAppProvider[] = [
    preferredProvider,
    ...( ["zapi", "evolution", "meta"] as const ).filter(p => p !== preferredProvider),
  ]

  for (const provider of order) {
    const sent = await PROVIDER_SENDERS[provider](phone, message)
    if (sent) return true
    console.warn(`[WA Processor] ${provider} failed, trying next...`)
  }

  console.error(`[WA Processor] ALL providers failed for ${phone}`)
  return false
}

// ═══════════════════════════════════════════════════════════════
// ENCONTRAR O ADMIN CORRETO PARA UM NÚMERO
// ═══════════════════════════════════════════════════════════════

async function findTrainerForMessage(): Promise<{ id: string; userId: string } | null> {
  // Por enquanto single-tenant (Victor App)
  // TODO: Multi-tenant — rotear baseado no número do WhatsApp Business
  const trainer = await prisma.trainerProfile.findFirst({
    select: { id: true, userId: true },
    orderBy: { createdAt: "asc" },
  })
  return trainer
}

// ═══════════════════════════════════════════════════════════════
// PROCESSADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function processIncomingMessage(msg: IncomingMessage): Promise<ProcessResult> {
  const { phone, senderName, content, provider } = msg

  console.log(`[WA Processor] Processing from ${provider}: ${phone} (${senderName}): "${content.slice(0, 80)}"`)

  // ─── 1. Verificar se é aluno ───────────────────────────────
  const studentData = await getStudentContextByPhone(phone)

  if (studentData) {
    return processStudentMessage(phone, senderName, content, studentData, provider)
  }

  // ─── 2. Processar como Lead ────────────────────────────────
  return processLeadMessage(phone, senderName, content, provider)
}

// ═══════════════════════════════════════════════════════════════
// ALUNO CONHECIDO
// ═══════════════════════════════════════════════════════════════

async function processStudentMessage(
  phone: string,
  senderName: string,
  content: string,
  studentData: Awaited<ReturnType<typeof getStudentContextByPhone>> & {},
  provider: WhatsAppProvider
): Promise<ProcessResult> {
  const trainer = await findTrainerForMessage()

  // Salvar mensagem recebida
  await prisma.directMessage.create({
    data: {
      senderId: studentData.userId,
      receiverId: trainer?.userId || studentData.userId,
      content,
      channel: "WHATSAPP",
    },
  })

  // Gerar resposta IA
  console.log(`[WA Processor] Generating bot response for student ${studentData.context.name}...`)
  const botResponse = await generateBotResponse(content, studentData.context)
  console.log(`[WA Processor] Bot response: "${botResponse.slice(0, 80)}"`)

  // Enviar resposta
  const sent = await sendReply(phone, botResponse, provider)

  // Salvar resposta do bot + notificar trainer
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
        title: `${studentData.context.name} (WhatsApp)`,
        body: content.slice(0, 100),
        sentVia: ["app"],
        metadata: {
          studentId: studentData.studentId,
          channel: `whatsapp_${provider}`,
          botResponse: botResponse.slice(0, 200),
        },
      },
    })
  }

  return { success: true, flow: "student", replySent: sent }
}

// ═══════════════════════════════════════════════════════════════
// LEAD (NÚMERO DESCONHECIDO)
// ═══════════════════════════════════════════════════════════════

async function processLeadMessage(
  phone: string,
  senderName: string,
  content: string,
  provider: WhatsAppProvider
): Promise<ProcessResult> {
  const trainer = await findTrainerForMessage()
  if (!trainer) {
    console.warn("[WA Processor] No trainer found — cannot process lead")
    return { success: false, flow: "no_trainer", replySent: false, error: "No trainer found" }
  }

  const suffix = phoneSearchSuffix(phone)

  // ─── Criar ou atualizar lead ───────────────────────────────
  const existingLead = await prisma.lead.findFirst({
    where: { trainerId: trainer.id, phone: { contains: suffix } },
  })

  let leadId: string

  if (!existingLead) {
    const lead = await prisma.lead.create({
      data: {
        trainerId: trainer.id,
        name: senderName,
        phone: normalizePhone(phone),
        source: "WHATSAPP",
        status: "NEW",
        notes: `Primeira mensagem: "${content.slice(0, 200)}"`,
      },
    })
    leadId = lead.id

    await prisma.crmActivity.create({
      data: {
        leadId,
        action: "CREATED",
        details: `Lead capturado via ${provider.toUpperCase()} (WhatsApp)`,
      },
    })

    await prisma.notification.create({
      data: {
        userId: trainer.userId,
        type: "new_lead",
        title: "Novo lead via WhatsApp!",
        body: `${senderName} (${phone}) mandou mensagem. Adicionado ao CRM.`,
        metadata: { phone, message: content.slice(0, 100), provider },
      },
    })

    console.log(`[WA Processor] New lead created: ${senderName} (${phone})`)
  } else {
    leadId = existingLead.id

    await prisma.leadFollowUp.create({
      data: {
        leadId,
        type: "WHATSAPP",
        content: content.slice(0, 500),
      },
    })

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    })

    console.log(`[WA Processor] Existing lead updated: ${leadId}`)
  }

  // ─── Auto-classificar temperatura ──────────────────────────
  const msgLower = content.toLowerCase()
  const isHotIntent =
    /pre[cç]o|valor|quanto|custa|plano|mensalidade|experiment|testar|aula.*grat|gratis|assinar|comprar|pagar/.test(
      msgLower
    )
  if (isHotIntent) {
    await prisma.lead.update({ where: { id: leadId }, data: { temperature: "HOT" } })
  }

  // ─── Gerar resposta IA ─────────────────────────────────────
  const leadForContext = await prisma.lead.findFirst({
    where: { id: leadId },
    include: {
      followUps: { orderBy: { createdAt: "desc" }, take: 6, select: { content: true, type: true } },
    },
  })

  const history = leadForContext?.followUps
    ?.map((f: { content: string }) => `Lead: ${f.content}`)
    .reverse() || []

  console.log(`[WA Processor] Generating lead bot response...`)
  let reply = await generateLeadResponse(content, senderName, history)

  if (!reply) {
    reply =
      `Oi ${senderName.split(" ")[0]}! Sou o ${BRAND.trainerName}, personal trainer em ${BRAND.trainerCity} \n\n` +
      `Me conta: o que tu tá procurando?\n\n` +
      `1. Emagrecer\n2. Ganhar massa\n3. Condicionamento\n4. Preços\n5. Aula experimental grátis`
    console.log("[WA Processor] Groq failed, using fallback menu")
  }

  console.log(`[WA Processor] Lead reply: "${reply.slice(0, 80)}"`)

  // ─── Enviar resposta ───────────────────────────────────────
  const sent = await sendReply(phone, reply, provider)

  // ─── Lead scoring (fire-and-forget) ────────────────────────
  import("./lead-scoring")
    .then((m) => m.scoreAndNotify(leadId))
    .catch((err) => console.error("[WA Processor] Lead scoring failed:", err))

  return {
    success: true,
    flow: existingLead ? "lead_existing" : "lead_new",
    replySent: sent,
  }
}
