import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentFeatures } from "@/lib/subscription"

// GET /api/community/stories — active stories from people I follow + my own
export async function GET() {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ stories: [] })

    // Get who I follow
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    })
    const followingIds = [me.id, ...follows.map((f) => f.followingId)]

    // Get active (non-expired) stories grouped by student
    const now = new Date()
    const stories = await prisma.story.findMany({
      where: {
        studentId: { in: followingIds },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
        views: { where: { studentId: me.id }, select: { id: true } },
        _count: { select: { views: true } },
      },
    })

    // Group by student
    const grouped = new Map<string, {
      studentId: string
      name: string
      avatar: string | null
      isMe: boolean
      hasUnviewed: boolean
      stories: Array<{
        id: string
        imageUrl: string
        caption: string | null
        viewCount: number
        isViewed: boolean
        createdAt: Date
        expiresAt: Date
      }>
    }>()

    for (const s of stories) {
      const key = s.studentId
      if (!grouped.has(key)) {
        grouped.set(key, {
          studentId: s.studentId,
          name: s.student.user.name,
          avatar: s.student.user.avatar,
          isMe: s.studentId === me.id,
          hasUnviewed: false,
          stories: [],
        })
      }
      const isViewed = s.views.length > 0
      const group = grouped.get(key)!
      if (!isViewed) group.hasUnviewed = true
      group.stories.push({
        id: s.id,
        imageUrl: s.imageUrl,
        caption: s.caption,
        viewCount: s._count.views,
        isViewed,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })
    }

    // Sort: my stories first, then unviewed, then viewed
    const result = Array.from(grouped.values()).sort((a, b) => {
      if (a.isMe) return -1
      if (b.isMe) return 1
      if (a.hasUnviewed && !b.hasUnviewed) return -1
      if (!a.hasUnviewed && b.hasUnviewed) return 1
      return 0
    })

    return NextResponse.json({ storyGroups: result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/community/stories — create a new story
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    // Free tier cannot create stories
    const features = await getStudentFeatures(me.id)
    if (!features.subscriptionStatus || features.subscriptionStatus === "EXPIRED") {
      return NextResponse.json({
        error: "Interagir na comunidade é exclusivo de planos pagos",
        upgradeUrl: "/upgrade"
      }, { status: 403 })
    }

    const { imageUrl, caption } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 })
    }

    // Limit: max 10 active stories per user
    const activeCount = await prisma.story.count({
      where: { studentId: me.id, expiresAt: { gt: new Date() } },
    })
    if (activeCount >= 10) {
      return NextResponse.json({ error: "Máximo 10 stories ativos" }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        studentId: me.id,
        imageUrl,
        caption: caption?.slice(0, 200) || null,
        expiresAt,
      },
    })

    return NextResponse.json({ story: { id: story.id } }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/community/stories — delete own story
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { storyId } = await req.json()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const story = await prisma.story.findUnique({ where: { id: storyId } })
    if (!story || story.studentId !== me.id) {
      return NextResponse.json({ error: "Story não encontrado" }, { status: 404 })
    }

    await prisma.story.delete({ where: { id: storyId } })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
