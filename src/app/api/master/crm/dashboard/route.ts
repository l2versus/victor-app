import { NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/crm/dashboard — Master CRM analytics for SaasLeads
export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalLeads,
      activeLeads,
      convertedLeads,
      lostLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      newThisWeek,
      convertedThisMonth,
      lostThisMonth,
      leadsBySource,
      pipelineValue,
      convertedValue,
    ] = await Promise.all([
      prisma.saasLead.count(),
      prisma.saasLead.count({ where: { status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.saasLead.count({ where: { status: "CONVERTED" } }),
      prisma.saasLead.count({ where: { status: "LOST" } }),
      prisma.saasLead.count({ where: { temperature: "HOT", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.saasLead.count({ where: { temperature: "WARM", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.saasLead.count({ where: { temperature: "COLD", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.saasLead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.saasLead.count({ where: { status: "CONVERTED", convertedAt: { gte: thirtyDaysAgo } } }),
      prisma.saasLead.count({ where: { status: "LOST", updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.saasLead.groupBy({
        by: ["source"],
        where: { source: { not: null } },
        _count: true,
        orderBy: { _count: { source: "desc" } },
      }),
      prisma.saasLead.aggregate({
        where: { status: { notIn: ["CONVERTED", "LOST"] } },
        _sum: { estimatedMrr: true },
      }),
      prisma.saasLead.aggregate({
        where: { status: "CONVERTED" },
        _sum: { estimatedMrr: true },
      }),
    ])

    // Conversion rate
    const totalFinished = convertedLeads + lostLeads
    const conversionRate = totalFinished > 0 ? Math.round((convertedLeads / totalFinished) * 100) : 0

    // Top leads by score
    const topLeads = await prisma.saasLead.findMany({
      where: { status: { notIn: ["CONVERTED", "LOST"] } },
      orderBy: { score: "desc" },
      take: 5,
      select: {
        id: true, name: true, company: true, score: true,
        temperature: true, estimatedMrr: true, status: true, source: true, type: true,
      },
    })

    // Funnel de conversão — SaaS statuses
    const funnelStages = ["NEW", "CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "NEGOTIATING", "CONVERTED"] as const
    const funnelCounts = await Promise.all(
      funnelStages.map(status =>
        prisma.saasLead.count({ where: { status } })
      )
    )

    const funnel = funnelStages.map((stage, i) => {
      const count = funnelCounts[i]
      const reachedHere = funnelCounts.slice(i).reduce((a, b) => a + b, 0)
      const reachedPrev = i === 0 ? totalLeads : funnelCounts.slice(i - 1).reduce((a, b) => a + b, 0)
      const rate = reachedPrev > 0 ? Math.round((reachedHere / reachedPrev) * 100) : 0
      return { stage, count, reached: reachedHere, rate }
    })

    // Leads capturados por semana (últimas 4 semanas)
    const weeksAgo = (w: number) => new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)
    const weeklyCapture = await Promise.all(
      [0, 1, 2, 3].map(w =>
        prisma.saasLead.count({
          where: { createdAt: { gte: weeksAgo(w + 1), lt: weeksAgo(w) } },
        })
      )
    )

    // Lead type distribution
    const byType = await prisma.saasLead.groupBy({
      by: ["type"],
      _count: true,
      orderBy: { _count: { type: "desc" } },
    })

    return NextResponse.json({
      overview: {
        totalLeads,
        activeLeads,
        convertedLeads,
        lostLeads,
        conversionRate,
        newThisWeek,
        convertedThisMonth,
        lostThisMonth,
        pipelineValue: pipelineValue._sum.estimatedMrr || 0,
        convertedValue: convertedValue._sum.estimatedMrr || 0,
      },
      temperatures: { HOT: hotLeads, WARM: warmLeads, COLD: coldLeads },
      leadsBySource: leadsBySource.map(s => ({ source: s.source || "UNKNOWN", count: s._count })),
      topLeads: topLeads.map(l => ({
        id: l.id,
        name: l.company || l.name,
        score: l.score ?? 0,
        temperature: l.temperature,
        value: l.estimatedMrr,
        status: l.status,
        source: l.source || "UNKNOWN",
        type: l.type,
      })),
      byType: byType.map(t => ({ type: t.type, count: t._count })),
      funnel,
      weeklyCapture: weeklyCapture.reverse(),
    })
  } catch (error) {
    console.error("GET /api/master/crm/dashboard error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
