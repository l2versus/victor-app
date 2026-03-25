import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { embed } from "ai"
import { prisma } from "@/lib/prisma"

// ─── Embedding Model — Google gemini-embedding-001 (free, 3072 dims) ─────────

function getEmbeddingModel() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  return google.textEmbeddingModel("gemini-embedding-001")
}

/** Generate embedding vector for a text string */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel()
  const { embedding } = await embed({ model, value: text })
  return embedding
}

// ─── Cosine Similarity ──────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dotProduct / denom
}

// ─── RAG Search — find relevant documents ────────────────────────────────────

export type RAGResult = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  imageUrl: string | null
  sourceUrl: string | null
  score: number
}

/**
 * Search knowledge base for documents relevant to a query.
 * Uses embedding similarity + keyword matching for best results.
 */
export async function searchKnowledge(
  trainerId: string,
  query: string,
  options?: { limit?: number; minScore?: number; categories?: string[] }
): Promise<RAGResult[]> {
  const limit = options?.limit ?? 5
  const minScore = options?.minScore ?? 0.3

  // Load all documents with embeddings for this trainer
  const where: Record<string, unknown> = { trainerId }
  if (options?.categories?.length) {
    where.category = { in: options.categories }
  }

  const documents = await prisma.knowledgeDocument.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      tags: true,
      imageUrl: true,
      sourceUrl: true,
      embedding: true,
    },
  })

  if (documents.length === 0) return []

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // Score each document by embedding similarity
  const scored = documents
    .filter(doc => doc.embedding.length > 0)
    .map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      imageUrl: doc.imageUrl,
      sourceUrl: doc.sourceUrl,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }))

  // Also boost documents with keyword matches in title/tags
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  for (const doc of scored) {
    const titleLower = doc.title.toLowerCase()
    const tagsLower = doc.tags.map(t => t.toLowerCase())
    for (const word of queryWords) {
      if (titleLower.includes(word)) doc.score += 0.1
      if (tagsLower.some(t => t.includes(word))) doc.score += 0.05
    }
  }

  // Sort by score, filter by minimum, return top N
  return scored
    .filter(d => d.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Build RAG context string to inject into AI system prompt.
 * Formats relevant documents as context the AI can reference.
 */
export function buildRAGContext(results: RAGResult[]): string {
  if (results.length === 0) return ""

  const docs = results.map((r, i) => {
    let entry = `[${i + 1}] ${r.title} (${r.category})`
    entry += `\n${r.content}`
    if (r.imageUrl) entry += `\n[Imagem: ${r.imageUrl}]`
    if (r.sourceUrl) entry += `\n[Fonte: ${r.sourceUrl}]`
    return entry
  }).join("\n\n")

  return `\nBASE DE CONHECIMENTO (use estas informações para responder com precisão):
${docs}

IMPORTANTE: Quando usar informações da base de conhecimento, cite a fonte naturalmente.
Se houver imagem relevante, mencione que o aluno pode ver a foto de referência.`
}
