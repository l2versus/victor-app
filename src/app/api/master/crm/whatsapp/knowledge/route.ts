import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { getSetting, setSetting } from "@/lib/platform-settings"
import { BOT_CONFIGS } from "@/lib/bot-config"

export interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: "FAQ" | "Objecoes" | "Precos" | "Regras" | "Scripts"
}

function knowledgeKey(botType: string): string {
  return `bot_${botType}_knowledge`
}

// GET /api/master/crm/whatsapp/knowledge?botType=victor
export async function GET(req: NextRequest) {
  try {
    await requireMaster()
    const botType = req.nextUrl.searchParams.get("botType")

    if (!botType) {
      return NextResponse.json({ error: "botType obrigatorio" }, { status: 400 })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" nao encontrado` }, { status: 404 })
    }

    const raw = await getSetting(knowledgeKey(botType))
    const items: KnowledgeItem[] = raw ? JSON.parse(raw) : []

    return NextResponse.json({ botType, items })
  } catch (error) {
    console.error("GET whatsapp/knowledge error:", error)
    return NextResponse.json({ error: "Falha" }, { status: 500 })
  }
}

// POST /api/master/crm/whatsapp/knowledge — save knowledge items
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()
    const { botType, items } = body as { botType: string; items: KnowledgeItem[] }

    if (!botType) {
      return NextResponse.json({ error: "botType obrigatorio" }, { status: 400 })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" nao encontrado` }, { status: 404 })
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items deve ser um array" }, { status: 400 })
    }

    await setSetting(knowledgeKey(botType), JSON.stringify(items))

    return NextResponse.json({
      success: true,
      botType,
      count: items.length,
      message: `${items.length} itens de conhecimento salvos`,
    })
  } catch (error) {
    console.error("POST whatsapp/knowledge error:", error)
    return NextResponse.json({ error: "Falha" }, { status: 500 })
  }
}
