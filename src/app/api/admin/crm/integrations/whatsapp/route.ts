import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import {
  createInstance, fetchInstances, getInstanceStatus,
  getQrCode, deleteInstance, logoutInstance,
  INSTANCE_NAME, isConfigured,
} from "@/lib/evolution-api"

// GET /api/admin/crm/integrations/whatsapp — status + QR code
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const action = new URL(req.url).searchParams.get("action")

    if (!isConfigured()) {
      return NextResponse.json({
        error: "Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY no .env",
        configured: false,
      }, { status: 400 })
    }

    // ─── STATUS ───
    if (action === "status") {
      try {
        const status = await Promise.race([
          getInstanceStatus(INSTANCE_NAME),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ])
        return NextResponse.json({ status: status.state || "unknown", instanceName: INSTANCE_NAME })
      } catch {
        return NextResponse.json({ status: "disconnected", instanceName: INSTANCE_NAME })
      }
    }

    // ─── QR CODE ───
    if (action === "qrcode") {
      try {
        const qr = await getQrCode(INSTANCE_NAME)
        return NextResponse.json({ qrcode: qr.base64, code: qr.code })
      } catch {
        return NextResponse.json({ error: "Não foi possível gerar QR code. Instância pode já estar conectada." }, { status: 400 })
      }
    }

    // ─── DEFAULT: full info ───
    const instances = await fetchInstances()
    const exists = instances.find((i: { instanceName: string }) => i.instanceName === INSTANCE_NAME)

    let status = "not_created"
    if (exists) {
      try {
        const state = await Promise.race([
          getInstanceStatus(INSTANCE_NAME),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ])
        status = state.state || "unknown"
      } catch {
        status = "timeout"
      }
    }

    return NextResponse.json({
      configured: true,
      instanceName: INSTANCE_NAME,
      exists: Boolean(exists),
      status,
    })
  } catch (error) {
    console.error("GET /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/integrations/whatsapp — connect (create instance + get QR)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const action = body.action || "connect"

    if (!isConfigured()) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 400 })
    }

    // ─── CONNECT (create instance + QR) ───
    if (action === "connect") {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/evolution`

      // Check if instance already exists
      const instances = await fetchInstances()
      const exists = instances.find((i: { instanceName: string }) => i.instanceName === INSTANCE_NAME)

      if (!exists) {
        await createInstance(INSTANCE_NAME, webhookUrl)
      }

      // Get QR code
      try {
        const qr = await getQrCode(INSTANCE_NAME)
        return NextResponse.json({
          success: true,
          qrcode: qr.base64,
          code: qr.code,
          instanceName: INSTANCE_NAME,
        })
      } catch {
        // Instance might already be connected
        const status = await getInstanceStatus(INSTANCE_NAME)
        return NextResponse.json({
          success: true,
          status: status.state,
          instanceName: INSTANCE_NAME,
          message: "Instância já conectada",
        })
      }
    }

    // ─── DISCONNECT ───
    if (action === "disconnect") {
      await logoutInstance(INSTANCE_NAME)
      return NextResponse.json({ success: true })
    }

    // ─── DELETE ───
    if (action === "delete") {
      await deleteInstance(INSTANCE_NAME)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
