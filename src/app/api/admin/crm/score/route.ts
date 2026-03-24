import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { calculateScore } from "@/lib/lead-scoring"

// POST /api/admin/crm/score — AI-powered lead scoring (batch or single)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { leadId } = body

    const where: Record<string, unknown> = {
      trainerId: trainer.id,
      status: { notIn: ["CONVERTED", "LOST"] },
    }
    if (leadId) where.id = leadId

    const leads = await prisma.lead.findMany({
      where,
      include: { followUps: { select: { createdAt: true } } },
    })

    const results = []

    for (const lead of leads) {
      const result = calculateScore(lead)

      await prisma.lead.update({
        where: { id: lead.id },
        data: { score: result.score, temperature: result.temperature },
      })

      await prisma.crmActivity.create({
        data: {
          leadId: lead.id,
          action: "SCORED",
          details: `Score: ${result.score}/100 (${result.label}) — Freq:${result.factors.frequency} Rec:${result.factors.recency} Val:${result.factors.value} Src:${result.factors.source} Pip:${result.factors.pipeline}`,
        },
      })

      results.push({ id: lead.id, name: lead.name, ...result })
    }

    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({ scored: results.length, results })
  } catch (error) {
    console.error("POST /api/admin/crm/score error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
