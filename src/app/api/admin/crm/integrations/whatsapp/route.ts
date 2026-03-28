import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

// GET /api/admin/crm/integrations/whatsapp — status
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    return NextResponse.json({
      configured: false,
      provider: null,
      status: "not_configured",
      message: "Nenhum provider de WhatsApp configurado. Configure Evolution API ou outro provider.",
    })
  } catch (error) {
    console.error("GET /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/integrations/whatsapp
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    return NextResponse.json({
      error: "Nenhum provider de WhatsApp configurado",
      configured: false,
    }, { status: 400 })
  } catch (error) {
    console.error("POST /api/admin/crm/integrations/whatsapp error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
