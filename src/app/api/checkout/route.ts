import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreferenceClient } from "@/lib/mercadopago"
import { getSession } from "@/lib/auth"

// POST /api/checkout — Create Mercado Pago checkout preference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, planSlug, buyerName, buyerEmail, buyerPhone } = body

    const planKey = planSlug || planId

    // If logged in, use session data as fallback
    const session = await getSession().catch(() => null)
    let name = buyerName
    let email = buyerEmail
    let phone = buyerPhone

    if (session && (!name || !email)) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, phone: true },
      })
      if (user) {
        name = name || user.name
        email = email || user.email
        phone = phone || user.phone
      }
    }

    if (!planKey) {
      return NextResponse.json({ error: "Plano é obrigatório" }, { status: 400 })
    }
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 })
    }

    // Find plan by: slug → id → name+interval fallback
    let plan = await prisma.plan.findUnique({ where: { slug: planKey } })
    if (!plan) {
      plan = await prisma.plan.findUnique({ where: { id: planKey } }).catch(() => null)
    }
    if (!plan) {
      // Fallback: parse "elite-semiannual" or "pro_quarterly" → name + interval
      const sep = planKey.includes("-") ? "-" : "_"
      const parts = planKey.split(sep)
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
      return NextResponse.json({ error: `Plano não encontrado: ${planKey}` }, { status: 404 })
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://victor-app-seven.vercel.app"

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
          name,
          email,
          phone: phone ? { number: phone } : undefined,
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
          buyerName: name,
          buyerEmail: email,
          buyerPhone: phone || null,
          userId: session?.userId || null,
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
