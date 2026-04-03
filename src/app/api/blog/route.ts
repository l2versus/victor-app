import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/blog — lista posts publicados (público)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    // Se pedir por status diferente de PUBLISHED, precisa ser admin
    if (status && status !== "PUBLISHED") {
      await requireAdmin()
    }

    const posts = await prisma.blogPost.findMany({
      where: status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("GET /api/blog error:", error)
    return NextResponse.json({ error: "Falha ao buscar posts" }, { status: 500 })
  }
}

// POST /api/blog — criar post (admin)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()

    const { title, slug, excerpt, content, coverImage, category, tags, status, publishedAt } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "title, slug e content são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar trainerId do admin
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: admin.userId },
      select: { id: true },
    })

    if (!trainer) {
      return NextResponse.json({ error: "Perfil de trainer não encontrado" }, { status: 404 })
    }

    const post = await prisma.blogPost.create({
      data: {
        trainerId: trainer.id,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        category: category || null,
        tags: tags || [],
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("POST /api/blog error:", error)
    return NextResponse.json({ error: "Falha ao criar post" }, { status: 500 })
  }
}
