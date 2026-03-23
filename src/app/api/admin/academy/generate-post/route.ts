import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { postType, niche, topic } = await req.json()

    const prompts: Record<string, string> = {
      legenda: `Crie uma legenda profissional para Instagram de um personal trainer especializado em ${niche}.
${topic ? `Tema: ${topic}` : "Escolha um tema relevante."}

Regras:
- Comece com um gancho forte (pergunta ou afirmação impactante)
- 3-4 parágrafos curtos
- Inclua emojis estratégicos (não exagere)
- Termine com CTA (chamada para ação)
- Adicione 15-20 hashtags relevantes no final
- Tom: profissional mas acessível
- Máximo 2200 caracteres`,

      carrossel: `Crie o conteúdo para um carrossel de Instagram (8-10 slides) para um personal trainer de ${niche}.
${topic ? `Tema: ${topic}` : "Escolha um tema educativo."}

Formato:
SLIDE 1 (CAPA): Título impactante + subtítulo
SLIDE 2-8: Um ponto por slide (frase curta + explicação em 1-2 linhas)
SLIDE FINAL: CTA + hashtags

Regras:
- Frases curtas e diretas (cabe num slide)
- Informação acionável e prática
- Tom educativo e profissional`,

      reels: `Crie um roteiro de Reels/TikTok para um personal trainer de ${niche}.
${topic ? `Tema: ${topic}` : "Escolha um tema viral."}

Formato:
GANCHO (0-3s): Frase que prende atenção
CONTEÚDO (3-30s): 3-5 pontos rápidos
CTA (30-60s): Chamada para ação
LEGENDA: Texto para a descrição do vídeo
HASHTAGS: 10-15 hashtags

Regras:
- Gancho nos primeiros 3 segundos é OBRIGATÓRIO
- Linguagem direta, ritmo rápido
- Inclua indicações de corte/transição entre pontos`,

      stories: `Crie um roteiro de sequência de Stories (5-7 stories) para um personal trainer de ${niche}.
${topic ? `Tema: ${topic}` : "Escolha um tema engajador."}

Formato para cada story:
STORY 1: [Tipo: texto/enquete/quiz] Conteúdo
STORY 2: [Tipo] Conteúdo
...
STORY FINAL: [CTA com link/DM]

Regras:
- Inclua pelo menos 1 enquete ou quiz para engajamento
- Alterne entre texto, foto sugerida e interação
- Último story SEMPRE tem CTA`,

      bio: `Crie 5 opções de bio profissional para Instagram de um personal trainer de ${niche}.
${topic ? `Informações adicionais: ${topic}` : ""}

Para cada opção inclua:
- Nome de exibição sugerido
- Bio (máx 150 caracteres)
- CTA sugerido para o link da bio

Regras:
- Inclua emoji estratégico
- Mencione a especialidade/nicho
- Inclua credencial (CREF ou similar)
- Uma linha com diferencial único`,

      hashtags: `Gere 3 grupos de hashtags para um personal trainer de ${niche}.
${topic ? `Contexto: ${topic}` : ""}

Formato:
GRUPO 1 — ALTO ALCANCE (500k+ posts): 10 hashtags populares
GRUPO 2 — MÉDIO ALCANCE (50k-500k posts): 10 hashtags de nicho
GRUPO 3 — BAIXO ALCANCE (<50k posts): 10 hashtags específicas/locais

Regras:
- Todas em português
- Mix de hashtags genéricas e específicas do nicho
- Inclua hashtags de localização (Fortaleza, Ceará, Brasil)`,

      estrategia: `Você é um consultor de marketing especializado em personal trainers e profissionais de fitness.

Pergunta do personal trainer: ${topic}

Responda de forma prática e acionável:
- Dê passos concretos (não genéricos)
- Inclua exemplos reais
- Considere o mercado brasileiro
- Sugira ferramentas/apps quando relevante
- Máximo 500 palavras
- Use português brasileiro casual mas profissional`,
    }

    const prompt = prompts[postType] || prompts.legenda

    const result = await generateText({
      model: freeModel,
      prompt,
    })

    return NextResponse.json({ text: result.text.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("Academy generate error:", msg)
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
