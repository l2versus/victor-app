import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/stories/highlights?studentId=xxx — list highlights for a student
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 })
    }

    const highlights = await prisma.storyHighlight.findMany({
      where: { studentId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      highlights: highlights.map(h => ({
        id: h.id,
        title: h.title,
        coverUrl: h.coverUrl,
        itemCount: h._count.items,
        items: h.items.map(i => ({
          id: i.id,
          imageUrl: i.imageUrl,
          caption: i.caption,
          createdAt: i.createdAt,
        })),
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/community/stories/highlights — create or add item to highlight
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const { action } = body // "create" | "add_item"

    if (action === "create") {
      const { title, coverUrl, imageUrl, caption } = body
      if (!title || !coverUrl) {
        return NextResponse.json({ error: "title and coverUrl required" }, { status: 400 })
      }

      // Max 10 highlights per user
      const count = await prisma.storyHighlight.count({ where: { studentId: me.id } })
      if (count >= 10) {
        return NextResponse.json({ error: "Máximo 10 destaques" }, { status: 400 })
      }

      const highlight = await prisma.storyHighlight.create({
        data: {
          studentId: me.id,
          title: title.slice(0, 30),
          coverUrl,
          items: imageUrl ? {
            create: { imageUrl, caption: caption?.slice(0, 200) || null },
          } : undefined,
        },
      })

      return NextResponse.json({ highlight: { id: highlight.id } }, { status: 201 })
    }

    if (action === "add_item") {
      const { highlightId, imageUrl, caption } = body
      if (!highlightId || !imageUrl) {
        return NextResponse.json({ error: "highlightId and imageUrl required" }, { status: 400 })
      }

      // Verify ownership
      const highlight = await prisma.storyHighlight.findUnique({
        where: { id: highlightId },
        select: { studentId: true },
      })
      if (!highlight || highlight.studentId !== me.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Max 30 items per highlight
      const itemCount = await prisma.storyHighlightItem.count({ where: { highlightId } })
      if (itemCount >= 30) {
        return NextResponse.json({ error: "Máximo 30 itens por destaque" }, { status: 400 })
      }

      const item = await prisma.storyHighlightItem.create({
        data: { highlightId, imageUrl, caption: caption?.slice(0, 200) || null },
      })

      return NextResponse.json({ item: { id: item.id } }, { status: 201 })
    }

    return NextResponse.json({ error: "action must be 'create' or 'add_item'" }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/community/stories/highlights — delete highlight or item
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { highlightId, itemId } = await req.json()

    if (itemId) {
      // Delete specific item
      const item = await prisma.storyHighlightItem.findUnique({
        where: { id: itemId },
        include: { highlight: { select: { studentId: true } } },
      })
      if (!item || item.highlight.studentId !== me.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      await prisma.storyHighlightItem.delete({ where: { id: itemId } })
      return NextResponse.json({ success: true })
    }

    if (highlightId) {
      // Delete entire highlight
      const highlight = await prisma.storyHighlight.findUnique({
        where: { id: highlightId },
        select: { studentId: true },
      })
      if (!highlight || highlight.studentId !== me.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      await prisma.storyHighlight.delete({ where: { id: highlightId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "highlightId or itemId required" }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
