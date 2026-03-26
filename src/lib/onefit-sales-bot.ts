/**
 * ONEFIT B2B Sales Bot — AI-powered WhatsApp sales assistant
 *
 * Handles incoming WhatsApp messages from potential B2B clients,
 * auto-creates leads in SaasLead table, and responds with AI.
 *
 * Separate from the trainer bot (whatsapp-bot.ts) which handles
 * student interactions for Victor's personal training business.
 */

import { generateText } from "ai"
import { freeModel } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"
import { phoneSearchSuffix } from "@/lib/phone"

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — Persona de vendas ONEFIT
// ═══════════════════════════════════════════════════════════════

const SALES_PROMPT = `Voce e o assistente de vendas da ONEFIT, plataforma SaaS fitness para personal trainers, nutricionistas e academias.

═══ SOBRE A ONEFIT ═══

- Plataforma white-label: o profissional tem seu proprio app com sua marca
- Treinos personalizados com timer, series, carga progressiva
- Modulo nutricional completo (planos alimentares, macros, aderencia)
- IA nativa: chat inteligente, bot pos-treino, analise de anamnese
- Comunidade social: feed, stories, rankings, desafios
- CRM de vendas integrado com WhatsApp
- Correcao postural por camera (MediaPipe)
- PWA (funciona como app nativo sem App Store)
- Animacoes 3D dos exercicios

═══ PLANOS ═══

- Starter: R$97/mes — 1 profissional, 30 alunos
- Pro: R$197/mes (mais escolhido!) — 3 profissionais, 100 alunos, IA, CRM, WhatsApp Bot
- Business: R$497/mes — ilimitado, white-label completo, dominio proprio

═══ REGRAS DE OURO ═══

1. Responda em portugues brasileiro casual e profissional
2. Respostas CURTAS — 2-4 frases no maximo (e WhatsApp, nao email)
3. Seja consultivo: tire duvidas com paciencia, entenda a necessidade
4. Recomende o plano Pro como melhor custo-beneficio
5. Se perguntarem algo que nao sabe, diga "Vou consultar nosso time e te retorno!"
6. NUNCA invente features ou precos que nao existem
7. Sempre termine com uma pergunta ou CTA pra manter a conversa
8. Se a pessoa quiser assinar, direcione para WhatsApp comercial: (85) 9.9698-5823
9. Use emojis com moderacao (1-2 por mensagem)
10. Detecte se o lead e Personal Trainer, Nutricionista ou Academia e adapte o pitch

═══ DIFERENCIAIS PRA CADA TIPO ═══

Personal Trainer:
- "Seus alunos treinam pelo app com a SUA marca"
- "Bot no WhatsApp que responde alunos 24h"
- "CRM pra captar e converter leads automaticamente"

Nutricionista:
- "Planos alimentares digitais que o paciente acessa no celular"
- "Controle de aderencia e macros automatico"
- "Integra treino + nutricao num app so"

Academia:
- "App white-label com a marca da academia"
- "Gestao de alunos, planos e pagamentos"
- "Comunidade e ranking pra engajamento"

═══ OBJECOES COMUNS ═══

"E caro" → "O Pro sai menos que R$7/dia e tu economiza horas de trabalho manual. Quantos alunos tu atende hoje?"
"Ja uso outro app" → "A gente migra tudo pra ti. Qual app tu usa? Posso te mostrar o que a ONEFIT faz diferente."
"Preciso pensar" → "Tranquilo! Posso te mandar um video mostrando a plataforma por dentro?"
"Nao tenho muitos alunos" → "O Starter e perfeito pra comecar — R$97/mes pra ate 30 alunos. Quando crescer, so faz upgrade."
`

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleOnefitMessage(
  phone: string,
  message: string,
  senderName?: string
): Promise<string> {
  const suffix = phoneSearchSuffix(phone)

  // 1. Check if lead exists by phone
  let lead = await prisma.saasLead.findFirst({
    where: { phone: { contains: suffix } },
    include: {
      followUps: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { content: true, type: true, createdAt: true },
      },
    },
  })

  // 2. If not, create lead automatically
  if (!lead) {
    const scored = calculateSaasLeadScore({
      phone,
      company: senderName || undefined,
    })

    lead = await prisma.saasLead.create({
      data: {
        name: senderName || `Lead WhatsApp ${phone.slice(-4)}`,
        phone,
        source: "WHATSAPP",
        status: "NEW",
        score: scored.score,
        temperature: scored.temperature,
      },
      include: {
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { content: true, type: true, createdAt: true },
        },
      },
    })

    console.log(`[ONEFIT Bot] New lead created: ${lead.name} (${phone})`)
  }

  // 3. Update lead status if NEW → CONTACTED
  if (lead.status === "NEW") {
    await prisma.saasLead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    })
  }

  // 4. Build conversation history for context
  const history = lead.followUps
    .map((f: { content: string }) => f.content)
    .reverse()

  const historyContext =
    history.length > 0
      ? `\n\nHistorico da conversa:\n${history.join("\n")}`
      : ""

  // 5. Auto-detect lead type from message
  const msgLower = message.toLowerCase()
  const detectedType = /academia|gym|box/.test(msgLower)
    ? "ACADEMY"
    : /nutri/.test(msgLower)
    ? "NUTRITIONIST"
    : /personal|trainer|treino/.test(msgLower)
    ? "PERSONAL_TRAINER"
    : null

  if (detectedType && !lead.type) {
    await prisma.saasLead.update({
      where: { id: lead.id },
      data: { type: detectedType as "ACADEMY" | "PERSONAL_TRAINER" | "NUTRITIONIST" },
    })
  }

  // 6. Auto-classify temperature by intent
  const isHotIntent =
    /pre[cç]o|valor|quanto|custa|plano|mensalidade|assinar|comprar|pagar|contratar|testar|demo|demonstra/.test(
      msgLower
    )
  if (isHotIntent && lead.temperature !== "HOT") {
    await prisma.saasLead.update({
      where: { id: lead.id },
      data: { temperature: "HOT" },
    })
  }

  // 7. Generate AI response
  let reply: string

  try {
    const result = await generateText({
      model: freeModel,
      system:
        SALES_PROMPT +
        `\n\nNome do lead: ${lead.name}` +
        `\nTipo: ${lead.type || "Nao identificado"}` +
        `\nCanal: WhatsApp` +
        historyContext,
      prompt: message,
    })

    reply = result.text
  } catch (error) {
    console.error("[ONEFIT Bot] AI generation failed:", error)
    reply =
      "Oi! Tive um probleminha tecnico. Fala com nosso time no WhatsApp: (85) 9.9698-5823 que te ajudamos!"
  }

  // 8. Log follow-up (both message and reply)
  await prisma.saasLeadFollowUp.create({
    data: {
      leadId: lead.id,
      type: "WHATSAPP",
      content: `Lead: ${message}\nBot: ${reply}`,
    },
  })

  // 9. Update lead score after interaction
  const updatedLead = await prisma.saasLead.findUnique({
    where: { id: lead.id },
    select: {
      email: true,
      phone: true,
      company: true,
      type: true,
      estimatedStudents: true,
      estimatedMrr: true,
      city: true,
      state: true,
    },
  })

  if (updatedLead) {
    const newScore = calculateSaasLeadScore(updatedLead)
    await prisma.saasLead.update({
      where: { id: lead.id },
      data: {
        score: newScore.score,
        temperature:
          isHotIntent
            ? "HOT"
            : newScore.temperature,
      },
    })
  }

  return reply
}
