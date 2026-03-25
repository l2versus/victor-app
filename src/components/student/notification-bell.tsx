"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

export function NotificationBell() {
  const router = useRouter()
  const [unread, setUnread] = useState(0)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/student/notifications")
      if (!res.ok) return
      const data = await res.json()
      setUnread(data.unreadCount ?? 0)
    } catch {
      // ignore
    }
  }, [])

  // Poll every 10s
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 10000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  return (
    <button
      onClick={() => router.push("/community/notifications")}
      className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.07] active:scale-95 transition-all"
      aria-label="Notificações"
    >
      <Bell className="w-4 h-4 text-neutral-400" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[9px] font-bold text-white leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  )
}
