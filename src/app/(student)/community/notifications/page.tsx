"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Heart, MessageSquare, UserPlus, AtSign, Bell,
  Trophy, Zap, Megaphone, Calendar, CalendarCheck, CalendarX,
  Check, Loader2, Eye, X,
} from "lucide-react"
import { SafeAvatar } from "@/components/ui/safe-image"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion"

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
  social_like: <Heart className="w-5 h-5 text-red-400" />,
  social_comment: <MessageSquare className="w-5 h-5 text-blue-400" />,
  social_follow: <UserPlus className="w-5 h-5 text-green-400" />,
  social_mention: <AtSign className="w-5 h-5 text-purple-400" />,
  achievement: <Trophy className="w-5 h-5 text-amber-400" />,
  challenge_started: <Zap className="w-5 h-5 text-purple-400" />,
  announcement: <Megaphone className="w-5 h-5 text-red-400" />,
  new_message: <MessageSquare className="w-5 h-5 text-blue-400" />,
  schedule_new: <Calendar className="w-5 h-5 text-blue-400" />,
  schedule_confirmed: <CalendarCheck className="w-5 h-5 text-green-400" />,
  schedule_cancelled: <CalendarX className="w-5 h-5 text-red-400" />,
  schedule_completed: <CalendarCheck className="w-5 h-5 text-neutral-400" />,
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

/** Returns readable body text for each notification type */
function getNotificationText(n: Notification): React.ReactNode {
  switch (n.type) {
    case "social_follow":
      return "comecou a seguir voce."
    case "social_like":
      return "curtiu seu post."
    case "social_comment":
      return (
        <>
          comentou: <span className="text-neutral-400">&ldquo;{n.body?.replace(/^"/, "").replace(/"$/, "")}&rdquo;</span>
        </>
      )
    case "social_mention":
      return (
        <>
          mencionou voce: <span className="text-neutral-400">&ldquo;{n.body?.replace(/^"/, "").replace(/"$/, "")}&rdquo;</span>
        </>
      )
    case "achievement":
      return "compartilhou um novo PR!"
    case "schedule_new":
    case "schedule_confirmed":
    case "schedule_cancelled":
    case "schedule_completed":
      return <span className="text-neutral-400">{n.body}</span>
    default:
      return <span className="text-neutral-400">{n.body}</span>
  }
}

/** Whether this notification type is a "reminder" style (no sender, uses icon) */
function isReminderType(type: string): boolean {
  return (
    type.startsWith("schedule") ||
    type === "announcement" ||
    type === "challenge_started"
  )
}

function groupByTime(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = Date.now()
  const groups: { label: string; items: Notification[] }[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Ultimos 7 dias", items: [] },
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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

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
      setNotifications(prev => prev.map(n =>
        n.senderStudentId === studentId ? { ...n, isFollowingSender: true } : n
      ))
    } catch { /* ignore */ }
    setFollowingLoading(prev => { const s = new Set(prev); s.delete(studentId); return s })
  }

  function handleNotificationClick(n: Notification) {
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

  function handleDismiss(id: string) {
    setDismissed(prev => new Set(prev).add(id))
  }

  // Filter notifications
  const filtered = notifications.filter(n => {
    if (dismissed.has(n.id)) return false
    if (filter === "follows") return n.type === "social_follow"
    if (filter === "comments") return n.type === "social_comment" || n.type === "social_mention"
    return true
  })

  const grouped = groupByTime(filtered)

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tudo" },
    { id: "follows", label: "Seguidores" },
    { id: "comments", label: "Comentarios" },
  ]

  /** Render the action button on the right side of each card */
  function renderAction(n: Notification) {
    // Follow back button
    if (n.type === "social_follow" && n.senderStudentId && !n.isFollowingSender) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleFollow(n.senderStudentId!)
          }}
          disabled={followingLoading.has(n.senderStudentId)}
          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 min-h-[32px] min-w-[72px] flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
        >
          {followingLoading.has(n.senderStudentId) ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Aceitar"
          )}
        </button>
      )
    }

    // Already following
    if (n.type === "social_follow" && n.senderStudentId && n.isFollowingSender) {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[11px] text-neutral-400 shrink-0">
          <Check className="w-3 h-3" /> Seguindo
        </span>
      )
    }

    // Reminder-type: dismiss button
    if (isReminderType(n.type)) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss(n.id)
          }}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 text-xs font-semibold shrink-0 min-h-[32px] flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <X className="w-3 h-3" />
          Dispensar
        </button>
      )
    }

    // Default: "Ver" button
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleNotificationClick(n)
        }}
        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 min-h-[32px] min-w-[56px] flex items-center gap-1.5 justify-center active:scale-95 transition-all"
      >
        <Eye className="w-3 h-3" />
        Ver
      </button>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-[#030303]/90 backdrop-blur-xl z-10 border-b border-white/[0.04]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </div>

        <FadeIn direction="up" distance={10}>
          <div className="px-4 pb-4">
            <h1 className="text-2xl font-bold text-white">Atividade e Social</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Suas interacoes recentes e notificacoes</p>
          </div>
        </FadeIn>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                filter === f.id
                  ? "bg-white text-black"
                  : "bg-white/[0.06] border border-white/[0.08] text-neutral-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <FadeIn className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Bell className="w-8 h-8 text-neutral-700" />
          </div>
          <p className="text-neutral-500 text-sm">Nenhuma notificacao</p>
        </FadeIn>
      ) : (
        <div className="pb-24">
          {grouped.map(group => (
            <div key={group.label}>
              {/* Time group header */}
              <FadeIn direction="none">
                <div className="px-4 pt-5 pb-2">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{group.label}</p>
                </div>
              </FadeIn>

              <StaggerContainer stagger={0.04}>
                {group.items.map(n => {
                  const isReminder = isReminderType(n.type) && !n.senderName

                  return (
                    <StaggerItem key={n.id}>
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors border-b border-white/[0.04] hover:bg-white/[0.03] active:bg-white/[0.05] relative ${
                          !n.read ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        {/* Unread dot indicator */}
                        {!n.read && (
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                        )}

                        {/* Avatar or Icon */}
                        <div className="relative shrink-0">
                          {isReminder ? (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/[0.08] flex items-center justify-center">
                              {TYPE_ICON[n.type] ?? <Bell className="w-5 h-5 text-neutral-500" />}
                            </div>
                          ) : (
                            <SafeAvatar
                              src={n.senderAvatar}
                              name={n.senderName || n.title || "?"}
                              className="w-14 h-14 text-lg"
                            />
                          )}

                          {/* Type badge overlay on avatar */}
                          {!isReminder && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center">
                              {TYPE_ICON[n.type] ?? <Bell className="w-3 h-3 text-neutral-500" />}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-neutral-300 leading-relaxed">
                            {isReminder ? (
                              <>
                                <span className="font-bold text-white">Lembrete: </span>
                                <span className="text-neutral-400">{n.body || n.title}</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-white">{n.senderName || n.title}</span>
                                {" "}
                                {getNotificationText(n)}
                              </>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-600 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>

                        {/* Action button */}
                        <div className="shrink-0">
                          {renderAction(n)}
                        </div>
                      </button>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
