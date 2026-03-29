import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Returns default values for the calculator based on real platform data
export async function GET() {
  try {
    await requireMaster()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // AI cost per org estimate
    const aiUsage = await prisma.aiTokenUsage.aggregate({
      _sum: { totalTokens: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const totalOrgs = await prisma.organization.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } })
    const totalTokens = aiUsage._sum.totalTokens || 0
    const aiCostPerOrgUSD = totalOrgs > 0 ? ((totalTokens / 1_000_000) * 0.05) / totalOrgs : 0.5
    const aiCostPerOrgBRL = aiCostPerOrgUSD * 5.5

    // Default cost estimates (masterCost table not yet in schema)
    const hostingPerOrg = totalOrgs > 0 ? 50 / totalOrgs : 15
    const whatsappPerOrg = totalOrgs > 0 ? 150 / totalOrgs : 50

    // Average plan price
    const activeSubs = await prisma.saasSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { price: true, interval: true } } },
    })

    function toMonthly(price: number, interval: string): number {
      switch (interval) {
        case "QUARTERLY": return price / 3
        case "SEMIANNUAL": return price / 6
        case "ANNUAL": return price / 12
        default: return price
      }
    }

    const avgPlanPrice = activeSubs.length > 0
      ? activeSubs.reduce((s, sub) => s + toMonthly(sub.plan.price, sub.plan.interval), 0) / activeSubs.length
      : 197

    return Response.json({
      defaults: {
        numClients: totalOrgs || 1,
        avgPlanPrice: Math.round(avgPlanPrice * 100) / 100,
        aiCostPerOrg: Math.round(aiCostPerOrgBRL * 100) / 100,
        hostingPerOrg: Math.round(hostingPerOrg * 100) / 100,
        whatsappPerOrg: Math.round(whatsappPerOrg * 100) / 100,
        overhead: 15, // % taxes/fees
        fixedMonthlyCosts: 0,
      },
    })
  } catch (error) {
    console.error("[master/finance/calculator]", error)
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}
