"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy, Flame, Target, Users, Medal,
  HandMetal, Zap, Crown, ChevronRight,
  Calendar, TrendingUp, Award, Lock,
  Heart, MessageCircle, Send, Camera, Play, Share2, Bookmark,
  Image as ImageIcon, X, Plus, Loader2,
  UserPlus, User, Mail, Search, RefreshCw, Check, ChevronUp, Compass, Users2,
  Globe, ShieldCheck, Eye, EyeOff, DoorOpen,
} from "lucide-react"
import { NotificationBell } from "@/components/student/notification-bell"
import { LiveTrainingCard } from "@/components/community/live-training"
import { SafeImage, SafeAvatar } from "@/components/ui/safe-image"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion"
import { EmptyState } from "@/components/ui/empty-state"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type RankedStudent = {
  position: number
  studentId: string
  name: string
  avatar: string | null
  totalVolume: number
  totalSessions: number
  streakWeeks: number
  consistency: number
  score: number
}

type FeedComment = {
  id: string
  content: string
  studentName: string
  studentAvatar: string | null
  createdAt: string
}

type FeedPost = {
  id: string
  type: string
  content: string
  imageUrl: string | null
  metadata: Record<string, unknown> | null
  studentId: string | null
  studentName: string
  studentAvatar: string | null
  reactionCounts: { CLAP: number; FIRE: number; MUSCLE: number }
  userReactions: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  isLiked: boolean
  likedBy?: { name: string; avatar: string | null }[]
  comments: FeedComment[]
  createdAt: string
}

type ChallengeItem = {
  id: string
  title: string
  description: string | null
  metric: string
  targetValue: number | null
  status: string
  startDate: string
  endDate: string
  participantCount: number
  isParticipating: boolean
  leaderboard: { position: number; name: string; avatar: string | null; value: number; isMe: boolean }[]
  myEntry: { value: number } | null
}

type StoryGroup = {
  studentId: string; name: string; avatar: string | null; isMe: boolean; hasUnviewed: boolean
  stories: { id: string; imageUrl: string; caption: string | null; viewCount: number; isViewed: boolean; createdAt: string; expiresAt: string }[]
}

type Tab = "ranking" | "feed" | "desafios" | "grupos"

type GroupItem = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY"
  memberCount: number
  challengeCount: number
  creatorName: string
  creatorAvatar: string | null
  isMember: boolean
  myRole: string | null
  isOwner: boolean
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function formatVolume(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M kg`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K kg`
  return `${v} kg`
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const REACTION_ICONS = {
  CLAP: { emoji: "👏", label: "Palmas" },
  FIRE: { emoji: "🔥", label: "Fogo" },
  MUSCLE: { emoji: "💪", label: "Força" },
} as const

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  volume_total: { label: "Volume Total", unit: "kg" },
  sessoes_total: { label: "Sessões", unit: "" },
  sessoes_semana: { label: "Sessões", unit: "" },
  streak_dias: { label: "Streak", unit: "dias" },
  consistencia: { label: "Consistência", unit: "%" },
}

const MEDAL_COLORS = [
  "from-yellow-400 to-amber-600",
  "from-slate-300 to-slate-500",
  "from-orange-400 to-orange-700",
]

const MEDAL_GLOW = [
  "shadow-yellow-500/30",
  "shadow-slate-400/20",
  "shadow-orange-500/20",
]

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

