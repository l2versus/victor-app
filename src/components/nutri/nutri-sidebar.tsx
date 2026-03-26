"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/branding"
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  ClipboardList,
  Apple,
  BookOpen,
  Settings,
  LogOut,
  ExternalLink,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react"

const navGroups = [
  {
    label: "Gestão",
    items: [
      { href: "/nutri/dashboard", label: "Painel", icon: LayoutDashboard },
      { href: "/nutri/students", label: "Pacientes", icon: Users },
      { href: "/nutri/schedule", label: "Agenda", icon: Calendar },
      { href: "/nutri/messages", label: "Mensagens", icon: MessageCircle },
    ],
  },
  {
    label: "Nutrição",
    items: [
      { href: "/nutri/meal-plans", label: "Planos Alimentares", icon: ClipboardList },
      { href: "/nutri/foods", label: "Alimentos", icon: Apple },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/nutri/crm", label: "CRM", icon: Target },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { href: "/nutri/bi", label: "BI Nutri", icon: BarChart3 },
      { href: "/nutri/knowledge", label: "Base IA", icon: BookOpen },
    ],
  },
  {
    label: "Config",
    items: [
      { href: "/nutri/settings", label: "Configurações", icon: Settings },
    ],
  },
]

export function NutriSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <aside className="w-[260px] h-full border-r border-white/[0.06] bg-[#060606]/80 backdrop-blur-xl flex flex-col shrink-0 relative overflow-hidden">
      {/* Sidebar emerald glow */}
      <div className="absolute top-0 right-0 w-32 h-64 bg-gradient-to-l from-emerald-600/[0.03] to-transparent pointer-events-none" />

      {/* Logo — Nutri */}
      <Link href="/nutri/dashboard" className="block px-7 py-8 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-[13px] text-white/90 tracking-[-0.01em]">Nutri</p>
            <p className="text-[11px] text-neutral-500 tracking-wide uppercase">{BRAND.appName}</p>
          </div>
        </div>
      </Link>

      {/* Nav — scrollable so footer is always visible */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3.5 py-1 text-[9px] font-medium uppercase tracking-[0.15em] text-neutral-600">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300",
                    isActive
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/15"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
                  )}
                >
                  <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white/80" : "")} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-white/[0.06]">
        <p className="text-[11px] text-neutral-600 truncate px-3.5 mb-3 tracking-wide">{userName}</p>
        <a
          href="/?site=true"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-all duration-300 w-full border border-transparent hover:border-white/[0.06] mb-1.5"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
          Ver Site
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300 w-full border border-emerald-500/10 hover:border-emerald-500/20"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sair da Conta
        </button>
      </div>
    </aside>
  )
}
