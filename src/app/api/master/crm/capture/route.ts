import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"
import { NextRequest } from "next/server"

/**
 * POST /api/master/crm/capture
 *
 * Public endpoint for the B2B landing page form.
 * Creates a SaasLead with source="WEBSITE" and auto-scores it.
 * No auth required (public form submission).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, company, type, city, state, estimatedStudents, estimatedMrr, notes } = body

    if (!name) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Validate type if provided
    const validTypes = ["ACADEMY", "PERSONAL_TRAINER", "NUTRITIONIST", "CLINIC"]
    const leadType = type && validTypes.includes(type) ? type : "ACADEMY"

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

    // Check for existing lead by email to avoid duplicates
    if (email) {
      const existing = await prisma.saasLead.findFirst({ where: { email } })
      if (existing) {
        return Response.json({
          success: true,
          message: "Recebemos seus dados! Entraremos em contato em breve.",
        })
      }
    }

    await prisma.saasLead.create({
      data: {
        name,
        ...leadData,
        notes: notes || null,
        source: "WEBSITE",
        score: scoreResult.score,
        temperature: scoreResult.temperature,
      },
    })

    return Response.json({
      success: true,
      message: "Recebemos seus dados! Entraremos em contato em breve.",
    }, { status: 201 })
  } catch (error) {
    console.error("[Master CRM Capture]", error)
    return Response.json({ error: "Erro ao enviar. Tente novamente." }, { status: 500 })
  }
}
