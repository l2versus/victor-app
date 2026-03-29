import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { getBotCustomInstructions, setBotCustomInstructions, getSetting } from "@/lib/platform-settings"
import { BOT_CONFIGS } from "@/lib/bot-config"

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: string
}

function formatKnowledgeForPrompt(items: KnowledgeItem[]): string {
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

async function getKnowledgeItems(botType: string): Promise<KnowledgeItem[]> {
  const raw = await getSetting(`bot_${botType}_knowledge`)
  return raw ? JSON.parse(raw) : []
}

// GET /api/master/crm/whatsapp/instructions?botType=b2b
export async function GET(req: NextRequest) {
  try {
    await requireMaster()
    const botType = req.nextUrl.searchParams.get("botType")

    // Return all 3 bots if no botType specified
    if (!botType) {
      const [victor, nutri, b2b, victorK, nutriK, b2bK] = await Promise.all([
        getBotCustomInstructions("victor"),
        getBotCustomInstructions("nutri"),
        getBotCustomInstructions("b2b"),
        getKnowledgeItems("victor"),
        getKnowledgeItems("nutri"),
        getKnowledgeItems("b2b"),
      ])
      return NextResponse.json({
        bots: {
          victor: {
            instructions: victor || "",
            knowledge: victorK,
            knowledgeFormatted: formatKnowledgeForPrompt(victorK),
            label: "Victor (Personal Trainer)",
            description: "Bot do personal trainer que responde alunos e leads de treino",
          },
          nutri: {
            instructions: nutri || "",
            knowledge: nutriK,
            knowledgeFormatted: formatKnowledgeForPrompt(nutriK),
            label: "Nutri (Nutricionista)",
            description: "Bot da nutricionista que responde pacientes e leads de nutricao",
          },
          b2b: {
            instructions: b2b || "",
            knowledge: b2bK,
            knowledgeFormatted: formatKnowledgeForPrompt(b2bK),
            label: "Emmanuel (B2B Vendas)",
            description: "Bot de vendas B2B que vende a plataforma ONEFIT para academias e profissionais",
          },
        },
      })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" não encontrado` }, { status: 404 })
    }

    const [instructions, knowledgeItems] = await Promise.all([
      getBotCustomInstructions(botType),
      getKnowledgeItems(botType),
    ])

    return NextResponse.json({
      botType,
      instructions: instructions || "",
      hasCustom: !!instructions,
      knowledge: knowledgeItems,
      knowledgeFormatted: formatKnowledgeForPrompt(knowledgeItems),
    })
  } catch (error) {
    console.error("GET whatsapp/instructions error:", error)
    return NextResponse.json({ error: "Falha" }, { status: 500 })
  }
}

// POST /api/master/crm/whatsapp/instructions — salvar instruções customizadas
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()
    const { botType, instructions } = body as { botType: string; instructions: string }

    if (!botType) {
      return NextResponse.json({ error: "botType obrigatório" }, { status: 400 })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" não encontrado` }, { status: 404 })
    }

    await setBotCustomInstructions(botType, instructions || "")

    return NextResponse.json({
      success: true,
      botType,
      message: instructions
        ? "Instruções customizadas salvas"
        : "Instruções resetadas para o padrão",
    })
  } catch (error) {
    console.error("POST whatsapp/instructions error:", error)
    return NextResponse.json({ error: "Falha" }, { status: 500 })
  }
}
