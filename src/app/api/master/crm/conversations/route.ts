import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/crm/conversations — list SaasLead conversations
// Master sees ALL conversations (no trainerId scoping)
// We use CrmConversation linked via Lead, but for master we query differently
export async function GET(req: NextRequest) {
  try {
    await requireMaster()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "OPEN"
    const conversationId = searchParams.get("id")

    // Get single conversation with messages
    if (conversationId) {
      const conversation = await prisma.crmConversation.findUnique({
        where: { id: conversationId },
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true, temperature: true, score: true } },
          messages: { orderBy: { createdAt: "asc" }, take: 100 },
        },
      })

      if (!conversation) {
        return NextResponse.json({ error: "Conversa nao encontrada" }, { status: 404 })
      }

      // Mark as read
      if (conversation.unreadCount > 0) {
        await prisma.crmConversation.update({
          where: { id: conversationId },
          data: { unreadCount: 0 },
        })
      }

      return NextResponse.json({ conversation })
    }

    // List all conversations (master sees all)
    const where: Record<string, unknown> = {}
    if (status !== "ALL") where.status = status

    const conversations = await prisma.crmConversation.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, phone: true, temperature: true, score: true, status: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    })

    const unreadTotal = conversations.reduce((s, c) => s + c.unreadCount, 0)

    return NextResponse.json({ conversations, unreadTotal })
  } catch (error) {
    console.error("GET /api/master/crm/conversations error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/master/crm/conversations — send message
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()

    const { conversationId, content } = body

    if (conversationId) {
      const conv = await prisma.crmConversation.findUnique({
        where: { id: conversationId },
      })
      if (!conv) {
        return NextResponse.json({ error: "Conversa nao encontrada" }, { status: 404 })
      }

      const message = await prisma.crmMessage.create({
        data: {
          conversationId,
          content,
          fromMe: true,
          type: "text",
          status: "sent",
        },
      })

      await prisma.crmConversation.update({
        where: { id: conversationId },
        data: { lastMessage: content.substring(0, 200), lastMessageAt: new Date() },
      })

      return NextResponse.json({ message })
    }

    return NextResponse.json({ error: "conversationId obrigatorio" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/master/crm/conversations error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/master/crm/conversations?id=xxx — close/assign conversation
export async function PATCH(req: NextRequest) {
  try {
    await requireMaster()
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const body = await req.json()
    const conversation = await prisma.crmConversation.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        assignedTo: body.assignedTo ?? undefined,
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("PATCH /api/master/crm/conversations error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
