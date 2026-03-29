import { prisma } from "@/lib/prisma"
import type { TokenPayload } from "@/lib/auth"

export interface OrgAccessResult {
  allowed: boolean
  reason?: string
  reasonCode?: "SUSPENDED" | "CANCELLED" | "TRIAL_EXPIRED" | "EXPIRED" | "PAST_DUE_GRACE_ENDED" | "NO_SUBSCRIPTION" | "LIMIT_STUDENTS" | "LIMIT_PROFESSIONALS"
  org?: {
    id: string
    name: string
    slug: string
    status: string
    maxProfessionals: number
    maxStudents: number
  }
  subscription?: {
    id: string
    status: string
    planName: string
    planPrice: number
    startDate: Date
    endDate: Date | null
    trialEndsAt: Date | null
  }
  daysRemaining?: number
  isTrialExpired?: boolean
  isTrialEndingSoon?: boolean
  isPastDue?: boolean
  pastDueGraceDaysLeft?: number
  studentCount?: number
  professionalCount?: number
  warnings: string[]
}

const PAST_DUE_GRACE_DAYS = 7

/**
 * Check subscription-based access for a user's organization.
 *
 * Rules:
 * - MASTER role: NEVER restricted
 * - No org (solo professional): NEVER restricted
 * - Org with SUSPENDED/CANCELLED status: BLOCKED
 * - Trial expired: BLOCKED
 * - Subscription expired: BLOCKED
 * - Past due beyond grace period: BLOCKED
 * - Past due within grace: ALLOWED with warning
 * - No active subscription: BLOCKED
 * - Limits exceeded: ALLOWED with warning (soft limit)
 */
