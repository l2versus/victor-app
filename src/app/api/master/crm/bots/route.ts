import { NextRequest, NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/crm/bots — list master bot flows (trainerId = null)
export async function GET() {
  try {
    await requireMaster()

    const flows = await prisma.crmBotFlow.findMany({
      where: { trainerId: null, nutritionistId: null },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ flows })
  } catch (error) {
    console.error("GET /api/master/crm/bots error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// POST /api/master/crm/bots — create bot flow
export async function POST(req: NextRequest) {
  try {
    await requireMaster()
    const body = await req.json()

    const { name, trigger, nodes, edges } = body
    if (!name) return NextResponse.json({ error: "Nome obrigatorio" }, { status: 400 })

    const flow = await prisma.crmBotFlow.create({
      data: {
        trainerId: null,
        nutritionistId: null,
        name,
        trigger: trigger || "new_lead",
        nodes: nodes || [],
        edges: edges || [],
        active: false,
      },
    })

    return NextResponse.json({ flow }, { status: 201 })
  } catch (error) {
    console.error("POST /api/master/crm/bots error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/master/crm/bots?id=xxx — update flow
export async function PATCH(req: NextRequest) {
  try {
    await requireMaster()
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmBotFlow.findFirst({
      where: { id, trainerId: null },
    })
    if (!existing) {
      return NextResponse.json({ error: "Flow nao encontrado" }, { status: 404 })
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
    console.error("PATCH /api/master/crm/bots error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/master/crm/bots?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await requireMaster()
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.crmBotFlow.findFirst({
      where: { id, trainerId: null },
    })
    if (!existing) {
      return NextResponse.json({ error: "Flow nao encontrado" }, { status: 404 })
    }

    await prisma.crmBotFlow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/master/crm/bots error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
