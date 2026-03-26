import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalLeads,
      convertedLeads,
      lostLeads,
      leadsThisMonth,
      byStatus,
      mrrAggregate,
      avgScore,
      autoCapturedThisMonth,
      byTemperature,
    ] = await Promise.all([
      prisma.saasLead.count(),
      prisma.saasLead.count({ where: { status: "CONVERTED" } }),
      prisma.saasLead.count({ where: { status: "LOST" } }),
      prisma.saasLead.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.saasLead.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.saasLead.aggregate({
        where: { status: { notIn: ["LOST", "CONVERTED"] } },
        _sum: { estimatedMrr: true },
      }),
      prisma.saasLead.aggregate({
        where: { score: { not: null } },
        _avg: { score: true },
      }),
      prisma.saasLead.count({
        where: {
          createdAt: { gte: startOfMonth },
          source: { in: ["WEBHOOK", "WEBSITE", "MANYCHAT", "N8N"] },
        },
      }),
      prisma.saasLead.groupBy({
        by: ["temperature"],
        _count: { _all: true },
      }),
    ])

    const closedLeads = convertedLeads + lostLeads
    const conversionRate = closedLeads > 0 ? Math.round((convertedLeads / closedLeads) * 100) : 0

    const statusCounts: Record<string, number> = {}
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all
    }

    const temperatureCounts: Record<string, number> = {}
    for (const row of byTemperature) {
      temperatureCounts[row.temperature] = row._count._all
    }

    return Response.json({
      totalLeads,
      convertedLeads,
      lostLeads,
      leadsThisMonth,
      conversionRate,
      pipelineMrr: mrrAggregate._sum.estimatedMrr ?? 0,
      statusCounts,
      avgScore: Math.round(avgScore._avg.score ?? 0),
      autoCapturedThisMonth,
      temperatureCounts,
    })
  } catch (error) {
    console.error("[Master CRM Stats]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
