"use client"

import { LogOut } from "lucide-react"

export function SettingsLogout() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all active:scale-[0.98]"
    >
      <LogOut className="w-4 h-4" />
      Sair da Conta
    </button>
  )
}
