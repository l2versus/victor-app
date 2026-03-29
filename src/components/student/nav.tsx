"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dumbbell, TrendingUp, User, Trophy, Camera, Utensils, ImageIcon, Activity, MessageSquare, CalendarCheck } from "lucide-react"

const BASE_NAV = [
  { href: "/today", label: "Treino", icon: Dumbbell },
  { href: "/posture", label: "Postura", icon: Camera },
  { href: "/community", label: "Comunidade", icon: Trophy },
  { href: "/evolution", label: "Evolução", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: User },
]

const NUTRITION_ITEM = { href: "/nutrition", label: "Nutrição", icon: Utensils }

// Extra student pages accessible via profile or deep links
export const EXTRA_STUDENT_PAGES = [
  { href: "/schedule", label: "Agenda", icon: CalendarCheck },
  { href: "/progress", label: "Fotos Progresso", icon: ImageIcon },
  { href: "/extra", label: "Atividades Extra", icon: Activity },
  { href: "/nutrition", label: "Nutrição", icon: Utensils },
]

interface StudentNavProps {
  hasNutrition?: boolean
}

export function StudentNav({ hasNutrition = false }: StudentNavProps) {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Poll for unread messages every 10s
  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/messages")
        if (!res.ok) return
        const data = await res.json()
        const total = (data.conversations || []).reduce(
          (sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0
        )
        setUnreadMessages(total)
      } catch { /* ignore */ }
    }
    checkUnread()
    const interval = setInterval(checkUnread, 10000)
    return () => clearInterval(interval)
  }, [])

  const navItems = hasNutrition
    ? [...BASE_NAV.slice(0, 2), NUTRITION_ITEM, ...BASE_NAV.slice(2, 4), BASE_NAV[4]]
    : BASE_NAV

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      {/* Glass background — premium frosted, deeper blur */}
      <div className="absolute inset-0 bg-[#030303]/85 backdrop-blur-[40px] border-t border-white/[0.06]" />

      {/* Top accent glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-red-600/25 to-transparent" />
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-red-600/[0.03] to-transparent pointer-events-none" />

      <div className="relative max-w-lg mx-auto flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isNutrition = item.href === "/nutrition"
          const isProfile = item.href === "/profile"
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1",
                "transition-all duration-200 ease-out",
                isActive
                  ? "text-white"
                  : "text-neutral-600 active:text-neutral-400 active:scale-90"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-9 h-9 rounded-xl",
                "transition-all duration-200",
                isActive && (isNutrition
                  ? "bg-emerald-600/15 border border-emerald-500/25 shadow-lg shadow-emerald-600/10"
                  : "bg-red-600/15 border border-red-500/25 shadow-lg shadow-red-600/10")
              )}>
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-all duration-200",
                  isActive
                    ? isNutrition
                      ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                    : "text-neutral-600"
                )} />
                {isActive && (
                  <div className={cn(
                    "absolute -bottom-1.5 w-4 h-0.5 rounded-full",
                    isNutrition
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                      : "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.6)]"
                  )} />
                )}
                {/* Unread message badge on Profile */}
                {isProfile && unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse-glow">
                    <span className="text-[8px] font-bold text-white px-1">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-semibold tracking-wider uppercase transition-colors duration-200",
                isActive ? "text-neutral-200" : "text-neutral-700"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
