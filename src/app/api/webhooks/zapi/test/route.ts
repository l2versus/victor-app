import { NextRequest, NextResponse } from "next/server"
import { sendTextMessage } from "@/lib/zapi"

// GET /api/webhooks/zapi/test?phone=5585999999999 — teste isolado de envio
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || "5585999999999"

  console.log("[Z-API TEST] Env check:", {
    hasInstanceId: !!process.env.ZAPI_INSTANCE_ID,
    hasToken: !!process.env.ZAPI_TOKEN,
    hasClientToken: !!process.env.ZAPI_CLIENT_TOKEN,
  })

  try {
    const ok = await sendTextMessage(phone, "Teste automatico Z-API ✅")
    console.log("[Z-API TEST] sendTextMessage result:", ok)
    return NextResponse.json({ success: ok, phone })
  } catch (err) {
    console.error("[Z-API TEST] Error:", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
