import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentClient, calculateEndDate } from "@/lib/mercadopago"
import { hashPassword } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"
import crypto from "crypto"

// ═══════════════════════════════════════
// B2C Payment Webhook — Mercado Pago IPN
// Handles payments from /pricing checkout (consumidor final)
// ═══════════════════════════════════════

// Verify Mercado Pago webhook signature (HMAC-SHA256) — copied from main webhook
function verifyMpSignature(req: NextRequest): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[B2C Webhook] MERCADOPAGO_WEBHOOK_SECRET not set in production — rejecting")
      return false
    }
    console.warn("[B2C Webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature check (dev only)")
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
    }),
  )
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"))
  } catch {
    return false
  }
}

// Generate cryptographically secure temporary password
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789"
  const bytes = crypto.randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("")
}

// Map Mercado Pago payment type to our enum
function mapMpPaymentMethod(
  mpType?: string | null,
): "PIX" | "CREDIT_CARD" | "MERCADOPAGO" | "BANK_TRANSFER" {
  switch (mpType) {
    case "credit_card":
    case "debit_card":
      return "CREDIT_CARD"
    case "bank_transfer":
    case "pix":
      return "PIX"
    default:
      return "MERCADOPAGO"
  }
}

// POST /api/webhooks/mercadopago/b2c — Receive B2C payment notifications
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifyMpSignature(req)) {
      console.warn("[B2C Webhook] Invalid signature — rejecting")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = await req.json()

    // Only process payment notifications
    if (
      body.type !== "payment" &&
      body.action !== "payment.created" &&
      body.action !== "payment.updated"
    ) {
      return NextResponse.json({ received: true })
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
      console.log(`[B2C Webhook] Payment ${paymentId} status: ${mpPayment.status} — skipping`)
      return NextResponse.json({ received: true, status: mpPayment.status })
    }

    // Parse external_reference
    let refData: {
      type?: string
      planId: string
      planSlug?: string
      buyerName: string
      buyerEmail: string
      buyerPhone?: string
    }
    try {
      refData = JSON.parse(mpPayment.external_reference || "{}")
    } catch {
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 })
    }

    // Verify this is a B2C payment
    if (refData.type !== "b2c") {
      console.warn(`[B2C Webhook] Non-B2C payment received: type=${refData.type}`)
      return NextResponse.json({ received: true, skipped: "not-b2c" })
    }

    const { planId, buyerName, buyerEmail, buyerPhone } = refData
    if (!planId || !buyerEmail || !buyerName) {
      return NextResponse.json({ error: "Missing reference data" }, { status: 400 })
    }

    // Idempotency: check if already processed
    const existingPayment = await prisma.payment.findFirst({
      where: { gatewayId: String(paymentId) },
    })
    if (existingPayment) {
      console.log(`[B2C Webhook] Payment ${paymentId} already processed — skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Find the B2C plan
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isB2C) {
      console.error(`[B2C Webhook] B2C Plan ${planId} not found`)
      return NextResponse.json({ error: "B2C plan not found" }, { status: 404 })
    }

    // Check if user already exists before hashing (bcrypt is expensive)
    let isNewUser = false
    let newUserTempPassword: string | null = null
    let user = await prisma.user.findUnique({ where: { email: buyerEmail } })

    if (!user) {
      const tempPassword = generateTempPassword()
      newUserTempPassword = tempPassword
      const hashedPwd = await hashPassword(tempPassword)
      isNewUser = true

      try {
        user = await prisma.user.create({
          data: {
            name: buyerName,
            email: buyerEmail,
            password: hashedPwd,
            phone: buyerPhone || null,
            role: "STUDENT",
          },
        })
      } catch (e: unknown) {
        // Race condition: user was created between findUnique and create
        const msg = e instanceof Error ? e.message : ""
        if (msg.includes("Unique constraint")) {
          user = await prisma.user.findUnique({ where: { email: buyerEmail } })
          if (!user) throw e
          isNewUser = false
        } else {
          throw e
        }
      }
    }

    // All student + financial operations in a single transaction
    const startDate = new Date()
    const endDate = calculateEndDate(startDate, plan.interval)

    await prisma.$transaction(async (tx) => {
      // Find or create student profile (B2C: no trainer, no org)
      const existingStudent = await tx.student.findUnique({
        where: { userId: user.id },
      })

      let resolvedStudent: NonNullable<typeof existingStudent>

      if (!existingStudent) {
        isNewUser = true
        resolvedStudent = await tx.student.create({
          data: {
            userId: user.id,
            trainerId: null, // B2C self-service — no trainer
            organizationId: null,
            status: "ACTIVE",
            goals: "Assinante B2C via checkout online",
          },
        })
      } else {
        resolvedStudent = existingStudent
        if (resolvedStudent.status !== "ACTIVE") {
          await tx.student.update({
            where: { id: resolvedStudent.id },
            data: { status: "ACTIVE" },
          })
        }
      }

      // Register payment FIRST (prevents orphaned state)
      await tx.payment.create({
        data: {
          studentId: resolvedStudent.id,
          amount: mpPayment.transaction_amount || plan.price,
          method: mapMpPaymentMethod(mpPayment.payment_type_id),
          status: "PAID",
          dueDate: startDate,
          paidAt: new Date(),
          gatewayId: String(paymentId),
          description: `B2C ${plan.name} (${plan.interval}) — MP #${paymentId}`,
          invoiceUrl: mpPayment.transaction_details?.external_resource_url || null,
        },
      })

      // Cancel existing active subscriptions
      await tx.subscription.updateMany({
        where: { studentId: resolvedStudent.id, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      })

      // Create new subscription
      await tx.subscription.create({
        data: {
          studentId: resolvedStudent.id,
          planId: plan.id,
          status: "ACTIVE",
          startDate,
          endDate,
          autoRenew: true,
        },
      })

      // Notify user
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "subscription_activated",
          title: "Assinatura ativada!",
          body: `Seu plano ${plan.name} (${plan.interval}) esta ativo. Bons treinos!`,
        },
      })
    })

    // Send welcome email with credentials to new users
    if (isNewUser && newUserTempPassword) {
      await sendWelcomeEmail({
        to: buyerEmail,
        name: buyerName,
        tempPassword: newUserTempPassword,
        planName: `${plan.name} B2C (${plan.interval})`,
      })
    }

    console.log(
      `[B2C Webhook] Payment ${paymentId} processed — user=${user.id}, plan=${plan.slug}, new=${isNewUser}`,
    )

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    console.error("[B2C Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
