import { prisma } from "@/lib/prisma"

export interface SyncResult {
  total: number
  updated: number
  details: Array<{
    orgId: string
    orgName: string
    oldStatus: string
    newStatus: string
    reason: string
  }>
}

/**
 * Sync all organization statuses based on their subscription state.
 *
 * Logic:
 * - Trial with expired trialEndsAt: mark subscription EXPIRED, org SUSPENDED
 * - Active subscription past endDate: mark subscription EXPIRED, org SUSPENDED
 * - Active subscription: org ACTIVE
 * - Trial subscription (not expired): org TRIAL
 * - Cancelled subscription: org CANCELLED
 * - No subscription at all: keep current status (don't break new orgs)
 */
export async function syncAllOrgStatuses(): Promise<SyncResult> {
  const now = new Date()
  const details: SyncResult["details"] = []

  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          plan: { select: { name: true } },
        },
      },
    },
  })

  for (const org of organizations) {
    const sub = org.subscriptions[0]
    if (!sub) continue // No subscription — skip

    let newOrgStatus: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED" = org.status as "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED"
    let newSubStatus: string | null = null
    let reason = ""

    // ── Trial check ──
    if (sub.status === "TRIAL") {
      if (sub.trialEndsAt && now > new Date(sub.trialEndsAt)) {
        newOrgStatus = "SUSPENDED"
        newSubStatus = "EXPIRED"
        reason = "Trial expirado"
      } else {
        newOrgStatus = "TRIAL"
        reason = "Trial ativo"
      }
    }

    // ── Active check ──
    else if (sub.status === "ACTIVE") {
      if (sub.endDate && now > new Date(sub.endDate)) {
        newOrgStatus = "SUSPENDED"
        newSubStatus = "EXPIRED"
        reason = "Assinatura expirada"
      } else {
        newOrgStatus = "ACTIVE"
        reason = "Assinatura ativa"
      }
    }

    // ── Past Due check ──
    else if (sub.status === "PAST_DUE") {
      // Check if grace period (7 days) has expired
      const daysSince = Math.floor((now.getTime() - new Date(sub.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince > 7) {
        newOrgStatus = "SUSPENDED"
        newSubStatus = "EXPIRED"
        reason = "Pagamento pendente por mais de 7 dias"
      }
      // else: keep current status, still in grace period
    }

    // ── Cancelled check ──
    else if (sub.status === "CANCELLED") {
      newOrgStatus = "CANCELLED"
      reason = "Assinatura cancelada"
    }

    // ── Expired check ──
    else if (sub.status === "EXPIRED") {
      newOrgStatus = "SUSPENDED"
      reason = "Assinatura expirada"
    }

    // Only update if status changed
    const orgStatusChanged = newOrgStatus !== org.status
    const subStatusChanged = newSubStatus && newSubStatus !== sub.status

    if (orgStatusChanged || subStatusChanged) {
      // Update in a transaction
      await prisma.$transaction(async (tx) => {
        if (orgStatusChanged) {
          await tx.organization.update({
            where: { id: org.id },
            data: { status: newOrgStatus },
          })
        }
        if (subStatusChanged && newSubStatus) {
          await tx.saasSubscription.update({
            where: { id: sub.id },
            data: { status: newSubStatus as "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED" },
          })
        }
      })

      details.push({
        orgId: org.id,
        orgName: org.name,
        oldStatus: org.status,
        newStatus: newOrgStatus,
        reason,
      })
    }
  }

  return {
    total: organizations.length,
    updated: details.length,
    details,
  }
}
