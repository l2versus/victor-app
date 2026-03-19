import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month" // month, quarter, year, all

    // Calculate date ranges
    const now = new Date()
    // Always fetch 6 months for the chart, regardless of selected period
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    let startDate: Date
    switch (period) {
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "all":
        startDate = new Date(2020, 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    // Use the earliest date for fetching payments (chart needs 6 months)
    const fetchFrom = startDate < sixMonthsAgo ? startDate : sixMonthsAgo

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // === PARALLEL QUERIES ===
    const [
      // Revenue this period
      periodPayments,
      // Revenue this month
      monthPayments,
      // Revenue last month (for comparison)
      lastMonthPayments,
      // Active subscriptions
      activeSubscriptions,
      // Operational costs (active recurring + one-time in period)
      recurringCosts,
      periodOneTimeCosts,
      // AI usage (feedback tokens this month)
      aiUsageMonth,
      // Students count
      totalStudents,
      activeStudents,
      // Revenue by method (this period)
      paymentsByMethod,
      // Monthly revenue history (last 6 months)
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          student: { trainerId: trainer.id },
          status: "PAID",
          paidAt: { gte: fetchFrom },
        },
        select: { amount: true, method: true, paidAt: true },
      }),
      prisma.payment.aggregate({
        where: {
          student: { trainerId: trainer.id },
          status: "PAID",
          paidAt: { gte: monthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          student: { trainerId: trainer.id },
          status: "PAID",
          paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.subscription.count({
        where: {
          student: { trainerId: trainer.id },
          status: "ACTIVE",
        },
      }),
      prisma.operationalCost.findMany({
        where: { trainerId: trainer.id, active: true, recurrence: { not: "ONE_TIME" } },
        select: { amount: true, recurrence: true, category: true, name: true },
      }),
      prisma.operationalCost.aggregate({
        where: {
          trainerId: trainer.id,
          recurrence: "ONE_TIME",
          date: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.workoutFeedback.aggregate({
        where: {
          student: { trainerId: trainer.id },
          createdAt: { gte: monthStart },
        },
        _sum: { tokensUsed: true },
        _count: true,
      }),
      prisma.student.count({ where: { trainerId: trainer.id } }),
      prisma.student.count({ where: { trainerId: trainer.id, status: "ACTIVE" } }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          student: { trainerId: trainer.id },
          status: "PAID",
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Calculate monthly cost from recurring costs
    function toMonthlyCost(amount: number, recurrence: string): number {
      switch (recurrence) {
        case "DAILY": return amount * 30
        case "MONTHLY": return amount
        case "QUARTERLY": return amount / 3
        case "ANNUAL": return amount / 12
        default: return 0
      }
    }

    const recurringMonthly = recurringCosts.reduce(
      (sum, c) => sum + toMonthlyCost(c.amount, c.recurrence), 0
    )
    // Add one-time costs prorated into the current month view
    const oneTimeCosts = periodOneTimeCosts._sum.amount || 0
    const monthlyCostsTotal = recurringMonthly + oneTimeCosts

    // Costs breakdown by category
    const costsByCategory: Record<string, number> = {}
    for (const cost of recurringCosts) {
      const monthly = toMonthlyCost(cost.amount, cost.recurrence)
      costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + monthly
    }

    // Revenue totals (filter to actual selected period, not the 6-month fetch window)
    const periodRevenue = periodPayments
      .filter(p => p.paidAt && p.paidAt >= startDate)
      .reduce((sum, p) => sum + p.amount, 0)
    const monthRevenue = monthPayments._sum.amount || 0
    const lastMonthRevenue = lastMonthPayments._sum.amount || 0
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthRevenue > 0 ? 100 : 0

    // Profit
    const monthProfit = monthRevenue - monthlyCostsTotal
    const profitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0

    // AI cost estimate (Claude: ~$3/1M input tokens, ~$15/1M output tokens)
    // Rough estimate: ~500 tokens per feedback interaction, cost ~$0.004 per interaction
    const aiInteractions = aiUsageMonth._count || 0
    const estimatedAICostBRL = aiInteractions * 0.025 // ~R$0.025 per interaction average

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number; costs: number }[] = []
    for (let m = 5; m >= 0; m--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59)
      const rev = periodPayments
        .filter(p => p.paidAt && p.paidAt >= mStart && p.paidAt <= mEnd)
        .reduce((s, p) => s + p.amount, 0)
      const label = mStart.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
      revenueByMonth.push({ month: label, revenue: Math.round(rev), costs: Math.round(monthlyCostsTotal) })
    }

    // Revenue by payment method
    const methodLabels: Record<string, string> = {
      PIX: "PIX",
      CREDIT_CARD: "Cartão",
      CASH: "Dinheiro",
      BANK_TRANSFER: "Transferência",
      MERCADOPAGO: "Mercado Pago",
    }

    const revenueByMethod = paymentsByMethod.map(g => ({
      method: g.method,
      label: methodLabels[g.method] || g.method,
      total: g._sum.amount || 0,
      count: g._count,
    }))

    // Pending payments
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        student: { trainerId: trainer.id },
        status: { in: ["PENDING", "OVERDUE"] },
      },
      _sum: { amount: true },
      _count: true,
    })

    return NextResponse.json({
      // KPIs
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      periodRevenue: Math.round(periodRevenue * 100) / 100,
      monthlyCosts: Math.round(monthlyCostsTotal * 100) / 100,
      monthProfit: Math.round(monthProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,

      // Subscriptions
      activeSubscriptions,
      totalStudents,
      activeStudents,

      // AI
      aiInteractionsMonth: aiInteractions,
      estimatedAICostBRL: Math.round(estimatedAICostBRL * 100) / 100,

      // Pending
      pendingAmount: pendingPayments._sum.amount || 0,
      pendingCount: pendingPayments._count || 0,

      // Breakdowns
      costsByCategory,
      revenueByMethod,
      revenueByMonth,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
