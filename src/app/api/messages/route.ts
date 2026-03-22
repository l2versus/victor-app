import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"

// GET — list conversations or messages with a specific user
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const withUserId = searchParams.get("with") // specific conversation

    if (withUserId) {
      // Get messages between current user and target user
      const messages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: session.userId, receiverId: withUserId },
            { senderId: withUserId, receiverId: session.userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
        },
      })

      // Mark unread messages as read
      await prisma.directMessage.updateMany({
        where: {
          senderId: withUserId,
          receiverId: session.userId,
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          senderName: m.sender.name,
          senderAvatar: m.sender.avatar,
          isMe: m.senderId === session.userId,
          readAt: m.readAt,
          createdAt: m.createdAt,
        })),
      })
    }

    // List conversations — get latest message per conversation partner
    const allMessages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId },
          { receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } },
      },
    })

    // Group by conversation partner
    const conversationMap = new Map<string, typeof allMessages[number]>()
    for (const msg of allMessages) {
      const partnerId = msg.senderId === session.userId ? msg.receiverId : msg.senderId
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg)
      }
    }

    // Count unread per partner
    const unreadCounts = await prisma.directMessage.groupBy({
      by: ["senderId"],
      where: {
        receiverId: session.userId,
        readAt: null,
      },
      _count: true,
    })
    const unreadMap = new Map(unreadCounts.map((u) => [u.senderId, u._count]))

    const conversations = Array.from(conversationMap.entries()).map(([partnerId, lastMsg]) => {
      const partner = lastMsg.senderId === session.userId ? lastMsg.receiver : lastMsg.sender
      return {
        partnerId,
        partnerName: partner.name,
        partnerAvatar: partner.avatar,
        partnerRole: partner.role,
        lastMessage: lastMsg.content.length > 60 ? lastMsg.content.slice(0, 60) + "..." : lastMsg.content,
        lastMessageAt: lastMsg.createdAt,
        unreadCount: unreadMap.get(partnerId) || 0,
      }
    })

    // Sort by most recent message
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return NextResponse.json({ conversations })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { receiverId, content } = body

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "receiverId e content obrigatórios" }, { status: 400 })
    }

    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true },
    })
    if (!receiver) {
      return NextResponse.json({ error: "Destinatário não encontrado" }, { status: 404 })
    }

    // Students can only message admins, admins can message anyone
    if (session.role === "STUDENT" && receiver.role !== "ADMIN") {
      return NextResponse.json({ error: "Alunos só podem enviar mensagens para o treinador" }, { status: 403 })
    }

    // Get sender name for notification
    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    })
    const senderName = sender?.name || "Alguém"

    const message = await prisma.directMessage.create({
      data: {
        senderId: session.userId,
        receiverId,
        content: content.trim(),
      },
    })

    // Create in-app notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "new_message",
        title: `Mensagem de ${senderName}`,
        body: content.trim().slice(0, 120),
        metadata: { senderId: session.userId, messageId: message.id },
      },
    }).catch(() => {}) // non-blocking

    // Send push notification (non-blocking)
    sendPushToUser(receiverId, {
      title: `💬 ${senderName}`,
      body: content.trim().slice(0, 100),
      url: session.role === "ADMIN" ? "/admin/messages" : "/messages",
    }).catch(() => {})

    return NextResponse.json({ message }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ═══ PUSH HELPER ═══
async function sendPushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) return

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  // Find student by userId to get push subscriptions
  const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } })
  if (!student) return // Receiver is admin — no push for now

  const subs = await prisma.pushSubscription.findMany({ where: { studentId: student.id } })

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: payload.title, body: payload.body, url: payload.url })
      )
    } catch (err: unknown) {
      // Clean up expired subscriptions (410 Gone)
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }
}
