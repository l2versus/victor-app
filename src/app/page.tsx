import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export default async function Home() {
  const session = await getSession()

  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard")
    redirect("/today")
  }

  return <LandingPage />
}
