/**
 * WhatsApp Message Processor — MULTI-BOT
 *
 * Toda mensagem recebida passa por aqui, roteada pelo botType.
 *
 * Bots:
 * - victor: Personal trainer → CRM trainer (Lead) + responde alunos
 * - nutri:  Nutricionista     → CRM nutri (Lead com nutritionistId)
 * - b2b:    Emmanuel          → CRM SaaS (SaasLead) — vende o produto
 *
 * Fluxo:
 * 1. Webhook /api/webhooks/zapi/[bot] identifica o bot
 * 2. Processor roteia: aluno vs lead → CRM correto
 * 3. Bot gera resposta IA com a persona correta
 * 4. Envia via Z-API da instância do bot
 * 5. Salva no CRM + notifica o dono
 */

import { prisma } from "./prisma"
import { BRAND } from "./branding"
import { normalizePhone, phoneSearchSuffix } from "./phone"
import {
  getStudentContextByPhone,
  generateBotResponse,
  generateLeadResponse,
} from "./whatsapp-bot"
import type { BotType, BotConfig } from "./bot-config"
import { BOT_CONFIGS, sendBotMessage } from "./bot-config"
import { isBotPaused } from "./platform-settings"

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════��════════════════════════

export type WhatsAppProvider = "zapi" | "evolution" | "meta"

export interface IncomingMessage {
  phone: string
  senderName: string
  content: string
  provider: WhatsAppProvider
  /** Qual bot recebeu essa mensagem */
  botType?: BotType
  /** raw payload pra debug */
  rawPayload?: unknown
}

export interface ProcessResult {
  success: boolean
  flow: "student" | "lead_new" | "lead_existing" | "saas_lead_new" | "saas_lead_existing" | "no_owner"
  replySent: boolean
  error?: string
}

// ════════════════���══════════════��═══════════════════════════════
// ENVIAR MENSAGEM — usa Z-API do bot específico ou fallback legado
// ══════════════��══════════════════��═════════════════════════════

async function sendReply(
  phone: string,
  message: string,
  provider: WhatsAppProvider,
  bot?: BotConfig
): Promise<boolean> {
  // Se tem bot config, usa a Z-API dele diretamente
  if (bot) {
    const sent = await sendBotMessage(bot, phone, message)
    if (sent) return true
    console.warn(`[${bot.name}] Send failed, trying legacy fallback...`)
  }

  // Fallback legado (env vars globais)
  return legacySendReply(phone, message, provider)
}

async function legacySendReply(phone: string, message: string, provider: WhatsAppProvider): Promise<boolean> {
  // Z-API global
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) {
    try {
      const { sendTextMessage } = await import("./zapi")
      if (await sendTextMessage(phone, message)) return true
    } catch {}
  }
  // Meta
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (token && phoneNumberId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phone,
            type: "text",
            text: { body: message },
          }),
        }
      )
      if (res.ok) return true
    } catch {}
  }

  console.error(`[WA Processor] ALL providers failed for ${phone}`)
  return false
}

// ══════════════���════════════════════════════════���═══════════════
// ENCONTRAR O DONO DO BOT
// ══��═════════════════════��══════════════════════════════════════

async function findOwnerForBot(botType: BotType): Promise<{ id: string; oderId: string; role: string } | null> {
  if (botType === "nutri") {
    const nutri = await prisma.nutritionistProfile.findFirst({
      select: { id: true, userId: true },
      orderBy: { createdAt: "asc" },
    })
    return nutri ? { id: nutri.id, oderId: nutri.userId, role: "NUTRITIONIST" } : null
  }

  if (botType === "b2b") {
    // Master admin (Emmanuel)
    const master = await prisma.user.findFirst({
      where: { role: "MASTER" },
      select: { id: true },
    })
    return master ? { id: master.id, oderId: master.id, role: "MASTER" } : null
  }

  // victor (personal trainer)
  const trainer = await prisma.trainerProfile.findFirst({
    select: { id: true, userId: true },
    orderBy: { createdAt: "asc" },
  })
  return trainer ? { id: trainer.id, oderId: trainer.userId, role: "ADMIN" } : null
}

