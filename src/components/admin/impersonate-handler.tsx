"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export function ImpersonateHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("_impersonate")
    if (!token) return

    // Set the impersonation token as cookie
    document.cookie = `token=${token}; path=/; max-age=3600; SameSite=Lax`

    // Store the original admin token so we can switch back
    const currentToken = document.cookie.split("; ").find(c => c.startsWith("token="))?.split("=").slice(1).join("=")
    if (currentToken && currentToken !== token) {
      sessionStorage.setItem("_admin_token", currentToken)
    }

    // Remove the query param and reload
    const url = new URL(window.location.href)
    url.searchParams.delete("_impersonate")
    window.location.href = url.pathname
  }, [searchParams, router])

  return null
}
