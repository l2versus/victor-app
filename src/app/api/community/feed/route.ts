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
      ...(trainerId ? { where: { OR: [{ student: { trainerId } }, { studentId: null }] } } : {}),
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

    // Get current student id for reaction/like highlights (works for both student and admin)
    const currentStudent = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    const currentStudentId = currentStudent?.id ?? null

    // Resolve admin's trainer profile for posts with null studentId
    const trainerUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, avatar: true },
    })
    // Get admin's student proxy for profile linking
    const adminStudent = trainerUser ? await prisma.student.findUnique({
      where: { userId: trainerUser.id },
      select: { id: true },
    }) : null

    const feed = items.map((post) => {
      // Count reactions by type
      const reactionCounts = { CLAP: 0, FIRE: 0, MUSCLE: 0 }
      const userReactions: string[] = []
      for (const r of post.reactions) {
        reactionCounts[r.type]++
        if (r.studentId === currentStudentId) userReactions.push(r.type)
      }

      // For admin posts (studentId null), use trainer info
      const isAdminPost = !post.studentId

      return {
        id: post.id,
        type: post.type,
        content: post.content,
        imageUrl: post.imageUrl,
        metadata: post.metadata,
        studentId: isAdminPost ? (adminStudent?.id ?? null) : post.studentId,
        studentName: post.student?.user.name ?? trainerUser?.name ?? "Victor Oliveira",
        studentAvatar: post.student?.user.avatar ?? trainerUser?.avatar ?? null,
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

    const body = await req.json()
    const { postId, type } = body

    if (!postId || !type || !["CLAP", "FIRE", "MUSCLE"].includes(type)) {
      return NextResponse.json({ error: "postId e type (CLAP|FIRE|MUSCLE) obrigatórios" }, { status: 400 })
    }

    // Resolve student (admin gets community proxy)
    let student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student && session.role === "ADMIN") {
      const trainer = await prisma.trainerProfile.findUnique({ where: { userId: session.userId }, select: { id: true } })
      if (trainer) {
        student = await prisma.student.upsert({
          where: { userId: session.userId },
          create: { userId: session.userId, trainerId: trainer.id, goals: "Personal Trainer", status: "ACTIVE" },
          update: {},
          select: { id: true },
        })
      }
    }
    if (!student) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
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
