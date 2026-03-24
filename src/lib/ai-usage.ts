/**
 * AI Token Usage Tracker — loga consumo real do Groq.
 *
 * Wrappeia chamadas à API Groq e salva no banco:
 * - Tokens de prompt e completion
 * - Latência
 * - Feature que usou (chat, lead_bot, etc.)
 * - Modelo usado
 *
 * O Groq retorna usage no response:
 * { usage: { prompt_tokens, completion_tokens, total_tokens } }
 */

import { prisma } from "./prisma"

export interface GroqUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export async function logTokenUsage(
  feature: string,
  model: string,
  usage: GroqUsage | null,
  latencyMs: number,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await prisma.aiTokenUsage.create({
      data: {
        feature,
        model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        latencyMs,
        success,
        error: error?.slice(0, 500),
      },
    })
  } catch (err) {
    console.error("[AI Usage] Failed to log:", err)
  }
}

/**
 * Chamada Groq com tracking automático de tokens.
 */
export async function callGroqWithTracking(opts: {
  feature: string
  messages: { role: string; content: string }[]
  maxTokens?: number
  temperature?: number
  model?: string
}): Promise<{ content: string; usage: GroqUsage | null }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { content: "", usage: null }

  const model = opts.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
  const start = Date.now()

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens || 300,
        temperature: opts.temperature || 0.7,
        messages: opts.messages,
      }),
    })

    const latency = Date.now() - start

    if (!res.ok) {
      const errText = await res.text()
      logTokenUsage(opts.feature, model, null, latency, false, errText)
      return { content: "", usage: null }
    }

    const data = await res.json()
    const usage: GroqUsage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const content = data.choices?.[0]?.message?.content || ""

    // Log fire-and-forget
    logTokenUsage(opts.feature, model, usage, latency, true)

    return { content, usage }
  } catch (err) {
    const latency = Date.now() - start
    logTokenUsage(opts.feature, model, null, latency, false, String(err))
    return { content: "", usage: null }
  }
}
