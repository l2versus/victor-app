"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Heart, MessageSquare, UserPlus, AtSign, Bell,
  Trophy, Zap, Megaphone, Calendar, CalendarCheck, CalendarX,
  Check, Loader2,
} from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
  senderStudentId: string | null
  senderName: string | null
  senderAvatar: string | null
  isFollowingSender: boolean
}

type Filter = "all" | "follows" | "comments"

const TYPE_ICON: Record<string, React.ReactNode> = {
  social_like: <Heart className="w-4 h-4 text-red-400" />,
  social_comment: <MessageSquare className="w-4 h-4 text-blue-400" />,
  social_follow: <UserPlus className="w-4 h-4 text-green-400" />,
  social_mention: <AtSign className="w-4 h-4 text-purple-400" />,
  achievement: <Trophy className="w-4 h-4 text-amber-400" />,
  challenge_started: <Zap className="w-4 h-4 text-purple-400" />,
  announcement: <Megaphone className="w-4 h-4 text-red-400" />,
  new_message: <MessageSquare className="w-4 h-4 text-blue-400" />,
  schedule_new: <Calendar className="w-4 h-4 text-blue-400" />,
  schedule_confirmed: <CalendarCheck className="w-4 h-4 text-green-400" />,
  schedule_cancelled: <CalendarX className="w-4 h-4 text-red-400" />,
  schedule_completed: <CalendarCheck className="w-4 h-4 text-neutral-400" />,
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} d`
  return `${Math.floor(days / 7)} sem`
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function groupByTime(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = Date.now()
  const groups: { label: string; items: Notification[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Últimos 7 dias", items: [] },
    { label: "Anteriores", items: [] },
  ]
  for (const n of notifications) {
    const diff = now - new Date(n.createdAt).getTime()
    const hours = diff / 3600000
    if (hours < 24) groups[0].items.push(n)
    else if (hours < 48) groups[1].items.push(n)
    else if (hours < 168) groups[2].items.push(n)
    else groups[3].items.push(n)
  }
  return groups.filter(g => g.items.length > 0)
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set())

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/student/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Mark all as read on mount
  useEffect(() => {
    fetch("/api/student/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
  }, [])

  async function handleFollow(studentId: string) {
    setFollowingLoading(prev => new Set(prev).add(studentId))
    try {
      await fetch("/api/community/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      // Update local state
      setNotifications(prev => prev.map(n =>
        n.senderStudentId === studentId ? { ...n, isFollowingSender: true } : n
      ))
    } catch { /* ignore */ }
    setFollowingLoading(prev => { const s = new Set(prev); s.delete(studentId); return s })
  }

  function handleNotificationClick(n: Notification) {
    // Navigate based on type
    if (n.senderStudentId && (n.type === "social_follow" || n.type === "social_like" || n.type === "social_comment" || n.type === "social_mention")) {
      router.push(`/community/profile/${n.senderStudentId}`)
    } else if (n.type === "new_message") {
      router.push("/community/dm")
    } else if (n.type.startsWith("schedule")) {
      router.push("/schedule")
    } else {
      router.push("/community")
    }
  }

  // Filter notifications
  const filtered = notifications.filter(n => {
    if (filter === "follows") return n.type === "social_follow"
    if (filter === "comments") return n.type === "social_comment" || n.type === "social_mention"
    return true
  })

  const grouped = groupByTime(filtered)

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tudo" },
    { id: "follows", label: "Pessoas que você segue" },
    { id: "comments", label: "Comentários" },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-[#030303]/90 backdrop-blur-xl z-10 border-b border-white/[0.04]">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white flex-1">Notificações</h1>
      </div>

      {/* Filter tabs — Instagram style */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
              filter === f.id
                ? "bg-white text-black"
                : "bg-white/[0.06] border border-white/[0.08] text-neutral-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell className="w-12 h-12 text-neutral-700" />
          <p className="text-neutral-500 text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="pb-24">
          {grouped.map(group => (
            <div key={group.label}>
              {/* Time group header */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-bold text-white">{group.label}</p>
              </div>

              {group.items.map(n => (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors ${
                    !n.read ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {/* Sender avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold shrink-0 overflow-hidden">
                    {n.senderAvatar ? (
                      <img src={n.senderAvatar} alt="" className="w-full h-full object-cover" />
                    ) : n.senderName ? (
                      getInitials(n.senderName)
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-neutral-500" />}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-neutral-300 leading-snug">
                      <span className="font-semibold text-white">{n.senderName || n.title}</span>
                      {" "}
                      {n.type === "social_follow" && "começou a seguir você."}
                      {n.type === "social_like" && "curtiu seu post."}
                      {n.type === "social_comment" && (
                        <>comentou: <span className="text-neutral-400">{n.body?.replace(/^"/, "").replace(/"$/, "")}</span></>
                      )}
                      {n.type === "social_mention" && (
                        <>mencionou você: <span className="text-neutral-400">{n.body?.replace(/^"/, "").replace(/"$/, "")}</span></>
                      )}
                      {!n.type.startsWith("social_") && (
                        <span className="text-neutral-400">{n.body}</span>
                      )}
                      <span className="text-neutral-600 ml-1">{timeAgo(n.createdAt)}</span>
                    </p>
                  </div>

                  {/* Right side: Follow back button or post thumbnail */}
                  {n.type === "social_follow" && n.senderStudentId && !n.isFollowingSender && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFollow(n.senderStudentId!)
                      }}
                      disabled={followingLoading.has(n.senderStudentId)}
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shrink-0 min-h-[32px] min-w-[80px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {followingLoading.has(n.senderStudentId) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Seguir"
                      )}
                    </button>
                  )}
                  {n.type === "social_follow" && n.senderStudentId && n.isFollowingSender && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[11px] text-neutral-400 shrink-0">
                      <Check className="w-3 h-3" /> Seguindo
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
