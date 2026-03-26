import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    const subscriptions = await prisma.saasSubscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, price: true, interval: true } },
      },
    })

    return Response.json(subscriptions)
  } catch (error) {
    console.error("[Master Billing Subscriptions]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { organizationId, planId, trialDays } = body

    if (!organizationId || !planId) {
      return Response.json({ error: "organizationId e planId são obrigatórios" }, { status: 400 })
    }

    // Check org exists
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) return Response.json({ error: "Organização não encontrada" }, { status: 404 })

    // Check plan exists
    const plan = await prisma.saasPlan.findUnique({ where: { id: planId } })
    if (!plan || !plan.active) return Response.json({ error: "Plano não encontrado ou inativo" }, { status: 404 })

    const now = new Date()
    const trialEndsAt = trialDays
      ? new Date(now.getTime() + Number(trialDays) * 24 * 60 * 60 * 1000)
      : null

    const subscription = await prisma.saasSubscription.create({
      data: {
        organizationId,
        planId,
        status: trialDays ? "TRIAL" : "ACTIVE",
        startDate: now,
        trialEndsAt,
      },
      include: {
        organization: { select: { name: true } },
        plan: { select: { name: true } },
      },
    })

    return Response.json(subscription, { status: 201 })
  } catch (error) {
    console.error("[Master Billing Subscriptions POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
