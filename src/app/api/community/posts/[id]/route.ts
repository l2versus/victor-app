import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifySocial } from "@/lib/social-notifications"

// POST /api/community/posts/[id] — like/unlike or comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: postId } = await params

    // Resolve student (or create proxy for admin to participate in community)
    let student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })

    // Admin gets a "community proxy" student record to interact
    if (!student && session.role === "ADMIN") {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      if (trainer) {
        student = await prisma.student.upsert({
          where: { userId: session.userId },
          create: {
            userId: session.userId,
            trainerId: trainer.id,
            goals: "Personal Trainer",
            status: "ACTIVE",
          },
          update: {},
          select: { id: true },
        })
      }
    }

    if (!student) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
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

      // Notify post author
      const likedPost = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: { student: { include: { user: { select: { id: true, name: true } } } } },
      })
      if (likedPost?.student && likedPost.student.userId !== session.userId) {
        const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
        notifySocial({ toUserId: likedPost.student.userId, fromName: me?.name || "Alguém", type: "social_like", postContent: likedPost.content })
      }

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

      // Notify post author
      const commentedPost = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: { student: { select: { userId: true } } },
      })
      if (commentedPost?.student && commentedPost.student.userId !== session.userId) {
        const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
        notifySocial({ toUserId: commentedPost.student.userId, fromName: me?.name || "Alguém", type: "social_comment", commentContent: content.trim() })
      }

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

// DELETE /api/community/posts/[id] — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: postId } = await params

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { studentId: true },
    })

    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })

    // Only own posts or admin can delete
    const isOwner = me && post.studentId && post.studentId === me.id
    const isAdmin = session.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    await prisma.communityPost.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
