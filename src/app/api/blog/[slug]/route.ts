import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ slug: string }> }

// GET /api/blog/[slug] — buscar post por slug (público, só PUBLISHED)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        category: true,
        tags: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        trainer: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("GET /api/blog/[slug] error:", error)
    return NextResponse.json({ error: "Falha ao buscar post" }, { status: 500 })
  }
}

// PUT /api/blog/[slug] — atualizar post (admin)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
    const { slug } = await params
    const body = await req.json()

    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    const { title, slug: newSlug, excerpt, content, coverImage, category, tags, status, publishedAt } = body

    const post = await prisma.blogPost.update({
      where: { slug },
      data: {
        ...(title !== undefined && { title }),
        ...(newSlug !== undefined && { slug: newSlug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(coverImage !== undefined && { coverImage }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && { status }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
        // Auto-set publishedAt quando publicar pela primeira vez
        ...(status === "PUBLISHED" && !existing.publishedAt && { publishedAt: new Date() }),
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("PUT /api/blog/[slug] error:", error)
    return NextResponse.json({ error: "Falha ao atualizar post" }, { status: 500 })
  }
}

// DELETE /api/blog/[slug] — deletar post (admin)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
    const { slug } = await params

    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    await prisma.blogPost.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/blog/[slug] error:", error)
    return NextResponse.json({ error: "Falha ao deletar post" }, { status: 500 })
  }
}
