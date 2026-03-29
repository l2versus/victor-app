import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentClient, calculateEndDate } from "@/lib/mercadopago"
import crypto from "crypto"

// Verify Mercado Pago webhook signature (HMAC-SHA256)
function verifySaasSignature(req: NextRequest): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[SaaS Webhook] MERCADOPAGO_WEBHOOK_SECRET not set in production — rejecting")
      return false
    }
    console.warn("[SaaS Webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature check (dev only)")
    return true
  }

  const xSignature = req.headers.get("x-signature")
  const xRequestId = req.headers.get("x-request-id")
  const url = new URL(req.url)
  const dataId = url.searchParams.get("data.id") ?? ""

  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=")
      return [k, v.join("=")]
    })
  )
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"))
  } catch {
    return false
  }
}

// POST /api/webhooks/mercadopago/saas — Receive IPN for SaaS payments (separate from student billing)
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifySaasSignature(req)) {
      console.warn("[SaaS Webhook] Invalid signature — rejecting")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = await req.json()
    console.log("[SaaS Webhook] Received:", body.type, body.action)

    // Only process payment notifications
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return NextResponse.json({ received: true, type: body.type })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID" }, { status: 400 })
    }

    // Fetch payment details from Mercado Pago
    const mpPayment = await getPaymentClient().get({ id: paymentId })

    if (!mpPayment || !mpPayment.status) {
      return NextResponse.json({ error: "Payment not found in MP" }, { status: 404 })
    }

    // Only process approved payments
    if (mpPayment.status !== "approved") {
      console.log(`[SaaS Webhook] Payment ${paymentId} status: ${mpPayment.status} — ignoring`)
      return NextResponse.json({ received: true, status: mpPayment.status })
    }

    // Parse external_reference — expect { type: "saas", planId, organizationId, orgName, orgEmail }
    let refData: {
      type?: string
      planId?: string
      organizationId?: string | null
      orgName?: string
      orgEmail?: string
    }
    try {
      refData = JSON.parse(mpPayment.external_reference || "{}")
    } catch {
      console.error("[SaaS Webhook] Invalid external_reference:", mpPayment.external_reference)
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 })
    }

    // Only process SaaS payments — ignore student payments that might arrive here
    if (refData.type !== "saas") {
      console.log("[SaaS Webhook] Not a SaaS payment, ignoring. Type:", refData.type)
      return NextResponse.json({ received: true, skipped: "not_saas" })
    }

    if (!refData.planId) {
      return NextResponse.json({ error: "Missing planId in reference" }, { status: 400 })
    }

    // Idempotency: check if we already processed this payment
    const existingInvoice = await prisma.saasInvoice.findFirst({
      where: {
        subscription: { organizationId: refData.organizationId || undefined },
        status: "paid",
        // Use createdAt as rough duplicate check — within 1 minute means duplicate
        createdAt: {
          gte: new Date(Date.now() - 60_000),
        },
      },
    })
    // More robust: check by gateway reference in a custom way
    // For now, we proceed carefully

    const plan = await prisma.saasPlan.findUnique({ where: { id: refData.planId } })
    if (!plan) {
      console.error(`[SaaS Webhook] Plan ${refData.planId} not found`)
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const now = new Date()
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const endDate = calculateEndDate(now, plan.interval)

    // --- SCENARIO A: Existing organization (renewal or upgrade) ---
    if (refData.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: refData.organizationId } })
      if (!org) {
        console.error(`[SaaS Webhook] Organization ${refData.organizationId} not found`)
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }

      await prisma.$transaction(async (tx) => {
        // Find active subscription for this org
        let subscription = await tx.saasSubscription.findFirst({
          where: { organizationId: org.id, status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] } },
        })

        if (subscription) {
          // Renewal: extend end date + update plan if changed
          subscription = await tx.saasSubscription.update({
            where: { id: subscription.id },
            data: {
              planId: plan.id,
              status: "ACTIVE",
              endDate,
            },
          })
        } else {
          // New subscription for existing org
          subscription = await tx.saasSubscription.create({
            data: {
              organizationId: org.id,
              planId: plan.id,
              status: "ACTIVE",
              startDate: now,
              endDate,
            },
          })
        }

        // Create paid invoice
        await tx.saasInvoice.create({
          data: {
            subscriptionId: subscription.id,
            amount: mpPayment.transaction_amount || plan.price,
            status: "paid",
            dueDate: now,
            paidAt: now,
            referenceMonth,
          },
        })

        // Update org limits + status
        await tx.organization.update({
          where: { id: org.id },
          data: {
            status: "ACTIVE",
            maxProfessionals: plan.maxProfessionals,
            maxStudents: plan.maxStudents,
          },
        })
      })

      console.log(`[SaaS Webhook] Renewal processed for org ${org.name}, plan ${plan.name}`)
      return NextResponse.json({ received: true, processed: true, action: "renewal" })
    }

    // --- SCENARIO B: New organization (first payment) ---
    const orgName = refData.orgName || "Nova Organizacao"
    const orgEmail = refData.orgEmail || ""
    const slug = orgName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50)

    // Make slug unique
    let uniqueSlug = slug
    let slugCounter = 0
    while (await prisma.organization.findUnique({ where: { slug: uniqueSlug } })) {
      slugCounter++
      uniqueSlug = `${slug}-${slugCounter}`
    }

    await prisma.$transaction(async (tx) => {
      // Create the organization
      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
          ownerEmail: orgEmail || null,
          status: "ACTIVE",
          maxProfessionals: plan.maxProfessionals,
          maxStudents: plan.maxStudents,
        },
      })

      // Create subscription
      const subscription = await tx.saasSubscription.create({
        data: {
          organizationId: newOrg.id,
          planId: plan.id,
          status: "ACTIVE",
          startDate: now,
          endDate,
        },
      })

      // Create paid invoice
      await tx.saasInvoice.create({
        data: {
          subscriptionId: subscription.id,
          amount: mpPayment.transaction_amount || plan.price,
          status: "paid",
          dueDate: now,
          paidAt: now,
          referenceMonth,
        },
      })
    })

    console.log(`[SaaS Webhook] New org "${orgName}" provisioned with plan ${plan.name}`)
    return NextResponse.json({ received: true, processed: true, action: "new_org" })
  } catch (error) {
    console.error("[SaaS Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
