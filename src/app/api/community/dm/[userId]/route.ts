import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/dm/[userId] — get message thread with a user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { userId: partnerId } = await params

    const messages = await prisma.directMessage.findMany({
      where: {
        channel: "APP",
        OR: [
          { senderId: session.userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        sender: { select: { name: true, avatar: true } },
      },
    })

    // Mark unread received messages as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: session.userId,
        channel: "APP",
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    // Get partner info
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, avatar: true },
    })

    return NextResponse.json({
      partner,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        isMe: m.senderId === session.userId,
        senderName: m.sender.name,
        senderAvatar: m.sender.avatar,
        readAt: m.readAt,
        createdAt: m.createdAt,
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