// ═══════════��═══════════════════��═══════════════════════════════
// LIMITE DE RESPOSTAS AUTOMÁTICAS
// ═══════════════════════════���═══════════════════════════════════

async function countLeadBotReplies(leadId: string, isSaas: boolean): Promise<number> {
  if (isSaas) {
    return prisma.saasLeadFollowUp.count({
      where: { leadId, type: "BOT" },
    })
  }
  return prisma.leadFollowUp.count({
    where: { leadId, type: "BOT" },
  })
}

// ════════════════���═══════════════════════════��══════════════════
// PROCESSADOR PRINCIPAL
// ═══════════════════════════════���═══════════════════════════════

export async function processIncomingMessage(msg: IncomingMessage): Promise<ProcessResult> {
  const { phone, senderName, content, provider, botType = "victor" } = msg
  const bot = BOT_CONFIGS[botType]

  console.log(`[${bot.name}] Processing: ${phone} (${senderName}): "${content.slice(0, 80)}"`)

  // Verificar se o bot está pausado pelo master admin
  const paused = await isBotPaused(botType)
  if (paused) {
    console.log(`[${bot.name}] Bot PAUSADO pelo master admin — mensagem salva mas sem resposta automática`)
    // Salvar a mensagem no CRM mas não responder
    if (botType === "b2b") {
      await saveB2bMessageOnly(phone, senderName, content)
      return { success: true, flow: "saas_lead_existing", replySent: false }
    }
    return { success: true, flow: "lead_existing", replySent: false }
  }

  // B2B bot — SEMPRE vai pro CRM SaaS, nunca verifica aluno
  if (botType === "b2b") {
    return processB2bLeadMessage(phone, senderName, content, provider, bot)
  }

  // Victor / Nutri — verifica se é aluno primeiro
  const studentData = await getStudentContextByPhone(phone)

  if (studentData) {
    return processStudentMessage(phone, senderName, content, studentData, provider, bot)
  }

  // Não é aluno → lead
  return processLeadMessage(phone, senderName, content, provider, bot)
}

// ═════════════���═════════════════════════════════════════════════
// ALUNO CONHECIDO (Victor / Nutri)
// ═══════════════════��═══════════════════════════════════════════

async function processStudentMessage(
  phone: string,
  senderName: string,
  content: string,
  studentData: Awaited<ReturnType<typeof getStudentContextByPhone>> & {},
  provider: WhatsAppProvider,
  bot: BotConfig
): Promise<ProcessResult> {
  const owner = await findOwnerForBot(bot.type)

  // Salvar mensagem recebida
  await prisma.directMessage.create({
    data: {
      senderId: studentData.userId,
      receiverId: owner?.oderId || studentData.userId,
      content,
      channel: "WHATSAPP",
    },
  })

  // Gerar resposta IA (aluno sempre recebe resposta automática)
  console.log(`[${bot.name}] Generating response for student ${studentData.context.name}...`)
  const botResponse = await generateBotResponse(content, studentData.context, bot.type)
  console.log(`[${bot.name}] Response: "${botResponse.slice(0, 80)}"`)

  // Enviar resposta
  const sent = await sendReply(phone, botResponse, provider, bot)

  // Salvar resposta + notificar dono
  if (owner) {
    await prisma.directMessage.create({
      data: {
        senderId: owner.oderId,
        receiverId: studentData.userId,
        content: botResponse,
        channel: "WHATSAPP_BOT",
      },
    })

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "NEW_MESSAGE",
        title: `${studentData.context.name} (WhatsApp)`,
        body: content.slice(0, 100),
        sentVia: ["app"],
        metadata: {
          studentId: studentData.studentId,
          channel: `whatsapp_${provider}`,
          bot: bot.type,
          botResponse: botResponse.slice(0, 200),
        },
      },
    })
  }

  return { success: true, flow: "student", replySent: sent }
}

