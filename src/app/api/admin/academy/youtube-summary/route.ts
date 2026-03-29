import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"
import { YoutubeTranscript } from "youtube-transcript"

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    // Try Portuguese first
    let transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" })

    // Fallback to English if Portuguese not available
    if (!transcripts || transcripts.length === 0) {
      transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" })
    }

    if (!transcripts || transcripts.length === 0) return null

    return transcripts.map(t => t.text).join(" ")
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "URL do YouTube inválida" }, { status: 400 })
    }

    // Try to get transcript
    const transcript = await fetchTranscript(videoId)

    if (!transcript) {
      return NextResponse.json({
        error: "Não foi possível extrair a transcrição. O vídeo pode não ter legendas disponíveis.",
      }, { status: 400 })
    }

    // Truncate to ~8000 chars to fit context window
    const truncated = transcript.length > 8000 ? transcript.substring(0, 8000) + "..." : transcript

    const result = await generateText({
      model: freeModel,
      prompt: `Você é um especialista em educação física, fisiologia do exercício e marketing para profissionais fitness.

Analise a transcrição do vídeo abaixo e gere:

1. **RESUMO EXECUTIVO** (3-5 frases do conteúdo principal)
2. **PONTOS-CHAVE** (5-10 bullets com as informações mais importantes)
3. **APLICAÇÃO PRÁTICA** (como um personal trainer pode usar esse conhecimento)
4. **IDEIAS DE CONTEÚDO** (3 ideias de posts/reels baseados nesse vídeo)

Use português brasileiro. Seja objetivo e prático.

TRANSCRIÇÃO:
${truncated}`,
    })

    return NextResponse.json({ summary: result.text.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("YouTube summary error:", msg)
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
