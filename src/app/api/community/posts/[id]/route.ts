import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/community/posts/[id] — like/unlike or comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Apenas alunos" }, { status: 403 })
    }

    const { id: postId } = await params

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const { action } = body // "like" | "comment"

    if (action === "like") {
      // Toggle like
      const existing = await prisma.communityLike.findUnique({
        where: { postId_studentId: { postId, studentId: student.id } },
      })

      if (existing) {
        await prisma.communityLike.delete({ where: { id: existing.id } })
        return NextResponse.json({ liked: false })
      }

      await prisma.communityLike.create({
        data: { postId, studentId: student.id },
      })
      return NextResponse.json({ liked: true })
    }

    if (action === "comment") {
      const { content } = body
      if (!content?.trim()) {
        return NextResponse.json({ error: "Comentário vazio" }, { status: 400 })
      }

      const comment = await prisma.communityComment.create({
        data: { postId, studentId: student.id, content: content.trim() },
        include: {
          student: { include: { user: { select: { name: true, avatar: true } } } },
        },
      })

      return NextResponse.json({ comment }, { status: 201 })
    }

    return NextResponse.json({ error: "action deve ser 'like' ou 'comment'" }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/community/posts/[id] — get comments for a post
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id: postId } = await params

    const comments = await prisma.communityComment.findMany({
      where: { postId },
      include: {
        student: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    })

    return NextResponse.json({ comments })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
