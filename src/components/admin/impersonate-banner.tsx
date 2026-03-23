"use client"

import { useState, useEffect } from "react"
import { Eye, X } from "lucide-react"

export function ImpersonateBanner({ studentName }: { studentName: string }) {
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    // Check if we have an admin token stored (means we're impersonating)
    const adminToken = sessionStorage.getItem("_admin_token")
    if (adminToken) setIsImpersonating(true)
  }, [])

  if (!isImpersonating) return null

  const handleExit = () => {
    const adminToken = sessionStorage.getItem("_admin_token")
    if (adminToken) {
      document.cookie = `token=${adminToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      sessionStorage.removeItem("_admin_token")
    }
    window.location.href = "/admin/students"
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-purple-600/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-white">
        <Eye className="w-4 h-4" />
        <span className="text-xs font-semibold">
          Visualizando como: <span className="text-purple-200">{studentName}</span>
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all"
      >
        <X className="w-3 h-3" />
        Voltar ao Admin
      </button>
    </div>
  )
}
