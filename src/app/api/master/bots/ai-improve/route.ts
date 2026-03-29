import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { callGroqWithTracking } from "@/lib/ai-usage"
import { getBotCustomInstructions } from "@/lib/platform-settings"
import type { BotType } from "@/lib/bot-config"

const VALID_BOT_TYPES: BotType[] = ["victor", "nutri", "b2b"]
const VALID_ACTIONS = ["analyze_objections", "suggest_improvements", "generate_scripts"] as const
type Action = (typeof VALID_ACTIONS)[number]

const BOT_CONTEXT: Record<BotType, string> = {
  victor: "Personal Trainer que vende planos de treino personalizado e acompanhamento fitness",
  nutri: "Nutricionista que vende consultas, planos alimentares e acompanhamento nutricional",
  b2b: "Vendedor B2B que vende a plataforma SaaS ONEFIT para academias e profissionais de fitness",
}

// ═══ Fetch recent conversations ═══

async function loadRecentConversations(botType: BotType, limit: number): Promise<string[]> {
  const messages: string[] = []

  if (botType === "b2b") {
    // B2B uses SaasLead follow-ups
    const followUps = await prisma.saasLeadFollowUp.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { lead: { select: { name: true } } },
    })
    for (const f of followUps) {
      messages.push(`[Lead: ${f.lead.name}] (${f.type}) ${f.content}`)
    }
  } else {
    // Victor/Nutri use CRM conversations + messages
    const conversations = await prisma.crmConversation.findMany({
      take: Math.ceil(limit / 3),
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        lead: { select: { name: true } },
      },
    })
    for (const conv of conversations) {
      const sorted = conv.messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      for (const msg of sorted) {
        const sender = msg.fromMe ? "Bot" : conv.lead.name
        messages.push(`[${sender}] ${msg.content}`)
      }
    }
  }

  return messages
}

async function loadConversionStats(botType: BotType) {
  if (botType === "b2b") {
    const [total, converted, lost] = await Promise.all([
      prisma.saasLead.count(),
      prisma.saasLead.count({ where: { status: "CONVERTED" } }),
      prisma.saasLead.count({ where: { status: "LOST" } }),
    ])
    return { total, converted, lost, rate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0" }
  }

  const [total, converted, lost] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count({ where: { status: "LOST" } }),
  ])
  return { total, converted, lost, rate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0" }
}

// ═══ Action handlers ═══

async function analyzeObjections(botType: BotType) {
  const conversations = await loadRecentConversations(botType, 50)

  if (conversations.length === 0) {
    return {
      objections: [
        {
          objection: "Sem dados suficientes",
          frequency: "N/A",
          suggestedResponse: "Ainda nao ha conversas suficientes para analise. Aguarde mais interacoes.",
        },
      ],
    }
  }

  const conversationText = conversations.slice(0, 80).join("\n")

  const { content } = await callGroqWithTracking({
    feature: "ai_improve",
    botType,
    maxTokens: 1200,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `Voce e um especialista em vendas por WhatsApp para ${BOT_CONTEXT[botType]}. Responda APENAS em JSON valido, sem markdown.`,
      },
      {
        role: "user",
        content: `Analise estas conversas de WhatsApp e identifique as 5 objecoes mais comuns dos leads. Para cada objecao, sugira uma resposta eficaz.

Conversas recentes:
${conversationText}

Responda EXATAMENTE neste formato JSON (sem blocos de codigo):
{"objections":[{"objection":"texto da objecao","frequency":"alta/media/baixa","suggestedResponse":"resposta sugerida"}]}`,
      },
    ],
  })

  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch {
    return {
      objections: [
        {
          objection: "Erro ao processar analise",
          frequency: "N/A",
          suggestedResponse: content || "A IA nao retornou uma resposta valida. Tente novamente.",
        },
      ],
    }
  }
}

async function suggestImprovements(botType: BotType) {
  const [instructions, conversations, stats] = await Promise.all([
    getBotCustomInstructions(botType),
    loadRecentConversations(botType, 30),
    loadConversionStats(botType),
  ])

  const conversationText = conversations.slice(0, 50).join("\n")

  const { content } = await callGroqWithTracking({
    feature: "ai_improve",
    botType,
    maxTokens: 1200,
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `Voce e um consultor de otimizacao de bots de vendas para ${BOT_CONTEXT[botType]}. Responda APENAS em JSON valido, sem markdown.`,
      },
      {
        role: "user",
        content: `Analise o prompt atual do bot, as conversas recentes, e as taxas de conversao. Sugira 3-5 melhorias especificas para aumentar a taxa de conversao.

Prompt atual do bot:
${instructions || "(sem instrucoes customizadas — usando prompt padrao)"}

Estatisticas:
- Total de leads: ${stats.total}
- Convertidos: ${stats.converted}
- Perdidos: ${stats.lost}
- Taxa de conversao: ${stats.rate}%

Conversas recentes:
${conversationText || "(sem conversas recentes)"}

Responda EXATAMENTE neste formato JSON (sem blocos de codigo):
{"suggestions":[{"title":"titulo curto","description":"descricao detalhada da melhoria","priority":"high|medium|low"}]}`,
      },
    ],
  })

  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch {
    return {
      suggestions: [
        {
          title: "Erro ao processar sugestoes",
          description: content || "A IA nao retornou uma resposta valida. Tente novamente.",
          priority: "medium" as const,
        },
      ],
    }
  }
}

async function generateScripts(botType: BotType) {
  const { content } = await callGroqWithTracking({
    feature: "ai_improve",
    botType,
    maxTokens: 1500,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Voce e um copywriter especialista em vendas por WhatsApp para ${BOT_CONTEXT[botType]}. Responda APENAS em JSON valido, sem markdown.`,
      },
      {
        role: "user",
        content: `Gere 5 scripts de vendas para WhatsApp para um ${BOT_CONTEXT[botType]}. Cada script deve ter: situacao, abertura, desenvolvimento, fechamento. Foco em conversao.

Responda EXATAMENTE neste formato JSON (sem blocos de codigo):
{"scripts":[{"situation":"quando usar","opening":"mensagem de abertura","development":"desenvolvimento da conversa","closing":"fechamento/CTA"}]}`,
      },
    ],
  })

  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch {
    return {
      scripts: [
        {
          situation: "Erro ao gerar scripts",
          opening: content || "A IA nao retornou uma resposta valida.",
          development: "Tente novamente.",
          closing: "",
        },
      ],
    }
  }
}

// ═══ POST handler ═══

export async function POST(req: NextRequest) {
  try {
    await requireMaster()

    const body = await req.json()
    const { botType, action } = body as { botType?: string; action?: string }

    if (!botType || !VALID_BOT_TYPES.includes(botType as BotType)) {
      return NextResponse.json(
        { error: `botType invalido. Use: ${VALID_BOT_TYPES.join(", ")}` },
        { status: 400 }
      )
    }

    if (!action || !VALID_ACTIONS.includes(action as Action)) {
      return NextResponse.json(
        { error: `action invalida. Use: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      )
    }

    const typedBot = botType as BotType

    let result: unknown

    switch (action as Action) {
      case "analyze_objections":
        result = await analyzeObjections(typedBot)
        break
      case "suggest_improvements":
        result = await suggestImprovements(typedBot)
        break
      case "generate_scripts":
        result = await generateScripts(typedBot)
        break
    }

    return NextResponse.json({ success: true, botType, action, data: result })
  } catch (error) {
    console.error("[AI Improve] POST error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
