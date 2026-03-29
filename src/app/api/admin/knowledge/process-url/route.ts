import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel, visionModel } from "@/lib/ai"
import { YoutubeTranscript } from "youtube-transcript"

// ─── YouTube helpers ──────────────────────────────────────────────────────────

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
    let transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" })
    if (!transcripts || transcripts.length === 0) {
      transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" })
    }
    if (!transcripts || transcripts.length === 0) return null
    return transcripts.map(t => t.text).join(" ")
  } catch {
    return null
  }
}

// ─── Website scraper (basic) ──────────────────────────────────────────────────

async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VictorApp/1.0)" },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Strip HTML tags, scripts, styles — extract readable text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()

    return text.length > 100 ? text : null
  } catch {
    return null
  }
}

// ─── Vision analysis (YouTube thumbnails) ────────────────────────────────────

async function analyzeVideoThumbnail(videoId: string): Promise<string | null> {
  // YouTube provides free thumbnails at multiple resolutions
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  try {
    // Download thumbnail (max 2MB)
    const imgRes = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(5000) })
    if (!imgRes.ok) return null
    const contentLength = Number(imgRes.headers.get("content-length") || 0)
    if (contentLength > 2 * 1024 * 1024) return null
    const buffer = await imgRes.arrayBuffer()
    if (buffer.byteLength > 2 * 1024 * 1024) return null
    const base64 = Buffer.from(buffer).toString("base64")

    const { text } = await generateText({
      model: visionModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:image/jpeg;base64,${base64}`,
            },
            {
              type: "text",
              text: `Analise esta thumbnail de um vídeo fitness/exercício.
Identifique:
- Exercício ou atividade mostrada (se visível)
- Equipamento ou máquina usada
- Posição corporal e postura
- Grupo muscular alvo
- Possíveis erros de execução visíveis
- Ambiente (academia, ar livre, estúdio)

Seja específico e técnico. Se não for um vídeo de exercício, descreva o conteúdo visual relevante para fitness/saúde.
Responda em português brasileiro.`,
            },
          ],
        },
      ],
    })

    return text.trim()
  } catch (err) {
    console.warn("Vision analysis failed:", err)
    return null
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

const CATEGORIES = ["EXERCISE", "MACHINE", "POSTURE", "NUTRITION", "SCIENCE", "PROTOCOL", "INJURY", "GENERAL"]

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { url } = await req.json()

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })
    }

    // Validate URL format and block SSRF
    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL deve ser http:// ou https://" }, { status: 400 })
      }
      // Block private/internal IPs
      const blocked = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0)/i
      if (blocked.test(parsed.hostname)) {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "URL inválida — use https://..." }, { status: 400 })
    }

    const videoId = extractVideoId(url)
    const isYouTube = !!videoId

    // ── Step 1: Extract content ─────────────────────────────────────────────
    let rawContent: string | null = null
    let visionAnalysis: string | null = null
    let sourceType: "youtube" | "website" = "website"

    if (isYouTube && videoId) {
      sourceType = "youtube"

      // Run transcript + vision in parallel
      const [transcript, vision] = await Promise.all([
        fetchTranscript(videoId),
        analyzeVideoThumbnail(videoId),
      ])

      rawContent = transcript
      visionAnalysis = vision

      if (!rawContent && !visionAnalysis) {
        return NextResponse.json({
          error: "Não foi possível extrair transcrição nem analisar o vídeo. Verifique se tem legendas disponíveis.",
        }, { status: 400 })
      }
    } else {
      // Website scraping
      rawContent = await scrapeWebsite(url)

      if (!rawContent) {
        return NextResponse.json({
          error: "Não foi possível extrair conteúdo do site. Verifique se a URL está correta.",
        }, { status: 400 })
      }
    }

    // ── Step 2: AI processing — generate structured knowledge document ──────
    const truncatedContent = rawContent
      ? rawContent.length > 8000 ? rawContent.substring(0, 8000) + "..." : rawContent
      : "(sem transcrição disponível)"

    const visionSection = visionAnalysis
      ? `\n\nANÁLISE VISUAL DO VÍDEO:\n${visionAnalysis}`
      : ""

    const { text: aiResult } = await generateText({
      model: freeModel,
      prompt: `Você é um especialista em educação física, fisiologia do exercício e nutrição esportiva.

Analise o conteúdo abaixo (extraído de ${sourceType === "youtube" ? "um vídeo do YouTube" : "um site"}) e gere um documento de conhecimento estruturado.

CONTEÚDO:
${truncatedContent}
${visionSection}

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
{
  "title": "Título descritivo e específico do conteúdo",
  "content": "Resumo técnico completo do conteúdo (mínimo 200 palavras). Inclua: conceitos principais, detalhes técnicos, aplicação prática para personal trainers, pontos de atenção, e conclusão. Organize com bullet points e parágrafos claros.",
  "category": "UMA das categorias: ${CATEGORIES.join(", ")}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Regras:
- O título deve ser claro e específico (não genérico)
- O conteúdo deve ser detalhado e útil para um personal trainer
- Escolha a categoria mais adequada ao tema
- Use 3-6 tags relevantes em português
- Se houver análise visual, incorpore os detalhes de postura/execução no conteúdo`,
    })

    // ── Step 3: Parse AI result ─────────────────────────────────────────────
    let parsed: { title: string; content: string; category: string; tags: string[] }
    try {
      // Clean potential markdown code blocks
      const cleaned = aiResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({
        error: "Erro ao processar conteúdo com IA. Tente novamente.",
      }, { status: 500 })
    }

    // Validate category
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = "GENERAL"
    }

    return NextResponse.json({
      title: parsed.title,
      content: parsed.content,
      category: parsed.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      sourceUrl: url,
      sourceType,
      hasVisionAnalysis: !!visionAnalysis,
      videoId: videoId || null,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("Process URL error:", msg)
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
