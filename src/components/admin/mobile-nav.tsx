"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Brain,
  MoreHorizontal,
  Crown,
  ClipboardList,
  Upload,
  DollarSign,
  Settings,
  Globe,
  LogOut,
  X,
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
} from "lucide-react"

const mainItems = [
  { href: "/admin/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/admin/students", label: "Alunos", icon: Users },
  { href: "/admin/schedule", label: "Agenda", icon: Calendar },
  { href: "/admin/workouts", label: "Treinos", icon: Dumbbell },
]

const moreItems = [
  { href: "/admin/bi-treino", label: "BI Treino", icon: BarChart3 },
  { href: "/admin/checkin", label: "Presença", icon: QrCode },
  { href: "/admin/crm", label: "CRM", icon: UserPlus },
  { href: "/admin/automations", label: "Automações", icon: Zap },
  { href: "/admin/template-library", label: "Templates", icon: BookOpen },
  { href: "/admin/challenges", label: "Desafios", icon: Target },
  { href: "/admin/payment-reminders", label: "Cobranças", icon: Bell },
  { href: "/admin/plans", label: "Planos", icon: Crown },
  { href: "/admin/messages", label: "Mensagens", icon: MessageCircle },
  { href: "/admin/broadcasts", label: "Broadcast", icon: Send },
  { href: "/admin/ai", label: "IA Tools", icon: Brain },
  { href: "/admin/assessments", label: "Avaliações", icon: ClipboardList },
  { href: "/admin/import", label: "Importar MFIT", icon: Upload },
  { href: "/admin/finance", label: "Financeiro", icon: DollarSign },
  { href: "/admin/exercises", label: "Exercícios", icon: Dumbbell },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
]

export function AdminMobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Check if current page is one of the "more" items
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  const handleClose = useCallback(() => setMoreOpen(false), [])

  // Close menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        </div>
      )}

      {/* More Menu Panel */}
      {moreOpen && (
        <div className="fixed bottom-[68px] inset-x-0 z-50 px-3 pb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">Menu</p>
              <button onClick={handleClose} className="text-neutral-600 hover:text-white transition-colors p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {moreItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-red-600/10 border border-red-500/15 text-white"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "text-red-400")} />
                    <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Quick actions */}
            <div className="mt-2 pt-2 border-t border-white/[0.04] flex gap-1.5">
              <a
                href="/?site=true"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.03] transition-all text-[11px]"
              >
                <Globe className="w-3.5 h-3.5" />
                Ver Site
              </a>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" })
                  window.location.href = "/login"
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-[11px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
        {/* Glass background */}
        <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl border-t border-white/[0.04]" />

        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="relative flex items-center justify-around px-2 py-2">
          {mainItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 min-w-[56px]",
                  isActive
                    ? "text-white"
                    : "text-neutral-600 active:text-neutral-400"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                  isActive && "bg-white/[0.06] border border-white/[0.08]"
                )}>
                  <item.icon className={cn(
                    "w-[18px] h-[18px] transition-all duration-300",
                    isActive && "scale-110"
                  )} />
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white/60" />
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-medium tracking-wide uppercase transition-colors duration-300",
                  isActive ? "text-neutral-300" : "text-neutral-700"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 min-w-[56px]",
              moreOpen || isMoreActive
                ? "text-white"
                : "text-neutral-600 active:text-neutral-400"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
              (moreOpen || isMoreActive) && "bg-white/[0.06] border border-white/[0.08]"
            )}>
              <MoreHorizontal className={cn(
                "w-[18px] h-[18px] transition-all duration-300",
                (moreOpen || isMoreActive) && "scale-110"
              )} />
              {isMoreActive && !moreOpen && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white/60" />
              )}
            </div>
            <span className={cn(
              "text-[9px] font-medium tracking-wide uppercase transition-colors duration-300",
              moreOpen || isMoreActive ? "text-neutral-300" : "text-neutral-700"
            )}>
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