export default function CommunityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deepLinkPostId = searchParams.get("post")
  const [tab, setTab] = useState<Tab>("feed")
  const [period, setPeriod] = useState<"week" | "month" | "all">("month")
  const [ranking, setRanking] = useState<RankedStudent[]>([])
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [feedCursor, setFeedCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [groupFilter, setGroupFilter] = useState<"mine" | "discover">("mine")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState<{ hasVipGroup: boolean; planName: string | null }>({ hasVipGroup: false, planName: null })
  const [showComposer, setShowComposer] = useState(false)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [myStudentId, setMyStudentId] = useState<string | null>(null)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [myName, setMyName] = useState<string>("Você")
  const [myBio, setMyBio] = useState<string | null>(null)
  const [myProfession, setMyProfession] = useState<string | null>(null)
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{ studentId: string; name: string; avatar: string | null; sessions: number }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ studentId: string; name: string; avatar: string | null; bio: string | null; profession: string | null; followers: number; sessions: number; isMe: boolean }>>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout>(null)
  const [feedHasFollows, setFeedHasFollows] = useState(false)
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null)
  const deepLinkScrolled = useRef(false)

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [])

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false)
  const [pullOffset, setPullOffset] = useState(0)
  const touchStartRef = useRef(0)
  const canPullRef = useRef(false)
  const pullDistRef = useRef(0)

  // Stories
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [viewingStory, setViewingStory] = useState<{ group: StoryGroup; index: number } | null>(null)
  const [showStoryCreate, setShowStoryCreate] = useState(false)
  const [storyPreview, setStoryPreview] = useState<string | null>(null)
  const [storyFile, setStoryFile] = useState<File | null>(null)
  const [storyUploading, setStoryUploading] = useState(false)
  const [storyProgress, setStoryProgress] = useState("")

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch("/api/community/stories")
      if (res.ok) {
        const data = await res.json()
        setStoryGroups(data.storyGroups || [])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchFeatures = useCallback(async () => {
    try {
      const [subRes, followRes, profileRes] = await Promise.all([
        fetch("/api/student/subscription"),
        fetch("/api/community/follow?type=following"),
        fetch("/api/student/profile"),
      ])
      if (subRes.ok) {
        const data = await subRes.json()
        setFeatures({ hasVipGroup: data.hasVipGroup ?? false, planName: data.planName ?? null })
      }
      if (followRes.ok) {
        const data = await followRes.json()
        setFollowingIds(new Set(data.users?.map((u: { studentId: string }) => u.studentId) ?? []))
      }
      if (profileRes.ok) {
        const data = await profileRes.json()
        setMyStudentId(data.student?.id ?? null)
        setMyName(data.student?.user?.name ?? "Você")
        setMyAvatar(data.student?.user?.avatar ?? null)
        setMyBio(data.student?.bio ?? null)
        setMyProfession(data.student?.profession ?? null)
      }
      // Fetch suggested users: ranking (month + all-time) for wider pool
      try {
        const [sugRes1, sugRes2] = await Promise.all([
          fetch("/api/community/ranking?period=month"),
          fetch("/api/community/ranking?period=all"),
        ])
        const allSuggested = new Map<string, { studentId: string; name: string; avatar: string | null; sessions: number }>()
        for (const sugRes of [sugRes1, sugRes2]) {
          if (sugRes.ok) {
            const sugData = await sugRes.json()
            for (const u of (sugData.ranking || []).slice(0, 10)) {
              if (!allSuggested.has(u.studentId)) {
                allSuggested.set(u.studentId, {
                  studentId: u.studentId, name: u.name, avatar: u.avatar || null, sessions: u.totalSessions || 0
                })
              }
            }
          }
        }
        setSuggestedUsers([...allSuggested.values()])
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }, [])

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/ranking?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setRanking(data.ranking)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [period])

  const fetchFeed = useCallback(async (cursor?: string | null) => {
    if (cursor) setLoadingMore(true)
    else setLoading(true)
    try {
      const url = cursor ? `/api/community/feed?cursor=${cursor}&limit=10` : "/api/community/feed?limit=10"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (cursor) {
          setFeed(prev => [...prev, ...(data.feed || [])])
        } else {
          setFeed(data.feed || [])
        }
        setFeedCursor(data.nextCursor || null)
        setFeedHasFollows(data.hasFollows ?? false)
      }
    } catch { /* ignore */ }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Infinite scroll — load more when reaching bottom
  useEffect(() => {
    if (tab !== "feed" || !feedCursor) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedCursor && !loadingMore) {
          fetchFeed(feedCursor)
        }
      },
      { threshold: 0.1 }
    )
    const el = feedEndRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [tab, feedCursor, loadingMore, fetchFeed])

  const fetchChallenges = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/community/challenges")
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/groups?filter=${groupFilter}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [groupFilter])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchFeed(), fetchStories(), fetchFeatures()])
    setRefreshing(false)
  }, [fetchFeed, fetchStories, fetchFeatures])

  async function handleFollow(studentId: string) {
    // Optimistic update
    setFollowingIds(prev => { const n = new Set(prev); n.add(studentId); return n })
    try {
      const res = await fetch("/api/community/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (!data.following) {
        setFollowingIds(prev => { const n = new Set(prev); n.delete(studentId); return n })
      }
    } catch {
      setFollowingIds(prev => { const n = new Set(prev); n.delete(studentId); return n })
    }
  }

  // Deep link: scroll to post from ?post= param (e.g. from notifications)
  useEffect(() => {
    if (!deepLinkPostId || deepLinkScrolled.current || feed.length === 0) return
    const el = document.getElementById(`post-${deepLinkPostId}`)
    if (el) {
      deepLinkScrolled.current = true
      setTab("feed")
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightPostId(deepLinkPostId)
        setTimeout(() => setHighlightPostId(null), 2500)
      }, 300)
    }
  }, [deepLinkPostId, feed])

  useEffect(() => { fetchFeatures(); fetchStories() }, [fetchFeatures, fetchStories])

  // Refetch groups when filter changes
  useEffect(() => {
    if (tab === "grupos") fetchGroups()
  }, [groupFilter, tab, fetchGroups])

  useEffect(() => {
    if (tab === "ranking") fetchRanking()
    else if (tab === "feed") fetchFeed()
    else if (tab === "desafios") fetchChallenges()
    else if (tab === "grupos") fetchGroups()
  }, [tab, fetchRanking, fetchFeed, fetchChallenges, fetchGroups])

  // Pull-to-refresh: native listeners with passive:false to preventDefault
  useEffect(() => {
    if (tab !== "feed") return

    document.documentElement.style.overscrollBehaviorY = "contain"

    const onStart = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollTop <= 5 && !refreshing) {
        touchStartRef.current = e.touches[0].clientY
        canPullRef.current = true
      }
    }

    const onMove = (e: TouchEvent) => {
      if (!canPullRef.current) return
      const dy = e.touches[0].clientY - touchStartRef.current
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      if (dy > 10 && scrollTop <= 5) {
        e.preventDefault()
        const d = Math.min((dy - 10) * 0.4, 80)
        pullDistRef.current = d
        setPullOffset(d)
      } else if (dy < -5) {
        canPullRef.current = false
        pullDistRef.current = 0
        setPullOffset(0)
      }
    }

    const onEnd = () => {
      if (!canPullRef.current) {
        setPullOffset(0)
        pullDistRef.current = 0
        return
      }
      canPullRef.current = false
      if (pullDistRef.current >= 50) {
        handleRefresh()
      }
      setPullOffset(0)
      pullDistRef.current = 0
    }

    document.addEventListener("touchstart", onStart, { passive: true })
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend", onEnd, { passive: true })

    return () => {
      document.documentElement.style.overscrollBehaviorY = ""
      document.removeEventListener("touchstart", onStart)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
    }
  }, [tab, refreshing, handleRefresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && tab === "feed") {
        fetchFeed()
        fetchStories()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [tab, fetchFeed, fetchStories])

  async function toggleLike(postId: string) {
    // Haptic feedback (mobile)
    try { navigator.vibrate?.(15) } catch {}
    // Optimistic update
    setFeed(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ))
    await fetch(`/api/community/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    })
  }

  async function toggleReaction(postId: string, type: string) {
    const res = await fetch("/api/community/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, type }),
    })
    if (res.ok) fetchFeed()
  }

  async function joinChallenge(challengeId: string) {
    const res = await fetch("/api/community/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    })
    if (res.ok) fetchChallenges()
  }

  async function joinGroup(groupId: string) {
    try {
      const res = await fetch(`/api/community/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      })
      if (res.ok) fetchGroups()
    } catch { /* ignore */ }
  }

  async function leaveGroup(groupId: string) {
    try {
      const res = await fetch(`/api/community/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      })
      if (res.ok) fetchGroups()
    } catch { /* ignore */ }
  }

  async function createGroup(data: { name: string; description: string; visibility: string; imageUrl?: string }) {
    try {
      const res = await fetch("/api/community/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setShowCreateGroup(false)
        setGroupFilter("mine")
        fetchGroups()
      }
      return res
    } catch { return null }
  }

  const isPro = features.planName?.toLowerCase().includes("pro") || features.planName?.toLowerCase().includes("elite") || features.hasVipGroup

  const tabs: { id: Tab; label: string; icon: typeof Trophy; locked: boolean }[] = [
    { id: "feed", label: "Feed", icon: Flame, locked: false },
    { id: "ranking", label: "Ranking", icon: Trophy, locked: false },
    { id: "desafios", label: "Desafios", icon: Target, locked: !isPro },
    { id: "grupos", label: "Grupos", icon: Users2, locked: false },
  ]

  return (
    <div className="space-y-5">
      {/* Header — Instagram style */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">Victor Personal Family</h1>
        <div className="flex items-center gap-2">
          {/* Explore / Discover */}
          <button
            onClick={() => router.push("/community/discover")}
            className="p-2 rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <Compass className="w-5 h-5 text-neutral-300" />
          </button>
          {/* Notifications — reuses existing bell component with dropdown */}
          <NotificationBell />
          {/* DM inbox */}
          <button
            onClick={() => router.push("/community/dm")}
            className="p-2 rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <Mail className="w-5 h-5 text-neutral-300" />
          </button>
          {/* My profile */}
          <button
            onClick={() => myStudentId && router.push(`/community/profile/${myStudentId}`)}
            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center"
          >
            {myAvatar ? (
              <SafeImage src={myAvatar} alt="Meu perfil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-red-300" />
            )}
          </button>
        </div>
      </div>

      {/* ═══ Search Bar ═══ */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value
              setSearchQuery(q)
              if (searchTimer.current) clearTimeout(searchTimer.current)
              if (q.trim().length < 2) { setSearchResults([]); setSearching(false); return }
              setSearching(true)
              searchTimer.current = setTimeout(async () => {
                try {
                  const res = await fetch(`/api/community/search?q=${encodeURIComponent(q.trim())}`)
                  if (res.ok) { const data = await res.json(); setSearchResults(data.users || []) }
                } catch { /* ignore */ }
                setSearching(false)
              }, 300)
            }}
            placeholder="Buscar pessoas..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]) }} className="text-neutral-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {(searchResults.length > 0 || searching) && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl z-30 max-h-72 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center"><Loader2 className="w-4 h-4 text-red-500 animate-spin mx-auto" /></div>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.studentId}
                  onClick={() => { router.push(`/community/profile/${u.studentId}`); setSearchQuery(""); setSearchResults([]) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold shrink-0 overflow-hidden">
                    {u.avatar ? <SafeImage src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {u.profession || `${u.followers} seguidores · ${u.sessions} sessões`}
                    </p>
                  </div>
                  {u.isMe && <span className="text-[9px] text-neutral-600 px-2 py-0.5 rounded bg-white/[0.04]">Você</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ═══ Live Training — who's training now ═══ */}
      <LiveTrainingCard />

      {/* ═══ Stories Ring — Instagram style ═══ */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {/* Add story button */}
        <button
          onClick={() => setShowStoryCreate(true)}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-white/[0.15] flex items-center justify-center">
            <Plus className="w-5 h-5 text-neutral-400" />
          </div>
          <span className="text-[10px] text-neutral-500 w-16 text-center truncate">Seu story</span>
        </button>

        {/* Story rings */}
        {storyGroups.map((group) => (
          <button
            key={group.studentId}
            onClick={() => {
              setViewingStory({ group, index: 0 })
              // Mark first story as viewed
              fetch("/api/community/stories/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId: group.stories[0].id }),
              })
            }}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className={`w-16 h-16 rounded-full p-[2.5px] ${
              group.hasUnviewed
                ? "bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400"
                : "bg-neutral-700"
            }`}>
              <div className="w-full h-full rounded-full bg-[#030303] p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs font-bold">
                  {group.avatar ? (
                    <SafeImage src={group.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (group.name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  )}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 w-16 text-center truncate">
              {group.isMe ? "Você" : (group.name || "").split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal — portal to escape stacking context */}
      {viewingStory && typeof document !== "undefined" && createPortal(
        <StoryViewer
          viewingStory={viewingStory}
          setViewingStory={setViewingStory}
          fetchStories={fetchStories}
          myStudentId={myStudentId}
          timeAgo={timeAgo}
        />,
        document.getElementById("modal-portal") || document.body
      )}

      {/* Story Create Modal — portal to escape stacking context */}
      {showStoryCreate && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center" onClick={() => { setShowStoryCreate(false); setStoryPreview(null) }}>
          <div className="w-full max-w-lg bg-[#111] border-t border-white/[0.08] rounded-t-2xl p-5 pb-10 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Novo Story</h3>
              <button onClick={() => { setShowStoryCreate(false); setStoryPreview(null) }} className="text-neutral-500"><X className="w-5 h-5" /></button>
            </div>

            {!storyPreview ? (
              <>
                <p className="text-xs text-neutral-500">Escolha uma foto ou vídeo para compartilhar por 24h</p>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 text-white text-sm font-semibold cursor-pointer active:scale-95 transition-transform">
                    <Camera className="w-5 h-5" />
                    Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setStoryFile(file)
                        setStoryPreview(URL.createObjectURL(file))
                      }}
                    />
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-semibold cursor-pointer active:scale-95 transition-transform">
                    <Play className="w-5 h-5" />
                    Vídeo
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 100 * 1024 * 1024) { alert("Máximo 100MB"); return }
                        setStoryFile(file)
                        setStoryPreview(URL.createObjectURL(file))
                      }}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                  {storyFile?.type.startsWith("video/") ? (
                    <video src={storyPreview} className="w-full max-h-[40dvh] object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <SafeImage src={storyPreview} alt="Preview" className="w-full max-h-[40dvh] object-cover" />
                  )}
                  <button
                    onClick={() => { setStoryPreview(null); setStoryFile(null); setStoryProgress("") }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                {storyFile && (
                  <p className="text-[10px] text-neutral-600 text-center">
                    {storyFile.type.startsWith("video/") ? "🎬" : "📷"} {(storyFile.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                )}
                <button
                  onClick={async () => {
                    if (!storyFile || storyUploading) return
                    setStoryUploading(true)
                    setStoryProgress("Enviando...")
                    try {
                      // Upload to Vercel Blob (direct from client, no size limit)
                      const { upload } = await import("@vercel/blob/client")
                      const blob = await upload(
                        `stories/${Date.now()}-${storyFile.name}`,
                        storyFile,
                        { access: "public", handleUploadUrl: "/api/upload" }
                      )
                      setStoryProgress("Publicando...")
                      const res = await fetch("/api/community/stories", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageUrl: blob.url }),
                      })
                      if (res.ok) {
                        setShowStoryCreate(false)
                        setStoryPreview(null)
                        setStoryFile(null)
                        setStoryProgress("")
                        fetchStories()
                      }
                    } catch {
                      setStoryProgress("Erro no upload. Tente novamente.")
                    } finally {
                      setStoryUploading(false)
                    }
                  }}
                  disabled={storyUploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 active:scale-[0.98] transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  {storyUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs">{storyProgress}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publicar Story
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => !t.locked && setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-300 min-h-[44px] ${
              tab === t.id
                ? "bg-red-600/15 text-red-400 border border-red-500/20"
                : t.locked
                  ? "text-neutral-700 cursor-not-allowed"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]"
            }`}
          >
            {t.locked ? <Lock className="w-3.5 h-3.5" /> : <t.icon className="w-3.5 h-3.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* ═══ FEED ═══ */}
        {tab === "feed" && (
          <motion.div key="feed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Pull-to-refresh indicator */}
            {(pullOffset > 0 || refreshing) && (
              <div
                className="flex items-center justify-center overflow-hidden transition-[height] duration-200 -mt-2"
                style={{ height: refreshing ? 48 : pullOffset }}
              >
                <RefreshCw
                  className={`w-5 h-5 text-red-400 transition-transform ${refreshing ? "animate-spin" : ""}`}
                  style={!refreshing ? { transform: `rotate(${pullOffset * 4}deg)`, opacity: Math.min(pullOffset / 50, 1) } : undefined}
                />
              </div>
            )}

            {/* New Post Button */}
            <button
              onClick={() => setShowComposer(true)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors">
                Compartilhe seu treino, resultado ou momento...
              </span>
              <Camera className="w-4 h-4 text-neutral-600 ml-auto" />
            </button>

            {/* Following count indicator */}
            {followingIds.size > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] text-neutral-500">
                  Seguindo {followingIds.size} {followingIds.size === 1 ? "pessoa" : "pessoas"}
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
            )}

            {/* ═══ Onboarding — Complete profile nudge ═══ */}
            {myStudentId && (!myBio || !myAvatar) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-gradient-to-r from-red-600/10 to-amber-600/5 border border-red-500/15 p-4"
              >
                <p className="text-sm font-semibold text-white mb-1">Complete seu perfil</p>
                <p className="text-xs text-neutral-400 mb-3">
                  {!myAvatar && !myBio ? "Adicione uma foto e bio para que outros membros te conheçam" :
                   !myAvatar ? "Adicione uma foto de perfil" : "Escreva uma bio sobre você"}
                </p>
                <button
                  onClick={() => myStudentId && router.push(`/community/profile/${myStudentId}`)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
                >
                  Completar perfil
                </button>
              </motion.div>
            )}

            {/* ═══ Suggested users — ALWAYS visible for discovery ═══ */}
            {suggestedUsers.filter(u => u.studentId !== myStudentId && !followingIds.has(u.studentId)).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
              >
                <p className="text-sm font-semibold text-white mb-1">
                  {followingIds.size === 0 ? "Comece seguindo" : "Sugestões para você"}
                </p>
                <p className="text-xs text-neutral-500 mb-3">
                  {followingIds.size === 0 ? "Siga membros para personalizar seu feed" : "Descubra mais membros da Victor Personal"}
                </p>
                <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                  {suggestedUsers.filter(u => u.studentId !== myStudentId && !followingIds.has(u.studentId)).map((u) => (
                    <div key={u.studentId} className="flex flex-col items-center gap-1.5 shrink-0 w-[88px]">
                      <button
                        onClick={() => router.push(`/community/profile/${u.studentId}`)}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-sm font-bold overflow-hidden"
                      >
                        {u.avatar ? <SafeImage src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                      </button>
                      <p className="text-[10px] text-neutral-300 text-center truncate w-full">{(u.name || "").split(" ")[0]}</p>
                      <button
                        onClick={() => handleFollow(u.studentId)}
                        className="px-3 py-2 min-h-11 rounded-md bg-red-600 text-white text-[10px] font-bold active:scale-95 transition-transform w-full"
                      >
                        Seguir
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Feed mode indicator */}
            {!feedHasFollows && feed.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] text-neutral-500">
                  Mostrando posts da Victor Personal · Siga pessoas para personalizar
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
            )}

            {/* Post Composer Modal — portal to escape stacking context */}
            {showComposer && typeof document !== "undefined" && createPortal(
              <PostComposer
                onClose={() => setShowComposer(false)}
                onPost={() => { setShowComposer(false); fetchFeed() }}
              />,
              document.getElementById("modal-portal") || document.body
            )}

            {loading && !refreshing ? (
              /* Skeleton shimmer — Instagram-style placeholder */
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3 px-1 py-2.5">
                      <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 rounded bg-white/[0.06]" />
                        <div className="h-2 w-16 rounded bg-white/[0.04]" />
                      </div>
                    </div>
                    <div className="w-full aspect-[4/3] bg-white/[0.04] rounded-lg" />
                    <div className="px-3.5 pt-3 space-y-2">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
                        <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
                        <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
                      </div>
                      <div className="h-3 w-32 rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-full rounded bg-white/[0.04]" />
                      <div className="h-2.5 w-3/4 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <FadeIn direction="up" delay={0.15}>
                <EmptyState
                  icon={Camera}
                  title="Nenhum post ainda"
                  description="Seja o primeiro a compartilhar!"
                  className="mx-4 my-8"
                />
              </FadeIn>
            ) : (
              <>
                {feed.map((post, i) => (
                  <FadeIn key={post.id} direction="up" distance={12} delay={Math.min(i * 0.06, 0.3)}>
                    <div
                      id={`post-${post.id}`}
                      className={`transition-all duration-700 rounded-2xl ${highlightPostId === post.id ? "ring-2 ring-red-500/60 bg-red-500/5" : ""}`}
                    >
                      <FeedCard
                        post={post}
                        onLike={() => toggleLike(post.id)}
                        onReaction={(type) => toggleReaction(post.id, type)}
                        onCommentAdded={() => fetchFeed()}
                        isFollowing={!!post.studentId && followingIds.has(post.studentId)}
                        isMe={post.studentId === myStudentId}
                        onFollow={() => post.studentId && handleFollow(post.studentId)}
                        myName={myName}
                        myAvatar={myAvatar}
                      />
                    </div>
                  </FadeIn>
                ))}
                {/* Infinite scroll sentinel */}
                {feedCursor && (
                  <div ref={feedEndRef} className="flex items-center justify-center py-6">
                    {loadingMore ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="h-1" /> /* invisible trigger */
                    )}
                  </div>
                )}
                {!feedCursor && feed.length >= 5 && (
                  <div className="text-center py-8">
                    <p className="text-[11px] text-neutral-600">Você viu tudo por enquanto</p>
                    <p className="text-[10px] text-neutral-700 mt-0.5">Puxe para baixo para atualizar</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ═══ RANKING ═══ */}
        {tab === "ranking" && (
          <motion.div key="ranking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="flex gap-2">
              {(["week", "month", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                    period === p
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      : "text-neutral-500 bg-white/[0.03] border border-white/[0.06] hover:text-neutral-300"
                  }`}
                >
                  {p === "week" ? "Semana" : p === "month" ? "Mês" : "Geral"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Nenhum treino registrado neste período</p>
              </div>
            ) : (
              <>
                {/* ── Podium Top 3 ── */}
                {ranking.length >= 3 && (
                  <FadeIn direction="up" delay={0.1}>
                    <div className="flex items-end justify-center gap-2 mb-6 pt-6">
                      {/* 2nd place — left */}
                      <PodiumCard student={ranking[1]} position={2} myStudentId={myStudentId} onNavigate={(id) => router.push(`/community/profile/${id}`)} />
                      {/* 1st place — center, taller */}
                      <PodiumCard student={ranking[0]} position={1} myStudentId={myStudentId} onNavigate={(id) => router.push(`/community/profile/${id}`)} />
                      {/* 3rd place — right */}
                      <PodiumCard student={ranking[2]} position={3} myStudentId={myStudentId} onNavigate={(id) => router.push(`/community/profile/${id}`)} />
                    </div>
                  </FadeIn>
                )}

                {/* ── List 4th+ ── */}
                <StaggerContainer className="space-y-2" stagger={0.05}>
                  {ranking.slice(ranking.length >= 3 ? 3 : 0).map((student) => {
                    const isMe = student.studentId === myStudentId
                    return (
                      <StaggerItem key={student.studentId} direction="up">
                        <div
                          onClick={() => router.push(`/community/profile/${student.studentId}`)}
                          className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm cursor-pointer active:bg-white/[0.05] transition-colors ${
                            isMe
                              ? "bg-amber-500/10 border border-amber-500/20"
                              : "bg-white/[0.02] border border-amber-500/10"
                          }`}
                        >
                          <span className="text-xs font-bold text-amber-400 w-6 text-center">{student.position}</span>
                          <SafeAvatar src={student.avatar} name={student.name} size="sm" className="ring-1 ring-amber-500/30" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white truncate">{student.name}</p>
                              {isMe && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded">YOU</span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-500">
                              {formatVolume(student.totalVolume)} · {student.totalSessions} sessões · {student.streakWeeks}w streak
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-amber-400">{student.consistency}%</p>
                            <p className="text-[9px] text-neutral-600 uppercase tracking-wider">consist.</p>
                          </div>
                        </div>
                      </StaggerItem>
                    )
                  })}
                </StaggerContainer>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ DESAFIOS ═══ */}
        {tab === "desafios" && (
          <motion.div key="desafios" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Nenhum desafio ativo</p>
                <p className="text-neutral-600 text-xs mt-1">O treinador vai criar novos desafios em breve!</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm overflow-hidden"
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            challenge.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-neutral-500/15 text-neutral-400"
                          }`}>
                            {challenge.status === "ACTIVE" ? "Ativo" : "Encerrado"}
                          </span>
                          <span className="text-[10px] text-neutral-600">
                            <Calendar className="w-3 h-3 inline mr-0.5" />
                            até {new Date(challenge.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
                        {challenge.description && <p className="text-xs text-neutral-400 mt-1">{challenge.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 text-neutral-500">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs">{challenge.participantCount}</span>
                      </div>
                    </div>

                    {challenge.myEntry && challenge.targetValue && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                          <span>Seu progresso</span>
                          <span>{Math.round((challenge.myEntry.value / challenge.targetValue) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, (challenge.myEntry.value / challenge.targetValue) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!challenge.isParticipating && challenge.status === "ACTIVE" && (
                      <button
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold hover:from-red-500 hover:to-red-600 transition-all min-h-[44px] shadow-lg shadow-red-600/20"
                      >
                        Participar do Desafio
                      </button>
                    )}
                  </div>

                  {challenge.leaderboard.length > 0 && (
                    <div className="border-t border-white/[0.04] px-4 py-3 space-y-1.5">
                      <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">Ranking do desafio</p>
                      {challenge.leaderboard.slice(0, 5).map((entry) => (
                        <div key={entry.position} className={`flex items-center gap-2 py-1 ${entry.isMe ? "text-red-400" : "text-neutral-400"}`}>
                          <span className="text-[10px] font-bold w-4 text-center">{entry.position}</span>
                          <Avatar name={entry.name} avatar={entry.avatar} size="xs" />
                          <span className="text-xs flex-1 truncate">{entry.name}</span>
                          <span className="text-xs font-semibold">
                            {challenge.metric === "volume_total" ? formatVolume(entry.value) : entry.value}
                            {challenge.metric !== "volume_total" && METRIC_LABELS[challenge.metric]?.unit ? ` ${METRIC_LABELS[challenge.metric].unit}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ═══ GRUPOS ═══ */}
        {tab === "grupos" && (
          <motion.div key="grupos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Filter + Create */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                {(["mine", "discover"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setGroupFilter(f)}
                    className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all min-h-[40px] ${
                      groupFilter === f
                        ? "bg-red-600/15 text-red-400 border border-red-500/20"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {f === "mine" ? "Meus Grupos" : "Descobrir"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2.5 rounded-lg bg-red-600/15 text-red-400 border border-red-500/20 hover:bg-red-600/25 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16">
                <Users2 className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  {groupFilter === "mine" ? "Você ainda não faz parte de nenhum grupo" : "Nenhum grupo para descobrir"}
                </p>
                <p className="text-neutral-600 text-xs mt-1">
                  {groupFilter === "mine" ? "Crie um ou explore a aba Descobrir!" : "Crie o primeiro!"}
                </p>
                {groupFilter === "mine" && (
                  <button
                    onClick={() => setGroupFilter("discover")}
                    className="mt-3 px-4 py-2 rounded-lg bg-white/[0.05] text-neutral-300 text-xs font-medium hover:bg-white/[0.08] transition-all"
                  >
                    <Compass className="w-3.5 h-3.5 inline mr-1" /> Descobrir Grupos
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
                  >
                    <button
                      onClick={() => router.push(`/community/groups/${group.id}`)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start gap-3">
                        {/* Group avatar */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/15 flex items-center justify-center shrink-0 overflow-hidden">
                          {group.imageUrl ? (
                            <SafeImage src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users2 className="w-5 h-5 text-red-400/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">{group.name}</h3>
                            <span className="shrink-0">
                              {group.visibility === "PUBLIC" && <Globe className="w-3 h-3 text-green-400/60" />}
                              {group.visibility === "PRIVATE" && <ShieldCheck className="w-3 h-3 text-yellow-400/60" />}
                              {group.visibility === "INVITE_ONLY" && <EyeOff className="w-3 h-3 text-neutral-500" />}
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{group.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.memberCount} membros</span>
                            {group.challengeCount > 0 && (
                              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{group.challengeCount} desafios</span>
                            )}
                            {group.isMember && (
                              <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">
                                {group.myRole === "OWNER" ? "Dono" : group.myRole === "ADMIN" ? "Admin" : "Membro"}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0 mt-1" />
                      </div>
                    </button>

                    {/* Quick action */}
                    {!group.isMember && group.visibility !== "INVITE_ONLY" && (
                      <div className="border-t border-white/[0.04] px-4 py-2.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); joinGroup(group.id) }}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold hover:from-red-500 hover:to-red-600 transition-all min-h-[40px] shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5"
                        >
                          <DoorOpen className="w-3.5 h-3.5" /> Entrar no Grupo
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={createGroup} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════
// CREATE GROUP MODAL
// ═══════════════════════════════════════

function CreateGroupModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: { name: string; description: string; visibility: string }) => Promise<Response | null>
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState("PUBLIC")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!name.trim()) { setError("Nome é obrigatório"); return }
    setSaving(true)
    setError("")
    const res = await onCreate({ name: name.trim(), description: description.trim(), visibility })
    if (res && !res.ok) {
      const data = await res.json().catch(() => ({ error: "Erro ao criar grupo" }))
      setError(data.error || "Erro ao criar grupo")
    }
    setSaving(false)
  }

  const visOptions = [
    { value: "PUBLIC", label: "Público", desc: "Qualquer um pode ver e entrar", icon: Globe },
    { value: "PRIVATE", label: "Privado", desc: "Visível mas precisa pedir pra entrar", icon: ShieldCheck },
    { value: "INVITE_ONLY", label: "Só Convite", desc: "Só entra por convite", icon: EyeOff },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain bg-[#0f0f0f] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Criar Grupo</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.06]"><X className="w-5 h-5 text-neutral-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Nome do grupo *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="Ex: Squad Madrugada"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-red-500/30 focus:outline-none min-h-[44px]"
            />
            <span className="text-[10px] text-neutral-700 mt-0.5 block text-right">{name.length}/50</span>
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Sobre o que é o grupo..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-red-500/30 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Visibilidade</label>
            <div className="space-y-2">
              {visOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    visibility === opt.value
                      ? "border-red-500/30 bg-red-600/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <opt.icon className={`w-4 h-4 shrink-0 ${visibility === opt.value ? "text-red-400" : "text-neutral-500"}`} />
                  <div>
                    <p className={`text-sm font-medium ${visibility === opt.value ? "text-white" : "text-neutral-300"}`}>{opt.label}</p>
                    <p className="text-[10px] text-neutral-600">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 min-h-[48px] shadow-lg shadow-red-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Criar Grupo"}
        </button>
      </motion.div>
    </div>,
    document.getElementById("modal-portal") || document.body
  )
}

// ═══════════════════════════════════════
// FEED CARD — Instagram-style
// ═══════════════════════════════════════

function FeedCard({
  post,
  onLike,
  onReaction,
  onCommentAdded,
  isFollowing,
  isMe,
  onFollow,
  myName,
  myAvatar,
}: {
  post: FeedPost
  onLike: () => void
  onReaction: (type: string) => void
  onCommentAdded: () => void
  isFollowing: boolean
  isMe: boolean
  onFollow: () => void
  myName: string
  myAvatar: string | null
}) {
  const router = useRouter()
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const viewTracked = useRef(false)

  // Track post view (fire-and-forget, once per mount)
  useEffect(() => {
    if (viewTracked.current) return
    viewTracked.current = true
    fetch("/api/community/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    }).catch(() => {})
  }, [post.id])
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [allComments, setAllComments] = useState<FeedComment[]>(post.comments)
  const [totalComments, setTotalComments] = useState(post.commentsCount)

  async function loadComments() {
    const res = await fetch(`/api/community/posts/${post.id}`)
    if (res.ok) {
      const data = await res.json()
      setAllComments(data.comments)
    }
  }

  async function submitComment() {
    if (!commentText.trim() || submitting) return
    const text = commentText.trim()

    // ═══ OPTIMISTIC UPDATE — comment appears instantly ═══
    const optimisticComment: FeedComment = {
      id: `temp-${Date.now()}`,
      content: text,
      studentName: myName,
      studentAvatar: myAvatar,
      createdAt: new Date().toISOString(),
    }
    setAllComments(prev => [...prev, optimisticComment])
    setTotalComments(prev => prev + 1)
    setCommentText("")

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }

    // ═══ Server sync in background ═══
    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content: text }),
      })
      if (res.ok) {
        // Replace optimistic with real data silently
        loadComments()
        onCommentAdded()
      } else {
        // Revert optimistic on failure
        setAllComments(prev => prev.filter(c => c.id !== optimisticComment.id))
        setTotalComments(prev => prev - 1)
      }
    } catch {
      // Revert on network error
      setAllComments(prev => prev.filter(c => c.id !== optimisticComment.id))
      setTotalComments(prev => prev - 1)
    }
    setSubmitting(false)
  }

  const isUserPost = post.type === "USER_POST"
  const [showMenu, setShowMenu] = useState(false)

  async function deletePost() {
    if (!confirm("Deletar este post?")) return
    const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) onCommentAdded() // refresh feed
    setShowMenu(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/[0.06] pb-1"
    >
      {/* Header — Instagram style */}
      <div className="flex items-center gap-3 px-1 py-2.5">
        <button
          onClick={() => post.studentId && router.push(`/community/profile/${post.studentId}`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Avatar name={post.studentName} avatar={post.studentAvatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">{post.studentName}</p>
              {!post.studentId && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-[8px] text-amber-400 font-bold uppercase tracking-wider">Personal</span>
              )}
            </div>
            <p className="text-[10px] text-neutral-500">{timeAgo(post.createdAt)}</p>
          </div>
        </button>
        {!isUserPost && <PostTypeBadge type={post.type} />}
        {/* Follow button — inline discovery (zero friction) */}
        {post.studentId && !isFollowing && !isMe && (
          <button
            onClick={(e) => { e.stopPropagation(); onFollow() }}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-500 active:scale-95 transition-all"
          >
            Seguir
          </button>
        )}
        {post.studentId && isFollowing && !isMe && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-500">
            <Check className="w-3 h-3" /> Seguindo
          </span>
        )}
        {/* 3-dot menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 min-h-11 min-w-11 flex items-center justify-center text-neutral-500 hover:text-white">
            <span className="text-lg leading-none">···</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 w-40 bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl z-20 overflow-hidden">
              <button
                onClick={deletePost}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
              >
                Deletar
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 text-left text-sm text-neutral-400 hover:bg-white/[0.05] transition-colors border-t border-white/[0.06]"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transformation before/after side-by-side */}
      {post.type === "TRANSFORMATION" && post.metadata && (() => {
        const meta = post.metadata as Record<string, unknown>
        const beforeUrl = meta.beforeImageUrl as string | undefined
        const afterUrl = meta.afterImageUrl as string | undefined
        const beforeDate = meta.beforeDate as string | undefined
        const afterDate = meta.afterDate as string | undefined
        const days = meta.daysBetween as number | undefined
        if (!beforeUrl || !afterUrl) return null
        return (
          <div
            className="relative w-full bg-neutral-900"
            onDoubleClick={() => {
              if (!post.isLiked) onLike()
              try { navigator.vibrate?.(20) } catch {}
              setShowHeartAnim(true)
              setTimeout(() => setShowHeartAnim(false), 1200)
            }}
          >
            {days && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[10px] text-white font-semibold">
                {days} dias de evolução
              </div>
            )}
            <div className="grid grid-cols-2 divide-x divide-white/10">
              <div className="relative">
                <SafeImage src={beforeUrl} alt="Antes" className="w-full aspect-[3/4] object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-neutral-900/70 text-[10px] text-neutral-300 font-bold uppercase">Antes</span>
                {beforeDate && <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-neutral-400">{new Date(beforeDate).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</span>}
              </div>
              <div className="relative">
                <SafeImage src={afterUrl} alt="Depois" className="w-full aspect-[3/4] object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-red-600/80 text-[10px] text-white font-bold uppercase">Depois</span>
                {afterDate && <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-neutral-400">{new Date(afterDate).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</span>}
              </div>
            </div>
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-28 h-28 fill-red-500 text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })()}

      {/* Media — photo or video, edge-to-edge, double-tap heart */}
      {post.type !== "TRANSFORMATION" && post.imageUrl && (() => {
        const url = post.imageUrl!
        const isPostVideo = /\.(mp4|mov|webm|quicktime)/i.test(url) || url.includes("video")
        return (
          <div
            className="relative w-full bg-neutral-900 -mx-0"
            onDoubleClick={() => {
              if (!post.isLiked) onLike()
              try { navigator.vibrate?.(20) } catch {}
              setShowHeartAnim(true)
              setTimeout(() => setShowHeartAnim(false), 1200)
            }}
          >
            {isPostVideo ? (
              <video
                src={url}
                className="w-full object-contain bg-black max-h-[500px]"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <SafeImage src={url} alt="Post" className="w-full object-contain bg-black" />
            )}
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-28 h-28 fill-red-500 text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })()}

      {/* Actions */}
      <div className="px-3.5 pt-2.5">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 transition-transform active:scale-125"
          >
            <Heart
              className={`w-6 h-6 transition-all ${
                post.isLiked
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-neutral-400 hover:text-white"
              }`}
            />
          </button>
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) loadComments() }}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="w-5.5 h-5.5 text-neutral-400 hover:text-white transition-colors" />
          </button>
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: `${post.studentName} na Victor Personal Family`,
                    text: post.content?.slice(0, 100) || "Confira este post!",
                    url: window.location.href,
                  })
                } catch {}
              } else {
                await navigator.clipboard.writeText(window.location.href)
                alert("Link copiado!")
              }
            }}
            className="flex items-center gap-1.5"
          >
            <Share2 className="w-5 h-5 text-neutral-400 hover:text-white transition-colors" />
          </button>
          <button className="ml-auto">
            <Bookmark className="w-5 h-5 text-neutral-400 hover:text-white transition-colors" />
          </button>
          {/* Emoji reactions for non-user-posts */}
          {!isUserPost && (
            <div className="flex gap-1.5">
              {(Object.keys(REACTION_ICONS) as Array<keyof typeof REACTION_ICONS>).map((type) => {
                const count = post.reactionCounts[type]
                const isActive = post.userReactions.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => onReaction(type)}
                    className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs transition-all ${
                      isActive
                        ? "bg-red-600/15 border border-red-500/20"
                        : "bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <span className="text-[11px]">{REACTION_ICONS[type].emoji}</span>
                    {count > 0 && <span className="text-[10px] text-neutral-400">{count}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Likes — Instagram social proof with stacked avatars */}
        {post.likesCount > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {/* Stacked avatar circles */}
            {post.likedBy && post.likedBy.length > 0 && (
              <div className="flex -space-x-2">
                {post.likedBy.slice(0, 3).map((liker, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-black bg-gradient-to-br from-red-600/40 to-red-900/40 flex items-center justify-center overflow-hidden">
                    {liker.avatar ? (
                      <SafeImage src={liker.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[7px] text-red-300 font-bold">{liker.name[0]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-neutral-300">
              {post.isLiked && post.likesCount === 1 ? (
                <span className="font-semibold text-white">Você curtiu</span>
              ) : post.isLiked ? (
                <>
                  Curtido por <span className="font-semibold text-white">você</span>
                  {post.likesCount > 1 && <> e <span className="font-semibold text-white">
                    {post.likedBy?.[0]?.name
                      ? (post.likesCount === 2 ? post.likedBy[0].name : `mais ${post.likesCount - 1}`)
                      : `mais ${post.likesCount - 1}`}
                  </span></>}
                </>
              ) : post.likedBy && post.likedBy.length > 0 ? (
                <>
                  Curtido por <span className="font-semibold text-white">{post.likedBy[0].name}</span>
                  {post.likesCount > 1 && <> e <span className="font-semibold text-white">
                    {post.likesCount === 2
                      ? (post.likedBy[1]?.name || "outra pessoa")
                      : `mais ${post.likesCount - 1}`}
                  </span></>}
                </>
              ) : (
                <span className="font-semibold text-white">{post.likesCount} curtida{post.likesCount > 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
        )}

        {/* View count — own posts only (Instagram "Visto por") */}
        {isMe && post.viewsCount > 0 && (
          <p className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1">
            👁 Visto por {post.viewsCount} {post.viewsCount === 1 ? "pessoa" : "pessoas"}
          </p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
            <span className="font-semibold text-white mr-1.5">{(post.studentName || "").split(" ")[0]}</span>
            <MentionText text={post.content} />
          </p>
        )}

        {/* Comments preview */}
        {totalComments > 0 && !showComments && (
          <button
            onClick={() => { setShowComments(true); loadComments() }}
            className="text-xs text-neutral-500 hover:text-neutral-300 mt-1.5 transition-colors"
          >
            Ver {totalComments > 1 ? `todos os ${totalComments} comentários` : "1 comentário"}
          </button>
        )}
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-2 pt-2 space-y-2 border-t border-white/[0.04] mt-3">
              {allComments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={c.studentName} avatar={c.studentAvatar} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 break-words">
                      <span className="font-semibold text-white mr-1">{(c.studentName || "").split(" ")[0]}</span>
                      <MentionText text={c.content} />
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))}

              {/* Comment input with @mention autocomplete */}
              <div className="flex items-center gap-2 pt-1">
                <CommentInputWithMentions
                  value={commentText}
                  onChange={setCommentText}
                  onSubmit={submitComment}
                  placeholder="Adicionar comentário..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className="text-red-400 disabled:text-neutral-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick comment input (always visible like Instagram) */}
      {!showComments && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-white/[0.04] mt-2">
          <CommentInputWithMentions
            value={commentText}
            onChange={setCommentText}
            onSubmit={submitComment}
            placeholder="Adicionar comentário..."
            className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
          />
          {commentText.trim() && (
            <button
              onClick={submitComment}
              disabled={submitting}
              className="text-red-400 text-xs font-semibold disabled:text-neutral-700"
            >
              Publicar
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════
// POST COMPOSER — Create new post
// ═══════════════════════════════════════

function PostComposer({ onClose, onPost }: { onClose: () => void; onPost: () => void }) {
  const [text, setText] = useState("")
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) { alert("Máximo 100MB"); return }
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  async function submit() {
    if ((!text.trim() && !mediaFile) || posting) return
    setPosting(true)
    try {
      let imageUrl: string | null = null

      if (mediaFile) {
        setUploadProgress("Enviando...")
        const { upload } = await import("@vercel/blob/client")
        const blob = await upload(
          `posts/${Date.now()}-${mediaFile.name}`,
          mediaFile,
          { access: "public", handleUploadUrl: "/api/upload" }
        )
        imageUrl = blob.url
        setUploadProgress("Publicando...")
      }

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, imageUrl }),
      })
      if (res.ok) onPost()
    } catch {
      setUploadProgress("Erro no upload. Tente novamente.")
    } finally {
      setPosting(false)
      setUploadProgress("")
    }
  }

  const isVideo = mediaFile?.type.startsWith("video/")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 w-full max-w-lg mx-auto bg-[#0a0a0a] rounded-t-2xl flex flex-col"
        style={{ maxHeight: "85dvh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/[0.06] shrink-0">
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-2 min-h-11">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-white">Novo Post</h3>
          <button
            onClick={submit}
            disabled={(!text.trim() && !mediaFile) || posting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-30 min-h-11 flex items-center gap-1.5"
          >
            {posting ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">{uploadProgress}</span></> : "Publicar"}
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder="O que está treinando hoje? Compartilhe com a galera..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none resize-none min-h-[100px]"
            autoFocus
          />
          <p className="text-[10px] text-neutral-700 text-right">{text.length}/2000</p>

          {/* Media preview — photo or video */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-white/[0.08]">
              {isVideo ? (
                <video src={mediaPreview} className="w-full max-h-[300px] object-cover" autoPlay muted loop playsInline />
              ) : (
                <SafeImage src={mediaPreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
              )}
              <button
                onClick={() => { setMediaPreview(null); setMediaFile(null) }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaFile && (
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg">
                  <span className="text-[10px] text-white">{isVideo ? "🎬" : "📷"} {(mediaFile.size / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media buttons — above nav bar with extra padding */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] shrink-0 pb-20">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleMedia} className="hidden" />
          <input ref={videoRef} type="file" accept="video/*" onChange={handleMedia} className="hidden" />

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:text-white transition-colors min-h-11"
          >
            <ImageIcon className="w-4.5 h-4.5" />
            <span className="text-xs font-medium">Foto</span>
          </button>
          <button
            onClick={() => videoRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:text-white transition-colors min-h-11"
          >
            <Play className="w-4.5 h-4.5" />
            <span className="text-xs font-medium">Vídeo</span>
          </button>
          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*"
              input.capture = "environment"
              input.onchange = (e) => handleMedia(e as unknown as React.ChangeEvent<HTMLInputElement>)
              input.click()
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:text-white transition-colors min-h-11"
          >
            <Camera className="w-4.5 h-4.5" />
            <span className="text-xs font-medium">Câmera</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// STORY VIEWER — Reply + Emoji Reactions
// ═══════════════════════════════════════

function StoryViewer({
  viewingStory,
  setViewingStory,
  fetchStories,
  myStudentId,
  timeAgo,
}: {
  viewingStory: { group: StoryGroup; index: number }
  setViewingStory: (v: { group: StoryGroup; index: number } | null) => void
  fetchStories: () => void
  myStudentId: string | null
  timeAgo: (d: string) => string
}) {
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [reactionSent, setReactionSent] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // Set Media Session API artwork (prevents iOS showing default Next.js triangle)
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Story de ${(viewingStory.group.name || "").split(" ")[0]}`,
        artist: "Victor Personal",
        album: "Stories",
        artwork: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      })
    }
    // Cleanup: pause video and clear media session on unmount
    return () => {
      videoRef.current?.pause()
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null
      }
    }
  }, [viewingStory.group.name])

  // Story Insights (own stories)
  const [showInsights, setShowInsights] = useState(false)
  const [insightsData, setInsightsData] = useState<{
    viewCount: number
    viewers: Array<{ studentId: string; name: string; avatar: string | null; viewedAt: string }>
    replies: Array<{ id: string; senderName: string; senderAvatar: string | null; content: string; isReaction: boolean; createdAt: string }>
  } | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  async function fetchInsights(storyId: string) {
    setInsightsLoading(true)
    try {
      const res = await fetch(`/api/community/stories/insights?storyId=${storyId}`)
      if (res.ok) {
        const data = await res.json()
        setInsightsData(data)
      }
    } catch { /* silent */ }
    setInsightsLoading(false)
  }

  const STORY_REACTIONS = ["❤️", "🔥", "😍", "😂", "😮", "👏"]

  const isOwnStory = viewingStory.group.isMe

  async function sendReply(text: string) {
    if (!text.trim() || sending || isOwnStory) return
    setSending(true)
    try {
      // Find the userId for the story author via profile API
      const profileRes = await fetch(`/api/community/profile/${viewingStory.group.studentId}`)
      if (!profileRes.ok) { setSending(false); return }
      const profileData = await profileRes.json()
      const receiverUserId = profileData.profile?.userId
      if (!receiverUserId) { setSending(false); return }

      // Send DM with story context
      const storyUrl = viewingStory.group.stories[viewingStory.index].imageUrl
      const dmContent = `[Story reply] ${text}`
      await fetch("/api/community/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: receiverUserId,
          content: dmContent,
          metadata: { storyId: viewingStory.group.stories[viewingStory.index].id, storyImageUrl: storyUrl },
        }),
      })
      setReplyText("")
      // Brief feedback
      setReactionSent("✓ Enviado")
      setTimeout(() => setReactionSent(null), 1500)
    } catch { /* silent */ }
    setSending(false)
  }

  async function sendEmojiReaction(emoji: string) {
    if (isOwnStory) return
    setReactionSent(emoji)
    try {
      const profileRes = await fetch(`/api/community/profile/${viewingStory.group.studentId}`)
      if (!profileRes.ok) return
      const profileData = await profileRes.json()
      const receiverUserId = profileData.profile?.userId
      if (!receiverUserId) return

      await fetch("/api/community/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: receiverUserId,
          content: `${emoji} reagiu ao seu story`,
          metadata: { storyId: viewingStory.group.stories[viewingStory.index].id, type: "story_reaction" },
        }),
      })
    } catch { /* silent */ }
    setTimeout(() => setReactionSent(null), 1500)
  }

  function closeViewer() {
    videoRef.current?.pause()
    setViewingStory(null)
    fetchStories()
  }

  function navigateStory(direction: "prev" | "next") {
    videoRef.current?.pause()
    if (direction === "prev") {
      if (viewingStory.index > 0) {
        setViewingStory({ ...viewingStory, index: viewingStory.index - 1 })
      } else {
        closeViewer()
      }
    } else {
      const nextIdx = viewingStory.index + 1
      if (nextIdx < viewingStory.group.stories.length) {
        setViewingStory({ ...viewingStory, index: nextIdx })
        fetch("/api/community/stories/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId: viewingStory.group.stories[nextIdx].id }),
        })
      } else {
        closeViewer()
      }
    }
  }

  const currentStory = viewingStory.group.stories[viewingStory.index]
  const isVideo = currentStory.imageUrl.startsWith("data:video/") || /\.(mp4|mov|webm|quicktime)/i.test(currentStory.imageUrl)

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => closeViewer()}>
      <div className="w-full max-w-lg h-full relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="absolute top-2 left-3 right-3 flex gap-1 z-10">
          {viewingStory.group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${
                i < viewingStory.index ? "bg-white w-full" : i === viewingStory.index ? "bg-white w-full" : "w-0"
              }`} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-3 right-3 flex items-center gap-2 z-10">
          <button
            onClick={() => router.push(`/community/profile/${viewingStory.group.studentId}`)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-neutral-300 text-xs font-bold">
              {viewingStory.group.avatar ? (
                <SafeImage src={viewingStory.group.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (viewingStory.group.name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
              )}
            </div>
            <span className="text-white text-sm font-semibold">{(viewingStory.group.name || "").split(" ")[0]}</span>
          </button>
          <span className="text-white/50 text-xs">
            {timeAgo(currentStory.createdAt)}
          </span>
          {/* View count for own stories */}
          {isOwnStory && currentStory.viewCount > 0 && (
            <span className="text-white/50 text-[10px] flex items-center gap-1">
              👁 {currentStory.viewCount}
            </span>
          )}
          <button onClick={() => closeViewer()} className="ml-auto text-white/70 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story media */}
        <div className="flex-1 relative">
          {isVideo ? (
            <video ref={videoRef} key={currentStory.imageUrl} src={currentStory.imageUrl} className="w-full h-full object-contain" autoPlay playsInline loop />
          ) : (
            <SafeImage src={currentStory.imageUrl} alt="" className="w-full h-full object-contain" />
          )}

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Navigation tap zones */}
          <button className="absolute left-0 top-0 w-1/3 h-full" onClick={() => navigateStory("prev")} />
          <button className="absolute right-0 top-0 w-2/3 h-full" onClick={() => navigateStory("next")} />

          {/* Reaction sent feedback */}
          <AnimatePresence>
            {reactionSent && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-6xl drop-shadow-2xl">{reactionSent}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reply bar + Emoji reactions — only for other people's stories */}
        {!isOwnStory && (
          <div className="shrink-0 px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2 bg-black/80 backdrop-blur-sm">
            {/* Quick emoji reactions */}
            <div className="flex justify-center gap-4 mb-2">
              {STORY_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendEmojiReaction(emoji)}
                  className="text-2xl active:scale-150 transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Text reply input */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply(replyText)}
                placeholder={`Responder a ${(viewingStory.group.name || "").split(" ")[0]}...`}
                className="flex-1 bg-white/[0.08] border border-white/[0.12] rounded-full px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/[0.25] transition-colors"
              />
              {replyText.trim() && (
                <button
                  onClick={() => sendReply(replyText)}
                  disabled={sending}
                  className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Own story — view count bar + swipe up for insights */}
        {isOwnStory && (
          <div className="shrink-0 bg-black/80 backdrop-blur-sm">
            <button
              onClick={() => {
                if (!showInsights) {
                  setShowInsights(true)
                  fetchInsights(currentStory.id)
                } else {
                  setShowInsights(false)
                }
              }}
              className="w-full px-4 pb-1 pt-3 flex flex-col items-center gap-1"
            >
              <motion.div
                animate={{ y: showInsights ? 2 : [0, -3, 0] }}
                transition={showInsights ? {} : { repeat: Infinity, duration: 1.5 }}
                className="text-white/50"
              >
                {showInsights ? <X className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </motion.div>
              <span className="text-white/60 text-xs flex items-center gap-1.5">
                👁 {currentStory.viewCount} visualizações
              </span>
            </button>

            {/* Insights panel — slides up */}
            <AnimatePresence>
              {showInsights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-[env(safe-area-inset-bottom,8px)] max-h-[45dvh] overflow-y-auto overscroll-contain space-y-3">
                    {insightsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      </div>
                    ) : insightsData ? (
                      <>
                        {/* Replies section */}
                        {insightsData.replies.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-white mb-2">Respostas ao story</p>
                            {insightsData.replies.map((r) => (
                              <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[8px] font-bold shrink-0 overflow-hidden">
                                  {r.senderAvatar ? <img src={r.senderAvatar} alt="" className="w-full h-full object-cover" /> : r.senderName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-white font-semibold truncate">{r.senderName}</p>
                                  <p className="text-[11px] text-neutral-400 truncate">{r.content}</p>
                                </div>
                                <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(r.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Viewers section */}
                        <div>
                          <p className="text-[11px] font-semibold text-white mb-2">Quem viu este story</p>
                          {insightsData.viewers.length === 0 ? (
                            <p className="text-[11px] text-neutral-600 py-3 text-center">Ninguém viu ainda</p>
                          ) : (
                            insightsData.viewers.map((v) => (
                              <button
                                key={v.studentId}
                                onClick={() => {
                                  closeViewer()
                                  router.push(`/community/profile/${v.studentId}`)
                                }}
                                className="w-full flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[8px] font-bold shrink-0 overflow-hidden">
                                  {v.avatar ? <img src={v.avatar} alt="" className="w-full h-full object-cover" /> : v.name[0]}
                                </div>
                                <p className="text-xs text-white font-medium truncate flex-1 text-left">{v.name}</p>
                                <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(v.viewedAt)}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════

function Avatar({ name, avatar, size = "sm", isOnline }: { name: string; avatar: string | null; size?: "xs" | "sm" | "md"; isOnline?: boolean }) {
  const sizeClasses = { xs: "w-6 h-6 text-[8px]", sm: "w-9 h-9 text-[10px]", md: "w-14 h-14 text-sm" }
  const dotSize = { xs: "w-2 h-2", sm: "w-2.5 h-2.5", md: "w-3 h-3" }
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 font-semibold overflow-hidden`}>
        {avatar ? (
          <SafeImage src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {isOnline && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${dotSize[size]} rounded-full bg-emerald-500 border-2 border-[#0a0a0a]`} />
      )}
    </div>
  )
}

function PodiumCard({ student, position, myStudentId, onNavigate }: { student: RankedStudent; position: 1 | 2 | 3; myStudentId: string | null; onNavigate: (id: string) => void }) {
  const isFirst = position === 1
  const isMe = student.studentId === myStudentId

  // Sizing per position
  const avatarSize = isFirst ? "w-20 h-20" : position === 2 ? "w-16 h-16" : "w-14 h-14"
  const ringColor = isFirst ? "ring-amber-400 shadow-lg shadow-amber-400/20" : position === 2 ? "ring-neutral-300" : "ring-amber-700"
  const ringWidth = isFirst ? "ring-[3px]" : "ring-2"
  const podiumHeight = isFirst ? "h-28" : position === 2 ? "h-20" : "h-16"
  const podiumWidth = isFirst ? "w-24" : "w-20"
  const podiumGradient = isFirst
    ? "from-amber-400 to-amber-600"
    : position === 2
    ? "from-neutral-400 to-neutral-600"
    : "from-amber-700 to-amber-900"
  const numberColor = isFirst ? "text-amber-900" : position === 2 ? "text-neutral-800" : "text-amber-950"
  const numberSize = isFirst ? "text-3xl" : position === 2 ? "text-2xl" : "text-xl"
  const xpColor = isFirst ? "text-amber-400 text-sm font-bold" : position === 2 ? "text-neutral-400 text-xs" : "text-amber-600 text-xs"
  const nameSize = isFirst ? "text-base" : "text-sm"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`flex flex-col items-center cursor-pointer ${isFirst ? "-mt-6" : ""}`}
      onClick={() => onNavigate(student.studentId)}
    >
      {/* Crown for 1st */}
      {isFirst && <span className="text-2xl mb-1">👑</span>}

      {/* Avatar */}
      <div className={`${avatarSize} rounded-full ${ringWidth} ${ringColor} overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center`}>
        {student.avatar ? (
          <SafeImage src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-bold text-neutral-300 ${isFirst ? "text-xl" : "text-sm"}`}>{getInitials(student.name)}</span>
        )}
      </div>

      {/* Name */}
      <p className={`${nameSize} font-bold text-white mt-1 text-center max-w-[100px] truncate`}>
        {(student.name || "").split(" ")[0]}
      </p>

      {/* XP / Volume */}
      <p className={xpColor}>
        {formatVolume(student.totalVolume)}
      </p>

      {/* "YOU" badge */}
      {isMe && (
        <span className="text-[9px] font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded mt-0.5">YOU</span>
      )}

      {/* Podium block */}
      <div className={`${podiumWidth} ${podiumHeight} bg-gradient-to-b ${podiumGradient} rounded-t-lg mt-2 flex items-center justify-center`}>
        <span className={`${numberSize} font-bold ${numberColor}`}>{position}</span>
      </div>
    </motion.div>
  )
}

function PostTypeBadge({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Award; label: string; color: string }> = {
    ACHIEVEMENT: { icon: Award, label: "PR", color: "text-yellow-400 bg-yellow-400/10" },
    MILESTONE: { icon: Zap, label: "Marco", color: "text-blue-400 bg-blue-400/10" },
    ANNOUNCEMENT: { icon: HandMetal, label: "Aviso", color: "text-red-400 bg-red-400/10" },
    TRANSFORMATION: { icon: TrendingUp, label: "Transformação", color: "text-green-400 bg-green-400/10" },
  }
  const c = config[type] || config.ACHIEVEMENT
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.color}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

// Renders @mentions as clickable links in text
function MentionText({ text, className }: { text: string; className?: string }) {
  const router = useRouter()
  const parts = text.split(/(@\w[\w.]*)/g)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <button
            key={i}
            onClick={() => {
              // Search for user by name and navigate
              const name = part.slice(1)
              fetch(`/api/community/search?q=${encodeURIComponent(name)}`)
                .then(r => r.json())
                .then(data => {
                  const user = data.users?.[0]
                  if (user) router.push(`/community/profile/${user.studentId}`)
                })
                .catch(() => {})
            }}
            className="text-blue-400 font-semibold hover:underline"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

// Comment input with @mention autocomplete
function CommentInputWithMentions({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  className?: string
}) {
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionResults, setMentionResults] = useState<Array<{ studentId: string; name: string; avatar: string | null }>>([])
  const [showMentions, setShowMentions] = useState(false)
  const searchRef = useRef<NodeJS.Timeout>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(text: string) {
    onChange(text)

    // Check if user is typing @mention
    const cursorPos = inputRef.current?.selectionStart || text.length
    const textBeforeCursor = text.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      if (query.length >= 1) {
        if (searchRef.current) clearTimeout(searchRef.current)
        searchRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/community/search?q=${encodeURIComponent(query)}`)
            if (res.ok) {
              const data = await res.json()
              setMentionResults((data.users || []).slice(0, 5))
              setShowMentions(true)
            }
          } catch { /* ignore */ }
        }, 200)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  function selectMention(name: string) {
    const cursorPos = inputRef.current?.selectionStart || value.length
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    const newBefore = textBeforeCursor.replace(/@\w*$/, `@${name.split(" ")[0]} `)
    onChange(newBefore + textAfterCursor)
    setShowMentions(false)
    setMentionResults([])
    inputRef.current?.focus()
  }

  useEffect(() => {
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [])

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {/* Mention autocomplete dropdown */}
      {showMentions && mentionResults.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl z-30 max-h-40 overflow-y-auto">
          {mentionResults.map((u) => (
            <button
              key={u.studentId}
              onClick={() => selectMention(u.name)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[8px] font-bold shrink-0 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
              </div>
              <span className="text-xs text-white font-medium truncate">{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
