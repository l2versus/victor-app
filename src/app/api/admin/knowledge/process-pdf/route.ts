import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { freeModel } from "@/lib/ai"
import * as pdfjsLib from "pdfjs-dist"

// Disable worker — serverless runs Node.js, not a browser.
// pdfjs-dist processes on the main thread without a worker in Node.
pdfjsLib.GlobalWorkerOptions.workerSrc = ""

// ─── PDF text extraction with enhanced error handling ──────────────────────
async function extractPdfText(data: Uint8Array): Promise<string> {
  try {
    const doc = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true,
    }).promise

    const pages: string[] = []

    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) => (item as { str: string }).str)
          .join(" ")

        if (text.trim()) pages.push(text)
      } catch (pageError) {
        console.warn(`⚠️ Error extracting page ${i}:`, pageError)
        continue
      }
    }

    return pages.join("\n\n")
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const isEncrypted = msg.includes("encrypted") || msg.includes("password") || msg.includes("security")

    throw new Error(
      isEncrypted
        ? "PDF_ENCRYPTED"
        : `PDF_EXTRACT_FAILED: ${msg}`
    )
  }
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
    console.log(`📄 Processing PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    const arrayBuffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    let rawText: string

    try {
      rawText = await extractPdfText(uint8)

      console.log(`✅ PDF text extracted: ${rawText.length} chars, ${rawText.split('\n\n').length} sections`)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error(`❌ PDF extraction error: ${errMsg}`)

      if (errMsg.startsWith("PDF_ENCRYPTED")) {
        return NextResponse.json(
          { error: "🔒 PDF está protegido com senha. Remova a proteção e tente novamente." },
          { status: 400 },
        )
      }

      if (errMsg.startsWith("PDF_EXTRACT_FAILED")) {
        const details = errMsg.replace("PDF_EXTRACT_FAILED:", "").trim()
        console.error(`⚠️ PDF extraction failed: ${details}`)
        return NextResponse.json(
          {
            error: `❌ Não consegui extrair texto deste PDF. Possíveis causas:\n• PDF é um documento escaneado sem OCR\n• PDF está corrompido\n• Formato não suportado\n\nDetalhes técnicos: ${details}`,
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: "❌ Erro ao processar PDF. Tente outro arquivo ou verifique se está corrompido." },
        { status: 400 },
      )
    }

    if (!rawText || rawText.trim().length < 50) {
      console.warn(`⚠️ PDF has insufficient text: ${rawText.trim().length} chars`)
      return NextResponse.json(
        {
          error: `⚠️ PDF tem muito pouco texto extraível (${rawText.trim().length} caracteres).\n\nIsso pode significar:\n• É um PDF de imagens escaneadas (precisa OCR)\n• Está protegido contra cópia\n• Está vazio ou corrompido\n\n💡 Dica: Se é um PDF escaneado, use um serviço OCR antes de enviar.`,
        },
        { status: 400 },
      )
    }

    // ── Step 2: Detect language ───────────────────────────────────────────
    const isEnglish = isLikelyEnglish(rawText)
    console.log(`🌍 Language detected: ${isEnglish ? "ENGLISH (will translate)" : "PORTUGUESE"}`)

    // Truncate for AI processing (Groq has context limits)
    const truncated = rawText.length > 12000
      ? rawText.substring(0, 12000) + "\n\n[...texto truncado para processamento...]"
      : rawText

    // ── Step 3: AI processing — translate + structure ─────────────────────
    console.log(`🤖 Starting AI processing (model: ${freeModel})...`)

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

    console.log(`✅ PDF processing complete:
      • Title: ${parsed.title}
      • Category: ${parsed.category}
      • Content length: ${parsed.content.length} chars
      • Tags: ${(parsed.tags || []).join(", ")}
      • Was translated: ${isEnglish ? "YES (EN→PT)" : "NO (already PT)"}
      • Key findings: ${(parsed.keyFindings || []).length}`)

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
