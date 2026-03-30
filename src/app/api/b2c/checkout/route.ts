import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreferenceClient } from "@/lib/mercadopago"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkFraudSignals, logTransaction } from "@/lib/payment-security"

// POST /api/b2c/checkout — Create Mercado Pago preference for B2C consumer plan
export async function POST(req: NextRequest) {
  try {
    // Extract IP and user agent for security logging
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Rate limit: max 5 checkout creations per IP per hour
    const rateLimitResult = checkRateLimit(ip, 5, 60 * 60 * 1000)
    if (!rateLimitResult.success) {
      console.warn(`[B2C Checkout] Rate limited IP: ${ip}`)
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { planSlug, buyerName, buyerEmail, buyerPhone } = body

    if (!planSlug) {
      return NextResponse.json({ error: "Plano e obrigatorio" }, { status: 400 })
    }
    if (!buyerName || !buyerEmail) {
      return NextResponse.json({ error: "Nome e email sao obrigatorios" }, { status: 400 })
    }

    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(buyerEmail) || buyerEmail.length > 254) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    // Check fraud signals
    const fraudCheck = await checkFraudSignals({
      email: buyerEmail,
      phone: buyerPhone,
      ip,
      userAgent,
    })

    if (fraudCheck.shouldBlock) {
      console.warn(`[B2C Checkout] Blocked by fraud check: ${buyerEmail}`, fraudCheck.flags)
      await logTransaction({
        type: "fraud_flagged",
        amount: 0,
        email: buyerEmail,
        ip,
        userAgent,
        riskLevel: fraudCheck.riskLevel,
        flags: fraudCheck.flags,
        metadata: { planSlug, buyerName, buyerPhone },
      })
      return NextResponse.json(
        { error: "Nao foi possivel processar. Entre em contato com o suporte." },
        { status: 403 }
      )
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

    // Log successful checkout creation
    await logTransaction({
      type: "checkout_created",
      amount: plan.price,
      email: buyerEmail,
      planId: plan.id,
      ip,
      userAgent,
      riskLevel: fraudCheck.riskLevel,
      flags: fraudCheck.flags.length > 0 ? fraudCheck.flags : undefined,
      metadata: {
        planSlug: plan.slug,
        buyerName,
        buyerPhone,
        preferenceId: preference.id,
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
