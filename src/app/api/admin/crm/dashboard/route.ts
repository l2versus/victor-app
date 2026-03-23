import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/crm/dashboard — CRM analytics
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const tid = trainer.id
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
      prisma.lead.count({ where: { trainerId: tid } }),
      prisma.lead.count({ where: { trainerId: tid, status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { trainerId: tid, status: "CONVERTED" } }),
      prisma.lead.count({ where: { trainerId: tid, status: "LOST" } }),
      prisma.lead.count({ where: { trainerId: tid, temperature: "HOT", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { trainerId: tid, temperature: "WARM", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { trainerId: tid, temperature: "COLD", status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { trainerId: tid, createdAt: { gte: sevenDaysAgo } } }),
      prisma.lead.count({ where: { trainerId: tid, status: "CONVERTED", convertedAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { trainerId: tid, status: "LOST", updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.crmActivity.findMany({
        where: { lead: { trainerId: tid } },
        include: { lead: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { trainerId: tid },
        _count: true,
        orderBy: { _count: { source: "desc" } },
      }),
      prisma.lead.aggregate({
        where: { trainerId: tid, status: { notIn: ["CONVERTED", "LOST"] } },
        _sum: { value: true },
      }),
      prisma.lead.aggregate({
        where: { trainerId: tid, status: "CONVERTED" },
        _sum: { value: true },
      }),
    ])

    // Conversion rate
    const totalFinished = convertedLeads + lostLeads
    const conversionRate = totalFinished > 0 ? Math.round((convertedLeads / totalFinished) * 100) : 0

    // Top leads by score
    const topLeads = await prisma.lead.findMany({
      where: { trainerId: tid, status: { notIn: ["CONVERTED", "LOST"] } },
      orderBy: { score: "desc" },
      take: 5,
      select: { id: true, name: true, score: true, temperature: true, value: true, status: true, source: true },
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
    })
  } catch (error) {
    console.error("GET /api/admin/crm/dashboard error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
