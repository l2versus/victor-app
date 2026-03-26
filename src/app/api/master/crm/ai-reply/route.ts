import { generateText } from "ai"
import { freeModel } from "@/lib/ai"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Auth via token (same as webhook)
    const token = req.nextUrl.searchParams.get("token")
    const envToken = process.env.MASTER_CRM_WEBHOOK_TOKEN
    if (!envToken || token !== envToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, name, context } = await req.json()

    if (!message) {
      return Response.json({ error: "Message required" }, { status: 400 })
    }

    const systemPrompt = `Voce e o assistente de vendas da ONEFIT, plataforma SaaS fitness para personal trainers, nutricionistas e academias.

SOBRE A ONEFIT:
- Plataforma white-label: o profissional tem seu proprio app com sua marca
- Treinos personalizados com timer, series, carga progressiva
- Modulo nutricional completo (planos alimentares, macros, aderencia)
- IA nativa: chat inteligente, bot pos-treino, analise de anamnese
- Comunidade social: feed, stories, rankings, desafios
- CRM de vendas integrado com WhatsApp
- Correcao postural por camera
- PWA (funciona como app nativo sem App Store)

PLANOS:
- Starter: R$97/mes — 1 profissional, 30 alunos
- Pro: R$197/mes — 3 profissionais, 100 alunos, IA, CRM, WhatsApp Bot
- Business: R$497/mes — ilimitado, white-label completo, dominio proprio

REGRAS:
- Responda em portugues brasileiro casual e profissional
- Maximo 2-3 frases (ManyChat tem limite de caracteres)
- Seja consultivo, tire duvidas com paciencia
- Recomende o plano Pro como melhor custo-beneficio
- Se perguntarem algo que nao sabe, diga "Vou passar para nosso time comercial te responder!"
- NUNCA invente features ou precos que nao existem
- Se a pessoa quiser assinar, direcione para o WhatsApp: (85) 9.9698-5823
${name ? `\nNome do lead: ${name}` : ""}
${context ? `\nContexto: ${context}` : ""}`

    const result = await generateText({
      model: freeModel,
      system: systemPrompt,
      prompt: message,
    })

    return Response.json({
      reply: result.text,
      status: "success",
    })
  } catch (error) {
    console.error("[AI Reply]", error)
    return Response.json({
      reply: "Oi! Tive um probleminha tecnico. Fala com nosso time no WhatsApp: (85) 9.9698-5823 que te ajudamos!",
      status: "fallback",
    })
  }
}
