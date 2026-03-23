import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/templates — list templates
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const templates = await prisma.crmTemplate.findMany({
      where: { trainerId: trainer.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("GET /api/admin/crm/templates error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/templates — create template
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { name, content, type, category } = body
    if (!name || !content) {
      return NextResponse.json({ error: "Nome e conteudo sao obrigatorios" }, { status: 400 })
    }

    // Auto-detect variables
    const variables: string[] = []
    const regex = /\{\{(\w+)\}\}/g
    let m
    while ((m = regex.exec(content)) !== null) {
      if (!variables.includes(m[1])) variables.push(m[1])
    }

    const template = await prisma.crmTemplate.create({
      data: {
        trainerId: trainer.id,
        name,
        content,
        type: type || "whatsapp",
        category: category || null,
        variables,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm/templates error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm/templates?id=xxx — update template
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmTemplate.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const content = body.content ?? existing.content

    const variables: string[] = []
    const regex = /\{\{(\w+)\}\}/g
    let m
    while ((m = regex.exec(content)) !== null) {
      if (!variables.includes(m[1])) variables.push(m[1])
    }

    const template = await prisma.crmTemplate.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        content: body.content ?? undefined,
        type: body.type ?? undefined,
        category: body.category ?? undefined,
        variables,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("PATCH /api/admin/crm/templates error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/admin/crm/templates?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmTemplate.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 })
    }

    await prisma.crmTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/crm/templates error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
