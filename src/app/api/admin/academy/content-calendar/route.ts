import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { niche, postsPerWeek } = await req.json()

    const totalPosts = Math.round((postsPerWeek / 7) * 30)
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    const result = await generateText({
      model: freeModel,
      prompt: `Gere um calendário de conteúdo de 30 dias para Instagram de um personal trainer de ${niche || "Hipertrofia"}.

Total de posts: ${totalPosts} posts em 30 dias (${postsPerWeek} por semana).

Responda APENAS com um JSON array válido (sem markdown, sem \`\`\`):
[
  {"day": 1, "weekday": "Seg", "type": "Carrossel", "topic": "título do post", "caption": "resumo da legenda em 1-2 frases"}
]

Regras:
- "type" deve ser: "Carrossel", "Reels", "Stories", "Post" ou "Live"
- Distribua os tipos de forma variada
- Os dias da semana são: ${weekdays.join(", ")}
- Comece na segunda-feira (Seg)
- Alterne temas: educação, motivação, bastidores, social proof, oferta
- Tópicos específicos do nicho ${niche || "Hipertrofia"}
- Captions em português brasileiro
- Retorne APENAS o JSON, nada mais`,
    })

    // Parse the JSON from the response
    let calendar = []
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        calendar = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({ error: "Erro ao processar calendário" }, { status: 500 })
    }

    return NextResponse.json({ calendar })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("Content calendar error:", msg)
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
