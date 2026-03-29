import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateEndDate } from "@/lib/mercadopago"

// PATCH /api/master/billing/subscriptions/[id] — Update subscription (cancel, upgrade, extend trial, reactivate)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await request.json()
    const { action, planId, trialDays } = body

    const subscription = await prisma.saasSubscription.findUnique({
      where: { id },
      include: { plan: true, organization: true },
    })

    if (!subscription) {
      return Response.json({ error: "Assinatura nao encontrada" }, { status: 404 })
    }

    switch (action) {
      case "cancel": {
        const updated = await prisma.saasSubscription.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
          include: {
            organization: { select: { name: true } },
            plan: { select: { name: true } },
          },
        })
        return Response.json(updated)
      }

      case "reactivate": {
        if (subscription.status !== "CANCELLED" && subscription.status !== "EXPIRED") {
          return Response.json(
            { error: "Apenas assinaturas canceladas ou expiradas podem ser reativadas" },
            { status: 400 }
          )
        }
        const now = new Date()
        const newEnd = calculateEndDate(now, subscription.plan.interval)
        const updated = await prisma.saasSubscription.update({
          where: { id },
          data: {
            status: "ACTIVE",
            startDate: now,
            endDate: newEnd,
            cancelledAt: null,
          },
          include: {
            organization: { select: { name: true } },
            plan: { select: { name: true } },
          },
        })
        return Response.json(updated)
      }

      case "upgrade":
      case "downgrade": {
        if (!planId) {
          return Response.json({ error: "planId e obrigatorio para upgrade/downgrade" }, { status: 400 })
        }
        const newPlan = await prisma.saasPlan.findUnique({ where: { id: planId } })
        if (!newPlan || !newPlan.active) {
          return Response.json({ error: "Plano nao encontrado ou inativo" }, { status: 404 })
        }

        const now = new Date()
        const newEnd = calculateEndDate(now, newPlan.interval)

        const updated = await prisma.$transaction(async (tx) => {
          // Update org limits to match new plan
          await tx.organization.update({
            where: { id: subscription.organizationId },
            data: {
              maxProfessionals: newPlan.maxProfessionals,
              maxStudents: newPlan.maxStudents,
            },
          })

          return tx.saasSubscription.update({
            where: { id },
            data: {
              planId: newPlan.id,
              startDate: now,
              endDate: newEnd,
              status: "ACTIVE",
            },
            include: {
              organization: { select: { name: true } },
              plan: { select: { name: true, price: true } },
            },
          })
        })
        return Response.json(updated)
      }

      case "extend_trial": {
        if (!trialDays || trialDays < 1) {
          return Response.json({ error: "trialDays deve ser >= 1" }, { status: 400 })
        }
        const currentTrialEnd = subscription.trialEndsAt || new Date()
        const newTrialEnd = new Date(currentTrialEnd.getTime() + Number(trialDays) * 24 * 60 * 60 * 1000)

        const updated = await prisma.saasSubscription.update({
          where: { id },
          data: {
            trialEndsAt: newTrialEnd,
            status: "TRIAL",
          },
          include: {
            organization: { select: { name: true } },
            plan: { select: { name: true } },
          },
        })
        return Response.json(updated)
      }

      default:
        return Response.json(
          { error: `Acao desconhecida: ${action}. Use: cancel, reactivate, upgrade, downgrade, extend_trial` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("[Master Billing Subscription PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
