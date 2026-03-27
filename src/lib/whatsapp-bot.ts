/**
 * WhatsApp Bot powered by Claude — uses BRAND config for trainer identity.
 *
 * Integra WhatsApp Cloud API (oficial Meta) com Claude (Anthropic)
 * pra responder alunos como se fosse o BRAND.trainerFirstName em pessoa.
 *
 * Fluxo:
 * 1. Aluno manda msg no WhatsApp do trainer (BRAND.trainerFirstName)
 * 2. Meta webhook chega em /api/webhooks/whatsapp
 * 3. Bot identifica o aluno pelo telefone
 * 4. Puxa contexto: treinos, evolução, plano, restrições
 * 5. Claude gera resposta humanizada com a persona do trainer (BRAND)
 * 6. Responde no WhatsApp + salva no banco (DirectMessage)
 * 7. Trainer vê tudo em /admin/messages
 */

import { BRAND } from "@/lib/branding"
import { prisma } from "./prisma"

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — A alma do bot. Isso define TUDO.
// ═══════════════════════════════════════════════════════════════

export function buildSystemPrompt(context: StudentContext): string {
  return `Voce é o ${BRAND.trainerName}, personal trainer em ${BRAND.trainerCity}, ${BRAND.trainerCref}.
Voce está respondendo pelo WhatsApp. O aluno acha que está falando COM VOCE, não com um robô.

═══ REGRAS DE OURO (NUNCA QUEBRE) ═══

1. NUNCA diga que é IA, bot, assistente virtual, modelo de linguagem ou similar.
2. NUNCA diga "como IA" ou "como assistente". Voce É o ${BRAND.trainerFirstName}.
3. Fale como um cearense de Fortaleza — informal, direto, motivacional.
4. Use "tu" não "você". Ex: "Bora treinar hoje?" não "Você deveria treinar".
5. Emojis com moderação (1-2 por mensagem, máximo). Nada exagerado.
6. Respostas CURTAS. WhatsApp não é email. 2-4 frases no máximo.
7. Se não souber algo médico específico, diga "Vou verificar e te respondo" (não invente).
8. Assuntos SÉRIOS (lesão aguda, dor forte, emergência) → "Me liga que preciso ver isso contigo pessoalmente".
9. Nunca prescreva medicamentos ou diagnósticos médicos.
10. Áudios/imagens do aluno → "Vi aqui, vou analisar e te mando o feedback".

═══ SEU ESTILO DE COMUNICAÇÃO ═══

- Motivacional mas realista. Nada de coaching genérico.
- Direto ao ponto. "Treinou hoje?" não "Espero que esteja tendo um ótimo dia".
- Usa gírias naturais: "bora", "massa", "show", "fechou", "tranquilo".
- Quando o aluno fala que não treinou, não julga: "Tá tranquilo, mas amanhã bora compensar 💪"
- Quando o aluno reporta dor: leva a sério, pergunta detalhes, nunca minimiza.
- Horário: responde em qualquer horário (é WhatsApp), mas pode dizer "vou ver amanhã cedo" se for tarde.

═══ DADOS DO ALUNO (use naturalmente, não despeje tudo) ═══

Nome: ${context.name}
Plano: ${context.plan || "Sem plano ativo"}
Objetivo: ${context.goals || "Não definido"}
Restrições médicas: ${typeof context.restrictions === "string" ? context.restrictions : context.restrictions ? JSON.stringify(context.restrictions) : "Nenhuma informada"}
Peso: ${context.weight ? context.weight + "kg" : "Não informado"}
Altura: ${context.height ? context.height + "m" : "Não informada"}
Treinos esta semana: ${context.weekSessions}/${context.weekTarget}
Streak: ${context.streak} semanas consecutivas
Último treino: ${context.lastWorkout || "Não treinou ainda"}
Total de sessões: ${context.totalSessions}

═══ O QUE VOCE PODE FAZER ═══

- Tirar dúvidas sobre exercícios, técnica, postura
- Motivar o aluno a manter a constância
- Falar sobre nutrição básica (nada de prescrição — "come mais proteína", "hidrata bem")
- Ajustar treino se o aluno reportar problema ("Troca agachamento por leg press se tá doendo o joelho")
- Informar sobre o app: "Abre o app e vai em Postura, lá tem a correção por câmera"
- Falar sobre planos: "Tu tá no Essencial, no Pro tu ganha o chat com IA e treinos ilimitados"

═══ O QUE VOCE NÃO PODE FAZER ═══

- Prescrever medicamentos ou suplementos específicos (dosagem)
- Diagnosticar lesões ("Pode ser isso ou aquilo, mas preciso ver pessoalmente")
- Falar mal de outros profissionais
- Dar certeza sobre resultados ("Em 3 meses tu perde 10kg" — nunca)
- Mandar áudio (é texto)

═══ CONTEXTO RECENTE ═══

${context.recentMessages.length > 0 ? "Últimas mensagens da conversa:\n" + context.recentMessages.map(m => `${m.from}: ${m.text}`).join("\n") : "Primeira mensagem do aluno."}

Responda a próxima mensagem como ${BRAND.trainerFirstName}. Curto, direto, humano.`
}

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface StudentContext {
  name: string
  plan: string | null
  goals: string | null
  restrictions: string | null
  weight: number | null
  height: number | null
  weekSessions: number
  weekTarget: number
  streak: number
  lastWorkout: string | null
  totalSessions: number
  recentMessages: { from: string; text: string }[]
}

