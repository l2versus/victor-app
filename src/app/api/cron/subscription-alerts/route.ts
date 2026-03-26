import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/cron/subscription-alerts — Daily check for expiring/overdue subscriptions
// Called by Vercel Cron or external scheduler
export async function GET(req: NextRequest) {
  // SECURITY: Always verify cron secret. Without it, anyone can trigger
  // subscription state changes and generate notifications.
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not set — rejecting request")
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // 1. Subscriptions expiring in 3 days — notify student + admin
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: in3Days },
    },
    include: {
      student: { include: { user: { select: { id: true, name: true, email: true } } } },
      plan: { select: { name: true, price: true } },
    },
  })

  // 2. Subscriptions expiring in 7 days — early warning to admin
  const expiringWeek = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: in3Days, lte: in7Days },
    },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      plan: { select: { name: true } },
    },
  })

  // 3. Already expired (not yet cancelled) — mark as expired + notify
  const expired = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      plan: { select: { name: true } },
    },
  })

  // 4. Overdue payments
  const overdue = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
    },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
    },
  })

  const notifications: { userId: string; title: string; message: string; type: string }[] = []

  // Get admin user for admin notifications
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })

  // Expiring in 3 days → notify student
  for (const sub of expiringSoon) {
    const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    notifications.push({
      userId: sub.student.user.id,
      title: "Assinatura expirando",
      message: `Seu plano ${sub.plan.name} expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Renove para não perder acesso!`,
      type: "SUBSCRIPTION_EXPIRING",
    })
    if (admin) {
      notifications.push({
        userId: admin.id,
        title: "Assinatura expirando",
        message: `${sub.student.user.name} — plano ${sub.plan.name} expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`,
        type: "ADMIN_SUB_EXPIRING",
      })
    }
  }

  // Expiring in 7 days → admin only
  for (const sub of expiringWeek) {
    if (admin) {
      notifications.push({
        userId: admin.id,
        title: "Assinatura expira em breve",
        message: `${sub.student.user.name} — plano ${sub.plan.name} expira esta semana`,
        type: "ADMIN_SUB_WARNING",
      })
    }
  }

  // Expired → mark + notify
  let expiredCount = 0
  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    })
    expiredCount++
    notifications.push({
      userId: sub.student.user.id,
      title: "Assinatura expirada",
      message: `Seu plano ${sub.plan.name} expirou. Renove para continuar treinando!`,
      type: "SUBSCRIPTION_EXPIRED",
    })
    if (admin) {
      notifications.push({
        userId: admin.id,
        title: "Aluno com assinatura expirada",
        message: `${sub.student.user.name} — plano ${sub.plan.name} expirou`,
        type: "ADMIN_SUB_EXPIRED",
      })
    }
  }

  // Overdue payments → admin notification
  for (const payment of overdue) {
    const daysOverdue = Math.ceil((now.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    // Mark as overdue if still PENDING
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "OVERDUE" },
    })
    if (admin) {
      notifications.push({
        userId: admin.id,
        title: "Pagamento atrasado",
        message: `${payment.student.user.name} — R$ ${payment.amount.toFixed(2)} atrasado há ${daysOverdue} dias`,
        type: "ADMIN_PAYMENT_OVERDUE",
      })
    }
  }

  // Create all notifications in DB
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        title: n.title,
        body: n.message,
        type: n.type,
      })),
    })
  }

  // Send push notifications (Web Push) for each
  // TODO: integrate with existing push notification system

  return NextResponse.json({
    processed: {
      expiringSoon: expiringSoon.length,
      expiringWeek: expiringWeek.length,
      expired: expiredCount,
      overdue: overdue.length,
      notificationsSent: notifications.length,
    },
  })
}
