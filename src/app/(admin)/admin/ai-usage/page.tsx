import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BackButton } from "@/components/ui/back-button"
import { AiUsageClient } from "./ai-usage-client"

export const metadata: Metadata = {
  title: "Consumo IA — Tokens",
  robots: { index: false, follow: false },
}

export default async function AiUsagePage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  return (
    <div>
      <BackButton />
      <AiUsageClient />
    </div>
  )
}
