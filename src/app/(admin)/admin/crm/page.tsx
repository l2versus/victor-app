import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { CrmClient } from "./crm-client"

export const metadata: Metadata = {
  title: "CRM — Gestão de Leads",
  robots: { index: false, follow: false },
}

export default async function CrmPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  return <CrmClient />
}
