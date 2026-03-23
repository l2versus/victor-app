"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export function AiChatFab() {
  const pathname = usePathname()

  // Hide on chat page itself
  if (pathname === "/chat") return null

  return (
    <Link
      href="/chat"
      prefetch={true}
      className="fixed z-50 group"
      style={{ bottom: "5.5rem", right: "1.25rem" }}
      aria-label="Chat com IA"
    >
      {/* Outer pulse ring */}
      <span className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" style={{ animationDuration: "3s" }} />

      {/* Glow */}
      <span className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-red-500/30 to-red-900/20 blur-md group-active:from-red-500/50" />

      {/* Button */}
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-900/40 border border-red-500/30 group-active:scale-95 transition-transform duration-150">
        <Sparkles className="w-5.5 h-5.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
      </span>

      {/* Label pill */}
      <span className="absolute -top-1 -left-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-semibold text-white tracking-wide uppercase whitespace-nowrap">
        IA
      </span>
    </Link>
  )
}
