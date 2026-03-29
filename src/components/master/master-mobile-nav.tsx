"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Settings,
  BarChart3,
  Bot,
} from "lucide-react"

const navItems = [
  { href: "/master/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/master/organizations", label: "Orgs", icon: Building2 },
  { href: "/master/bots", label: "Bots", icon: Bot },
  { href: "/master/billing", label: "Billing", icon: DollarSign },
  { href: "/master/settings", label: "Config", icon: Settings },
]

export function MasterMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      {/* Glass background */}
      <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl border-t border-white/[0.04]" />

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
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
                isActive && "bg-violet-600/[0.12] border border-violet-500/[0.15]"
              )}>
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-all duration-300",
                  isActive && "text-violet-400 scale-110"
                )} />
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-violet-400/60" />
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
      </div>
    </nav>
  )
}
