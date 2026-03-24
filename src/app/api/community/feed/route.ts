import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    // Get trainerId for data isolation
    let trainerId: string | undefined
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { trainerId: true },
      })
      trainerId = student?.trainerId
    } else {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      trainerId = trainer?.id
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    const posts = await prisma.communityPost.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      ...(trainerId ? { where: { student: { trainerId } } } : {}),
      include: {
        student: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        reactions: {
          select: { type: true, studentId: true },
        },
        likes: {
          select: { studentId: true },
        },
        comments: {
          include: {
            student: { include: { user: { select: { name: true, avatar: true } } } },
          },
          orderBy: { createdAt: "asc" },
          take: 3, // Preview of latest comments
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    })

    const hasMore = posts.length > limit
    const items = hasMore ? posts.slice(0, limit) : posts

    // Get current student id for reaction/like highlights
    let currentStudentId: string | null = null
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      currentStudentId = student?.id ?? null
    }

    const feed = items.map((post) => {
      // Count reactions by type
      const reactionCounts = { CLAP: 0, FIRE: 0, MUSCLE: 0 }
      const userReactions: string[] = []
      for (const r of post.reactions) {
        reactionCounts[r.type]++
        if (r.studentId === currentStudentId) userReactions.push(r.type)
      }

      return {
        id: post.id,
        type: post.type,
        content: post.content,
        imageUrl: post.imageUrl,
        metadata: post.metadata,
        studentName: post.student?.user.name ?? "Victor Oliveira",
        studentAvatar: post.student?.user.avatar ?? null,
        reactionCounts,
        userReactions,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked: post.likes.some((l) => l.studentId === currentStudentId),
        comments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          studentName: c.student?.user.name ?? "Anônimo",
          studentAvatar: c.student?.user.avatar ?? null,
          createdAt: c.createdAt,
        })),
        createdAt: post.createdAt,
      }
    })

    return NextResponse.json({
      feed,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// React to a post (legacy — keep for backward compat)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Apenas alunos podem reagir" }, { status: 403 })
    }

    const body = await req.json()
    const { postId, type } = body

    if (!postId || !type || !["CLAP", "FIRE", "MUSCLE"].includes(type)) {
      return NextResponse.json({ error: "postId e type (CLAP|FIRE|MUSCLE) obrigatórios" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Toggle reaction (upsert/delete)
    const existing = await prisma.communityReaction.findUnique({
      where: {
        postId_studentId_type: { postId, studentId: student.id, type },
      },
    })

    if (existing) {
      await prisma.communityReaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: "removed" })
    }

    await prisma.communityReaction.create({
      data: { postId, studentId: student.id, type },
    })
    return NextResponse.json({ action: "added" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
