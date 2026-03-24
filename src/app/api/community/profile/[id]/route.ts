import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/profile/[id] — public profile of a student
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: studentId } = await params

    // Get current student (works for both student and admin proxy)
    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    const myStudentId = me?.id ?? null

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, avatar: true, createdAt: true } },
        _count: {
          select: {
            followers: true,
            following: true,
            communityPosts: true,
            sessions: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Check if I follow this person
    let isFollowing = false
    if (myStudentId && myStudentId !== studentId) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: myStudentId, followingId: studentId } },
      })
      isFollowing = !!follow
    }

    // Get posts by this student
    const posts = await prisma.communityPost.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        likes: { select: { studentId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    // Training stats (public)
    const [totalSessions, streak] = await Promise.all([
      prisma.workoutSession.count({
        where: { studentId, completedAt: { not: null } },
      }),
      (async () => {
        const sessions = await prisma.workoutSession.findMany({
          where: { studentId, completedAt: { not: null } },
          select: { startedAt: true },
          orderBy: { startedAt: "desc" },
          take: 52,
        })
        if (sessions.length === 0) return 0
        const now = new Date()
        let s = 0
        for (let w = 0; w < 52; w++) {
          const end = new Date(now); end.setDate(now.getDate() - w * 7)
          const start = new Date(end); start.setDate(end.getDate() - 7)
          if (sessions.some((sess) => sess.startedAt >= start && sess.startedAt < end)) s++
          else break
        }
        return s
      })(),
    ])

    return NextResponse.json({
      profile: {
        studentId: student.id,
        userId: student.userId,
        name: student.user.name,
        avatar: student.user.avatar,
        memberSince: student.user.createdAt,
        goals: student.goals,
        bio: student.bio,
        profession: student.profession,
        bioLink: student.bioLink,
        isMe: myStudentId === studentId,
        isFollowing,
        stats: {
          followers: student._count.followers,
          following: student._count.following,
          posts: student._count.communityPosts,
          sessions: totalSessions,
          streak,
        },
      },
      posts: posts.map((p) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        imageUrl: p.imageUrl,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        isLiked: myStudentId ? p.likes.some((l) => l.studentId === myStudentId) : false,
        createdAt: p.createdAt,
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

// PATCH /api/community/profile/[id] — edit own social profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: studentId } = await params

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })

    if (!me || me.id !== studentId) {
      return NextResponse.json({ error: "Só pode editar o próprio perfil" }, { status: 403 })
    }

    const body = await req.json()
    const { name, avatar, bio, profession, bioLink } = body

    // Update Student social fields
    const studentUpdate: Record<string, unknown> = {}
    if (bio !== undefined) studentUpdate.bio = (bio as string).slice(0, 150) || null
    if (profession !== undefined) studentUpdate.profession = (profession as string).slice(0, 60) || null
    if (bioLink !== undefined) studentUpdate.bioLink = (bioLink as string).slice(0, 200) || null

    if (Object.keys(studentUpdate).length > 0) {
      await prisma.student.update({ where: { id: studentId }, data: studentUpdate })
    }

    // Update User fields (name, avatar)
    const userUpdate: Record<string, unknown> = {}
    if (name?.trim()) userUpdate.name = (name as string).trim().slice(0, 80)
    if (avatar !== undefined) userUpdate.avatar = avatar || null

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: session.userId }, data: userUpdate })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
