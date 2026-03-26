import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"
import { NextRequest } from "next/server"

/**
 * POST /api/master/crm/webhook
 *
 * Webhook endpoint for external lead capture (n8n, ManyChat, website forms, landing pages).
 * No auth required — uses MASTER_CRM_WEBHOOK_TOKEN from env.
 *
 * Query param: ?token=YOUR_TOKEN
 * Body: { name, email?, phone?, company?, type?, source?, city?, state?, estimatedStudents?, estimatedMrr? }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate webhook token
    const token = new URL(req.url).searchParams.get("token")
    const expectedToken = process.env.MASTER_CRM_WEBHOOK_TOKEN

    if (!expectedToken || !token || token !== expectedToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, company, type, source, city, state, estimatedStudents, estimatedMrr } = body

    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 })
    }

    // Validate type if provided
    const validTypes = ["ACADEMY", "PERSONAL_TRAINER", "NUTRITIONIST", "CLINIC"]
    const leadType = type && validTypes.includes(type.toUpperCase()) ? type.toUpperCase() : "ACADEMY"

    const leadData = {
      email: email || null,
      phone: phone || null,
      company: company || null,
      type: leadType,
      estimatedStudents: estimatedStudents ? parseInt(String(estimatedStudents)) : null,
      estimatedMrr: estimatedMrr ? parseFloat(String(estimatedMrr)) : null,
      city: city || null,
      state: state || null,
    }

    // Auto-score
    const scoreResult = calculateSaasLeadScore(leadData)

    // Check for duplicate by email or phone
    const existingLead = await findExistingLead(email, phone)
    if (existingLead) {
      // Update existing lead instead of creating duplicate
      const updated = await prisma.saasLead.update({
        where: { id: existingLead.id },
        data: {
          ...leadData,
          name,
          source: source || existingLead.source || "WEBHOOK",
          score: scoreResult.score,
          temperature: scoreResult.temperature,
        },
      })

      return Response.json({
        success: true,
        leadId: updated.id,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        action: "updated",
      })
    }

    const lead = await prisma.saasLead.create({
      data: {
        name,
        ...leadData,
        source: source || "WEBHOOK",
        score: scoreResult.score,
        temperature: scoreResult.temperature,
      },
    })

    return Response.json({
      success: true,
      leadId: lead.id,
      score: scoreResult.score,
      temperature: scoreResult.temperature,
      action: "created",
    }, { status: 201 })
  } catch (error) {
    console.error("[Master CRM Webhook]", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function findExistingLead(email?: string | null, phone?: string | null) {
  if (!email && !phone) return null

  const conditions = []
  if (email) conditions.push({ email })
  if (phone) conditions.push({ phone })

  return prisma.saasLead.findFirst({
    where: { OR: conditions },
  })
}
