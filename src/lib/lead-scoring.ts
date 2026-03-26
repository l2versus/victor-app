/**
 * Lead Scoring Engine — calcula score 0-100 e temperatura automática.
 *
 * Chamado automaticamente quando:
 * - Lead é criado (webhook, form, WhatsApp)
 * - Lead recebe nova mensagem
 * - Status do lead muda
 * - Batch via botão "AI Score" no CRM
 *
 * Fatores:
 * 1. Frequência de contato (25%) — dias distintos com interação nos últimos 30d
 * 2. Recência (25%) — dias desde último contato
 * 3. Valor potencial (20%) — R$ esperado/mês
 * 4. Qualidade da fonte (15%) — referral > walk-in > instagram > ...
 * 5. Posição no pipeline (15%) — negotiating > trial > contacted > new
 */

import { prisma } from "./prisma"

const SOURCE_SCORES: Record<string, number> = {
  REFERRAL: 15, WALK_IN: 13, INSTAGRAM: 10, WHATSAPP: 10,
  WEBSITE: 8, MANYCHAT: 9, FACEBOOK: 7, TIKTOK: 6, OTHER: 3,
}

const PIPELINE_SCORES: Record<string, number> = {
  NEW: 3, CONTACTED: 7, TRIAL: 12, NEGOTIATING: 15,
}

export interface ScoreResult {
  score: number
  temperature: "HOT" | "WARM" | "COLD"
  label: string
  factors: {
    frequency: number
    recency: number
    value: number
    source: number
    pipeline: number
  }
}

export function calculateScore(lead: {
  source: string
  status: string
  value: number | null
  lastContactAt: Date | null
  updatedAt: Date
  followUps: { createdAt: Date }[]
}): ScoreResult {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  // Factor 1: Frequência (25%)
  const recentFollowUps = lead.followUps.filter(f => new Date(f.createdAt).getTime() > thirtyDaysAgo)
  const distinctDays = new Set(recentFollowUps.map(f => new Date(f.createdAt).toDateString())).size
  const frequency = Math.min(distinctDays / 10, 1) * 25

  // Factor 2: Recência (25%)
  const lastContact = lead.lastContactAt || lead.updatedAt
  const daysSince = Math.floor((now - new Date(lastContact).getTime()) / 86400000)
  const recency = daysSince <= 1 ? 25 : daysSince <= 3 ? 20 : daysSince <= 7 ? 15
    : daysSince <= 14 ? 8 : daysSince <= 30 ? 3 : 0

  // Factor 3: Valor (20%)
  const v = lead.value || 0
  const value = v >= 500 ? 20 : v >= 300 ? 16 : v >= 200 ? 12 : v >= 100 ? 8 : v > 0 ? 4 : 0

  // Factor 4: Fonte (15%)
  const source = SOURCE_SCORES[lead.source] || 3

  // Factor 5: Pipeline (15%)
  const pipeline = PIPELINE_SCORES[lead.status] || 0

  const total = Math.min(Math.max(Math.round(frequency + recency + value + source + pipeline), 0), 100)

  const temperature: "HOT" | "WARM" | "COLD" = total >= 60 ? "HOT" : total >= 30 ? "WARM" : "COLD"
  const label = total >= 80 ? "Muito Quente" : total >= 60 ? "Quente"
    : total >= 40 ? "Morno" : total >= 20 ? "Frio" : "Gelado"

  return {
    score: total,
    temperature,
    label,
    factors: {
      frequency: Math.round(frequency),
      recency: Math.round(recency),
      value: Math.round(value),
      source,
      pipeline,
    },
  }
}

/**
 * Score + update um lead no banco + log activity.
 * Chamada segura — não lança exceção, só loga erro.
 */
export async function scoreAndUpdateLead(leadId: string): Promise<ScoreResult | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { followUps: { select: { createdAt: true } } },
    })
    if (!lead || lead.status === "CONVERTED" || lead.status === "LOST") return null

    const result = calculateScore(lead)

    await prisma.lead.update({
      where: { id: leadId },
      data: { score: result.score, temperature: result.temperature },
    })

    return result
  } catch (err) {
    console.error(`[LeadScoring] Error scoring lead ${leadId}:`, err)
    return null
  }
}

/**
 * Score + update um lead + notificar trainer (BRAND.trainerFirstName) se ficou HOT.
 */
export async function scoreAndNotify(leadId: string): Promise<void> {
  const result = await scoreAndUpdateLead(leadId)
  if (!result || result.temperature !== "HOT") return

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { name: true, trainerId: true, nutritionistId: true } })
    if (!lead) return

    // Notify the owner (trainer or nutritionist)
    const ownerId = lead.trainerId || lead.nutritionistId
    if (!ownerId) return

    const trainer = lead.trainerId ? await prisma.trainerProfile.findUnique({
      where: { id: lead.trainerId },
      select: { userId: true },
    }) : null
    const nutri = !trainer && lead.nutritionistId ? await prisma.nutritionistProfile.findUnique({
      where: { id: lead.nutritionistId },
      select: { userId: true },
    }) : null
    const ownerUserId = trainer?.userId || nutri?.userId
    if (!ownerUserId) return

    // Notificar só se score recém ficou HOT
    await prisma.notification.create({
      data: {
        userId: ownerUserId,
        type: "hot_lead",
        title: `🔥 Lead quente: ${lead.name}`,
        body: `Score ${result.score}/100 — ${result.label}. Hora de entrar em contato!`,
        metadata: { leadId, score: result.score },
      },
    })
  } catch { /* non-blocking */ }
}
