import { NextResponse } from "next/server"
import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"

// GET /api/nutri/crm/dashboard — CRM analytics for nutritionist
export async function GET() {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const nid = nutri.id
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
      recentActivities,
      leadsBySource,
      pipelineValue,
      convertedValue,
    ] = await Promise.all([
      prisma.lead.count({ where: { nutritionistId: nid } }),
      prisma.lead.count({ where: { nutritionistId: nid, status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { nutritionistId: nid, status: "CONVERTED" } }),
      prisma.lead.count({ where: { nutritionistId: nid, status: "LOST" } }),
      prisma.lead.count({ where: { nutritionistId: nid, temperature: "HOT", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { nutritionistId: nid, temperature: "WARM", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { nutritionistId: nid, temperature: "COLD", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { nutritionistId: nid, createdAt: { gte: sevenDaysAgo } } }),
      prisma.lead.count({ where: { nutritionistId: nid, status: "CONVERTED", convertedAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { nutritionistId: nid, status: "LOST", updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.crmActivity.findMany({
        where: { lead: { nutritionistId: nid } },
        include: { lead: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { nutritionistId: nid },
        _count: true,
        orderBy: { _count: { source: "desc" } },
      }),
      prisma.lead.aggregate({
        where: { nutritionistId: nid, status: { notIn: ["CONVERTED", "LOST"] } },
        _sum: { value: true },
      }),
      prisma.lead.aggregate({
        where: { nutritionistId: nid, status: "CONVERTED" },
        _sum: { value: true },
      }),
    ])

    // Conversion rate
    const totalFinished = convertedLeads + lostLeads
    const conversionRate = totalFinished > 0 ? Math.round((convertedLeads / totalFinished) * 100) : 0

    // Top leads by score
    const topLeads = await prisma.lead.findMany({
      where: { nutritionistId: nid, status: { notIn: ["CONVERTED", "LOST"] } },
      orderBy: { score: "desc" },
      take: 5,
      select: { id: true, name: true, score: true, temperature: true, value: true, status: true, source: true },
    })

    // Funil de conversao
    const funnelStages = ["NEW", "CONTACTED", "TRIAL", "NEGOTIATING", "CONVERTED"] as const
    const funnelCounts = await Promise.all(
      funnelStages.map(status =>
        prisma.lead.count({ where: { nutritionistId: nid, status } })
      )
    )
    const funnel = funnelStages.map((stage, i) => {
      const count = funnelCounts[i]
      const reachedHere = funnelCounts.slice(i).reduce((a, b) => a + b, 0)
      const reachedPrev = i === 0 ? totalLeads : funnelCounts.slice(i - 1).reduce((a, b) => a + b, 0)
      const rate = reachedPrev > 0 ? Math.round((reachedHere / reachedPrev) * 100) : 0
      return { stage, count, reached: reachedHere, rate }
    })

    // Leads capturados por semana (ultimas 4 semanas)
    const weeksAgo = (w: number) => new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)
    const weeklyCapture = await Promise.all(
      [0, 1, 2, 3].map(w =>
        prisma.lead.count({
          where: { nutritionistId: nid, createdAt: { gte: weeksAgo(w + 1), lt: weeksAgo(w) } },
        })
      )
    )

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
        pipelineValue: pipelineValue._sum.value || 0,
        convertedValue: convertedValue._sum.value || 0,
      },
      temperatures: { HOT: hotLeads, WARM: warmLeads, COLD: coldLeads },
      leadsBySource: leadsBySource.map(s => ({ source: s.source, count: s._count })),
      topLeads,
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        action: a.action,
        details: a.details,
        leadName: a.lead.name,
        createdAt: a.createdAt,
      })),
      funnel,
      weeklyCapture: weeklyCapture.reverse(),
    })
  } catch (error) {
    console.error("GET /api/nutri/crm/dashboard error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