// ═══════════════════════════════════════════════════════════════
// LEAD — Victor ou Nutri (usa model Lead)
// ══════════���═════════════════════════���══════════════════════════

async function processLeadMessage(
  phone: string,
  senderName: string,
  content: string,
  provider: WhatsAppProvider,
  bot: BotConfig
): Promise<ProcessResult> {
  const owner = await findOwnerForBot(bot.type)
  if (!owner) {
    console.warn(`[${bot.name}] No owner found — cannot process lead`)
    return { success: false, flow: "no_owner", replySent: false, error: `No ${bot.role} found` }
  }

  const suffix = phoneSearchSuffix(phone)

  // Buscar lead existente — filtra por trainer ou nutritionist conforme o bot
  const whereClause = bot.crmTarget === "nutritionist"
    ? { nutritionistId: owner.id, phone: { contains: suffix } }
    : { trainerId: owner.id, phone: { contains: suffix } }

  const existingLead = await prisma.lead.findFirst({ where: whereClause })

  let leadId: string

  if (!existingLead) {
    const createData: Record<string, unknown> = {
      name: senderName,
      phone: normalizePhone(phone),
      source: "WHATSAPP",
      status: "NEW",
      notes: `Primeira mensagem: "${content.slice(0, 200)}"`,
    }

    if (bot.crmTarget === "nutritionist") {
      createData.nutritionistId = owner.id
    } else {
      createData.trainerId = owner.id
    }

    const lead = await prisma.lead.create({ data: createData as any })
    leadId = lead.id

    await prisma.crmActivity.create({
      data: {
        leadId,
        action: "CREATED",
        details: `Lead capturado via ${bot.name} (${provider.toUpperCase()})`,
      },
    })

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "new_lead",
        title: `Novo lead via WhatsApp! (${bot.displayName})`,
        body: `${senderName} (${phone}) mandou mensagem.`,
        metadata: { phone, message: content.slice(0, 100), provider, bot: bot.type },
      },
    })

    console.log(`[${bot.name}] New lead created: ${senderName} (${phone})`)
  } else {
    leadId = existingLead.id

    await prisma.leadFollowUp.create({
      data: { leadId, type: "WHATSAPP", content: content.slice(0, 500) },
    })

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    })

    console.log(`[${bot.name}] Existing lead updated: ${leadId}`)
  }

  // Auto-classificar temperatura
  const msgLower = content.toLowerCase()
  const isHotIntent =
    /pre[cç]o|valor|quanto|custa|plano|mensalidade|experiment|testar|aula.*grat|gratis|assinar|comprar|pagar|consult/.test(
      msgLower
    )
  if (isHotIntent) {
    await prisma.lead.update({ where: { id: leadId }, data: { temperature: "HOT" } })
  }

  // Checar limite de respostas automáticas
  const maxReplies = bot.maxBotReplies
  const botReplies = await countLeadBotReplies(leadId, false)
  console.log(`[${bot.name}] Bot replies: ${botReplies}/${maxReplies}`)

  if (maxReplies > 0 && botReplies >= maxReplies) {
    console.log(`[${bot.name}] Limite atingido — handoff`)

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "lead_handoff",
        title: `⚡ ${senderName} precisa de voc��!`,
        body: `Bot respondeu ${maxReplies}x. Msg: "${content.slice(0, 100)}"`,
        metadata: { phone, leadId, message: content.slice(0, 200), provider, bot: bot.type },
      },
    })

    import("./lead-scoring")
      .then((m) => m.scoreAndNotify(leadId))
      .catch((err) => console.error(`[${bot.name}] Lead scoring failed:`, err))

    return { success: true, flow: existingLead ? "lead_existing" : "lead_new", replySent: false }
  }

  // Gerar resposta IA
  const leadForContext = await prisma.lead.findFirst({
    where: { id: leadId },
    include: { followUps: { orderBy: { createdAt: "desc" }, take: 6, select: { content: true, type: true } } },
  })

  const history = leadForContext?.followUps
    ?.map((f: { content: string }) => `Lead: ${f.content}`)
    .reverse() || []

  console.log(`[${bot.name}] Generating lead response (${botReplies + 1}/${maxReplies})...`)
  let reply = await generateLeadResponse(content, senderName, history, bot.type)

  if (!reply) {
    reply = bot.type === "nutri"
      ? `Oi ${senderName.split(" ")[0]}! Sou nutricionista esportivo(a) 🥗\n\nMe conta: qual teu objetivo?\n\n1. Emagrecer\n2. Ganhar massa\n3. Performance\n4. Plano alimentar\n5. Agendar consulta`
      : `Oi ${senderName.split(" ")[0]}! Sou o ${BRAND.trainerName}, personal trainer em ${BRAND.trainerCity} \n\nMe conta: o que tu tá procurando?\n\n1. Emagrecer\n2. Ganhar massa\n3. Condicionamento\n4. Preços\n5. Aula experimental grátis`
  }

  // Na última resposta automática, avisa handoff
  if (maxReplies > 0 && botReplies + 1 >= maxReplies) {
    reply += `\n\n${bot.handoffMessage}`

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "lead_handoff",
        title: `⚡ Handoff: ${senderName}`,
        body: `Bot completou ${maxReplies} respostas. Lead pronto.`,
        metadata: { phone, leadId, provider, bot: bot.type },
      },
    })
  }

  // Enviar resposta
  const sent = await sendReply(phone, reply, provider, bot)

  // Salvar resposta do bot
  await prisma.leadFollowUp.create({
    data: { leadId, type: "BOT", content: reply.slice(0, 500) },
  })

  import("./lead-scoring")
    .then((m) => m.scoreAndNotify(leadId))
    .catch((err) => console.error(`[${bot.name}] Lead scoring failed:`, err))

  return { success: true, flow: existingLead ? "lead_existing" : "lead_new", replySent: sent }
}

