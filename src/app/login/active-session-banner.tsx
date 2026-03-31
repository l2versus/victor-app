"use client"

import { useState } from "react"
import { LogOut, ArrowRight, User } from "lucide-react"

export function ActiveSessionBanner({ role }: { role: string }) {
  const [loggingOut, setLoggingOut] = useState(false)

  const dashboardUrl = role === "MASTER" ? "/master/dashboard" : role === "ADMIN" ? "/admin/dashboard" : role === "NUTRITIONIST" ? "/nutri/dashboard" : "/today"

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.reload()
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-600/[0.06] p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
        <User className="w-4 h-4" />
        Voce ja esta logado
      </div>
      <p className="text-neutral-400 text-xs leading-relaxed">
        Voce tem uma sessao ativa. Pode continuar para o app ou sair para trocar de conta.
      </p>
      <div className="flex gap-2">
        <a
          href={dashboardUrl}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-all"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Continuar
        </a>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-xs font-medium hover:bg-white/[0.04] transition-all disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? "Saindo..." : "Trocar conta"}
        </button>
      </div>
    </div>
  )
}
