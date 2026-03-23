import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BackButton } from "@/components/ui/back-button"
import { CrmClient } from "./crm-client"

export const metadata: Metadata = {
  title: "CRM — Gestão de Leads",
  robots: { index: false, follow: false },
}

export default async function CrmPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  return (
    <div>
      <BackButton />
      <Suspense>
        <CrmClient />
      </Suspense>
    </div>
  )
}
