import { streamText } from "ai"
import { aiModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { NextRequest } from "next/server"

// Rate limit: simple in-memory counter per IP (resets on deploy)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const MAX_MESSAGES_PER_HOUR = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (entry.count >= MAX_MESSAGES_PER_HOUR) return false
  entry.count++
  return true
}

// POST /api/chat — Public Victor Virtual chat (no auth required)
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: "Muitas mensagens. Tente novamente em alguns minutos ou fale com Victor no WhatsApp: (85) 9.9698-5823" },
        { status: 429 }
      )
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 })
    }

    // Strip system-role messages and limit conversation length
    const trimmedMessages = messages
      .filter((m: unknown) => {
        if (typeof m !== "object" || m === null) return false
        const msg = m as Record<string, unknown>
        return (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string"
      })
      .slice(-10)

    const result = streamText({
      model: aiModel,
      system: SYSTEM_PROMPTS.victorVirtual,
      messages: trimmedMessages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[Victor Virtual] Error:", error)
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
