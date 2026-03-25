import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/stories/insights?storyId=xxx — viewers + replies for own story
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(req.url)
    const storyId = searchParams.get("storyId")
    if (!storyId) {
      return NextResponse.json({ error: "storyId required" }, { status: 400 })
    }

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Verify ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { studentId: true },
    })
    if (!story || story.studentId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get viewers with name + avatar
    const views = await prisma.storyView.findMany({
      where: { storyId },
      include: {
        student: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 50,
    })

    const viewers = views.map(v => ({
      studentId: v.studentId,
      name: v.student.user.name,
      avatar: v.student.user.avatar,
      viewedAt: v.viewedAt,
    }))

    // Get story replies — DMs that reference this story
    const replies = await prisma.directMessage.findMany({
      where: {
        receiverId: session.userId,
        content: { contains: "story" },
      },
      include: {
        sender: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    // Filter to only replies referencing this story (via content pattern)
    const storyReplies = replies
      .filter(r => r.content.includes("[Story reply]") || r.content.includes("reagiu ao seu story"))
      .map(r => ({
        id: r.id,
        senderName: r.sender.name,
        senderAvatar: r.sender.avatar,
        content: r.content.replace("[Story reply] ", ""),
        isReaction: r.content.includes("reagiu ao seu story"),
        createdAt: r.createdAt,
      }))

    return NextResponse.json({
      viewCount: viewers.length,
      viewers,
      replies: storyReplies,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
