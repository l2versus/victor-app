import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getInstanceStatus, getQrCode, disconnectInstance, isConfigured } from "@/lib/zapi"

// GET /api/admin/crm/integrations/whatsapp — status + QR code
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const action = new URL(req.url).searchParams.get("action")

    if (!isConfigured()) {
      return NextResponse.json({
        error: "Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN no .env",
        configured: false,
      }, { status: 400 })
    }

    // ─── STATUS ───
    if (action === "status") {
      try {
        const result = await Promise.race([
          getInstanceStatus(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ])
        const connected = result.value?.toLowerCase().includes("connect")
        return NextResponse.json({ status: connected ? "open" : "close", raw: result.value })
      } catch {
        return NextResponse.json({ status: "disconnected" })
      }
    }

    // ─── QR CODE ───
    if (action === "qrcode") {
      try {
        const qr = await getQrCode()
        return NextResponse.json({ qrcode: qr.value })
      } catch {
        return NextResponse.json(
          { error: "Não foi possível gerar QR code. Instância pode já estar conectada." },
          { status: 400 }
        )
      }
    }

    // ─── DEFAULT: full info ───
    try {
      const result = await Promise.race([
        getInstanceStatus(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
      ])
      const connected = result.value?.toLowerCase().includes("connect")
      return NextResponse.json({
        configured: true,
        provider: "zapi",
        status: connected ? "open" : "close",
        raw: result.value,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/zapi`,
      })
    } catch {
      return NextResponse.json({ configured: true, provider: "zapi", status: "timeout" })
    }
  } catch (error) {
    console.error("GET /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/integrations/whatsapp
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const action = body.action || "connect"

    if (!isConfigured()) {
      return NextResponse.json({ error: "Z-API não configurada" }, { status: 400 })
    }

    // ─── CONNECT → retorna QR code ───
    if (action === "connect") {
      try {
        const status = await getInstanceStatus()
        const connected = status.value?.toLowerCase().includes("connect")
        if (connected) {
          return NextResponse.json({ success: true, status: "open", message: "Instância já conectada" })
        }
      } catch { /* não conectado, continua para QR */ }

      try {
        const qr = await getQrCode()
        return NextResponse.json({ success: true, qrcode: qr.value })
      } catch {
        return NextResponse.json({ error: "Erro ao obter QR code" }, { status: 500 })
      }
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      await disconnectInstance()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
