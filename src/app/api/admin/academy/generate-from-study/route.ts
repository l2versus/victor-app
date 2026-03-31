import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title, content, postType, niche } = await req.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Título e conteúdo do estudo são obrigatórios" }, { status: 400 })
    }

    const truncatedContent = content.length > 4000
      ? content.substring(0, 4000) + "..."
      : content

    const prompts: Record<string, string> = {
      legenda: `Você é um social media manager de elite para personal trainers.

ESTUDO CIENTÍFICO para usar como base:
Título: ${title}
Conteúdo: ${truncatedContent}

Crie uma LEGENDA de Instagram transformando esse estudo em conteúdo acessível para o público.
Nicho: ${niche || "hipertrofia"}

Regras:
- Comece com gancho forte baseado nos resultados do estudo
- Traduza a ciência para linguagem simples (sem jargão acadêmico)
- 3-4 parágrafos curtos com emojis estratégicos
- Cite o estudo de forma casual ("Um estudo recente mostrou que...")
- Termine com CTA (chamada para ação — agende uma aula, mande DM, etc.)
- Adicione 15-20 hashtags relevantes
- Tom: profissional mas acessível, como quem traduz ciência em prática`,

      carrossel: `Você é um social media manager de elite para personal trainers.

ESTUDO CIENTÍFICO para usar como base:
Título: ${title}
Conteúdo: ${truncatedContent}

Crie um CARROSSEL de Instagram (8-10 slides) transformando esse estudo em conteúdo educativo.
Nicho: ${niche || "hipertrofia"}

Formato:
SLIDE 1 (CAPA): Pergunta ou afirmação impactante baseada no resultado do estudo
SLIDE 2: O que o estudo investigou (1-2 frases simples)
SLIDE 3-7: Resultados principais (1 dado por slide, linguagem simples)
SLIDE 8-9: Aplicação prática ("Como usar isso no seu treino")
SLIDE FINAL: CTA + "Salva esse post!" + hashtags

Regras:
- Frases CURTAS que cabem num slide
- Números e dados concretos do estudo
- Zero jargão acadêmico
- Cada slide deve fazer sentido sozinho
- Tom educativo e profissional`,

      reels: `Você é um social media manager de elite para personal trainers.

ESTUDO CIENTÍFICO para usar como base:
Título: ${title}
Conteúdo: ${truncatedContent}

Crie um ROTEIRO DE REELS transformando esse estudo em conteúdo viral.
Nicho: ${niche || "hipertrofia"}

Formato:
GANCHO (0-3s): Frase polêmica ou surpreendente baseada no resultado
CONTEXTO (3-10s): "Um estudo com X participantes mostrou que..."
RESULTADOS (10-30s): 2-3 dados impactantes, linguagem simples
APLICAÇÃO (30-45s): "Na prática, isso significa que você deve..."
CTA (45-60s): "Segue pra mais ciência aplicada ao treino"
LEGENDA: Texto para descrição
HASHTAGS: 10-15 hashtags

Regras:
- Gancho POLÊMICO nos primeiros 3s (tipo "X séries é DEMAIS pro seu treino")
- Ritmo rápido, cortes visuais sugeridos
- Linguagem de conversa, não de artigo`,

      stories: `Você é um social media manager de elite para personal trainers.

ESTUDO CIENTÍFICO para usar como base:
Título: ${title}
Conteúdo: ${truncatedContent}

Crie uma SEQUÊNCIA DE STORIES (6-8 stories) transformando esse estudo em conteúdo interativo.
Nicho: ${niche || "hipertrofia"}

Formato:
STORY 1: [Enquete] Pergunta provocativa baseada no tema do estudo
STORY 2: [Texto] "A ciência tem a resposta..."
STORY 3-5: [Texto] Resultados do estudo em linguagem simples (1 por story)
STORY 6: [Quiz] Pergunta sobre os resultados
STORY 7: [Texto] Aplicação prática
STORY 8: [CTA] "Quer um treino baseado em ciência? Manda DM"

Regras:
- Mínimo 2 interações (enquete, quiz, slider)
- Cada story = 1 ideia
- Tom de conversa casual`,
    }

    const prompt = prompts[postType] || prompts.legenda

    const result = await generateText({
      model: freeModel,
      prompt,
    })

    return NextResponse.json({ text: result.text.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("Generate from study error:", msg)
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
