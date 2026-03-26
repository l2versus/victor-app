import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params

    const followUps = await prisma.saasLeadFollowUp.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(followUps)
  } catch (error) {
    console.error("[Master CRM FollowUps GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await req.json()

    const { type, content, dueDate } = body

    if (!type || !content) {
      return Response.json({ error: "Tipo e conteúdo são obrigatórios" }, { status: 400 })
    }

    const followUp = await prisma.saasLeadFollowUp.create({
      data: {
        leadId: id,
        type,
        content,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return Response.json(followUp, { status: 201 })
  } catch (error) {
    console.error("[Master CRM FollowUps POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
