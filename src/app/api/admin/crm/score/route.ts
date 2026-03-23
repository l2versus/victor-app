import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import type { LeadTemperature } from "@/generated/prisma/client"

// POST /api/admin/crm/score — AI-powered lead scoring
// Scores a single lead or all leads (batch)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { leadId } = body // optional — if not provided, score ALL active leads

    const where: Record<string, unknown> = {
      trainerId: trainer.id,
      status: { notIn: ["CONVERTED", "LOST"] },
    }
    if (leadId) where.id = leadId

    const leads = await prisma.lead.findMany({
      where,
      include: {
        followUps: { orderBy: { createdAt: "desc" } },
        _count: { select: { followUps: true, conversations: true } },
      },
    })

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const results = []

    for (const lead of leads) {
      // ── Factor 1: Frequência de contato (25%) ──
      const recentFollowUps = lead.followUps.filter(f => new Date(f.createdAt).getTime() > thirtyDaysAgo)
      const distinctDays = new Set(recentFollowUps.map(f => new Date(f.createdAt).toDateString())).size
      const frequencyScore = Math.min(distinctDays / 10, 1) * 25

      // ── Factor 2: Recência (25%) ──
      const lastContact = lead.lastContactAt || lead.updatedAt
      const daysSinceContact = Math.floor((now - new Date(lastContact).getTime()) / 86400000)
      const recencyScore = daysSinceContact <= 1 ? 25
        : daysSinceContact <= 3 ? 20
        : daysSinceContact <= 7 ? 15
        : daysSinceContact <= 14 ? 8
        : daysSinceContact <= 30 ? 3
        : 0

      // ── Factor 3: Valor potencial (20%) ──
      const value = lead.value || 0
      const valueScore = value >= 500 ? 20
        : value >= 300 ? 16
        : value >= 200 ? 12
        : value >= 100 ? 8
        : value > 0 ? 4
        : 0

      // ── Factor 4: Qualidade da fonte (15%) ──
      const sourceScores: Record<string, number> = {
        REFERRAL: 15, WALK_IN: 13, INSTAGRAM: 10, WHATSAPP: 10,
        WEBSITE: 8, MANYCHAT: 9, FACEBOOK: 7, TIKTOK: 6, OTHER: 3,
      }
      const sourceScore = sourceScores[lead.source] || 3

      // ── Factor 5: Posição no pipeline (15%) ──
      const pipelineScores: Record<string, number> = {
        NEW: 3, CONTACTED: 7, TRIAL: 12, NEGOTIATING: 15,
      }
      const pipelineScore = pipelineScores[lead.status] || 0

      const totalScore = Math.round(frequencyScore + recencyScore + valueScore + sourceScore + pipelineScore)
      const clampedScore = Math.min(Math.max(totalScore, 0), 100)

      // Determine temperature from score
      let temperature: LeadTemperature = "COLD"
      if (clampedScore >= 60) temperature = "HOT"
      else if (clampedScore >= 30) temperature = "WARM"

      // Label
      const label = clampedScore >= 80 ? "Muito Quente"
        : clampedScore >= 60 ? "Quente"
        : clampedScore >= 40 ? "Morno"
        : clampedScore >= 20 ? "Frio"
        : "Gelado"

      // Update lead
      await prisma.lead.update({
        where: { id: lead.id },
        data: { score: clampedScore, temperature },
      })

      // Log activity
      await prisma.crmActivity.create({
        data: {
          leadId: lead.id,
          action: "SCORED",
          details: `Score: ${clampedScore}/100 (${label}) — Freq:${Math.round(frequencyScore)} Rec:${Math.round(recencyScore)} Val:${Math.round(valueScore)} Src:${sourceScore} Pip:${pipelineScore}`,
        },
      })

      results.push({
        id: lead.id,
        name: lead.name,
        score: clampedScore,
        temperature,
        label,
        factors: {
          frequency: Math.round(frequencyScore),
          recency: Math.round(recencyScore),
          value: Math.round(valueScore),
          source: sourceScore,
          pipeline: pipelineScore,
        },
      })
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({ scored: results.length, results })
  } catch (error) {
    console.error("POST /api/admin/crm/score error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
