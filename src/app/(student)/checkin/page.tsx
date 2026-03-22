import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CheckinStudentClient } from "./checkin-client"

export const metadata: Metadata = {
  title: "Check-in",
  robots: { index: false, follow: false },
}

export default async function CheckinPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <main className="min-h-screen bg-[#050505] pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <CheckinStudentClient />
      </div>
    </main>
  )
}
