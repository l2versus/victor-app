import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Organization Bot Config — stored inside Organization.brandConfig JSON
 * under the "botConfig" key.
 *
 * This allows each org to have its own bot identity without
 * touching the global bot configuration.
 */

export interface OrgBotConfig {
  botName: string
  botPersonality: string
  botGreeting: string
  botLanguageStyle: "formal" | "informal" | "tecnico"
  prices: {
    plans: { name: string; price: number; features: string[] }[]
  }
  customRules: string[]
  whatsappNumber: string
  workingHours: string
  offHoursMessage: string
}

// ═══ GET — Return org's bot configuration ═══

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true, brandConfig: true },
    })

    if (!org) {
      return NextResponse.json({ error: "Organizacao nao encontrada" }, { status: 404 })
    }

    const brandConfig = (org.brandConfig as Record<string, unknown>) || {}
    const botConfig = (brandConfig.botConfig as OrgBotConfig) || null

    return NextResponse.json({
      organizationId: org.id,
      organizationName: org.name,
      botConfig,
      hasConfig: !!botConfig,
    })
  } catch (error) {
    console.error("[Org Bot Config GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ═══ POST — Save org-specific bot config ═══

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, brandConfig: true },
    })

    if (!org) {
      return NextResponse.json({ error: "Organizacao nao encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const botConfig = body.botConfig as Partial<OrgBotConfig>

    if (!botConfig || typeof botConfig !== "object") {
      return NextResponse.json({ error: "botConfig obrigatorio" }, { status: 400 })
    }

    // Validate required fields
    if (botConfig.botName !== undefined && typeof botConfig.botName !== "string") {
      return NextResponse.json({ error: "botName deve ser string" }, { status: 400 })
    }

    if (
      botConfig.botLanguageStyle !== undefined &&
      !["formal", "informal", "tecnico"].includes(botConfig.botLanguageStyle)
    ) {
      return NextResponse.json(
        { error: "botLanguageStyle deve ser: formal, informal ou tecnico" },
        { status: 400 }
      )
    }

    if (botConfig.prices?.plans) {
      if (!Array.isArray(botConfig.prices.plans)) {
        return NextResponse.json({ error: "prices.plans deve ser array" }, { status: 400 })
      }
      for (const plan of botConfig.prices.plans) {
        if (!plan.name || typeof plan.price !== "number") {
          return NextResponse.json(
            { error: "Cada plano precisa de name (string) e price (number)" },
            { status: 400 }
          )
        }
      }
    }

    if (botConfig.customRules !== undefined && !Array.isArray(botConfig.customRules)) {
      return NextResponse.json({ error: "customRules deve ser array de strings" }, { status: 400 })
    }

    // Merge into existing brandConfig
    const existingBrand = (org.brandConfig as Record<string, unknown>) || {}

    const updatedBrandConfig = {
      ...existingBrand,
      botConfig: {
        ...(existingBrand.botConfig as Record<string, unknown> || {}),
        ...botConfig,
      },
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { brandConfig: updatedBrandConfig },
      select: { id: true, name: true, brandConfig: true },
    })

    const savedBotConfig = (updated.brandConfig as Record<string, unknown>)?.botConfig || null

    return NextResponse.json({
      success: true,
      organizationId: updated.id,
      botConfig: savedBotConfig,
      message: "Configuracao do bot salva com sucesso",
    })
  } catch (error) {
    console.error("[Org Bot Config POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
