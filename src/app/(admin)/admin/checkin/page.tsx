import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BackButton } from "@/components/ui/back-button"
import { CheckinAdminClient } from "./checkin-client"

export const metadata: Metadata = {
  title: "Check-in QR Code",
  robots: { index: false, follow: false },
}

export default async function CheckinPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  return (
    <div>
      <BackButton />
      <CheckinAdminClient />
    </div>
  )
}
