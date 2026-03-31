import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"

// ─── PDF text extraction ────────────────────────────────────────────────────
// pdf-parse requires dynamic import to avoid webpack issues with test file
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse") as any).default
  const data = await pdfParse(buffer)
  return data.text
}

// ─── Language detection (simple heuristic) ──────────────────────────────────
function isLikelyEnglish(text: string): boolean {
  const sample = text.substring(0, 2000).toLowerCase()
  const enWords = [
    "the ", "and ", "this ", "that ", "with ", "from ", "were ", "been ",
    "have ", "which ", "their ", "between ", "study ", "results ",
    "however", "therefore", "participants", "methods", "conclusion",
    "abstract", "introduction", "discussion", "significant",
    "muscle", "training", "exercise", "performance", "resistance",
  ]
  const ptWords = [
    " de ", " do ", " da ", " os ", " as ", " no ", " na ",
    " para ", " com ", " por ", " uma ", " que ", " dos ",
    " entre ", " mais ", " esta ", " este ", " foram ",
    "exercício", "treino", "músculo", "resultado", "estudo",
  ]

  let enScore = 0
  let ptScore = 0
  for (const w of enWords) if (sample.includes(w)) enScore++
  for (const w of ptWords) if (sample.includes(w)) ptScore++

  return enScore > ptScore
}

// ─── Categories ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  "EXERCISE", "MACHINE", "POSTURE", "NUTRITION",
  "SCIENCE", "PROTOCOL", "INJURY", "GENERAL",
]

// ─── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    // Read the PDF from the request (multipart form or raw binary)
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo PDF enviado" },
        { status: 400 },
      )
    }

    // Validate file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 },
      )
    }

    // Validate file size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "PDF muito grande. Máximo: 20MB" },
        { status: 400 },
      )
    }

    // ── Step 1: Extract text from PDF ─────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let rawText: string

    try {
      rawText = await extractPdfText(buffer)
    } catch {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do PDF. Verifique se o arquivo não está corrompido ou protegido." },
        { status: 400 },
      )
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF com pouco ou nenhum texto extraível. Verifique se não é um PDF de imagens (escaneado)." },
        { status: 400 },
      )
    }

    // ── Step 2: Detect language ───────────────────────────────────────────
    const isEnglish = isLikelyEnglish(rawText)

    // Truncate for AI processing (Groq has context limits)
    const truncated = rawText.length > 12000
      ? rawText.substring(0, 12000) + "\n\n[...texto truncado para processamento...]"
      : rawText

    // ── Step 3: AI processing — translate + structure ─────────────────────
    const translationInstruction = isEnglish
      ? `O texto está em INGLÊS. Você DEVE traduzir TODO o conteúdo para PORTUGUÊS BRASILEIRO no documento final.
Mantenha termos técnicos em inglês entre parênteses quando necessário (ex: "tempo sob tensão (time under tension)").`
      : `O texto está em português. Mantenha no mesmo idioma.`

    const { text: aiResult } = await generateText({
      model: freeModel,
      prompt: `Você é um especialista em educação física, fisiologia do exercício e nutrição esportiva.
Você recebeu o texto extraído de um artigo acadêmico/estudo científico em PDF.

${translationInstruction}

TEXTO DO PDF:
${truncated}

Analise o conteúdo e gere um documento de conhecimento estruturado para personal trainers.
Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
{
  "title": "Título claro e descritivo em PORTUGUÊS (mesmo que o original seja em inglês)",
  "content": "Resumo técnico completo em PORTUGUÊS BRASILEIRO (mínimo 300 palavras). Estruture assim:\n\n📋 OBJETIVO DO ESTUDO\n[resumo do objetivo]\n\n🔬 METODOLOGIA\n[participantes, protocolos, variáveis medidas]\n\n📊 RESULTADOS PRINCIPAIS\n[dados concretos com números, percentuais, efeitos significativos]\n\n💡 APLICAÇÃO PRÁTICA PARA PERSONAL TRAINERS\n[como usar esses achados na prescrição de treino]\n\n⚠️ LIMITAÇÕES\n[limitações do estudo]\n\n✅ CONCLUSÃO\n[conclusão principal em 2-3 frases]",
  "category": "UMA das categorias: ${CATEGORIES.join(", ")}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "originalLanguage": "${isEnglish ? "en" : "pt"}",
  "studyType": "tipo do estudo (ex: ensaio clínico randomizado, revisão sistemática, meta-análise, estudo observacional, etc.)",
  "authors": "autores principais (se identificáveis no texto)",
  "year": "ano de publicação (se identificável)",
  "keyFindings": ["achado principal 1 em uma frase", "achado principal 2", "achado principal 3"],
  "marketingInsights": ["insight para conteúdo de Instagram/marketing 1", "insight 2", "insight 3"]
}

Regras:
- TUDO em português brasileiro no título, conteúdo, tags e insights
- Se o estudo for em inglês, TRADUZA completamente
- Preserve números e dados estatísticos exatos
- Os marketingInsights devem ser frases curtas que um personal trainer pode usar em posts de Instagram, stories ou carrosséis
- As tags devem ser em português
- A categoria deve ser a mais adequada ao tema do estudo`,
    })

    // ── Step 4: Parse AI result ───────────────────────────────────────────
    let parsed: {
      title: string
      content: string
      category: string
      tags: string[]
      originalLanguage?: string
      studyType?: string
      authors?: string
      year?: string
      keyFindings?: string[]
      marketingInsights?: string[]
    }

    try {
      const cleaned = aiResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar conteúdo com IA. Tente novamente." },
        { status: 500 },
      )
    }

    // Validate category
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = "SCIENCE"
    }

    return NextResponse.json({
      title: parsed.title,
      content: parsed.content,
      category: parsed.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      sourceType: "pdf",
      originalLanguage: parsed.originalLanguage || (isEnglish ? "en" : "pt"),
      studyType: parsed.studyType || null,
      authors: parsed.authors || null,
      year: parsed.year || null,
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      marketingInsights: Array.isArray(parsed.marketingInsights) ? parsed.marketingInsights : [],
      fileName: file.name,
      fileSize: file.size,
      textLength: rawText.length,
      wasTranslated: isEnglish,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    console.error("Process PDF error:", msg)
    return NextResponse.json(
      { error: msg },
      { status: msg === "Unauthorized" ? 401 : 500 },
    )
  }
}
