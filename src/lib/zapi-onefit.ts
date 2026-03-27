/**
 * Z-API Client — Instância ONEFIT B2B
 *
 * Instância separada da instância principal (victor-app).
 * Criada no painel Z-API (zapi.io).
 *
 * Env vars:
 * - ONEFIT_ZAPI_INSTANCE_ID: ID da instância ONEFIT
 * - ONEFIT_ZAPI_TOKEN: Token da instância ONEFIT
 * - ONEFIT_ZAPI_CLIENT_TOKEN: Security token ONEFIT (opcional)
 *
 * Fallback para vars da instância principal se as específicas não estiverem definidas.
 */

const getBase = () => {
  const instanceId = process.env.ONEFIT_ZAPI_INSTANCE_ID || process.env.ZAPI_INSTANCE_ID
  const token = process.env.ONEFIT_ZAPI_TOKEN || process.env.ZAPI_TOKEN
  return `https://api.z-api.io/instances/${instanceId}/token/${token}`
}

function headers() {
  const clientToken = process.env.ONEFIT_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN
  return {
    "Content-Type": "application/json",
    ...(clientToken ? { "Client-Token": clientToken } : {}),
  }
}

// ═══════════════════════════════════════════════════════════════
// SEND MESSAGES
// ═══════════════════════════════════════════════════════════════

export async function sendOnefitMessage(phone: string, text: string): Promise<boolean> {
  const { normalizePhone } = await import("./phone")
  const formattedPhone = normalizePhone(phone)

  const base = getBase()
  if (!process.env.ONEFIT_ZAPI_INSTANCE_ID && !process.env.ZAPI_INSTANCE_ID) {
    console.error("[ONEFIT Z-API] ONEFIT_ZAPI_INSTANCE_ID não configurado")
    return false
  }

  console.log(`[ONEFIT Z-API] Sending to ${formattedPhone}: "${text.slice(0, 80)}..."`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let res: Response
  try {
    res = await fetch(`${base}/send-text`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ phone: formattedPhone, message: text }),
      signal: controller.signal,
    })
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    console.error(`[ONEFIT Z-API] Send ${isAbort ? "timed out (8s)" : "fetch error"}:`, isAbort ? "" : err)
    return false
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const error = await res.text()
    console.error(`[ONEFIT Z-API] Send failed (${res.status}):`, error)
    return false
  }

  console.log(`[ONEFIT Z-API] ✅ Sent to ${formattedPhone}`)
  return true
}

// ═══════════════════════════════════════════════════════════════
// STATUS & QR CODE
// ═══════════════════════════════════════════════════════════════

export async function getOnefitStatus(): Promise<{ value: string }> {
  const res = await fetch(`${getBase()}/status`, { headers: headers() })
  if (!res.ok) throw new Error(`Z-API ONEFIT status failed: ${res.status}`)
  return res.json()
}

export async function getOnefitQrCode(): Promise<{ value: string }> {
  const res = await fetch(`${getBase()}/qr-code/image`, { headers: headers() })
  if (!res.ok) throw new Error(`Z-API ONEFIT QR code failed: ${res.status}`)
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function isOnefitConfigured(): boolean {
  const instanceId = process.env.ONEFIT_ZAPI_INSTANCE_ID || process.env.ZAPI_INSTANCE_ID
  const token = process.env.ONEFIT_ZAPI_TOKEN || process.env.ZAPI_TOKEN
  return Boolean(instanceId) && Boolean(token)
}

export function verifyOnefitWebhook(req: Request): boolean {
  const clientToken = process.env.ONEFIT_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN
  if (!clientToken) return true
  return req.headers.get("client-token") === clientToken
}
