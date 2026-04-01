/**
 * Z-API Client — WhatsApp via QR Code
 *
 * Instância criada no painel Z-API (zapi.io), não via API.
 *
 * Env vars necessárias:
 * - ZAPI_INSTANCE_ID: ID da instância (painel Z-API)
 * - ZAPI_TOKEN: Token da instância (painel Z-API)
 * - ZAPI_CLIENT_TOKEN: Security token (painel Z-API → Security Token) — opcional mas recomendado
 */

const getBase = () =>
  `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`

function headers() {
  return {
    "Content-Type": "application/json",
    ...(process.env.ZAPI_CLIENT_TOKEN ? { "Client-Token": process.env.ZAPI_CLIENT_TOKEN } : {}),
  }
}

// ═══════════════════════════════════════════════════════════════
// STATUS & QR CODE
// ═══════════════════════════════════════════════════════════════

/** Retorna { value: "Connected" | "Disconnected" | ... } */
export async function getInstanceStatus(): Promise<{ value: string }> {
  const res = await fetch(`${getBase()}/status`, { headers: headers() })
  if (!res.ok) throw new Error(`Z-API status failed: ${res.status}`)
  return res.json()
}

/** Retorna { value: "base64..." } — use apenas quando desconectado */
export async function getQrCode(): Promise<{ value: string }> {
  const res = await fetch(`${getBase()}/qr-code/image`, { headers: headers() })
  if (!res.ok) throw new Error(`Z-API QR code failed: ${res.status}`)
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// SEND MESSAGES
// ═══════════════════════════════════════════════════════════════

export async function sendTextMessage(to: string, text: string): Promise<boolean> {
  const { normalizePhone } = await import("./phone")
  const phone = normalizePhone(to)

  const url = `${getBase()}/send-text`
  const payload = { phone, message: text }

  console.log(`[Z-API] Sending to ${phone} — URL: ${url.replace(/token\/[^/]+/, "token/***")}`)
  console.log(`[Z-API] Payload: ${JSON.stringify(payload).slice(0, 200)}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    console.error(`[Z-API] Send ${isAbort ? "timed out (15s)" : "fetch error"}:`, isAbort ? "" : err)
    return false
  } finally {
    clearTimeout(timeout)
  }

  const responseText = await res.text()
  console.log(`[Z-API] Response (${res.status}): ${responseText.slice(0, 300)}`)

  if (!res.ok) {
    console.error(`[Z-API] Send failed (${res.status}):`, responseText)
    return false
  }

  return true
}

// ═══════════════════════════════════════════════════════════════
// DISCONNECT
// ═══════════════════════════════════════════════════════════════

export async function disconnectInstance(): Promise<boolean> {
  const res = await fetch(`${getBase()}/disconnect`, {
    method: "DELETE",
    headers: headers(),
  })
  return res.ok
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function isConfigured(): boolean {
  return Boolean(process.env.ZAPI_INSTANCE_ID) && Boolean(process.env.ZAPI_TOKEN)
}

/**
 * Verifica se o webhook veio do Z-API.
 * ZAPI_WEBHOOK_SECRET é opcional — se não configurado, aceita tudo.
 * (ZAPI_CLIENT_TOKEN é usado apenas pra chamadas de API, não pra verificar webhooks)
 */
export function verifyWebhook(req: Request): boolean {
  const secret = process.env.ZAPI_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[Z-API] ZAPI_WEBHOOK_SECRET not configured — accepting all webhooks (insecure)")
    return true
  }
  const incoming = req.headers.get("client-token") || req.headers.get("x-webhook-secret") || ""
  return incoming === secret
}
