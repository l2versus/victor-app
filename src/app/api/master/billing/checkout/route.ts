import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPreferenceClient } from "@/lib/mercadopago"

// POST /api/master/billing/checkout — Generate Mercado Pago checkout for a SaaS plan
export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { planId, organizationId, orgName, orgEmail } = body

    if (!planId) {
      return Response.json({ error: "planId e obrigatorio" }, { status: 400 })
    }

    const plan = await prisma.saasPlan.findUnique({ where: { id: planId } })
    if (!plan || !plan.active) {
      return Response.json({ error: "Plano nao encontrado ou inativo" }, { status: 404 })
    }

    // Optional: look up org info for the payer
    let payerName = orgName || "Organizacao"
    let payerEmail = orgEmail || ""

    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, ownerEmail: true },
      })
      if (org) {
        payerName = org.name
        payerEmail = payerEmail || org.ownerEmail || ""
      }
    }

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://victor-app-seven.vercel.app"

    // SaaS external_reference format — prefixed with "saas:" to distinguish from student payments
    const externalReference = JSON.stringify({
      type: "saas",
      planId: plan.id,
      organizationId: organizationId || null,
      orgName: payerName,
      orgEmail: payerEmail,
    })

    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: `saas_${plan.id}`,
            title: `Victor App SaaS — ${plan.name} (${plan.interval})`,
            description: `Plano SaaS ${plan.name}: ate ${plan.maxProfessionals} profissionais, ${plan.maxStudents} alunos`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: payerName,
          email: payerEmail || undefined,
        },
        back_urls: {
          success: `${appUrl}/master/billing?checkout=success`,
          failure: `${appUrl}/master/billing?checkout=failure`,
          pending: `${appUrl}/master/billing?checkout=pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago/saas`,
        external_reference: externalReference,
        statement_descriptor: "VICTOR SAAS",
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    })

    return Response.json({
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
      preferenceId: preference.id,
      planName: plan.name,
      planPrice: plan.price,
      planInterval: plan.interval,
    })
  } catch (error) {
    console.error("[Master Billing Checkout]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    const detail = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: "Erro ao gerar checkout", detail }, { status: 500 })
  }
}

// GET /api/master/billing/checkout — List generated checkout links (from preferences cache)
export async function GET() {
  try {
    await requireMaster()

    // Return all active plans with their checkout info for quick link generation
    const plans = await prisma.saasPlan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        interval: true,
        maxProfessionals: true,
        maxStudents: true,
        _count: { select: { subscriptions: true } },
      },
    })

    return Response.json(plans)
  } catch (error) {
    console.error("[Master Billing Checkout GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
