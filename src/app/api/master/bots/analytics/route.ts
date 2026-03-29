/**
 * Bot Analytics API
 *
 * GET /api/master/bots/analytics
 *
 * Returns unified analytics for all 3 bots (victor, nutri, b2b):
 * - Message counts (total, bot replies, human replies)
 * - Lead funnel (total, new, converted, handoffs)
 * - AI usage (tokens, latency, cost)
 * - Conversion rate
 * - Comparative: top bot, total cost, total messages
 */

import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface BotAnalytics {
  totalMessages: number
  botReplies: number
  humanReplies: number
  totalLeads: number
  newLeadsLast30: number
  convertedLeads: number
  handoffs: number
  totalTokens: number
  avgLatencyMs: number
  totalInteractions: number
  estimatedCostBRL: number
  conversionRate: number
}

// ═══════════════════════════════════════════════════════════════
// HELPER — calculate cost in BRL
// Groq free tier, but estimate: (tokens / 1M) * $0.05 * R$5.5
// ═══════════════════════════════════════════════════════════════

function estimateCostBRL(totalTokens: number): number {
  return Number(((totalTokens / 1_000_000) * 0.05 * 5.5).toFixed(2))
}

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  try {
    await requireMaster()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ─── Run all queries in parallel ───
    const [
      // Victor/Nutri messages — CrmMessage count (via conversations on Leads)
      crmMessageCount,
      // DirectMessage where channel includes WHATSAPP (student↔trainer)
      directWhatsAppCount,
      // DirectMessage where channel = WHATSAPP_BOT (bot replies to students)
      directBotCount,
      // LeadFollowUp where type=BOT (victor)
      victorBotFollowUps,
      // LeadFollowUp where type=BOT for nutri leads
      nutriBotFollowUps,
      // SaasLeadFollowUp where type=BOT (b2b)
      b2bBotFollowUps,
      // Lead stats — trainer (victor)
      victorLeadTotal,
      victorLeadNew30,
      victorLeadConverted,
      victorLeadLost,
      victorHandoffs,
      // Lead stats — nutritionist (nutri)
      nutriLeadTotal,
      nutriLeadNew30,
      nutriLeadConverted,
      nutriLeadLost,
      nutriHandoffs,
      // SaasLead stats (b2b)
      b2bLeadTotal,
      b2bLeadNew30,
      b2bLeadConverted,
      b2bLeadLost,
      b2bHandoffs,
      // AI token usage — grouped by feature
      aiUsageVictor,
      aiUsageNutri,
      aiUsageB2b,
      // Total LeadFollowUp counts (all types) for victor
      victorFollowUpsAll,
      // Total LeadFollowUp counts (all types) for nutri
      nutriFollowUpsAll,
      // Total SaasLeadFollowUp counts (all types)
      b2bFollowUpsAll,
    ] = await Promise.all([
      // CrmMessage count (last 30 days) — these are on leads with trainerId
      prisma.crmMessage.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // DirectMessage WHATSAPP (incoming from students)
      prisma.directMessage.count({
        where: {
          channel: "WHATSAPP",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // DirectMessage WHATSAPP_BOT (bot replies to students)
      prisma.directMessage.count({
        where: {
          channel: "WHATSAPP_BOT",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // Victor bot follow-ups (type=BOT on leads with trainerId)
      prisma.leadFollowUp.count({
        where: {
          type: "BOT",
          lead: { trainerId: { not: null } },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // Nutri bot follow-ups (type=BOT on leads with nutritionistId)
      prisma.leadFollowUp.count({
        where: {
          type: "BOT",
          lead: { nutritionistId: { not: null } },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // B2B bot follow-ups
      prisma.saasLeadFollowUp.count({
        where: {
          type: "BOT",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // ─── Lead counts ───

      // Victor (trainer leads)
      prisma.lead.count({ where: { trainerId: { not: null } } }),
      prisma.lead.count({ where: { trainerId: { not: null }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { trainerId: { not: null }, status: "CONVERTED" } }),
      prisma.lead.count({ where: { trainerId: { not: null }, status: "LOST" } }),
      // Handoffs = leads where bot replies >= maxBotReplies (3)
      prisma.lead.count({
        where: {
          trainerId: { not: null },
          followUps: { some: { type: "BOT" } },
          // Leads that have 3+ BOT follow-ups are handoffs
        },
      }),

      // Nutri (nutritionist leads)
      prisma.lead.count({ where: { nutritionistId: { not: null } } }),
      prisma.lead.count({ where: { nutritionistId: { not: null }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { nutritionistId: { not: null }, status: "CONVERTED" } }),
      prisma.lead.count({ where: { nutritionistId: { not: null }, status: "LOST" } }),
      prisma.lead.count({
        where: {
          nutritionistId: { not: null },
          followUps: { some: { type: "BOT" } },
        },
      }),

      // B2B (SaasLead)
      prisma.saasLead.count(),
      prisma.saasLead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.saasLead.count({ where: { status: "CONVERTED" } }),
      prisma.saasLead.count({ where: { status: "LOST" } }),
      prisma.saasLead.count({
        where: {
          followUps: { some: { type: "BOT" } },
        },
      }),

      // ─── AI token usage by feature ───

      prisma.aiTokenUsage.aggregate({
        where: {
          feature: { in: ["chat_aluno", "lead_bot"] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
        _count: { _all: true },
      }),
      prisma.aiTokenUsage.aggregate({
        where: {
          feature: "chat_paciente",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
        _count: { _all: true },
      }),
      prisma.aiTokenUsage.aggregate({
        where: {
          feature: "lead_b2b",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
        _count: { _all: true },
      }),

      // ─── Total follow-up counts (all types) for message totals ───

      prisma.leadFollowUp.count({
        where: {
          lead: { trainerId: { not: null } },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.leadFollowUp.count({
        where: {
          lead: { nutritionistId: { not: null } },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.saasLeadFollowUp.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ])

    // ─── Handoff: count leads with >= 3 BOT follow-ups ───
    // The queries above counted leads with ANY bot follow-up.
    // For accurate handoff count, we use raw count of leads with 3+ bot replies.
    const [victorHandoffActual, nutriHandoffActual, b2bHandoffActual] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT "leadId" FROM "LeadFollowUp"
          WHERE type = 'BOT'
          AND "leadId" IN (SELECT id FROM "Lead" WHERE "trainerId" IS NOT NULL)
          GROUP BY "leadId" HAVING COUNT(*) >= 3
        ) sub
      `.then((r) => Number(r[0]?.count ?? 0)),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT "leadId" FROM "LeadFollowUp"
          WHERE type = 'BOT'
          AND "leadId" IN (SELECT id FROM "Lead" WHERE "nutritionistId" IS NOT NULL)
          GROUP BY "leadId" HAVING COUNT(*) >= 3
        ) sub
      `.then((r) => Number(r[0]?.count ?? 0)),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT "leadId" FROM "SaasLeadFollowUp"
          WHERE type = 'BOT'
          GROUP BY "leadId" HAVING COUNT(*) >= 3
        ) sub
      `.then((r) => Number(r[0]?.count ?? 0)),
    ])

    // ─── Build per-bot analytics ───

    // Victor: messages = CRM messages + direct whatsapp + lead follow-ups
    const victorTotalMessages = crmMessageCount + directWhatsAppCount + directBotCount + victorFollowUpsAll
    const victorBotReplies = victorBotFollowUps + directBotCount
    const victorTokens = aiUsageVictor._sum.totalTokens ?? 0

    const victor: BotAnalytics = {
      totalMessages: victorTotalMessages,
      botReplies: victorBotReplies,
      humanReplies: Math.max(0, victorTotalMessages - victorBotReplies),
      totalLeads: victorLeadTotal,
      newLeadsLast30: victorLeadNew30,
      convertedLeads: victorLeadConverted,
      handoffs: victorHandoffActual,
      totalTokens: victorTokens,
      avgLatencyMs: Math.round(aiUsageVictor._avg.latencyMs ?? 0),
      totalInteractions: aiUsageVictor._count._all,
      estimatedCostBRL: estimateCostBRL(victorTokens),
      conversionRate:
        victorLeadConverted + victorLeadLost > 0
          ? Math.round((victorLeadConverted / (victorLeadConverted + victorLeadLost)) * 100)
          : 0,
    }

    // Nutri
    const nutriTotalMessages = nutriFollowUpsAll
    const nutriTokens = aiUsageNutri._sum.totalTokens ?? 0

    const nutri: BotAnalytics = {
      totalMessages: nutriTotalMessages,
      botReplies: nutriBotFollowUps,
      humanReplies: Math.max(0, nutriTotalMessages - nutriBotFollowUps),
      totalLeads: nutriLeadTotal,
      newLeadsLast30: nutriLeadNew30,
      convertedLeads: nutriLeadConverted,
      handoffs: nutriHandoffActual,
      totalTokens: nutriTokens,
      avgLatencyMs: Math.round(aiUsageNutri._avg.latencyMs ?? 0),
      totalInteractions: aiUsageNutri._count._all,
      estimatedCostBRL: estimateCostBRL(nutriTokens),
      conversionRate:
        nutriLeadConverted + nutriLeadLost > 0
          ? Math.round((nutriLeadConverted / (nutriLeadConverted + nutriLeadLost)) * 100)
          : 0,
    }

    // B2B
    const b2bTotalMessages = b2bFollowUpsAll
    const b2bTokens = aiUsageB2b._sum.totalTokens ?? 0

    const b2b: BotAnalytics = {
      totalMessages: b2bTotalMessages,
      botReplies: b2bBotFollowUps,
      humanReplies: Math.max(0, b2bTotalMessages - b2bBotFollowUps),
      totalLeads: b2bLeadTotal,
      newLeadsLast30: b2bLeadNew30,
      convertedLeads: b2bLeadConverted,
      handoffs: b2bHandoffActual,
      totalTokens: b2bTokens,
      avgLatencyMs: Math.round(aiUsageB2b._avg.latencyMs ?? 0),
      totalInteractions: aiUsageB2b._count._all,
      estimatedCostBRL: estimateCostBRL(b2bTokens),
      conversionRate:
        b2bLeadConverted + b2bLeadLost > 0
          ? Math.round((b2bLeadConverted / (b2bLeadConverted + b2bLeadLost)) * 100)
          : 0,
    }

    // ─── Comparative ───

    const botEntries = [
      { name: "victor" as const, rate: victor.conversionRate },
      { name: "nutri" as const, rate: nutri.conversionRate },
      { name: "b2b" as const, rate: b2b.conversionRate },
    ]
    const topBot = botEntries.reduce((a, b) => (b.rate > a.rate ? b : a)).name

    const totalCostBRL = Number(
      (victor.estimatedCostBRL + nutri.estimatedCostBRL + b2b.estimatedCostBRL).toFixed(2)
    )
    const totalMessages = victor.totalMessages + nutri.totalMessages + b2b.totalMessages

    return Response.json({
      bots: { victor, nutri, b2b },
      topBot,
      totalCostBRL,
      totalMessages,
    })
  } catch (error) {
    console.error("[Bot Analytics]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
