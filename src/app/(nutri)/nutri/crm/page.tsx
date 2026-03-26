import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BackButton } from "@/components/ui/back-button"
import { CrmClient } from "./crm-client"

export const metadata: Metadata = {
  title: "CRM — Pacientes Potenciais",
  robots: { index: false, follow: false },
}

export default async function NutriCrmPage() {
  const session = await getSession()
  if (!session || session.role !== "NUTRITIONIST") redirect("/login")
  return (
    <div>
      <BackButton />
      <Suspense>
        <CrmClient />
      </Suspense>
    </div>
  )
}
