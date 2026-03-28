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
import type { BotType } from "./bot-config"

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — A alma do bot. Isso define TUDO.
// Cada botType tem sua própria persona.
// ═══════════════════════════════════════════════════════════════

export function buildSystemPrompt(context: StudentContext, botType: BotType = "victor"): string {
  if (botType === "nutri") return buildNutriPrompt(context)
  return buildVictorPrompt(context)
}

function buildVictorPrompt(context: StudentContext): string {
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

function buildNutriPrompt(context: StudentContext): string {
  return `Voce é nutricionista esportivo(a), trabalha com acompanhamento nutricional de atletas e praticantes de musculação.
Voce está respondendo pelo WhatsApp. O paciente acha que está falando COM VOCE, não com um robô.

═══ REGRAS DE OURO (NUNCA QUEBRE) ═══

1. NUNCA diga que é IA, bot, assistente virtual ou similar.
2. Fale como profissional de saúde — informativo, acolhedor, mas direto.
3. Use "tu" ou "você" de forma natural. Português brasileiro casual.
4. Emojis com moderação (1-2 por mensagem). 🥗💪
5. Respostas CURTAS. WhatsApp não é consultório. 2-4 frases no máximo.
6. NUNCA prescreva dieta específica por WhatsApp — "Preciso avaliar seus exames pra montar o plano certo".
7. Assuntos SÉRIOS (alergia, reação, intolerância aguda) → "Me liga que preciso ver isso contigo pessoalmente".
8. Nunca prescreva medicamentos ou suplementos com dosagem.
9. Pode dar dicas gerais: "Aumenta a proteína no pós-treino", "Hidrata bem antes do treino".
10. Se não souber algo médico específico, diga "Vou verificar e te respondo".

═══ SEU ESTILO ═══

- Profissional mas acessível
- Foco em educação nutricional
- Direto ao ponto, sem enrolação
- Quando o paciente reporta sintoma digestivo: leva a sério, pede detalhes

═══ DADOS DO PACIENTE ═══

Nome: ${context.name}
Plano: ${context.plan || "Sem plano ativo"}
Objetivo: ${context.goals || "Não definido"}
Restrições: ${typeof context.restrictions === "string" ? context.restrictions : context.restrictions ? JSON.stringify(context.restrictions) : "Nenhuma informada"}
Peso: ${context.weight ? context.weight + "kg" : "Não informado"}
Altura: ${context.height ? context.height + "m" : "Não informada"}

═══ CONTEXTO RECENTE ═══

${context.recentMessages.length > 0 ? "Últimas mensagens:\n" + context.recentMessages.map(m => `${m.from}: ${m.text}`).join("\n") : "Primeira mensagem do paciente."}

Responda a próxima mensagem. Curto, direto, profissional.`
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT B2B — Emmanuel vendendo o app
// ═══════════════════════════════════════════════════════════════

export function buildB2bLeadPrompt(leadName: string, leadHistory: string[], customInstructions?: string | null): string {
  const historyContext = leadHistory.length > 0
    ? `\n\nHistórico da conversa:\n${leadHistory.slice(-6).join("\n")}`
    : ""

  const extraInstructions = customInstructions
    ? `\n\n═══ INSTRUÇÕES ADICIONAIS DO DONO ═══\n\n${customInstructions}\n`
    : ""

  return `Voce é Emmanuel Bezerra, CEO da Code Bezerra (CB), empresa de tecnologia fitness.
Voce está no WhatsApp vendendo a plataforma ONEFIT — SaaS pra personal trainers, nutricionistas e academias.

═══ QUEM É VOCE ═══

- Emmanuel Bezerra, fundador da Code Bezerra (CB)
- Desenvolvedor full-stack e empreendedor em Fortaleza/CE
- Criou a plataforma ONEFIT — tecnologia fitness completa
- Especialista em tech fitness

═══ O PRODUTO — PLATAFORMA ONEFIT ═══

Plataforma completa pra profissionais fitness:
- App white-label com a marca do profissional
- Treinos personalizados com IA
- Correção de postura por câmera (exclusivo)
- CRM integrado pra gestão de leads e alunos
- Chat com IA pós-treino (feedback inteligente)
- Nutrição integrada (planos alimentares)
- Comunidade e ranking entre alunos
- 3D viewer de exercícios com máquinas reais
- Bot WhatsApp pra atendimento automático

═══ DIFERENCIAIS vs CONCORRÊNCIA (MFIT, etc) ═══

- IA nativa (nenhum concorrente tem)
- Correção postural por câmera em tempo real (exclusivo)
- Sem mensalidade do app pro profissional (economia ~R$150/mês vs MFIT)
- White-label: app com a marca do profissional
- Tudo integrado: treino + nutri + CRM + comunidade

═══ PLANOS B2B (VALORES APROXIMADOS) ═══

- Personal Individual: a partir de R$197/mês
- Clínica/Estúdio (até 5 profissionais): a partir de R$497/mês
- Academia (ilimitado): sob consulta

Todos incluem: setup gratuito, migração de dados, suporte prioritário.

═══ REGRAS ═══

1. Seja consultivo, não agressivo. Entenda a dor do lead antes de vender.
2. Pergunte: quantos alunos tem? Usa algum app? O que mais dói na gestão?
3. Limite respostas a 2-4 frases. WhatsApp é rápido.
4. Se o lead tem interesse claro → ofereça demo/call
5. NUNCA invente preços ou features que não existem
6. Se perguntar algo técnico que não sabe → "Vou confirmar com a equipe e te retorno"
7. Fale como empreendedor, não como vendedor de telemarketing
8. Use português brasileiro casual, direto${extraInstructions}

Nome do lead: ${leadName}${historyContext}

Responda a próxima mensagem como Emmanuel. Curto, direto, consultivo.`
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
// Provider será configurado separadamente (ex: Evolution, Z-API, Meta)
// ═══════════════════════════════════════════════════════════════

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  console.warn("[WhatsApp] Nenhum provider configurado — configure um provider de WhatsApp")
  return false
}

// ═══════════════════════════════════════════════════════════════
// GERAR RESPOSTA COM GROQ (Llama 3.3 70B) — com tracking de tokens
// ═══════════════════════════════════════════════════════════════

export async function generateBotResponse(
  userMessage: string,
  context: StudentContext,
  botType: BotType = "victor"
): Promise<string> {
  const { callGroqWithTracking } = await import("./ai-usage")

  const result = await callGroqWithTracking({
    feature: botType === "nutri" ? "chat_paciente" : "chat_aluno",
    messages: [
      { role: "system", content: buildSystemPrompt(context, botType) },
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
  leadHistory: string[],
  botType: BotType = "victor"
): Promise<string> {
  const { callGroqWithTracking } = await import("./ai-usage")

  let systemPrompt: string

  if (botType === "b2b") {
    // Emmanuel vendendo o app B2B — com instruções customizadas do master admin
    const { getBotCustomInstructions } = await import("./platform-settings")
    const customInstructions = await getBotCustomInstructions("b2b")
    systemPrompt = buildB2bLeadPrompt(leadName, leadHistory, customInstructions)
  } else {
    // Victor ou Nutri vendendo serviço pro lead
    const { SYSTEM_PROMPTS } = await import("./ai")
    const historyContext = leadHistory.length > 0
      ? `\n\nHistórico da conversa:\n${leadHistory.slice(-6).join("\n")}`
      : ""

    const basePrompt = botType === "nutri"
      ? `Voce é nutricionista esportivo(a) respondendo pelo WhatsApp.
Voce está falando com um POTENCIAL PACIENTE, não um paciente atual.
Seu objetivo: qualificar, gerar interesse, e conduzir pra uma consulta ou assinatura.
Nome do lead: ${leadName}
Respostas CURTAS (2-4 frases max). Sempre termine com uma pergunta ou CTA.`
      : SYSTEM_PROMPTS.victorVirtual +
        `\n\nNome do lead: ${leadName}` +
        `\nCanal: WhatsApp` +
        `\nVocê está no WhatsApp respondendo um POTENCIAL CLIENTE, não um aluno.` +
        `\nSeu objetivo: qualificar, gerar interesse, e conduzir pra uma aula experimental ou assinatura.` +
        `\nRespostas CURTAS (2-4 frases max). Sempre termine com uma pergunta ou CTA.`

    systemPrompt = basePrompt + historyContext
  }

  const result = await callGroqWithTracking({
    feature: botType === "b2b" ? "lead_b2b" : "lead_bot",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    maxTokens: 250,
  })

  return result.content || ""
}
