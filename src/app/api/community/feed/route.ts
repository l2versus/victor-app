import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    // Get trainerId for data isolation + current student
    let trainerId: string | undefined
    let currentStudentId: string | null = null
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { id: true, trainerId: true },
      })
      trainerId = student?.trainerId
      currentStudentId = student?.id ?? null
    } else {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      trainerId = trainer?.id
      const adminSt = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      currentStudentId = adminSt?.id ?? null
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50)

    // Smart feed: get who I follow
    const following = currentStudentId
      ? await prisma.follow.findMany({
          where: { followerId: currentStudentId },
          select: { followingId: true },
        })
      : []
    const followingIds = following.map((f) => f.followingId)
    const hasFollows = followingIds.length > 0

    // Build WHERE clause:
    // - If follows someone: posts from followed users + my own + admin posts
    // - If follows nobody: all posts from same trainer + admin posts (discovery mode)
    const whereClause = trainerId
      ? hasFollows
        ? {
            OR: [
              { studentId: { in: [...followingIds, ...(currentStudentId ? [currentStudentId] : [])] } },
              { studentId: null }, // admin posts always visible
            ],
          }
        : { OR: [{ student: { trainerId } }, { studentId: null }] }
      : {}

    const posts = await prisma.communityPost.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }],
      where: whereClause,
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
          take: 5, // For "liked by" social proof
        },
        comments: {
          include: {
            student: { include: { user: { select: { name: true, avatar: true } } } },
          },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
        _count: {
          select: { likes: true, comments: true, views: true },
        },
      },
    })

    const hasMore = posts.length > limit
    let items = hasMore ? posts.slice(0, limit) : posts

    // Engagement boost: sort by recency + engagement score
    // Score = likes*2 + comments*3 + recency bonus (last 6h = max boost)
    const now = Date.now()
    items = [...items].sort((a, b) => {
      const ageA = (now - new Date(a.createdAt).getTime()) / 3600000 // hours
      const ageB = (now - new Date(b.createdAt).getTime()) / 3600000
      const engA = a._count.likes * 2 + a._count.comments * 3
      const engB = b._count.likes * 2 + b._count.comments * 3
      const recencyA = Math.max(0, 1 - ageA / 48) // decays over 48h
      const recencyB = Math.max(0, 1 - ageB / 48)
      const scoreA = engA + recencyA * 10
      const scoreB = engB + recencyB * 10
      return scoreB - scoreA
    })

    // Resolve primary trainer for admin posts (the one with students)
    const primaryTrainer = await prisma.trainerProfile.findFirst({
      orderBy: { students: { _count: "desc" } },
      select: {
        userId: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    })
    const trainerUser = primaryTrainer
      ? primaryTrainer.user
      : await prisma.user.findFirst({
          where: { role: "ADMIN" },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, avatar: true },
        })
    const adminStudent = trainerUser ? await prisma.student.findUnique({
      where: { userId: trainerUser.id },
      select: { id: true },
    }) : null

    // Collect liker info for social proof (name + avatar)
    const likerStudentIds = new Set<string>()
    for (const post of items) {
      for (const like of post.likes) {
        if (like.studentId !== currentStudentId) likerStudentIds.add(like.studentId)
      }
    }
    const likerInfo = new Map<string, { name: string; avatar: string | null }>()
    if (likerStudentIds.size > 0) {
      const likers = await prisma.student.findMany({
        where: { id: { in: [...likerStudentIds] } },
        select: { id: true, user: { select: { name: true, avatar: true } } },
      })
      for (const l of likers) likerInfo.set(l.id, { name: l.user.name.split(" ")[0], avatar: l.user.avatar })
    }

    // Sanitize imageUrl: treat expired Vercel Blob URLs and invalid values as null
    const sanitizeImageUrl = (url: string | null): string | null => {
      if (!url) return null
      if (!url.startsWith("http")) return null
      try {
        const parsed = new URL(url)
        const token = parsed.searchParams.get("token")
        if (token) {
          const parts = token.split(".")
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            if (payload.exp && payload.exp * 1000 < Date.now()) return null
          }
        }
      } catch {
        // URL parse failed — still return it, browser will handle 404
      }
      return url
    }

    const feed = items.map((post) => {
      const reactionCounts = { CLAP: 0, FIRE: 0, MUSCLE: 0 }
      const userReactions: string[] = []
      for (const r of post.reactions) {
        reactionCounts[r.type]++
        if (r.studentId === currentStudentId) userReactions.push(r.type)
      }

      const isAdminPost = !post.studentId

      // Social proof: likers with name + avatar (Instagram style)
      const likedBy = post.likes
        .filter((l) => l.studentId !== currentStudentId)
        .slice(0, 3)
        .map((l) => likerInfo.get(l.studentId) || { name: "Alguém", avatar: null })

      return {
        id: post.id,
        type: post.type,
        content: post.content,
        imageUrl: sanitizeImageUrl(post.imageUrl),
        metadata: post.metadata,
        studentId: isAdminPost ? (adminStudent?.id ?? null) : post.studentId,
        studentName: post.student?.user.name ?? trainerUser?.name ?? "Personal",
        studentAvatar: post.student?.user.avatar ?? trainerUser?.avatar ?? null,
        reactionCounts,
        userReactions,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        viewsCount: post._count.views,
        isLiked: post.likes.some((l) => l.studentId === currentStudentId),
        likedBy,
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
      hasFollows,
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
