"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Trophy, MessageSquare, Zap, Megaphone, X, CheckCheck, CalendarCheck, CalendarX, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  achievement: <Trophy className="w-4 h-4 text-amber-400" />,
  new_message: <MessageSquare className="w-4 h-4 text-blue-400" />,
  challenge_started: <Zap className="w-4 h-4 text-purple-400" />,
  announcement: <Megaphone className="w-4 h-4 text-red-400" />,
  schedule_new: <Calendar className="w-4 h-4 text-blue-400" />,
  schedule_confirmed: <CalendarCheck className="w-4 h-4 text-green-400" />,
  schedule_cancelled: <CalendarX className="w-4 h-4 text-red-400" />,
  schedule_completed: <CalendarCheck className="w-4 h-4 text-neutral-400" />,
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/student/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {
      // ignore network errors silently
    }
  }, [])

  // Poll every 10s for new notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  async function markAllRead() {
    setLoading(true)
    try {
      await fetch("/api/student/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id: string) {
    await fetch("/api/student/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      })
    }
    setOpen(o => !o)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
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

      {/* Dropdown panel — fixed to escape overflow-hidden parents */}
      {open && (
        <>
        {/* Backdrop — blocks content behind */}
        <div className="fixed inset-0 z-[199] bg-black/60" onClick={() => setOpen(false)} />
        <div
          style={panelStyle}
          className="fixed w-[min(320px,calc(100vw-2rem))] max-h-96 flex flex-col z-200 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <p className="text-sm font-semibold text-white">Notificações</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-neutral-600 hover:text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-neutral-700" />
                <p className="text-xs text-neutral-600">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id) }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0",
                    !n.read && "bg-white/[0.02]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    !n.read ? "bg-red-600/15" : "bg-white/[0.04]"
                  )}>
                    {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-neutral-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn("text-xs font-semibold truncate", n.read ? "text-neutral-400" : "text-white")}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
