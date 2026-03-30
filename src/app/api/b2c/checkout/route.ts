import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreferenceClient } from "@/lib/mercadopago"

// POST /api/b2c/checkout — Create Mercado Pago preference for B2C consumer plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planSlug, buyerName, buyerEmail, buyerPhone } = body

    if (!planSlug) {
      return NextResponse.json({ error: "Plano e obrigatorio" }, { status: 400 })
    }
    if (!buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Nome e email sao obrigatorios" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    // Find the B2C plan by slug
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })

    if (!plan || !plan.active || !plan.isB2C) {
      return NextResponse.json({ error: `Plano B2C nao encontrado: ${planSlug}` }, { status: 404 })
    }

    // Free plans should go through /api/b2c/trial, not checkout
    if (plan.price === 0) {
      return NextResponse.json(
        { error: "Plano gratuito — use /api/b2c/trial para iniciar o trial" },
        { status: 400 },
      )
    }

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://victor-app-seven.vercel.app"

    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: plan.id,
            title: `Victor App — Plano ${plan.name} (${plan.interval})`,
            description: plan.description || `Plano ${plan.name} B2C`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone ? { number: buyerPhone } : undefined,
        },
        back_urls: {
          success: `${appUrl}/pricing/result?status=approved`,
          failure: `${appUrl}/pricing/result?status=failure`,
          pending: `${appUrl}/pricing/result?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago/b2c`,
        external_reference: JSON.stringify({
          type: "b2c",
          planId: plan.id,
          planSlug: plan.slug,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || null,
        }),
        statement_descriptor: "VICTOR APP",
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
      },
    })

    return NextResponse.json({
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
      preferenceId: preference.id,
    })
  } catch (error) {
    console.error("[B2C Checkout] Error:", error)
    const detail = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Erro ao criar checkout B2C", detail }, { status: 500 })
  }
}
