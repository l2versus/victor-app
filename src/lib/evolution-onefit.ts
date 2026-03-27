/**
 * Evolution API Client for ONEFIT B2B Sales Bot
 *
 * Separate instance from the trainer bot (victor-app).
 * Uses its own env vars so both can run independently.
 *
 * Env vars:
 * - ONEFIT_EVOLUTION_URL: URL base da instancia Evolution para ONEFIT
 * - ONEFIT_EVOLUTION_KEY: API key da instancia ONEFIT
 *
 * Falls back to EVOLUTION_API_URL / EVOLUTION_API_KEY if ONEFIT-specific vars are not set.
 */

export const ONEFIT_INSTANCE = "onefit-b2b"

const getBaseUrl = () =>
  process.env.ONEFIT_EVOLUTION_URL || process.env.EVOLUTION_API_URL || ""

const getApiKey = () =>
  process.env.ONEFIT_EVOLUTION_KEY || process.env.EVOLUTION_API_KEY || ""

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: getApiKey(),
  }
}

// ═══════════════════════════════════════════════════════════════
// SEND MESSAGES
// ═══════════════════════════════════════════════════════════════

/**
 * Send a text message via the ONEFIT WhatsApp instance.
 * Phone is normalized to digits-only before sending.
 */
export async function sendOnefitMessage(phone: string, text: string) {
  const { normalizePhone } = await import("./phone")
  const formattedNumber = normalizePhone(phone)

  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    console.error("[ONEFIT Evolution] ONEFIT_EVOLUTION_URL not configured")
    return false
  }

  const url = `${baseUrl}/message/sendText/${ONEFIT_INSTANCE}`
  console.log(`[ONEFIT Evolution] Sending to ${formattedNumber}: ${text.slice(0, 80)}...`)

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      number: formattedNumber,
      text,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`[ONEFIT Evolution] Send failed (${res.status}):`, error)
    return false
  }

  console.log(`[ONEFIT Evolution] Message sent successfully to ${formattedNumber}`)
  return true
}

// ═══════════════════════════════════════════════════════════════
// INSTANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function createOnefitInstance(webhookUrl: string) {
  const res = await fetch(`${getBaseUrl()}/instance/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      instanceName: ONEFIT_INSTANCE,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`ONEFIT Evolution createInstance failed: ${error}`)
  }

  return res.json()
}

export async function getOnefitQrCode(): Promise<{ base64: string; code: string }> {
  const res = await fetch(`${getBaseUrl()}/instance/connect/${ONEFIT_INSTANCE}`, {
    method: "GET",
    headers: headers(),
  })

  if (!res.ok) throw new Error("Failed to get ONEFIT QR code")
  return res.json()
}

export function isOnefitConfigured(): boolean {
  return Boolean(getBaseUrl()) && Boolean(getApiKey())
}
