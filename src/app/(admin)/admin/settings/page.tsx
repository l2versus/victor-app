import { requireAdmin } from "@/lib/auth"
import { Settings, Globe, CreditCard, Bell, Palette } from "lucide-react"
import Link from "next/link"
import { SettingsLogout } from "./settings-logout"

export default async function SettingsPage() {
  await requireAdmin()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-neutral-400" />
          Configuracoes
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Gerenciar conta e preferencias</p>
      </div>

      <div className="space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <Globe className="w-4 h-4 text-neutral-500" />
          <span>Visitar Site (Landing Page)</span>
        </Link>

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-500 text-sm cursor-not-allowed">
          <CreditCard className="w-4 h-4" />
          <span>Planos e Cobranca</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400">Em breve</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-500 text-sm cursor-not-allowed">
          <Bell className="w-4 h-4" />
          <span>Notificacoes</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400">Em breve</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-500 text-sm cursor-not-allowed">
          <Palette className="w-4 h-4" />
          <span>Personalizacao</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400">Em breve</span>
        </div>
      </div>

      <SettingsLogout />
    </div>
  )
}
