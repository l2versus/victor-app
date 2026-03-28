import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { isBotPaused, setBotPaused, getSetting, setSetting } from "@/lib/platform-settings"
import { BOT_CONFIGS, getBotZapiCredentials } from "@/lib/bot-config"
import { getInstanceStatus } from "@/lib/zapi"

// GET /api/master/crm/whatsapp — status de todos os bots
// Accessible by MASTER, ADMIN, NUTRITIONIST
export async function GET() {
  try {
    const session = await requireAuth()
    if (!["MASTER", "ADMIN", "NUTRITIONIST"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Status de cada bot
    const bots = await Promise.all(
      Object.values(BOT_CONFIGS).map(async (bot) => {
        const creds = getBotZapiCredentials(bot)
        const paused = await isBotPaused(bot.type)

        let connectionStatus = "not_configured"
        let phone: string | null = null

        if (creds) {
          try {
            // Check Z-API instance status
            const base = `https://api.z-api.io/instances/${creds.instanceId}/token/${creds.token}`
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              ...(creds.clientToken ? { "Client-Token": creds.clientToken } : {}),
            }
            const res = await fetch(`${base}/status`, { headers, signal: AbortSignal.timeout(8000) })
            if (res.ok) {
              const data = await res.json()
              connectionStatus = data.connected ? "connected" : (data.value || "disconnected")
              phone = data.phone || data.phoneNumber || null
            }
          } catch {
            connectionStatus = "error"
          }
        }

        return {
          type: bot.type,
          name: bot.name,
          displayName: bot.displayName,
          role: bot.role,
          configured: !!creds,
          paused,
          connectionStatus,
          phone,
          maxBotReplies: bot.maxBotReplies,
          crmTarget: bot.crmTarget,
        }
      })
    )

    return NextResponse.json({ bots })
  } catch (error) {
    console.error("GET /api/master/crm/whatsapp error:", error)
    return NextResponse.json({ error: "Falha ao buscar status" }, { status: 500 })
  }
}

// POST /api/master/crm/whatsapp — pause/resume bot
// Accessible by MASTER, ADMIN, NUTRITIONIST
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!["MASTER", "ADMIN", "NUTRITIONIST"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = await req.json()
    const { botType, action } = body as { botType: string; action: "pause" | "resume" }

    if (!botType || !["pause", "resume"].includes(action)) {
      return NextResponse.json({ error: "botType e action (pause|resume) obrigatórios" }, { status: 400 })
    }

    if (!BOT_CONFIGS[botType as keyof typeof BOT_CONFIGS]) {
      return NextResponse.json({ error: `Bot "${botType}" não encontrado` }, { status: 404 })
    }

    await setBotPaused(botType, action === "pause")

    return NextResponse.json({
      success: true,
      botType,
      paused: action === "pause",
      message: action === "pause"
        ? `Bot ${botType} pausado — não responde mais automaticamente`
        : `Bot ${botType} retomado — respostas automáticas ativas`,
    })
  } catch (error) {
    console.error("POST /api/master/crm/whatsapp error:", error)
    return NextResponse.json({ error: "Falha" }, { status: 500 })
  }
}
