import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { generateEmbedding } from "@/lib/rag"
import type { KnowledgeCategory } from "@/generated/prisma/client"

// GET /api/admin/knowledge — list all knowledge documents
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const category = req.nextUrl.searchParams.get("category")
    const search = req.nextUrl.searchParams.get("q")

    const where: Record<string, unknown> = { trainerId: trainer.id }
    if (category) where.category = category

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
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Client-side text search if query provided
    let filtered = documents
    if (search) {
      const q = search.toLowerCase()
      filtered = documents.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    const stats = {
      total: documents.length,
      byCategory: Object.fromEntries(
        ["EXERCISE", "MACHINE", "POSTURE", "NUTRITION", "SCIENCE", "PROTOCOL", "INJURY", "GENERAL"]
          .map(cat => [cat, documents.filter(d => d.category === cat).length])
      ),
    }

    return NextResponse.json({ documents: filtered, stats })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// POST /api/admin/knowledge — create a new knowledge document
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { title, content, category, tags, imageUrl, sourceUrl } = body as {
      title: string
      content: string
      category: string
      tags: string[]
      imageUrl?: string
      sourceUrl?: string
    }

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios" }, { status: 400 })
    }

    // Generate embedding for the document content
    const textForEmbedding = `${title}\n${tags?.join(", ") || ""}\n${content}`
    let embedding: number[] = []
    try {
      embedding = await generateEmbedding(textForEmbedding)
    } catch (err) {
      console.warn("Failed to generate embedding, saving without:", err)
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        trainerId: trainer.id,
        title: title.trim(),
        content: content.trim(),
        category: (category || "GENERAL") as KnowledgeCategory,
        tags: tags || [],
        imageUrl: imageUrl || null,
        sourceUrl: sourceUrl || null,
        embedding,
      },
    })

    return NextResponse.json({ document: doc })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// DELETE /api/admin/knowledge — delete a document
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    await prisma.knowledgeDocument.deleteMany({
      where: { id, trainerId: trainer.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
