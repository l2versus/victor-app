import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    await requireMaster()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    const leads = await prisma.saasLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { followUps: true } },
      },
    })

    return Response.json(leads)
  } catch (error) {
    console.error("[Master CRM GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireMaster()

    const body = await req.json()
    const { name, email, phone, company, type, notes, city, state, estimatedStudents, estimatedMrr, source } = body

    if (!name) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const leadData = {
      email: email || null,
      phone: phone || null,
      company: company || null,
      type: type || "ACADEMY",
      estimatedStudents: estimatedStudents ? parseInt(estimatedStudents) : null,
      estimatedMrr: estimatedMrr ? parseFloat(estimatedMrr) : null,
      city: city || null,
      state: state || null,
    }

    // Auto-score the lead
    const scoreResult = calculateSaasLeadScore(leadData)

    const lead = await prisma.saasLead.create({
      data: {
        name,
        ...leadData,
        notes: notes || null,
        source: source || null,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (error) {
    console.error("[Master CRM POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
