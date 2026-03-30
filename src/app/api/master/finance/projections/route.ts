import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ═══════════════════════════════════════════════════════════════
// GET /api/master/finance/projections
// Returns 12-month projections based on real current data
// ═══════════════════════════════════════════════════════════════

interface MonthMetrics {
  month: number
  subscribers: number
  mrr: number
  costs: number
  profit: number
  accumulated: number
  margin: number
}

interface ScenarioResult {
  label: string
  monthlyMetrics: MonthMetrics[]
  breakEvenMonth: number | null // null = never within 12 months
}

export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ═══ 1. Load current real metrics ═══

    // Active subscriptions & MRR
    const activeSubscriptions = await prisma.saasSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    })

    function toMonthly(price: number, interval: string): number {
      switch (interval) {
        case "QUARTERLY": return price / 3
        case "SEMIANNUAL": return price / 6
        case "ANNUAL": return price / 12
        default: return price
      }
    }

    const currentSubscribers = activeSubscriptions.length
    const currentMrr = activeSubscriptions.reduce(
      (sum, sub) => sum + toMonthly(sub.plan.price, sub.plan.interval),
      0,
    )
    const currentTicketMedio =
      currentSubscribers > 0 ? currentMrr / currentSubscribers : 197

    // Monthly costs from MasterCost
    const masterCosts = await prisma.masterCost.findMany({
      where: { active: true },
    })
    const currentCosts = masterCosts.reduce((sum, c) => {
      if (c.recurrence === "ANNUAL") return sum + c.amount / 12
      if (c.recurrence === "ONE_TIME") return sum
      return sum + c.amount
    }, 0)

    const currentProfit = currentMrr - currentCosts

    // Churn rate (last 30 days)
    const cancelledLast30 = await prisma.saasSubscription.count({
      where: { status: "CANCELLED", cancelledAt: { gte: thirtyDaysAgo } },
    })
    const totalRecentBase = currentSubscribers + cancelledLast30
    const currentChurnRate =
      totalRecentBase > 0 ? cancelledLast30 / totalRecentBase : 0 // as decimal

    // Growth rate (new orgs last 30 days)
    const totalOrgs = await prisma.organization.count()
    const newOrgsLast30 = await prisma.organization.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const currentGrowthRate = totalOrgs > 0 ? newOrgsLast30 / totalOrgs : 0 // as decimal

    // ═══ 2. Project 12 months forward ═══

    const scenarios: {
      key: string
      label: string
      growthMultiplier: number
      churnMultiplier: number
      costGrowthPerMonth: number
    }[] = [
      {
        key: "pessimistic",
        label: "Pessimista",
        growthMultiplier: 0.5,
        churnMultiplier: 1.5,
        costGrowthPerMonth: 0.10,
      },
      {
        key: "realistic",
        label: "Realista",
        growthMultiplier: 1.0,
        churnMultiplier: 1.0,
        costGrowthPerMonth: 0.05,
      },
      {
        key: "optimistic",
        label: "Otimista",
        growthMultiplier: 2.0,
        churnMultiplier: 0.5,
        costGrowthPerMonth: 0.03,
      },
    ]

    const results: Record<string, ScenarioResult> = {}

    for (const scenario of scenarios) {
      const monthlyMetrics: MonthMetrics[] = []
      let subscribers = currentSubscribers
      let costs = currentCosts
      let accumulated = 0

      // Monthly growth and churn in absolute terms based on rates
      const monthlyNewSubscribers = Math.max(
        currentGrowthRate * currentSubscribers * scenario.growthMultiplier,
        // Minimum 0.5 new sub/month to avoid zero-growth projections
        currentSubscribers > 0 ? 0.5 : 0,
      )
      const monthlyChurnRate = currentChurnRate * scenario.churnMultiplier

      let breakEvenMonth: number | null = null

      for (let month = 1; month <= 12; month++) {
        // Calculate new and churned subscribers
        const newSubs = monthlyNewSubscribers
        const churnedSubs = subscribers * monthlyChurnRate

        subscribers = Math.max(0, subscribers + newSubs - churnedSubs)

        const mrr = subscribers * currentTicketMedio
        costs = costs * (1 + scenario.costGrowthPerMonth)
        const profit = mrr - costs
        accumulated += profit
        const margin = mrr > 0 ? (profit / mrr) * 100 : 0

        monthlyMetrics.push({
          month,
          subscribers: Math.round(subscribers),
          mrr: Math.round(mrr * 100) / 100,
          costs: Math.round(costs * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          accumulated: Math.round(accumulated * 100) / 100,
          margin: Math.round(margin * 10) / 10,
        })

        if (breakEvenMonth === null && accumulated > 0) {
          breakEvenMonth = month
        }
      }

      results[scenario.key] = {
        label: scenario.label,
        monthlyMetrics,
        breakEvenMonth,
      }
    }

    return Response.json({
      // Current snapshot
      current: {
        mrr: Math.round(currentMrr * 100) / 100,
        costs: Math.round(currentCosts * 100) / 100,
        profit: Math.round(currentProfit * 100) / 100,
        subscribers: currentSubscribers,
        churnRate: Math.round(currentChurnRate * 10000) / 100, // as percentage
        growthRate: Math.round(currentGrowthRate * 10000) / 100, // as percentage
        ticketMedio: Math.round(currentTicketMedio * 100) / 100,
      },
      // Projections per scenario
      scenarios: results,
    })
  } catch (error) {
    console.error("[master/finance/projections]", error)
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}
