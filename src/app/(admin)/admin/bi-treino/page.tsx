import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { BiTreinoClient } from "./bi-treino-client"

export const metadata: Metadata = {
  title: "BI Treino",
  robots: { index: false, follow: false },
}

export default async function BiTreinoPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")

  return (
    <div className="space-y-6">
      <BiTreinoClient />
    </div>
  )
}
