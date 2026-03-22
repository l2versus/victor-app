import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreferenceClient } from "@/lib/mercadopago"

// POST /api/checkout — Create Mercado Pago checkout preference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, buyerName, buyerEmail, buyerPhone } = body

    if (!planId || !buyerEmail || !buyerName) {
      return NextResponse.json(
        { error: "Plano, nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Find plan by: slug → id → name+interval fallback
    // Landing page sends "pro_semiannual" = tier name + interval
    let plan = await prisma.plan.findUnique({ where: { slug: planId } })
    if (!plan) {
      plan = await prisma.plan.findUnique({ where: { id: planId } }).catch(() => null)
    }
    if (!plan) {
      // Fallback: parse "pro_semiannual" → name="Pro", interval="SEMIANNUAL"
      const parts = planId.split("_")
      if (parts.length >= 2) {
        const tierName = parts[0]
        const intervalKey = parts.slice(1).join("_").toUpperCase()
        plan = await prisma.plan.findFirst({
          where: {
            name: { equals: tierName, mode: "insensitive" },
            interval: intervalKey as "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL",
            active: true,
          },
        })
      }
    }
    if (!plan || !plan.active) {
      return NextResponse.json({ error: `Plano não encontrado: ${planId}` }, { status: 404 })
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Mercado Pago preference
    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: plan.id,
            title: `Victor App — Plano ${plan.name} (${plan.interval})`,
            description: plan.description || `Plano ${plan.name} de treino personalizado`,
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
          success: `${appUrl}/checkout/success`,
          failure: `${appUrl}/checkout/failure`,
          pending: `${appUrl}/checkout/pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        external_reference: JSON.stringify({
          planId: plan.id,
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
    console.error("Checkout error:", error)
    const detail = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Erro ao criar checkout", detail }, { status: 500 })
  }
}
