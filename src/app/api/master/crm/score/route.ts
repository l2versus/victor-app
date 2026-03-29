import { NextResponse } from "next/server"
import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateSaasLeadScore } from "@/lib/saas-lead-scoring"

// POST /api/master/crm/score — batch re-score all active SaasLeads
export async function POST() {
  try {
    await requireMaster()

    const leads = await prisma.saasLead.findMany({
      where: { status: { notIn: ["CONVERTED", "LOST"] } },
    })

    const results = []

    for (const lead of leads) {
      const result = calculateSaasLeadScore({
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        type: lead.type,
        estimatedStudents: lead.estimatedStudents,
        estimatedMrr: lead.estimatedMrr ? Number(lead.estimatedMrr) : null,
        city: lead.city,
        state: lead.state,
      })

      await prisma.saasLead.update({
        where: { id: lead.id },
        data: { score: result.score, temperature: result.temperature },
      })

      results.push({
        id: lead.id,
        name: lead.company || lead.name,
        score: result.score,
        temperature: result.temperature,
        label: result.label,
      })
    }

    results.sort((a, b) => b.score - a.score)

    return NextResponse.json({ scored: results.length, results })
  } catch (error) {
    console.error("POST /api/master/crm/score error:", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
