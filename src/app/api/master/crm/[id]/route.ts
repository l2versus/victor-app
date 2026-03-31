import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"
import { executeFlowTrigger } from "@/lib/bot-flow-executor"
import { NextRequest } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params

    const lead = await prisma.saasLead.findUnique({
      where: { id },
      include: {
        followUps: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    return Response.json(lead)
  } catch (error) {
    console.error("[Master CRM GET id]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await req.json()

    const {
      name, email, phone, company, type, status, notes,
      city, state, estimatedStudents, estimatedMrr, source, lostReason,
      convertedAt, convertedOrgId,
    } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email || null
    if (phone !== undefined) data.phone = phone || null
    if (company !== undefined) data.company = company || null
    if (type !== undefined) data.type = type
    if (status !== undefined) data.status = status
    if (notes !== undefined) data.notes = notes || null
    if (city !== undefined) data.city = city || null
    if (state !== undefined) data.state = state || null
    if (estimatedStudents !== undefined) data.estimatedStudents = estimatedStudents ? parseInt(estimatedStudents) : null
    if (estimatedMrr !== undefined) data.estimatedMrr = estimatedMrr ? parseFloat(estimatedMrr) : null
    if (source !== undefined) data.source = source || null
    if (lostReason !== undefined) data.lostReason = lostReason || null
    if (convertedAt !== undefined) data.convertedAt = convertedAt ? new Date(convertedAt) : null
    if (convertedOrgId !== undefined) data.convertedOrgId = convertedOrgId || null

    // If any scoring-relevant field changed, re-score
    const scoringFields = ["email", "phone", "company", "type", "estimatedStudents", "estimatedMrr", "city", "state"]
    const needsRescore = scoringFields.some((f) => data[f] !== undefined)

    if (needsRescore) {
      // Fetch current lead to merge with updates for scoring
      const current = await prisma.saasLead.findUnique({ where: { id } })
      if (current) {
        const merged = {
          email: data.email !== undefined ? data.email as string | null : current.email,
          phone: data.phone !== undefined ? data.phone as string | null : current.phone,
          company: data.company !== undefined ? data.company as string | null : current.company,
          type: data.type !== undefined ? data.type as string : current.type,
          estimatedStudents: data.estimatedStudents !== undefined ? data.estimatedStudents as number | null : current.estimatedStudents,
          estimatedMrr: data.estimatedMrr !== undefined ? data.estimatedMrr as number | null : current.estimatedMrr,
          city: data.city !== undefined ? data.city as string | null : current.city,
          state: data.state !== undefined ? data.state as string | null : current.state,
        }
        const scoreResult = calculateSaasLeadScore(merged)
        data.score = scoreResult.score
        data.temperature = scoreResult.temperature
      }
    }

    // Fetch old status before update for flow trigger
    const existingForFlow = status !== undefined
      ? await prisma.saasLead.findUnique({ where: { id }, select: { status: true, name: true, phone: true } })
      : null

    const lead = await prisma.saasLead.update({
      where: { id },
      data,
      include: {
        followUps: { orderBy: { createdAt: "desc" } },
      },
    })

    // Fire flow trigger on status change (fire-and-forget)
    if (existingForFlow && status && status !== existingForFlow.status) {
      executeFlowTrigger("status_change", {
        leadId: id,
        botType: "b2b",
        leadName: existingForFlow.name,
        phone: existingForFlow.phone || "",
        oldStatus: existingForFlow.status,
        newStatus: status,
      }).catch(console.error)
    }

    return Response.json(lead)
  } catch (error) {
    console.error("[Master CRM PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()
    const { id } = await params

    await prisma.saasLead.delete({ where: { id } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error("[Master CRM DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
