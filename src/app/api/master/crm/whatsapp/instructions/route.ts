import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { getBotCustomInstructions, setBotCustomInstructions } from "@/lib/platform-settings"
import { BOT_CONFIGS } from "@/lib/bot-config"

// GET /api/master/crm/whatsapp/instructions?botType=b2b
export async function GET(req: NextRequest) {
  try {
    await requireMaster()
    const botType = req.nextUrl.searchParams.get("botType")

    // Return all 3 bots if no botType specified
    if (!botType) {
      const [victor, nutri, b2b] = await Promise.all([
        getBotCustomInstructions("victor"),
        getBotCustomInstructions("nutri"),
        getBotCustomInstructions("b2b"),
      ])
      return NextResponse.json({
        bots: {
          victor: { instructions: victor || "", label: "Victor (Personal Trainer)", description: "Bot do personal trainer que responde alunos e leads de treino" },
          nutri: { instructions: nutri || "", label: "Nutri (Nutricionista)", description: "Bot da nutricionista que responde pacientes e leads de nutrição" },
          b2b: { instructions: b2b || "", label: "Emmanuel (B2B Vendas)", description: "Bot de vendas B2B que vende a plataforma ONEFIT para academias e profissionais" },
        },
      })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" não encontrado` }, { status: 404 })
    }

    const instructions = await getBotCustomInstructions(botType)

    return NextResponse.json({
      botType,
      instructions: instructions || "",
      hasCustom: !!instructions,
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
