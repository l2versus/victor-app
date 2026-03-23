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

    // ═══ NEW: Churn alerts — subscriptions expiring soon ═══
    const churnAlerts = await prisma.subscription.findMany({
      where: {
        student: { trainerId: trainer.id },
        status: "ACTIVE",
        endDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }, // next 30 days
      },
      include: {
        student: { include: { user: { select: { name: true, phone: true } } } },
        plan: { select: { name: true, price: true, interval: true } },
      },
      orderBy: { endDate: "asc" },
    })

    const churn = churnAlerts.map(s => {
      const daysLeft = Math.max(0, Math.ceil((s.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      return {
        id: s.id,
        studentName: s.student.user.name,
        phone: s.student.user.phone,
        planName: s.plan.name,
        planPrice: s.plan.price,
        endDate: s.endDate.toISOString(),
        daysLeft,
        severity: daysLeft <= 7 ? "critical" : daysLeft <= 15 ? "warning" : "info",
      }
    })

    // ═══ NEW: Revenue projection (next 3 months based on active subs) ═══
    const activeSubs = await prisma.subscription.findMany({
      where: { student: { trainerId: trainer.id }, status: "ACTIVE" },
      include: { plan: { select: { price: true, interval: true } } },
    })

    function planMonthlyPrice(price: number, interval: string): number {
      switch (interval) {
        case "QUARTERLY": return price / 3
        case "SEMIANNUAL": return price / 6
        case "ANNUAL": return price / 12
        default: return price
      }
    }

    const currentMRR = activeSubs.reduce((sum, s) => sum + planMonthlyPrice(s.plan.price, s.plan.interval), 0)
    const projection = Array.from({ length: 4 }, (_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const label = m.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
      // Simple projection: current MRR minus expected churn
      const churnThisMonth = churnAlerts.filter(c => {
        const end = new Date(c.endDate)
        return end.getMonth() === m.getMonth() && end.getFullYear() === m.getFullYear()
      }).reduce((sum, c) => sum + planMonthlyPrice(c.plan.price, c.plan.interval), 0)
      return {
        month: label,
        projected: Math.round(currentMRR - (i === 0 ? 0 : churnThisMonth)),
        best: Math.round(currentMRR * (1 + 0.05 * i)), // optimistic: 5% growth
        worst: Math.round((currentMRR - churnThisMonth) * (1 - 0.03 * i)), // pessimistic: 3% decline
      }
    })

    // ═══ NEW: LTV per student — total paid + months active ═══
    const studentPayments = await prisma.payment.groupBy({
      by: ["studentId"],
      where: { student: { trainerId: trainer.id }, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    })

    const studentFirstPayments = await prisma.payment.groupBy({
      by: ["studentId"],
      where: { student: { trainerId: trainer.id }, status: "PAID" },
      _min: { paidAt: true },
    })

    const ltvMap = new Map(studentPayments.map(s => [s.studentId, { total: s._sum.amount || 0, count: s._count }]))
    const firstPayMap = new Map(studentFirstPayments.map(s => [s.studentId, s._min.paidAt]))

    const studentsForLtv = await prisma.student.findMany({
      where: { trainerId: trainer.id, status: "ACTIVE" },
      select: { id: true, user: { select: { name: true } } },
    })

    const studentLtv = studentsForLtv.map(s => {
      const ltv = ltvMap.get(s.id)
      const firstPay = firstPayMap.get(s.id)
      const monthsActive = firstPay ? Math.max(1, Math.ceil((now.getTime() - firstPay.getTime()) / (30 * 24 * 60 * 60 * 1000))) : 0
      return {
        name: s.user.name,
        totalPaid: ltv?.total || 0,
        paymentCount: ltv?.count || 0,
        monthsActive,
        avgMonthly: monthsActive > 0 ? Math.round((ltv?.total || 0) / monthsActive) : 0,
      }
    }).sort((a, b) => b.totalPaid - a.totalPaid)

    const avgLtv = studentLtv.length > 0
      ? Math.round(studentLtv.reduce((sum, s) => sum + s.totalPaid, 0) / studentLtv.length)
      : 0

    // ═══ NEW: Cost per student ═══
    const costPerStudent = activeStudents > 0 ? Math.round(monthlyCostsTotal / activeStudents * 100) / 100 : 0
    const revenuePerStudent = activeStudents > 0 ? Math.round(monthRevenue / activeStudents * 100) / 100 : 0

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

      // NEW — Projections & Analytics
      currentMRR: Math.round(currentMRR),
      projection,
      churn,
      studentLtv: studentLtv.slice(0, 20), // top 20
      avgLtv,
      costPerStudent,
      revenuePerStudent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
