/**
 * Evolution API Client — Conecta WhatsApp via QR Code
 *
 * Diferente da Meta Cloud API (oficial), a Evolution API permite
 * conectar qualquer número pessoal via QR code.
 *
 * Env vars necessárias:
 * - EVOLUTION_API_URL: URL base da instância Evolution (ex: https://evo.seuservidor.com)
 * - EVOLUTION_API_KEY: API key global
 */

const getBaseUrl = () => process.env.EVOLUTION_API_URL || ""
const getApiKey = () => process.env.EVOLUTION_API_KEY || ""

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: getApiKey(),
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function createInstance(instanceName: string, webhookUrl: string) {
  const res = await fetch(`${getBaseUrl()}/instance/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "CONNECTION_UPDATE",
        ],
      },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Evolution createInstance failed: ${error}`)
  }

  return res.json()
}

export async function fetchInstances(): Promise<Array<{ instanceName: string; instanceId: string; status: string }>> {
  const res = await fetch(`${getBaseUrl()}/instance/fetchInstances`, {
    method: "GET",
    headers: headers(),
  })

  if (!res.ok) return []
  return res.json()
}

export async function getInstanceStatus(instanceName: string): Promise<{ state: string }> {
  const res = await fetch(`${getBaseUrl()}/instance/connectionState/${instanceName}`, {
    method: "GET",
    headers: headers(),
  })

  if (!res.ok) throw new Error("Failed to get status")
  return res.json()
}

export async function getQrCode(instanceName: string): Promise<{ base64: string; code: string }> {
  const res = await fetch(`${getBaseUrl()}/instance/connect/${instanceName}`, {
    method: "GET",
    headers: headers(),
  })

  if (!res.ok) throw new Error("Failed to get QR code")
  return res.json()
}

export async function deleteInstance(instanceName: string) {
  const res = await fetch(`${getBaseUrl()}/instance/delete/${instanceName}`, {
    method: "DELETE",
    headers: headers(),
  })
  return res.ok
}

export async function logoutInstance(instanceName: string) {
  const res = await fetch(`${getBaseUrl()}/instance/logout/${instanceName}`, {
    method: "DELETE",
    headers: headers(),
  })
  return res.ok
}

// ═══════════════════════════════════════════════════════════════
// SEND MESSAGES
// ═══════════════════════════════════════════════════════════════

export async function sendTextMessage(instanceName: string, to: string, text: string) {
  // Normalizar número: remover +, espaços, hifens
  const number = to.replace(/\D/g, "")
  // Garantir que tem o 55 na frente
  const formattedNumber = number.startsWith("55") ? number : `55${number}`

  const res = await fetch(`${getBaseUrl()}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      number: formattedNumber,
      text,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("[Evolution] Send failed:", error)
    return false
  }

  return true
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const INSTANCE_NAME = "victor-app"

export function isConfigured(): boolean {
  return Boolean(getBaseUrl()) && Boolean(getApiKey())
}
