/**
 * Payment Security Module
 *
 * Anti-fraud measures for Mercado Pago transactions:
 * 1. Signature verification (HMAC-SHA256) — already exists in webhook
 * 2. Payment amount validation — verify paid amount matches plan price
 * 3. Idempotency — prevent double-processing (already exists)
 * 4. IP rate limiting on checkout creation
 * 5. Email verification before checkout
 * 6. Device fingerprint logging
 * 7. Suspicious pattern detection
 */

import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

// ═══ Disposable email domains (common throwaway services) ═══
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.de",
  "sharklasers.com",
  "grr.la",
  "guerrillamailblock.com",
  "mailinator.com",
  "dispostable.com",
  "yopmail.com",
  "yopmail.fr",
  "throwaway.email",
  "temp-mail.org",
  "tempail.com",
  "fakeinbox.com",
  "mailnesia.com",
  "maildrop.cc",
  "discard.email",
  "trashmail.com",
  "trashmail.me",
  "trashmail.net",
  "10minutemail.com",
  "minutemail.com",
  "tempr.email",
  "tempinbox.com",
  "burnermail.io",
  "mailnull.com",
  "mailsac.com",
  "emailondeck.com",
  "getnada.com",
  "mohmal.com",
  "harakirimail.com",
  "crazymailing.com",
])

/**
 * Verify payment amount matches the plan price (+-1% tolerance for currency rounding)
 */
export function validatePaymentAmount(
  paidAmount: number,
  planPrice: number
): {
  valid: boolean
  reason?: string
  difference?: number
} {
  if (planPrice <= 0) {
    return { valid: false, reason: "Plan price is zero or negative" }
  }

  const difference = Math.abs(paidAmount - planPrice)
  const tolerance = planPrice * 0.01 // 1% tolerance

  if (difference <= tolerance) {
    return { valid: true }
  }

  const percentDiff = ((difference / planPrice) * 100).toFixed(2)
  return {
    valid: false,
    reason: `Amount mismatch: paid R$${paidAmount.toFixed(2)}, expected R$${planPrice.toFixed(2)} (${percentDiff}% difference)`,
    difference,
  }
}

/**
 * Check for suspicious patterns (fraud signals)
 */
export async function checkFraudSignals(params: {
  email: string
  phone?: string
  ip?: string
  userAgent?: string
  paymentMethod?: string
}): Promise<{
  riskLevel: "low" | "medium" | "high"
  flags: string[]
  shouldBlock: boolean
}> {
  const flags: string[] = []

  // 1. Check disposable email domains
  const emailDomain = params.email.split("@")[1]?.toLowerCase()
  if (emailDomain && DISPOSABLE_DOMAINS.has(emailDomain)) {
    flags.push("disposable_email")
  }

  // 2. Velocity check: same email creating 3+ checkouts in 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  try {
    const recentCheckouts = await prisma.transactionLog.count({
      where: {
        email: params.email,
        type: "checkout_created",
        createdAt: { gte: oneHourAgo },
      },
    })
    if (recentCheckouts >= 3) {
      flags.push("velocity_email_high")
    } else if (recentCheckouts >= 2) {
      flags.push("velocity_email_medium")
    }
  } catch {
    // TransactionLog table might not exist yet — skip velocity check
  }

  // 3. IP velocity check: same IP creating 5+ checkouts in 1 hour
  if (params.ip) {
    try {
      const recentIpCheckouts = await prisma.transactionLog.count({
        where: {
          ip: params.ip,
          type: "checkout_created",
          createdAt: { gte: oneHourAgo },
        },
      })
      if (recentIpCheckouts >= 5) {
        flags.push("velocity_ip_high")
      }
    } catch {
      // Table might not exist
    }
  }

  // 4. Brazilian phone validation (11 digits starting with DDD 11-99)
  if (params.phone) {
    const digits = params.phone.replace(/\D/g, "")
    if (digits.length !== 10 && digits.length !== 11) {
      flags.push("invalid_phone_length")
    } else {
      const ddd = parseInt(digits.substring(0, 2))
      if (ddd < 11 || ddd > 99) {
        flags.push("invalid_phone_ddd")
      }
    }
  }

  // 5. Email format suspicious patterns
  const emailLocal = params.email.split("@")[0]
  if (emailLocal && /^\d+$/.test(emailLocal)) {
    flags.push("numeric_email_local")
  }
  if (emailLocal && emailLocal.length < 3) {
    flags.push("short_email_local")
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low"
  let shouldBlock = false

  const highRiskFlags = ["velocity_email_high", "velocity_ip_high"]
  const mediumRiskFlags = [
    "disposable_email",
    "velocity_email_medium",
    "invalid_phone_length",
    "invalid_phone_ddd",
  ]

  if (flags.some((f) => highRiskFlags.includes(f))) {
    riskLevel = "high"
    shouldBlock = true
  } else if (flags.some((f) => mediumRiskFlags.includes(f))) {
    riskLevel = "medium"
  } else if (flags.length > 0) {
    riskLevel = "medium"
  }

  return { riskLevel, flags, shouldBlock }
}

/**
 * Log transaction for audit trail
 */
export async function logTransaction(params: {
  type:
    | "checkout_created"
    | "payment_received"
    | "payment_verified"
    | "fraud_flagged"
    | "refund"
  amount: number
  email: string
  planId?: string
  gatewayId?: string
  ip?: string
  userAgent?: string
  riskLevel?: string
  flags?: string[]
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.transactionLog.create({
      data: {
        type: params.type,
        amount: params.amount,
        email: params.email,
        planId: params.planId || null,
        gatewayId: params.gatewayId || null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        riskLevel: params.riskLevel || null,
        flags: params.flags && params.flags.length > 0 ? params.flags : Prisma.DbNull,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    })
  } catch (error) {
    // Log but don't fail the main operation — audit logging is best-effort
    console.error("[PaymentSecurity] Failed to log transaction:", error)
  }
}
