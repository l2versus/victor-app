/**
 * Multi-Bot Configuration
 *
 * Cada bot tem seu próprio número Z-API, persona, e CRM.
 * O webhook dinâmico /api/webhooks/zapi/[bot] roteia pra cá.
 *
 * Para adicionar um novo bot:
 * 1. Criar instância Z-API (zapi.io)
 * 2. Adicionar env vars: ZAPI_{BOT}_INSTANCE_ID, ZAPI_{BOT}_TOKEN
 * 3. Adicionar entrada aqui no BOT_CONFIGS
 * 4. Configurar webhook na Z-API: https://seudominio.com/api/webhooks/zapi/{bot}
 */

import { BRAND } from "./branding"

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type BotType = "victor" | "nutri" | "b2b"

export interface BotConfig {
  type: BotType
  name: string
  /** Nome que aparece pro lead (ex: "Victor", "Dra. Ana") */
  displayName: string
  /** Papel no sistema */
  role: "ADMIN" | "NUTRITIONIST" | "MASTER"
  /** Env var prefix pra Z-API (ex: "ZAPI_VICTOR" → ZAPI_VICTOR_INSTANCE_ID) */
  envPrefix: string
  /** Pra qual CRM os leads vão */
  crmTarget: "trainer" | "nutritionist" | "saas"
  /** Limite de respostas automáticas antes do handoff (0 = sem limite) */
  maxBotReplies: number
  /** Mensagem de handoff quando atinge o limite */
  handoffMessage: string
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES DOS BOTS
// ═══════════════════════════════════════════════════════════════

export const BOT_CONFIGS: Record<BotType, BotConfig> = {
  victor: {
    type: "victor",
    name: "Victor Bot (Personal)",
    displayName: BRAND.trainerFirstName,
    role: "ADMIN",
    envPrefix: "ZAPI_VICTOR",
    crmTarget: "trainer",
    maxBotReplies: 3,
    handoffMessage: "Vou te passar pra nossa equipe pra continuar esse atendimento! 💪",
  },

  nutri: {
    type: "nutri",
    name: "Nutri Bot",
    displayName: "Nutricionista",
    role: "NUTRITIONIST",
    envPrefix: "ZAPI_NUTRI",
    crmTarget: "nutritionist",
    maxBotReplies: 3,
    handoffMessage: "Vou te passar pra nossa nutricionista pra um atendimento personalizado! 🥗",
  },

  b2b: {
    type: "b2b",
    name: "Emmanuel Bot (B2B)",
    displayName: "Emmanuel",
    role: "MASTER",
    envPrefix: "ZAPI_B2B",
    crmTarget: "saas",
    maxBotReplies: 3,
    handoffMessage: "Vou te passar pra nossa equipe pra continuar esse atendimento! 💪",
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getBotConfig(botType: string): BotConfig | null {
  return BOT_CONFIGS[botType as BotType] ?? null
}

/** Retorna instanceId e token da Z-API pra esse bot */
export function getBotZapiCredentials(bot: BotConfig): {
  instanceId: string
  token: string
  clientToken?: string
} | null {
  const instanceId = process.env[`${bot.envPrefix}_INSTANCE_ID`]
  const token = process.env[`${bot.envPrefix}_TOKEN`]

  if (!instanceId || !token) return null

  return {
    instanceId,
    token,
    clientToken: process.env[`${bot.envPrefix}_CLIENT_TOKEN`] || undefined,
  }
}

/** Verifica se o bot tem Z-API configurada */
export function isBotConfigured(bot: BotConfig): boolean {
  return getBotZapiCredentials(bot) !== null
}

/** URL base da Z-API pra um bot específico */
export function getBotZapiBase(bot: BotConfig): string | null {
  const creds = getBotZapiCredentials(bot)
  if (!creds) return null
  return `https://api.z-api.io/instances/${creds.instanceId}/token/${creds.token}`
}

/** Headers da Z-API pra um bot específico */
export function getBotZapiHeaders(bot: BotConfig): Record<string, string> {
  const creds = getBotZapiCredentials(bot)
  return {
    "Content-Type": "application/json",
    ...(creds?.clientToken ? { "Client-Token": creds.clientToken } : {}),
  }
}

/** Envia mensagem via Z-API do bot específico */
export async function sendBotMessage(bot: BotConfig, phone: string, text: string): Promise<boolean> {
  const base = getBotZapiBase(bot)
  if (!base) {
    console.warn(`[${bot.name}] Z-API não configurada (faltam env vars ${bot.envPrefix}_*)`)
    return false
  }

  const { normalizePhone } = await import("./phone")
  const normalizedPhone = normalizePhone(phone)

  const url = `${base}/send-text`
  const payload = { phone: normalizedPhone, message: text }

  console.log(`[${bot.name}] Sending to ${normalizedPhone}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getBotZapiHeaders(bot),
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.text()
      console.error(`[${bot.name}] Send failed (${res.status}):`, body.slice(0, 300))
      return false
    }

    console.log(`[${bot.name}] Message sent to ${normalizedPhone}`)
    return true
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === "AbortError"
    console.error(`[${bot.name}] ${isAbort ? "Timeout (15s)" : "Fetch error"}:`, isAbort ? "" : err)
    return false
  }
}

/** Verifica webhook secret do bot */
export function verifyBotWebhook(bot: BotConfig, req: Request): boolean {
  const secret = process.env[`${bot.envPrefix}_WEBHOOK_SECRET`]
  if (!secret) return true
  const incoming = req.headers.get("client-token") || req.headers.get("x-webhook-secret") || ""
  return incoming === secret
}
