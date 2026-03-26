"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

/**
 * Client component rendered when trainer.onboardingComplete === false.
 * Redirects to /admin/onboarding unless already there.
 */
export function OnboardingRedirector() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname.startsWith("/admin/onboarding")) {
      router.replace("/admin/onboarding")
    }
  }, [pathname, router])

  return null
}
