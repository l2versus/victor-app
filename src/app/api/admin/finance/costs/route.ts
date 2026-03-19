import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const costs = await prisma.operationalCost.findMany({
      where: { trainerId: trainer.id },
      orderBy: [{ active: "desc" }, { date: "desc" }],
    })

    return NextResponse.json(costs)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { category, name, amount, recurrence, date, notes } = body

    if (!category || !name || amount == null) {
      return NextResponse.json({ error: "Categoria, nome e valor são obrigatórios" }, { status: 400 })
    }

    const cost = await prisma.operationalCost.create({
      data: {
        trainerId: trainer.id,
        category,
        name,
        amount: parseFloat(amount),
        recurrence: recurrence || "MONTHLY",
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    })

    return NextResponse.json(cost, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    // Verify ownership
    const existing = await prisma.operationalCost.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 })
    }

    const updated = await prisma.operationalCost.update({
      where: { id },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.name && { name: data.name }),
        ...(data.amount != null && { amount: parseFloat(data.amount) }),
        ...(data.recurrence && { recurrence: data.recurrence }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.active !== undefined && { active: data.active }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const existing = await prisma.operationalCost.findUnique({ where: { id } })
    if (!existing || existing.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 })
    }

    await prisma.operationalCost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
