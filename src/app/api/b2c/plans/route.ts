import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/b2c/plans — List all active B2C plans (public)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isB2C: true, active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        interval: true,
        price: true,
        description: true,
        hasAI: true,
        hasPostureCamera: true,
        hasVipGroup: true,
        hasNutrition: true,
        maxSessionsWeek: true,
      },
      orderBy: [{ price: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("[B2C Plans] Error:", error)
    return NextResponse.json({ error: "Erro ao buscar planos" }, { status: 500 })
  }
}
