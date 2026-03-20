import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EvolutionClient } from "./evolution-client"

export default async function EvolutionPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  return <EvolutionClient />
}
