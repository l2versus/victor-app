import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/bots — list bot flows
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const flows = await prisma.crmBotFlow.findMany({
      where: { trainerId: trainer.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ flows })
  } catch (error) {
    console.error("GET /api/admin/crm/bots error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/admin/crm/bots — create bot flow
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { name, trigger, nodes, edges } = body
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

    const flow = await prisma.crmBotFlow.create({
      data: {
        trainerId: trainer.id,
        name,
        trigger: trigger || "new_lead",
        nodes: nodes || [],
        edges: edges || [],
        active: false,
      },
    })

    return NextResponse.json({ flow }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/crm/bots error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/admin/crm/bots?id=xxx — update flow
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmBotFlow.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Flow não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const flow = await prisma.crmBotFlow.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        trigger: body.trigger ?? undefined,
        nodes: body.nodes ?? undefined,
        edges: body.edges ?? undefined,
        active: body.active ?? undefined,
      },
    })

    return NextResponse.json({ flow })
  } catch (error) {
    console.error("PATCH /api/admin/crm/bots error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/admin/crm/bots?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmBotFlow.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Flow não encontrado" }, { status: 404 })
    }

    await prisma.crmBotFlow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/crm/bots error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
