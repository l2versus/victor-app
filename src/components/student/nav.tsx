"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dumbbell, BarChart3, User, MessageCircle } from "lucide-react"

const navItems = [
  { href: "/today", label: "Treino", icon: Dumbbell },
  { href: "/history", label: "Histórico", icon: BarChart3 },
  { href: "/chat", label: "Chat IA", icon: MessageCircle },
  { href: "/profile", label: "Perfil", icon: User },
]

export function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      {/* Glass background */}
      <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl border-t border-white/[0.04]" />

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />

      <div className="relative max-w-lg mx-auto flex items-center justify-around px-2 py-2.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-300 min-w-[60px]",
                isActive
                  ? "text-white"
                  : "text-neutral-600 active:text-neutral-400 active:scale-95"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                isActive && "bg-red-600/10 border border-red-500/20"
              )}>
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-all duration-300",
                  isActive && "text-red-400 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
                )} />
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_4px_rgba(220,38,38,0.6)]" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium tracking-wider uppercase transition-colors duration-300",
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
