import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkOrgAccess } from "@/lib/subscription-guard"
import { SubscriptionRestrictionPage } from "@/components/subscription-banner"

export default async function RestrictedPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  // Re-check access — if they're allowed now, redirect back to admin
  const access = await checkOrgAccess(session)
  if (access.allowed) {
    redirect("/admin/dashboard")
  }

  return (
    <SubscriptionRestrictionPage
      reason={access.reason || "Acesso restrito."}
      reasonCode={access.reasonCode}
      orgName={access.org?.name}
      planName={access.subscription?.planName}
    />
  )
}
