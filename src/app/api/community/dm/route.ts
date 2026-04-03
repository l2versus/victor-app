import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentFeatures } from "@/lib/subscription"

// GET /api/community/dm — list conversations (inbox)
export async function GET() {
  try {
    const session = await requireAuth()

    // Get all DMs where I'm sender or receiver, grouped by conversation partner
    const sent = await prisma.directMessage.findMany({
      where: { senderId: session.userId, channel: "APP" },
      orderBy: { createdAt: "desc" },
      include: { receiver: { select: { id: true, name: true, avatar: true } } },
    })

    const received = await prisma.directMessage.findMany({
      where: { receiverId: session.userId, channel: "APP" },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    })

    // Build conversation map (keyed by the other person's userId)
    const convos = new Map<string, {
      partnerId: string
      partnerName: string
      partnerAvatar: string | null
      lastMessage: string
      lastMessageAt: Date
      unreadCount: number
    }>()

    for (const m of sent) {
      const key = m.receiverId
      if (!convos.has(key)) {
        convos.set(key, {
          partnerId: m.receiver.id,
          partnerName: m.receiver.name,
          partnerAvatar: m.receiver.avatar,
          lastMessage: m.content.slice(0, 80),
          lastMessageAt: m.createdAt,
          unreadCount: 0,
        })
      }
    }

    for (const m of received) {
      const key = m.senderId
      const existing = convos.get(key)
      if (!existing || m.createdAt > existing.lastMessageAt) {
        convos.set(key, {
          partnerId: m.sender.id,
          partnerName: m.sender.name,
          partnerAvatar: m.sender.avatar,
          lastMessage: m.content.slice(0, 80),
          lastMessageAt: m.createdAt,
          unreadCount: (existing?.unreadCount ?? 0) + (m.readAt ? 0 : 1),
        })
      } else if (!m.readAt) {
        existing.unreadCount++
      }
    }

    // Sort by most recent
    const conversations = Array.from(convos.values())
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

    return NextResponse.json({ conversations })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/community/dm — send a DM
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { receiverId, content } = await req.json()

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "receiverId e content obrigatórios" }, { status: 400 })
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    })
    if (!receiver) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

    if (receiverId === session.userId) {
      return NextResponse.json({ error: "Não pode mandar DM para si mesmo" }, { status: 400 })
    }

    // Free tier cannot send DMs
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (student) {
      const features = await getStudentFeatures(student.id)
      if (!features.subscriptionStatus || features.subscriptionStatus === "EXPIRED") {
        return NextResponse.json({
          error: "Interagir na comunidade é exclusivo de planos pagos",
          upgradeUrl: "/upgrade"
        }, { status: 403 })
      }
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: session.userId,
        receiverId,
        content: content.trim().slice(0, 2000),
        channel: "APP",
      },
    })

    return NextResponse.json({ message: { id: message.id, createdAt: message.createdAt } }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
