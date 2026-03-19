import { requireAdmin } from "@/lib/auth"
import { ClipboardList } from "lucide-react"

export default async function AssessmentsPage() {
  await requireAdmin()

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/10 flex items-center justify-center mx-auto backdrop-blur-xl">
            <ClipboardList className="w-9 h-9 text-red-500" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-red-500/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Avaliações</h1>
        <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">
          Composição corporal, fotos de progresso e métricas de desempenho em breve.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Em desenvolvimento
        </div>
      </div>
    </div>
  )
}
