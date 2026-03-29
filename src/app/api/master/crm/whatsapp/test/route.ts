import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { BOT_CONFIGS } from "@/lib/bot-config"
import type { BotType } from "@/lib/bot-config"
import { callGroqWithTracking } from "@/lib/ai-usage"
import { buildSystemPrompt, buildB2bLeadPrompt } from "@/lib/whatsapp-bot"
import type { StudentContext } from "@/lib/whatsapp-bot"
import { getBotCustomInstructions, getSetting } from "@/lib/platform-settings"

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: string
}

function formatKnowledge(items: KnowledgeItem[]): string {
  if (!items.length) return ""

  const grouped: Record<string, KnowledgeItem[]> = {}
  for (const item of items) {
    const cat = item.category || "FAQ"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  let result = "\n\n══════ BASE DE CONHECIMENTO ══════\n"

  for (const [category, catItems] of Object.entries(grouped)) {
    result += `\n${category}:\n`
    for (const item of catItems) {
      if (category === "Regras" || category === "Scripts") {
        result += `- ${item.answer}\n`
      } else if (category === "Objecoes") {
        result += `- "${item.question}" -> Responda: "${item.answer}"\n`
      } else {
        result += `- P: ${item.question} R: ${item.answer}\n`
      }
    }
  }

  return result
}

// POST /api/master/crm/whatsapp/test — test bot response
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()
    const { botType, message, context: ctxType } = body as {
      botType: string
      message: string
      context?: "student" | "lead"
    }

    if (!botType || !message) {
      return NextResponse.json({ error: "botType e message obrigatorios" }, { status: 400 })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" nao encontrado` }, { status: 404 })
    }

    const bt = botType as BotType
    const customInstructions = await getBotCustomInstructions(bt)

    // Load knowledge
    const knowledgeRaw = await getSetting(`bot_${bt}_knowledge`)
    const knowledgeItems: KnowledgeItem[] = knowledgeRaw ? JSON.parse(knowledgeRaw) : []
    const knowledgeText = formatKnowledge(knowledgeItems)

    // Combine custom instructions + knowledge
    const fullInstructions = [customInstructions, knowledgeText].filter(Boolean).join("\n") || null

    let systemPrompt: string

    if (bt === "b2b") {
      // B2B always uses lead context
      systemPrompt = buildB2bLeadPrompt(
        "Joao Teste",
        [],
        fullInstructions
      )
    } else if (ctxType === "lead" || ctxType === undefined) {
      // Lead context for victor/nutri
      if (bt === "nutri") {
        systemPrompt = `Voce e nutricionista esportivo(a) respondendo pelo WhatsApp.
Voce esta falando com um POTENCIAL PACIENTE, nao um paciente atual.
Seu objetivo: qualificar, gerar interesse, e conduzir pra uma consulta ou assinatura.
Nome do lead: Maria Teste
Respostas CURTAS (2-4 frases max). Sempre termine com uma pergunta ou CTA.`
        if (fullInstructions) {
          systemPrompt += `\n\n══════ INSTRUCOES ADICIONAIS DO DONO ══════\n\n${fullInstructions}\n`
        }
      } else {
        systemPrompt = buildB2bLeadPrompt("Carlos Teste", [], fullInstructions)
          .replace("Emmanuel Bezerra", "Victor Oliveira")
          .replace("Code Bezerra (CB)", "Victor App")

        // Actually use the proper lead persona for victor
        const { BRAND } = await import("@/lib/branding")
        systemPrompt = `Voce e o ${BRAND.trainerName}, personal trainer respondendo pelo WhatsApp.
Voce esta falando com um POTENCIAL CLIENTE, nao um aluno atual.
Seu objetivo: qualificar, gerar interesse, e conduzir pra uma aula experimental ou assinatura.
Nome do lead: Carlos Teste
Respostas CURTAS (2-4 frases max). Sempre termine com uma pergunta ou CTA.`
        if (fullInstructions) {
          systemPrompt += `\n\n══════ INSTRUCOES ADICIONAIS DO DONO ══════\n\n${fullInstructions}\n`
        }
      }
    } else {
      // Student context with fake data
      const fakeContext: StudentContext = {
        name: "Carlos Teste",
        plan: "Pro Mensal",
        goals: "Hipertrofia e definicao",
        restrictions: "Nenhuma",
        weight: 78,
        height: 1.75,
        weekSessions: 3,
        weekTarget: 5,
        streak: 4,
        lastWorkout: "Treino A - Peito e Triceps (ontem)",
        totalSessions: 42,
        recentMessages: [
          { from: "Carlos", text: "E ai professor, treino de hoje e qual?" },
          { from: bt === "nutri" ? "Nutricionista" : "Victor", text: "Fala Carlos! Hoje e Treino B - Costas e Biceps. Bora! 💪" },
        ],
      }
      systemPrompt = buildSystemPrompt(fakeContext, bt, fullInstructions)
    }

    const start = Date.now()

    const result = await callGroqWithTracking({
      feature: `bot_test_${bt}`,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      maxTokens: 300,
      botType: bt,
    })

    const latencyMs = Date.now() - start

    return NextResponse.json({
      response: result.content || "(Sem resposta do modelo)",
      tokens: result.usage
        ? {
            prompt: result.usage.prompt_tokens,
            completion: result.usage.completion_tokens,
            total: result.usage.total_tokens,
          }
        : null,
      latencyMs,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    })
  } catch (error) {
    console.error("POST whatsapp/test error:", error)
    return NextResponse.json({ error: "Falha ao testar bot" }, { status: 500 })
  }
}