// ═══════════════════════════════════════════════════════════════
// SALVAR MSG SEM RESPONDER (quando bot está pausado)
// ═══════════════════════════════════════════════════════════════

async function saveB2bMessageOnly(phone: string, senderName: string, content: string) {
  const suffix = phoneSearchSuffix(phone)
  const existingLead = await prisma.saasLead.findFirst({
    where: { phone: { contains: suffix } },
  })

  if (existingLead) {
    await prisma.saasLeadFollowUp.create({
      data: { leadId: existingLead.id, type: "WHATSAPP", content: content.slice(0, 500) },
    })
    await prisma.saasLead.update({
      where: { id: existingLead.id },
      data: { updatedAt: new Date() },
    })
  } else {
    await prisma.saasLead.create({
      data: {
        name: senderName,
        phone: normalizePhone(phone),
        source: "whatsapp_b2b",
        status: "NEW",
        notes: `(Bot pausado) Primeira mensagem: "${content.slice(0, 200)}"`,
      },
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// LEAD B2B — Emmanuel (usa model SaasLead)
// ═══════════════════════════════════════════════════════════════

async function processB2bLeadMessage(
  phone: string,
  senderName: string,
  content: string,
  provider: WhatsAppProvider,
  bot: BotConfig
): Promise<ProcessResult> {
  const owner = await findOwnerForBot("b2b")
  if (!owner) {
    console.warn(`[${bot.name}] No MASTER user found`)
    return { success: false, flow: "no_owner", replySent: false, error: "No MASTER user" }
  }

  const suffix = phoneSearchSuffix(phone)

  // Buscar no CRM SaaS
  const existingLead = await prisma.saasLead.findFirst({
    where: { phone: { contains: suffix } },
  })

  let leadId: string

  if (!existingLead) {
    const lead = await prisma.saasLead.create({
      data: {
        name: senderName,
        phone: normalizePhone(phone),
        source: "whatsapp_b2b",
        status: "NEW",
        notes: `Primeira mensagem: "${content.slice(0, 200)}"`,
      },
    })
    leadId = lead.id

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "new_saas_lead",
        title: "Novo lead B2B via WhatsApp!",
        body: `${senderName} (${phone}) mandou mensagem.`,
        metadata: { phone, message: content.slice(0, 100), provider, bot: "b2b" },
      },
    })

    console.log(`[${bot.name}] New SaaS lead: ${senderName} (${phone})`)
  } else {
    leadId = existingLead.id

    await prisma.saasLeadFollowUp.create({
      data: { leadId, type: "WHATSAPP", content: content.slice(0, 500) },
    })

    await prisma.saasLead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    })

    console.log(`[${bot.name}] Existing SaaS lead updated: ${leadId}`)
  }

  // Auto-classificar temperatura B2B
  const msgLower = content.toLowerCase()
  const isHotIntent =
    /pre[cç]o|valor|quanto|custa|plano|demo|demonstra|testar|contratar|assin|white.?label|saas/.test(msgLower)
  if (isHotIntent) {
    await prisma.saasLead.update({ where: { id: leadId }, data: { temperature: "HOT" } })
  }

  // Checar limite
  const maxReplies = bot.maxBotReplies
  const botReplies = await countLeadBotReplies(leadId, true)
  console.log(`[${bot.name}] Bot replies: ${botReplies}/${maxReplies}`)

  if (maxReplies > 0 && botReplies >= maxReplies) {
    console.log(`[${bot.name}] Limite B2B atingido �� handoff`)

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "lead_handoff",
        title: `⚡ Lead B2B: ${senderName}`,
        body: `Bot respondeu ${maxReplies}x. Msg: "${content.slice(0, 100)}"`,
        metadata: { phone, leadId, provider, bot: "b2b" },
      },
    })

    return { success: true, flow: existingLead ? "saas_lead_existing" : "saas_lead_new", replySent: false }
  }

  // Gerar resposta B2B
  const saasLeadForContext = await prisma.saasLead.findFirst({
    where: { id: leadId },
    include: { followUps: { orderBy: { createdAt: "desc" }, take: 6, select: { content: true, type: true } } },
  })

  const history = saasLeadForContext?.followUps
    ?.map((f: { content: string }) => `Lead: ${f.content}`)
    .reverse() || []

  console.log(`[${bot.name}] Generating B2B response (${botReplies + 1}/${maxReplies})...`)
  let reply = await generateLeadResponse(content, senderName, history, "b2b")

  if (!reply) {
    reply =
      `Oi ${senderName.split(" ")[0]}! Sou Emmanuel da Code Bezerra 👋\n\n` +
      `Trabalhamos com tecnologia pra personal trainers, nutricionistas e academias.\n\n` +
      `Tu é:\n1. Personal Trainer\n2. Nutricionista\n3. Academia/Estúdio\n4. Outro`
  }

  // Na última resposta, handoff
  if (maxReplies > 0 && botReplies + 1 >= maxReplies) {
    reply += `\n\n${bot.handoffMessage}`

    await prisma.notification.create({
      data: {
        userId: owner.oderId,
        type: "lead_handoff",
        title: `⚡ Handoff B2B: ${senderName}`,
        body: `Bot completou ${maxReplies} respostas. Lead pronto.`,
        metadata: { phone, leadId, provider, bot: "b2b" },
      },
    })
  }

  // Enviar
  const sent = await sendReply(phone, reply, provider, bot)

  // Salvar
  await prisma.saasLeadFollowUp.create({
    data: { leadId, type: "BOT", content: reply.slice(0, 500) },
  })

  return { success: true, flow: existingLead ? "saas_lead_existing" : "saas_lead_new", replySent: sent }
}
