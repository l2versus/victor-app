import { NextRequest, NextResponse } from "next/server"
import { sendTextMessage } from "@/lib/zapi"
import { prisma } from "@/lib/prisma"
import { getStudentContextByPhone, generateBotResponse } from "@/lib/whatsapp-bot"

// GET /api/webhooks/zapi/test?phone=5585999999999 — teste isolado de envio
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || "5585999999999"
  const mode = req.nextUrl.searchParams.get("mode") || "send" // send | full

  console.log("[Z-API TEST] Env check:", {
    hasInstanceId: !!process.env.ZAPI_INSTANCE_ID,
    hasToken: !!process.env.ZAPI_TOKEN,
    hasClientToken: !!process.env.ZAPI_CLIENT_TOKEN,
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

  // Modo full: simula o fluxo completo do webhook (sem after)
  const steps: Record<string, unknown> = {}

  try {
    // Step 1: DB — buscar aluno
    steps.step1_start = "getStudentContextByPhone"
    const studentData = await getStudentContextByPhone(phone)
    steps.step1_result = studentData ? "found" : "not_found"

    if (!studentData) {
      // Step 2: DB — buscar trainer
      steps.step2_start = "findTrainer"
      const trainer = await prisma.trainerProfile.findFirst({
        select: { id: true, userId: true },
        orderBy: { createdAt: "asc" },
      })
      steps.step2_result = trainer ? `found (${trainer.id})` : "not_found"

      // Step 3: AI — gerar resposta de lead
      steps.step3_start = "generateLeadResponse"
      const { generateLeadResponse } = await import("@/lib/whatsapp-bot")
      let reply = await generateLeadResponse("oi quero saber precos", "QA Teste", [])
      steps.step3_result = reply ? `ok (${reply.slice(0, 50)}...)` : "null_fallback"

      if (!reply) {
        reply = "Oi! Sou o Victor Oliveira, personal trainer 💪"
      }

      // Step 4: Z-API — enviar resposta
      steps.step4_start = "sendTextMessage"
      const ok = await sendTextMessage(phone, reply)
      steps.step4_result = ok ? "sent" : "failed"

      return NextResponse.json({ success: ok, flow: "lead", steps })
    }

    // Aluno encontrado
    steps.step2_start = "generateBotResponse"
    const botResponse = await generateBotResponse("oi teste", studentData.context)
    steps.step2_result = botResponse ? `ok (${botResponse.slice(0, 50)}...)` : "empty"

    steps.step3_start = "sendTextMessage"
    const ok = await sendTextMessage(phone, botResponse)
    steps.step3_result = ok ? "sent" : "failed"

    return NextResponse.json({ success: ok, flow: "student", steps })
  } catch (err) {
    steps.error = String(err)
    console.error("[Z-API TEST FULL] Error:", err)
    return NextResponse.json({ success: false, steps }, { status: 500 })
  }
}
