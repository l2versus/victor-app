"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Library,
  ClipboardList,
  DollarSign,
  Settings,
  LogOut,
  Brain,
  Crown,
  ExternalLink,
  Upload,
  MessageCircle,
  Target,
  Calendar,
  Bell,
  BookOpen,
  BarChart3,
  QrCode,
  UserPlus,
  Send,
  Zap,
  GraduationCap,
} from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/bi-treino", label: "BI Treino", icon: BarChart3 },
  { href: "/admin/students", label: "Alunos", icon: Users },
  { href: "/admin/schedule", label: "Agenda", icon: Calendar },
  { href: "/admin/checkin", label: "Presença", icon: QrCode },
  { href: "/admin/crm", label: "CRM", icon: UserPlus },
  { href: "/admin/automations", label: "Automações", icon: Zap },
  { href: "/admin/workouts", label: "Treinos", icon: Dumbbell },
  { href: "/admin/template-library", label: "Templates", icon: BookOpen },
  { href: "/admin/exercises", label: "Exercícios", icon: Library },
  { href: "/admin/machines", label: "Equipamentos 3D", icon: Dumbbell },
  { href: "/admin/plans", label: "Planos", icon: Crown },
  { href: "/admin/messages", label: "Mensagens", icon: MessageCircle },
  { href: "/admin/broadcasts", label: "Broadcast", icon: Send },
  { href: "/admin/community", label: "Comunidade", icon: Users },
  { href: "/admin/challenges", label: "Desafios", icon: Target },
  { href: "/admin/payment-reminders", label: "Cobranças", icon: Bell },
  { href: "/admin/ai", label: "IA Tools", icon: Brain },
  { href: "/admin/academy", label: "Academia", icon: GraduationCap },
  { href: "/admin/assessments", label: "Avaliações", icon: ClipboardList },
  { href: "/admin/knowledge", label: "Base IA", icon: BookOpen },
  { href: "/admin/import", label: "Importar MFIT", icon: Upload },
  { href: "/admin/finance", label: "Financeiro", icon: DollarSign },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
]

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <aside className="w-[260px] h-full border-r border-white/[0.06] bg-[#060606]/80 backdrop-blur-xl flex flex-col shrink-0 relative overflow-hidden">
      {/* Sidebar ember glow */}
      <div className="absolute top-0 right-0 w-32 h-64 bg-gradient-to-l from-red-600/[0.03] to-transparent pointer-events-none" />
      {/* Logo — Titanium */}
      <Link href="/" className="block px-7 py-8 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold text-base tracking-tight shadow-lg shadow-red-600/20">
            V
          </div>
          <div>
            <p className="font-semibold text-[13px] text-white/90 tracking-[-0.01em]">Victor Oliveira</p>
            <p className="text-[11px] text-neutral-500 tracking-wide uppercase">Personal Trainer</p>
          </div>
        </div>
      </Link>

      {/* Nav — scrollable so footer is always visible */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300",
                isActive
                  ? "bg-red-600/10 text-red-400 border border-red-500/15"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white/80" : "")} />
              {item.label}
            </Link>
          )
        })}
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
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 w-full border border-red-500/10 hover:border-red-500/20"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sair da Conta
        </button>
      </div>
    </aside>
  )
}
