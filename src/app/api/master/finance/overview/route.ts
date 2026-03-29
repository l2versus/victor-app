import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ═══ Active subscriptions & MRR ═══
    const activeSubscriptions = await prisma.saasSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true, organization: { select: { name: true, slug: true } } },
    })

    // Normalize all plan prices to monthly
    function toMonthly(price: number, interval: string): number {
      switch (interval) {
        case "QUARTERLY": return price / 3
        case "SEMIANNUAL": return price / 6
        case "ANNUAL": return price / 12
        default: return price // MONTHLY
      }
    }

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + toMonthly(sub.plan.price, sub.plan.interval), 0)
    const arr = mrr * 12
    const ticketMedio = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0

    // ═══ Active orgs ═══
    const activeOrgs = await prisma.organization.count({ where: { status: "ACTIVE" } })
    const totalOrgs = await prisma.organization.count()

    // ═══ Churn — cancelled last 30 days ═══
    const cancelledLast30 = await prisma.saasSubscription.count({
      where: { status: "CANCELLED", cancelledAt: { gte: thirtyDaysAgo } },
    })
    const totalActiveSubs = activeSubscriptions.length
    const churnRate = totalActiveSubs > 0 ? (cancelledLast30 / (totalActiveSubs + cancelledLast30)) * 100 : 0
    const churnRateMonthly = churnRate / 100

    // ═══ LTV ═══
    const ltv = churnRateMonthly > 0 ? ticketMedio * (1 / churnRateMonthly) : ticketMedio * 24 // cap at 24 months if no churn

    // ═══ Platform costs (MasterCost model not yet in schema — using estimates) ═══
    const monthlyCosts = 0
    const profit = mrr - monthlyCosts
    const margin = mrr > 0 ? (profit / mrr) * 100 : 0
    const costsByCategory: Record<string, number> = {}

    // ═══ CAC — marketing costs / new orgs last 30d ═══
    const marketingCosts = 0
    const newOrgsLast30 = await prisma.organization.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const cac = newOrgsLast30 > 0 ? marketingCosts / newOrgsLast30 : 0

    // ═══ AI Token cost estimate (last 30 days) ═══
    const aiUsage = await prisma.aiTokenUsage.aggregate({
      _sum: { totalTokens: true },
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    // Groq free tier estimate — if paid, roughly $0.05/1M tokens for small models
    const estimatedAiCostUSD = ((aiUsage._sum.totalTokens || 0) / 1_000_000) * 0.05
    const estimatedAiCostBRL = estimatedAiCostUSD * 5.5 // approximate BRL conversion

    // ═══ MRR evolution (last 6 months) ═══
    const mrrEvolution: { month: string; mrr: number; costs: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")

      // Count subscriptions active during that month
      const subsInMonth = await prisma.saasSubscription.count({
        where: {
          status: { in: ["ACTIVE", "CANCELLED"] },
          startDate: { lte: monthEnd },
          OR: [
            { cancelledAt: null },
            { cancelledAt: { gte: monthDate } },
          ],
        },
      })

      // Estimate MRR for that month based on average ticket
      const monthMrr = subsInMonth * ticketMedio
      mrrEvolution.push({ month: monthLabel, mrr: monthMrr, costs: monthlyCosts })
    }

    // ═══ Revenue by plan tier ═══
    const revenueByPlan: { name: string; mrr: number; count: number }[] = []
    const planMap = new Map<string, { name: string; mrr: number; count: number }>()
    for (const sub of activeSubscriptions) {
      const key = sub.planId
      const existing = planMap.get(key) || { name: sub.plan.name, mrr: 0, count: 0 }
      existing.mrr += toMonthly(sub.plan.price, sub.plan.interval)
      existing.count += 1
      planMap.set(key, existing)
    }
    for (const v of planMap.values()) revenueByPlan.push(v)

    // ═══ Churn trend (last 3 months) ═══
    const churnTrend: { month: string; cancelled: number; total: number; rate: number }[] = []
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")

      const cancelled = await prisma.saasSubscription.count({
        where: { cancelledAt: { gte: monthStart, lte: monthEnd } },
      })
      const activeAtMonth = await prisma.saasSubscription.count({
        where: {
          startDate: { lte: monthEnd },
          OR: [
            { cancelledAt: null },
            { cancelledAt: { gte: monthStart } },
          ],
        },
      })
      const rate = activeAtMonth > 0 ? (cancelled / activeAtMonth) * 100 : 0
      churnTrend.push({ month: monthLabel, cancelled, total: activeAtMonth, rate })
    }

    return Response.json({
      mrr,
      arr,
      monthlyCosts,
      profit,
      margin,
      activeOrgs,
      totalOrgs,
      churnRate,
      ticketMedio,
      ltv,
      cac,
      activeSubscriptions: totalActiveSubs,
      cancelledLast30,
      newOrgsLast30,
      estimatedAiCostBRL,
      aiInteractions: aiUsage._count || 0,
      totalAiTokens: aiUsage._sum.totalTokens || 0,
      costsByCategory,
      mrrEvolution,
      revenueByPlan,
      churnTrend,
    })
  } catch (error) {
    console.error("[master/finance/overview]", error)
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}
