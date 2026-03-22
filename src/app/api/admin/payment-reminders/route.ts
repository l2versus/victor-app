import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/payment-reminders — list overdue payments with reminder status
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const overduePayments = await prisma.payment.findMany({
      where: {
        student: { trainerId: trainer.id },
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
      include: {
        student: { include: { user: { select: { name: true, email: true, phone: true } } } },
        reminders: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { dueDate: "asc" },
    })

    const summary = {
      totalOverdue: overduePayments.length,
      totalAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
      payments: overduePayments.map(p => ({
        id: p.id,
        studentName: p.student.user.name,
        studentEmail: p.student.user.email,
        studentPhone: p.student.user.phone,
        amount: p.amount,
        dueDate: p.dueDate.toISOString(),
        daysOverdue: Math.ceil((Date.now() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        method: p.method,
        lastReminder: p.reminders[0] || null,
      })),
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("GET /api/admin/payment-reminders error:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}

// POST /api/admin/payment-reminders — send reminder for a payment
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { paymentId, channel, message } = body

    if (!paymentId || !message) {
      return NextResponse.json({ error: "paymentId and message are required" }, { status: 400 })
    }

    // Get payment and student
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Mark payment as OVERDUE if still PENDING
    if (payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "OVERDUE" },
      })
    }

    // Create the reminder
    const reminder = await prisma.paymentReminder.create({
      data: {
        paymentId,
        channel: channel || "APP",
        message,
        status: "SENT",
        sentAt: new Date(),
      },
    })

    // Create in-app notification for the student
    await prisma.notification.create({
      data: {
        userId: payment.student.user.id,
        type: "PAYMENT_REMINDER",
        title: "Lembrete de Pagamento",
        body: message,
        metadata: { paymentId, amount: payment.amount, dueDate: payment.dueDate.toISOString() },
      },
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/payment-reminders error:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}

// POST /api/admin/payment-reminders/auto — auto-generate reminders for all overdue
export async function PUT() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const overduePayments = await prisma.payment.findMany({
      where: {
        student: { trainerId: trainer.id },
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        reminders: {
          where: { createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
        },
      },
    })

    // Only send reminders to those who haven't been reminded in the last 3 days
    const needsReminder = overduePayments.filter(p => p.reminders.length === 0)

    const results = []
    for (const payment of needsReminder) {
      const daysOverdue = Math.ceil((Date.now() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const message = `Oi ${payment.student.user.name.split(" ")[0]}! 👋 Notamos que seu pagamento de R$ ${payment.amount.toFixed(2)} está ${daysOverdue} dias atrasado. Regularize para continuar aproveitando todas as funcionalidades do app! Qualquer dúvida, fale comigo. 💪`

      // Update status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "OVERDUE" },
      })

      const reminder = await prisma.paymentReminder.create({
        data: {
          paymentId: payment.id,
          channel: "APP",
          message,
          status: "SENT",
          sentAt: new Date(),
        },
      })

      await prisma.notification.create({
        data: {
          userId: payment.student.user.id,
          type: "PAYMENT_REMINDER",
          title: "Lembrete de Pagamento",
          body: message,
          metadata: { paymentId: payment.id, amount: payment.amount },
        },
      })

      results.push(reminder)
    }

    return NextResponse.json({
      sent: results.length,
      skipped: overduePayments.length - needsReminder.length,
      total: overduePayments.length,
    })
  } catch (error) {
    console.error("PUT /api/admin/payment-reminders error:", error)
    return NextResponse.json({ error: "Failed to auto-send reminders" }, { status: 500 })
  }
}
