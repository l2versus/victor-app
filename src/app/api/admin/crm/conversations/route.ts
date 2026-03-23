import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/conversations — list conversations with leads
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "OPEN"
    const channel = searchParams.get("channel")
    const leadId = searchParams.get("leadId")
    const conversationId = searchParams.get("id")

    // Get single conversation with messages
    if (conversationId) {
      const conversation = await prisma.crmConversation.findUnique({
        where: { id: conversationId },
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true, temperature: true, score: true, trainerId: true } },
          messages: { orderBy: { createdAt: "asc" }, take: 100 },
        },
      })

      if (!conversation || conversation.lead.trainerId !== trainer.id) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
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

    // List conversations
    const where: Record<string, unknown> = {
      lead: { trainerId: trainer.id },
    }
    if (status !== "ALL") where.status = status
    if (channel) where.channel = channel
    if (leadId) where.leadId = leadId

    const conversations = await prisma.crmConversation.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, phone: true, temperature: true, score: true, status: true } },
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    })

    const unreadTotal = conversations.reduce((s, c) => s + c.unreadCount, 0)

    return NextResponse.json({ conversations, unreadTotal })
  } catch (error) {
    console.error("GET /api/admin/crm/conversations error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/conversations — start new conversation or send message
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { leadId, conversationId, content, channel } = body

    // Send message to existing conversation
    if (conversationId) {
      const conv = await prisma.crmConversation.findUnique({
        where: { id: conversationId },
        include: { lead: { select: { trainerId: true } } },
      })
      if (!conv || conv.lead.trainerId !== trainer.id) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
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

      // Update lead lastContactAt
      await prisma.lead.update({
        where: { id: conv.leadId },
        data: { lastContactAt: new Date() },
      })

      return NextResponse.json({ message })
    }

    // Start new conversation
    if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 })

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, trainerId: trainer.id },
    })
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })

    // Check for existing open conversation
    let conversation = await prisma.crmConversation.findFirst({
      where: { leadId, status: "OPEN", channel: channel || "WHATSAPP" },
    })

    if (!conversation) {
      conversation = await prisma.crmConversation.create({
        data: {
          leadId,
          channel: channel || "WHATSAPP",
          status: "OPEN",
        },
      })
    }

    // Add first message if content provided
    if (content) {
      await prisma.crmMessage.create({
        data: {
          conversationId: conversation.id,
          content,
          fromMe: true,
          type: "text",
          status: "sent",
        },
      })
      await prisma.crmConversation.update({
        where: { id: conversation.id },
        data: { lastMessage: content.substring(0, 200), lastMessageAt: new Date() },
      })
    }

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm/conversations error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm/conversations?id=xxx — close/assign conversation
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const conv = await prisma.crmConversation.findUnique({
      where: { id },
      include: { lead: { select: { trainerId: true } } },
    })
    if (!conv || conv.lead.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

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
    console.error("PATCH /api/admin/crm/conversations error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
