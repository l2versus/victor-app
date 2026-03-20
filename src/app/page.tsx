import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const params = await searchParams
  const forceSite = params.site === "true"

  if (!forceSite) {
    const session = await getSession()
    if (session) {
      if (session.role === "ADMIN") redirect("/admin/dashboard")
      redirect("/today")
    }
  }

  return <LandingPage />
}
