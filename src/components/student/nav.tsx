"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Timer, BarChart3, User, MessageCircle } from "lucide-react"

const navItems = [
  { href: "/today", label: "Treino", icon: Calendar },
  { href: "/history", label: "Historico", icon: BarChart3 },
  { href: "/chat", label: "Chat IA", icon: MessageCircle },
  { href: "/profile", label: "Perfil", icon: User },
]

export function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
