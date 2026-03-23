import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/checkout/subscription — Create Mercado Pago recurring subscription (preapproval)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, buyerName, buyerEmail, buyerPhone } = body

    if (!planId || !buyerEmail || !buyerName) {
      return NextResponse.json({ error: "Plano, nome e email são obrigatórios" }, { status: 400 })
    }

    // Find plan
    let plan = await prisma.plan.findUnique({ where: { slug: planId } })
    if (!plan) {
      plan = await prisma.plan.findUnique({ where: { id: planId } }).catch(() => null)
    }
    if (!plan) {
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

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: "Pagamento não configurado" }, { status: 500 })
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Map plan interval to MP frequency
    const frequencyMap: Record<string, { frequency: number; type: string }> = {
      MONTHLY: { frequency: 1, type: "months" },
      QUARTERLY: { frequency: 3, type: "months" },
      SEMIANNUAL: { frequency: 6, type: "months" },
      ANNUAL: { frequency: 12, type: "months" },
    }
    const freq = frequencyMap[plan.interval] || frequencyMap.MONTHLY

    // Create Mercado Pago preapproval (recurring subscription)
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Victor App — Plano ${plan.name} (${plan.interval})`,
        auto_recurring: {
          frequency: freq.frequency,
          frequency_type: freq.type,
          transaction_amount: plan.price,
          currency_id: "BRL",
        },
        payer_email: buyerEmail,
        back_url: `${appUrl}/checkout/success`,
        external_reference: JSON.stringify({
          planId: plan.id,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || null,
          type: "subscription",
        }),
        status: "pending",
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[MP Subscription] Error:", errorText)
      return NextResponse.json({ error: "Erro ao criar assinatura", detail: errorText }, { status: 500 })
    }

    const subscription = await res.json()

    return NextResponse.json({
      subscriptionUrl: subscription.init_point,
      sandboxUrl: subscription.sandbox_init_point,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("Subscription checkout error:", error)
    const detail = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Erro ao criar assinatura", detail }, { status: 500 })
  }
}
