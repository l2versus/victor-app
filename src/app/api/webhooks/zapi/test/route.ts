import { NextRequest, NextResponse } from "next/server"
import { sendTextMessage } from "@/lib/zapi"
import { processIncomingMessage } from "@/lib/whatsapp-processor"

// GET /api/webhooks/zapi/test?phone=5585999999999&mode=send|full&secret=xxx — teste de envio e fluxo completo
export async function GET(req: NextRequest) {
  // Proteger endpoint: requer ZAPI_WEBHOOK_SECRET como query param em produção
  const secret = req.nextUrl.searchParams.get("secret")
  const expectedSecret = process.env.ZAPI_WEBHOOK_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized — pass ?secret=YOUR_ZAPI_WEBHOOK_SECRET" }, { status: 401 })
  }

  const phone = req.nextUrl.searchParams.get("phone") || "5585999999999"
  const mode = req.nextUrl.searchParams.get("mode") || "send"

  console.log("[Z-API TEST] Env check:", {
    hasInstanceId: !!process.env.ZAPI_INSTANCE_ID,
    hasToken: !!process.env.ZAPI_TOKEN,
    hasClientToken: !!process.env.ZAPI_CLIENT_TOKEN,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasEvolutionUrl: !!process.env.EVOLUTION_API_URL,
    hasMetaToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
  })

  // Modo simples: só envia
  if (mode === "send") {
    try {
      const ok = await sendTextMessage(phone, "Teste automatico Z-API ✅")
      return NextResponse.json({ success: ok, phone })
    } catch (err) {
      return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
  }

  // Modo full: simula o fluxo completo via processador centralizado
  try {
    const start = Date.now()
    const result = await processIncomingMessage({
      phone,
      senderName: "QA Teste",
      content: "oi quero saber precos",
      provider: "zapi",
    })
    const elapsed = Date.now() - start

    return NextResponse.json({
      success: result.success,
      result,
      elapsedMs: elapsed,
      phone,
    })
  } catch (err) {
    console.error("[Z-API TEST FULL] Error:", err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
