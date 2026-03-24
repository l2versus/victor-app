import { requireAdmin } from "@/lib/auth"
import { Settings, Globe, CreditCard, Bell, Palette, Crown, DollarSign, BarChart3, UserPlus, Smartphone, Brain } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { SettingsLogout } from "./settings-logout"

export default async function SettingsPage() {
  await requireAdmin()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <BackButton />
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

        <Link
          href="/admin/plans"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <Crown className="w-4 h-4 text-neutral-500" />
          <span>Planos e Assinaturas</span>
        </Link>

        <Link
          href="/admin/payment-reminders"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <CreditCard className="w-4 h-4 text-neutral-500" />
          <span>Cobranças</span>
        </Link>

        <Link
          href="/admin/bi-treino"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          <span>BI Treino</span>
        </Link>

        <Link
          href="/admin/crm"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4 text-neutral-500" />
          <span>CRM — Leads</span>
        </Link>

        <Link
          href="/admin/finance"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <DollarSign className="w-4 h-4 text-neutral-500" />
          <span>Financeiro</span>
        </Link>

        <Link
          href="/admin/crm?tab=whatsapp"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-green-500/20 text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <Smartphone className="w-4 h-4 text-green-500" />
          <span>WhatsApp (Conectar)</span>
          <span className="ml-auto text-[10px] text-green-500/60 font-medium">Evolution API</span>
        </Link>

        <Link
          href="/admin/ai-usage"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-purple-500/20 text-neutral-300 text-sm hover:bg-white/[0.06] transition-all active:scale-[0.98]"
        >
          <Brain className="w-4 h-4 text-purple-500" />
          <span>Consumo IA (Tokens)</span>
          <span className="ml-auto text-[10px] text-purple-500/60 font-medium">Groq</span>
        </Link>
      </div>

      <SettingsLogout />
    </div>
  )
}
