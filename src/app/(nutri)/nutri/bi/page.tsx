import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BackButton } from "@/components/ui/back-button"
import { BiClient } from "./bi-client"

export const metadata: Metadata = {
  title: "BI & Analytics - Nutri",
  robots: { index: false, follow: false },
}

export default async function NutriBiPage() {
  const session = await getSession()
  if (!session || session.role !== "NUTRITIONIST") redirect("/login")

  return (
    <div>
      <BackButton />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        }
      >
        <BiClient />
      </Suspense>
    </div>
  )
}
