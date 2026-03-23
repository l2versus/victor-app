import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AutomationsClient } from "./automations-client"

export const metadata: Metadata = {
  title: "Automações WhatsApp",
  robots: { index: false, follow: false },
}

export default async function AutomationsPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  return <AutomationsClient />
}