// ═══════════════════════════════════════════════════════════════
// BUSCAR CONTEXTO DO ALUNO
// ═══════════════════════════════════════════════════════════════

export async function getStudentContextByPhone(phone: string): Promise<{
  studentId: string
  userId: string
  context: StudentContext
} | null> {
  // Normalizar telefone
  const { normalizePhone, phoneSearchSuffix } = await import("./phone")
  const cleanPhone = normalizePhone(phone).replace(/^55/, "") // sem 55 pra busca local

  // Buscar user pelo telefone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: { contains: cleanPhone } },
        { phone: cleanPhone },
        { phone: `+55${cleanPhone}` },
      ],
    },
    include: {
      student: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: { select: { name: true, interval: true } } },
            take: 1,
          },
        },
      },
    },
  })

  if (!user || !user.student) return null

  const student = user.student

  // Stats
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const [weekSessions, totalSessions, weekPlans, lastSession] = await Promise.all([
    prisma.workoutSession.count({
      where: { studentId: student.id, startedAt: { gte: weekStart }, completedAt: { not: null } },
    }),
    prisma.workoutSession.count({
      where: { studentId: student.id, completedAt: { not: null } },
    }),
    prisma.studentWorkoutPlan.count({
      where: { studentId: student.id, active: true },
    }),
    prisma.workoutSession.findFirst({
      where: { studentId: student.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      include: { template: { select: { name: true } } },
    }),
  ])

  // Streak
  let streak = 0
  const now = new Date()
  for (let w = 0; w < 52; w++) {
    const end = new Date(now); end.setDate(now.getDate() - w * 7)
    const start = new Date(end); start.setDate(end.getDate() - 7)
    const count = await prisma.workoutSession.count({
      where: { studentId: student.id, completedAt: { not: null }, startedAt: { gte: start, lt: end } },
    })
    if (count > 0) streak++; else break
  }

  // Recent messages
  const recentMsgs = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      sender: { select: { name: true, role: true } },
    },
  })

  const activeSub = student.subscriptions[0]

  return {
    studentId: student.id,
    userId: user.id,
    context: {
      name: user.name,
      plan: activeSub ? `${activeSub.plan.name} (${activeSub.plan.interval})` : null,
      goals: student.goals,
      restrictions: typeof student.restrictions === "string"
        ? student.restrictions
        : student.restrictions ? JSON.stringify(student.restrictions) : null,
      weight: student.weight,
      height: student.height,
      weekSessions,
      weekTarget: weekPlans,
      streak,
      lastWorkout: lastSession
        ? `${lastSession.template.name} (${lastSession.completedAt?.toLocaleDateString("pt-BR")})`
        : null,
      totalSessions,
      recentMessages: recentMsgs.reverse().map(m => ({
        from: m.sender.role === "ADMIN" ? BRAND.trainerFirstName : m.sender.name,
        text: m.content,
      })),
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// ENVIAR MENSAGEM VIA WHATSAPP
// Tenta Z-API primeiro, fallback pra Meta Cloud API
// ═══════════════════════════════════════════════════════════════

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  // Tentar Z-API primeiro (se configurada)
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) {
    try {
      const { sendTextMessage } = await import("./zapi")
      const sent = await sendTextMessage(to, message)
      if (sent) return true
      console.warn("[WhatsApp] Z-API failed, trying Meta Cloud API...")
    } catch (err) {
      console.warn("[WhatsApp] Z-API error, fallback:", err)
    }
  }

  // Fallback: Meta Cloud API
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] No provider configured (neither Z-API nor Meta Cloud API)")
    return false
  }

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
          to,
          type: "text",
          text: { body: message },
        }),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      console.error("[WhatsApp] Meta send failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[WhatsApp] Meta send error:", error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR RESPOSTA COM GROQ (Llama 3.3 70B) — com tracking de tokens
// ═══════════════════════════════════════════════════════════════

export async function generateBotResponse(
  userMessage: string,
  context: StudentContext
): Promise<string> {
  const { callGroqWithTracking } = await import("./ai-usage")

  const result = await callGroqWithTracking({
    feature: "chat_aluno",
    messages: [
      { role: "system", content: buildSystemPrompt(context) },
      { role: "user", content: userMessage },
    ],
    maxTokens: 300,
  })

  return result.content || "Deu um bug aqui, me manda de novo? 😅"
}

// ═══════════════════════════════════════════════════════════════
// GERAR RESPOSTA DE VENDAS PRA LEADS (Groq + persona closer)
// ═══════════════════════════════════════════════════════════════

export async function generateLeadResponse(
  userMessage: string,
  leadName: string,
  leadHistory: string[]
): Promise<string> {
  const { callGroqWithTracking } = await import("./ai-usage")
  const { SYSTEM_PROMPTS } = await import("./ai")

  const historyContext = leadHistory.length > 0
    ? `\n\nHistórico da conversa:\n${leadHistory.slice(-6).join("\n")}`
    : ""

  const result = await callGroqWithTracking({
    feature: "lead_bot",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPTS.victorVirtual +
          `\n\nNome do lead: ${leadName}` +
          `\nCanal: WhatsApp` +
          `\nVocê está no WhatsApp respondendo um POTENCIAL CLIENTE, não um aluno.` +
          `\nSeu objetivo: qualificar, gerar interesse, e conduzir pra uma aula experimental ou assinatura.` +
          `\nRespostas CURTAS (2-4 frases max). Sempre termine com uma pergunta ou CTA.` +
          historyContext,
      },
      { role: "user", content: userMessage },
    ],
    maxTokens: 250,
  })

  return result.content || ""
}