export async function checkOrgAccess(session: TokenPayload): Promise<OrgAccessResult> {
  const warnings: string[] = []

  // MASTER is never restricted
  if (session.role === "MASTER") {
    return { allowed: true, warnings }
  }

  // Find the user's organization via their profile
  const orgId = await findUserOrgId(session.userId, session.role)

  // No org = solo professional, no SaaS restrictions
  if (!orgId) {
    return { allowed: true, warnings }
  }

  // Load org with subscription data
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      maxProfessionals: true,
      maxStudents: true,
      _count: {
        select: {
          trainers: true,
          nutritionists: true,
          students: true,
        },
      },
    },
  })

  if (!org) {
    // Org reference exists but org deleted — allow (edge case)
    return { allowed: true, warnings }
  }

  const orgData = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    maxProfessionals: org.maxProfessionals,
    maxStudents: org.maxStudents,
  }

  const professionalCount = org._count.trainers + org._count.nutritionists
  const studentCount = org._count.students

  // ── 1. Check org-level status (hard block) ──
  if (org.status === "SUSPENDED") {
    return {
      allowed: false,
      reason: "Conta suspensa. Entre em contato com o suporte.",
      reasonCode: "SUSPENDED",
      org: orgData,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  if (org.status === "CANCELLED") {
    return {
      allowed: false,
      reason: "Conta cancelada. Entre em contato para reativar.",
      reasonCode: "CANCELLED",
      org: orgData,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  // ── 2. Find active subscription ──
  const subscription = await prisma.saasSubscription.findFirst({
    where: {
      organizationId: orgId,
      status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] },
    },
    include: {
      plan: {
        select: { name: true, price: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!subscription) {
    return {
      allowed: false,
      reason: "Sem assinatura ativa. Escolha um plano para continuar.",
      reasonCode: "NO_SUBSCRIPTION",
      org: orgData,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  const subData = {
    id: subscription.id,
    status: subscription.status,
    planName: subscription.plan.name,
    planPrice: subscription.plan.price,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    trialEndsAt: subscription.trialEndsAt,
  }

  const now = new Date()

  // ── 3. TRIAL check ──
  if (subscription.status === "TRIAL") {
    if (subscription.trialEndsAt) {
      const trialEnd = new Date(subscription.trialEndsAt)
      const msRemaining = trialEnd.getTime() - now.getTime()
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

      if (daysRemaining <= 0) {
        // Trial expired
        return {
          allowed: false,
          reason: "Seu periodo de teste expirou. Assine um plano para continuar.",
          reasonCode: "TRIAL_EXPIRED",
          org: orgData,
          subscription: subData,
          daysRemaining: 0,
          isTrialExpired: true,
          studentCount,
          professionalCount,
          warnings,
        }
      }

      // Trial ending soon (< 7 days)
      if (daysRemaining <= 7) {
        warnings.push(`Seu periodo de teste expira em ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}.`)
        return {
          allowed: true,
          org: orgData,
          subscription: subData,
          daysRemaining,
          isTrialEndingSoon: true,
          studentCount,
          professionalCount,
          warnings,
        }
      }

      // Trial with days remaining, all good
      return {
        allowed: true,
        org: orgData,
        subscription: subData,
        daysRemaining,
        studentCount,
        professionalCount,
        warnings,
      }
    }

    // TRIAL without trialEndsAt — allow (no expiration set)
    return {
      allowed: true,
      org: orgData,
      subscription: subData,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  // ── 4. ACTIVE check ──
  if (subscription.status === "ACTIVE") {
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate)
      if (now > endDate) {
        // Subscription expired — mark it
        return {
          allowed: false,
          reason: "Sua assinatura expirou. Renove para continuar.",
          reasonCode: "EXPIRED",
          org: orgData,
          subscription: subData,
          daysRemaining: 0,
          studentCount,
          professionalCount,
          warnings,
        }
      }

      const msRemaining = endDate.getTime() - now.getTime()
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

      // Check limits (soft warnings)
      checkLimitWarnings(warnings, studentCount, org.maxStudents, professionalCount, org.maxProfessionals)

      return {
        allowed: true,
        org: orgData,
        subscription: subData,
        daysRemaining,
        studentCount,
        professionalCount,
        warnings,
      }
    }

    // ACTIVE with no endDate — perpetual, all good
    checkLimitWarnings(warnings, studentCount, org.maxStudents, professionalCount, org.maxProfessionals)

    return {
      allowed: true,
      org: orgData,
      subscription: subData,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  // ── 5. PAST_DUE check ──
  if (subscription.status === "PAST_DUE") {
    // Grace period: 7 days from when it became PAST_DUE (approximated by updatedAt)
    const sub = await prisma.saasSubscription.findUnique({
      where: { id: subscription.id },
      select: { updatedAt: true },
    })

    const pastDueSince = sub?.updatedAt ?? now
    const msSincePastDue = now.getTime() - pastDueSince.getTime()
    const daysSincePastDue = Math.floor(msSincePastDue / (1000 * 60 * 60 * 24))
    const graceDaysLeft = Math.max(0, PAST_DUE_GRACE_DAYS - daysSincePastDue)

    if (graceDaysLeft <= 0) {
      return {
        allowed: false,
        reason: "Pagamento pendente ha mais de 7 dias. Regularize para continuar.",
        reasonCode: "PAST_DUE_GRACE_ENDED",
        org: orgData,
        subscription: subData,
        isPastDue: true,
        pastDueGraceDaysLeft: 0,
        studentCount,
        professionalCount,
        warnings,
      }
    }

    warnings.push(`Pagamento pendente. Voce tem ${graceDaysLeft} dia${graceDaysLeft !== 1 ? "s" : ""} para regularizar.`)

    return {
      allowed: true,
      org: orgData,
      subscription: subData,
      isPastDue: true,
      pastDueGraceDaysLeft: graceDaysLeft,
      studentCount,
      professionalCount,
      warnings,
    }
  }

  // Fallback: allow
  return {
    allowed: true,
    org: orgData,
    subscription: subData,
    studentCount,
    professionalCount,
    warnings,
  }
}

/**
 * Find the organization ID for a given user based on their role/profile.
 */
async function findUserOrgId(userId: string, role: string): Promise<string | null> {
  if (role === "ADMIN") {
    const profile = await prisma.trainerProfile.findUnique({
      where: { userId },
      select: { organizationId: true },
    })
    return profile?.organizationId ?? null
  }

  if (role === "NUTRITIONIST") {
    const profile = await prisma.nutritionistProfile.findUnique({
      where: { userId },
      select: { organizationId: true },
    })
    return profile?.organizationId ?? null
  }

  if (role === "STUDENT") {
    // Students without a trainer are regular/public users — no org subscription required.
    // Only apply org checks to students who are direct members of an organization.
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        organizationId: true,
        trainerId: true,
      },
    })
    // No trainer = public user, allow freely
    if (!student?.trainerId) return null
    // Has a trainer but no direct org membership = personal client, allow freely
    return student?.organizationId ?? null
  }

  return null
}

/**
 * Add limit warnings to the warnings array (soft check, does not block).
 */
function checkLimitWarnings(
  warnings: string[],
  studentCount: number,
  maxStudents: number,
  professionalCount: number,
  maxProfessionals: number
) {
  if (studentCount >= maxStudents) {
    warnings.push(`Limite de ${maxStudents} alunos atingido (${studentCount}/${maxStudents}).`)
  } else if (studentCount >= maxStudents * 0.9) {
    warnings.push(`Proximo do limite de alunos (${studentCount}/${maxStudents}).`)
  }

  if (professionalCount >= maxProfessionals) {
    warnings.push(`Limite de ${maxProfessionals} profissionais atingido (${professionalCount}/${maxProfessionals}).`)
  }
}
