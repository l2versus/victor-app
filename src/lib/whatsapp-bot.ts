/**
 * Victor App — WhatsApp Bot powered by Claude
 *
 * Integra WhatsApp Cloud API (oficial Meta) com Claude (Anthropic)
 * pra responder alunos como se fosse o Victor em pessoa.
 *
 * Fluxo:
 * 1. Aluno manda msg no WhatsApp do Victor
 * 2. Meta webhook chega em /api/webhooks/whatsapp
 * 3. Bot identifica o aluno pelo telefone
 * 4. Puxa contexto: treinos, evolução, plano, restrições
 * 5. Claude gera resposta humanizada com a persona do Victor
 * 6. Responde no WhatsApp + salva no banco (DirectMessage)
 * 7. Victor vê tudo em /admin/messages
 */

import { prisma } from "./prisma"

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — A alma do bot. Isso define TUDO.
// ═══════════════════════════════════════════════════════════════

export function buildSystemPrompt(context: StudentContext): string {
  return `Voce é o Victor Oliveira, personal trainer em Fortaleza-CE, CREF 016254-G/CE.
Voce está respondendo pelo WhatsApp. O aluno acha que está falando COM VOCE, não com um robô.

═══ REGRAS DE OURO (NUNCA QUEBRE) ═══

1. NUNCA diga que é IA, bot, assistente virtual, modelo de linguagem ou similar.
2. NUNCA diga "como IA" ou "como assistente". Voce É o Victor.
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
Restrições médicas: ${context.restrictions || "Nenhuma informada"}
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

Responda a próxima mensagem como Victor. Curto, direto, humano.`
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
  // Normalizar telefone (remover +55, espaços, hifens)
  const cleanPhone = phone.replace(/\D/g, "").replace(/^55/, "")

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
      restrictions: student.restrictions as string | null,
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
        from: m.sender.role === "ADMIN" ? "Victor" : m.sender.name,
        text: m.content,
      })),
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// ENVIAR MENSAGEM VIA WHATSAPP CLOUD API
// ═══════════════════════════════════════════════════════════════

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID")
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
      console.error("[WhatsApp] Send failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[WhatsApp] Send error:", error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// GERAR RESPOSTA COM CLAUDE
// ═══════════════════════════════════════════════════════════════

export async function generateBotResponse(
  userMessage: string,
  context: StudentContext
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return "Opa, tô com um problema técnico aqui. Me manda de novo daqui a pouco? 🙏"
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300, // WhatsApp = curto
        system: buildSystemPrompt(context),
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok) {
      console.error("[Claude] Error:", await res.text())
      return "Deu um bug aqui, me manda de novo? 😅"
    }

    const data = await res.json()
    return data.content?.[0]?.text || "Não entendi, repete pra mim?"
  } catch (error) {
    console.error("[Claude] Error:", error)
    return "Tô sem conexão aqui, te respondo já já 🙏"
  }
}
