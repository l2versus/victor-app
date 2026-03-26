import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    const [activeSubscriptions, allSubscriptions, overdueInvoices, pendingInvoices] =
      await Promise.all([
        prisma.saasSubscription.count({
          where: { status: { in: ["ACTIVE", "TRIAL"] } },
        }),
        prisma.saasSubscription.findMany({
          where: { status: { in: ["ACTIVE", "TRIAL"] } },
          include: { plan: true },
        }),
        prisma.saasInvoice.count({
          where: { status: "overdue" },
        }),
        prisma.saasInvoice.count({
          where: { status: "pending" },
        }),
      ])

    // Calculate MRR — normalize all intervals to monthly
    let totalMrr = 0
    const mrrByPlan: Record<string, { name: string; mrr: number; count: number }> = {}

    for (const sub of allSubscriptions) {
      const plan = sub.plan
      let monthlyValue = plan.price

      switch (plan.interval) {
        case "QUARTERLY":
          monthlyValue = plan.price / 3
          break
        case "SEMIANNUAL":
          monthlyValue = plan.price / 6
          break
        case "ANNUAL":
          monthlyValue = plan.price / 12
          break
      }

      totalMrr += monthlyValue

      if (!mrrByPlan[plan.id]) {
        mrrByPlan[plan.id] = { name: plan.name, mrr: 0, count: 0 }
      }
      mrrByPlan[plan.id].mrr += monthlyValue
      mrrByPlan[plan.id].count += 1
    }

    const ticketMedio = activeSubscriptions > 0 ? totalMrr / activeSubscriptions : 0

    return Response.json({
      totalMrr: Math.round(totalMrr * 100) / 100,
      activeSubscriptions,
      overdueInvoices,
      pendingInvoices,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      mrrByPlan: Object.values(mrrByPlan),
    })
  } catch (error) {
    console.error("[Master Billing]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
