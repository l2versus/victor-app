import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // PAID, PENDING, OVERDUE, all
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {
      student: { trainerId: trainer.id },
    }
    if (status && status !== "all") {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(payments)
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

    const { studentId, amount, method, description, dueDate, paidAt } = body

    if (!studentId || !amount || !method) {
      return NextResponse.json({ error: "Aluno, valor e método são obrigatórios" }, { status: 400 })
    }

    // Verify student belongs to trainer
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student || student.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    const isPaid = !!paidAt || method === "CASH" // dinheiro vivo = pago na hora
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        method,
        status: isPaid ? "PAID" : "PENDING",
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        paidAt: isPaid ? (paidAt ? new Date(paidAt) : new Date()) : null,
        description: description || null,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// Mark payment as paid
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { id, status: newStatus } = body
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { student: true },
    })
    if (!payment || payment.student.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus || "PAID",
        paidAt: newStatus === "PAID" ? new Date() : payment.paidAt,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
