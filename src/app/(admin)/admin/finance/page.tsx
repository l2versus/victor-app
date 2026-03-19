import { requireAdmin } from "@/lib/auth"
import { DollarSign } from "lucide-react"

export default async function FinancePage() {
  await requireAdmin()

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/10 flex items-center justify-center mx-auto backdrop-blur-xl">
            <DollarSign className="w-9 h-9 text-emerald-500" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Financeiro</h1>
        <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">
          Controle de pagamentos, cobranças e análise de receita em breve.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Em desenvolvimento
        </div>
      </div>
    </div>
  )
}
