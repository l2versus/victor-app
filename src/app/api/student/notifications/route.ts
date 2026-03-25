import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// GET /api/student/notifications — list notifications with sender info
export async function GET() {
  try {
    const { student } = await requireStudent()

    const notifications = await prisma.notification.findMany({
      where: { userId: student.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unreadCount = notifications.filter(n => !n.read).length

    // Resolve sender avatars from metadata.fromStudentId
    const senderIds = new Set<string>()
    for (const n of notifications) {
      const meta = n.metadata as Record<string, string> | null
      if (meta?.fromStudentId) senderIds.add(meta.fromStudentId)
    }

    const senderMap = new Map<string, { name: string; avatar: string | null }>()
    if (senderIds.size > 0) {
      const senders = await prisma.student.findMany({
        where: { id: { in: [...senderIds] } },
        select: { id: true, user: { select: { name: true, avatar: true } } },
      })
      for (const s of senders) {
        senderMap.set(s.id, { name: s.user.name, avatar: s.user.avatar })
      }
    }

    // Check which senders the current user is following (for "Seguir de volta" button)
    const myFollowing = await prisma.follow.findMany({
      where: { followerId: student.id },
      select: { followingId: true },
    })
    const followingSet = new Set(myFollowing.map(f => f.followingId))

    const enriched = notifications.map(n => {
      const meta = n.metadata as Record<string, string> | null
      const senderId = meta?.fromStudentId || null
      const senderInfo = senderId ? senderMap.get(senderId) : null

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
        metadata: n.metadata,
        // Enriched sender info
        senderStudentId: senderId,
        senderName: senderInfo?.name || meta?.fromName || null,
        senderAvatar: senderInfo?.avatar || null,
        isFollowingSender: senderId ? followingSet.has(senderId) : false,
      }
    })

    return NextResponse.json({ notifications: enriched, unreadCount, myStudentId: student.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH /api/student/notifications — mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const body = await req.json().catch(() => ({}))

    // If ids provided, mark only those; otherwise mark all
    const where = body.ids?.length
      ? { userId: student.userId, id: { in: body.ids as string[] } }
      : { userId: student.userId, read: false }

    await prisma.notification.updateMany({ where, data: { read: true } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
