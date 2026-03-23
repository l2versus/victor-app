import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"

// POST /api/admin/broadcasts/generate — AI generates broadcast text
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error("GOOGLE_AI_API_KEY not configured")
      return NextResponse.json({ error: "API de IA não configurada" }, { status: 500 })
    }

    const body = await req.json()
    const { occasion, audience, tone, customPrompt } = body as {
      occasion: string
      audience: string
      tone: string
      customPrompt?: string
    }

    const audienceDesc: Record<string, string> = {
      todos: "todos os alunos (homens e mulheres de várias idades)",
      mulheres: "alunas mulheres",
      homens: "alunos homens",
      idosos: "alunos da terceira idade (60+ anos)",
      inativos: "alunos que estão inativos/afastados do treino",
      jovens: "alunos jovens (18-30 anos)",
    }

    const occasionDesc: Record<string, string> = {
      aniversario: "mensagem de aniversário personalizada. Use {nome} para o nome do aluno.",
      natal: "mensagem de Natal e Boas Festas",
      ano_novo: "mensagem de Ano Novo com motivação para o próximo ano de treinos",
      dia_mulher: "mensagem do Dia Internacional da Mulher, celebrando a força feminina",
      dia_pais: "mensagem do Dia dos Pais",
      dia_maes: "mensagem do Dia das Mães",
      pascoa: "mensagem de Páscoa",
      motivacional: "mensagem motivacional para manter a disciplina nos treinos",
      retorno: "mensagem convidando o aluno a voltar aos treinos (está afastado)",
      promocao: "mensagem anunciando uma promoção especial nos planos",
      lembrete: "lembrete gentil sobre o treino de hoje",
      custom: customPrompt || "mensagem personalizada",
    }

    const toneDesc: Record<string, string> = {
      formal: "tom formal e profissional",
      casual: "tom casual e amigável, com emojis",
      motivacional: "tom extremamente motivacional e energético, com emojis de fogo e força",
      carinhoso: "tom carinhoso e acolhedor, mostrando cuidado genuíno",
    }

    const prompt = `Você é Victor, personal trainer profissional. Crie uma mensagem para enviar via WhatsApp/notificação para ${audienceDesc[audience] || audience}.

Ocasião: ${occasionDesc[occasion] || occasion}
Tom: ${toneDesc[tone] || tone}

Regras:
- Máximo 300 caracteres (mensagem curta para WhatsApp)
- Use {nome} como placeholder para o nome do aluno (será substituído automaticamente)
- Comece direto sem saudação genérica ("Olá" está ok, mas nada de "Prezado(a)")
- Seja autêntico, como um personal que conhece seus alunos
- Inclua emojis quando o tom permitir
- Se for motivacional, mencione treino/evolução/superação
- Termine com algo que convide à ação (responder, vir treinar, etc.)

Responda APENAS com a mensagem, sem explicações.`

    const result = await generateText({
      model: freeModel,
      prompt,
    })

    return NextResponse.json({ text: result.text.trim() })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Broadcast AI generate error:", errMsg, error)
    return NextResponse.json({ error: `Erro ao gerar texto: ${errMsg}` }, { status: 500 })
  }
}
