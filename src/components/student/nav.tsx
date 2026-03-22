"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dumbbell, TrendingUp, User, Trophy, Camera, Utensils, MoreHorizontal, X, ImageIcon, Activity } from "lucide-react"

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
  { href: "/progress", label: "Fotos Progresso", icon: ImageIcon },
  { href: "/extra", label: "Atividades Extra", icon: Activity },
  { href: "/nutrition", label: "Nutrição", icon: Utensils },
]

interface StudentNavProps {
  hasNutrition?: boolean
}

export function StudentNav({ hasNutrition = false }: StudentNavProps) {
  const pathname = usePathname()
  const navItems = hasNutrition
    ? [...BASE_NAV.slice(0, 2), NUTRITION_ITEM, ...BASE_NAV.slice(2, 4), BASE_NAV[4]]
    : BASE_NAV

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      {/* Glass background */}
      <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl border-t border-white/4" />

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-red-600/20 to-transparent" />

      <div className="relative max-w-lg mx-auto flex items-center justify-around px-1 py-2.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isNutrition = item.href === "/nutrition"
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1",
                "transition-[color,transform] duration-150 ease-out",
                isActive
                  ? "text-white"
                  : "text-neutral-600 active:text-neutral-400 active:scale-95"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-xl",
                "transition-[background-color,border-color] duration-150",
                isActive && (isNutrition
                  ? "bg-emerald-600/10 border border-emerald-500/20"
                  : "bg-red-600/10 border border-red-500/20")
              )}>
                <item.icon className={cn(
                  "w-4.25 h-4.25 transition-colors duration-150",
                  isActive && (isNutrition
                    ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                    : "text-red-400 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]")
                )} />
                {isActive && (
                  <div className={cn(
                    "absolute -bottom-1 w-1 h-1 rounded-full",
                    isNutrition
                      ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                      : "bg-red-500 shadow-[0_0_4px_rgba(220,38,38,0.6)]"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium tracking-wider uppercase transition-colors duration-150",
                isActive ? "text-neutral-300" : "text-neutral-700"
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
