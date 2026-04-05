import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FitVSLoader } from "./fitvs-loader"

export default async function FitVSPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")
  const params = await searchParams
  const roomId = params.room || null

  return <FitVSLoader roomId={roomId} userName={session.email?.split("@")[0] || "Atleta"} />
}
