import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"

const EvolutionClient = dynamic(
  () => import("./evolution-client").then(m => ({ default: m.EvolutionClient })),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-white/[0.04] rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 h-20" />
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 h-56" />
      </div>
    ),
  }
)

export default async function EvolutionPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  return <EvolutionClient />
}
