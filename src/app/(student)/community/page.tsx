"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy, Flame, Target, Users, Medal,
  HandMetal, Zap, Crown, ChevronRight,
  Calendar, TrendingUp, Award, Lock,
  Heart, MessageCircle, Send, Camera, Play,
  Image as ImageIcon, X, Plus, Loader2,
  UserPlus, User, Mail, Search,
} from "lucide-react"

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
  isLiked: boolean
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

type Tab = "ranking" | "feed" | "desafios"

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

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const REACTION_ICONS = {
  CLAP: { emoji: "👏", label: "Palmas" },
  FIRE: { emoji: "🔥", label: "Fogo" },
  MUSCLE: { emoji: "💪", label: "Força" },
} as const

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
  const [tab, setTab] = useState<Tab>("feed")
  const [period, setPeriod] = useState<"week" | "month" | "all">("month")
  const [ranking, setRanking] = useState<RankedStudent[]>([])
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState<{ hasVipGroup: boolean; planName: string | null }>({ hasVipGroup: false, planName: null })
  const [showComposer, setShowComposer] = useState(false)
  const [feedFilter, setFeedFilter] = useState<"all" | "following">("all")
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [myStudentId, setMyStudentId] = useState<string | null>(null)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ studentId: string; name: string; avatar: string | null; bio: string | null; profession: string | null; followers: number; sessions: number; isMe: boolean }>>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout>(null)

  // Stories
  type StoryGroup = {
    studentId: string; name: string; avatar: string | null; isMe: boolean; hasUnviewed: boolean
    stories: { id: string; imageUrl: string; caption: string | null; viewCount: number; isViewed: boolean; createdAt: string; expiresAt: string }[]
  }
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [viewingStory, setViewingStory] = useState<{ group: StoryGroup; index: number } | null>(null)
  const [showStoryCreate, setShowStoryCreate] = useState(false)

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
        setMyAvatar(data.student?.user?.avatar ?? null)
      }
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

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/community/feed")
      if (res.ok) {
        const data = await res.json()
        setFeed(data.feed)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

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

  useEffect(() => { fetchFeatures(); fetchStories() }, [fetchFeatures, fetchStories])

  useEffect(() => {
    if (tab === "ranking") fetchRanking()
    else if (tab === "feed") fetchFeed()
    else if (tab === "desafios") fetchChallenges()
  }, [tab, fetchRanking, fetchFeed, fetchChallenges])

  async function toggleLike(postId: string) {
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

  const isPro = features.planName?.toLowerCase().includes("pro") || features.planName?.toLowerCase().includes("elite") || features.hasVipGroup

  const tabs: { id: Tab; label: string; icon: typeof Trophy; locked: boolean }[] = [
    { id: "feed", label: "Feed", icon: Flame, locked: false },
    { id: "ranking", label: "Ranking", icon: Trophy, locked: false },
    { id: "desafios", label: "Desafios", icon: Target, locked: !isPro },
  ]

  return (
    <div className="space-y-5">
      {/* Header — Instagram style */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">Ironberg Family</h1>
        <div className="flex items-center gap-3">
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
              <img src={myAvatar} alt="Meu perfil" className="w-full h-full object-cover" />
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
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
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
                    <img src={group.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    group.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  )}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 w-16 text-center truncate">
              {group.isMe ? "Você" : group.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => { setViewingStory(null); fetchStories() }}>
          <div className="w-full max-w-lg h-full relative" onClick={(e) => e.stopPropagation()}>
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
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-neutral-300 text-xs font-bold">
                {viewingStory.group.avatar ? (
                  <img src={viewingStory.group.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  viewingStory.group.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                )}
              </div>
              <span className="text-white text-sm font-semibold">{viewingStory.group.name.split(" ")[0]}</span>
              <span className="text-white/50 text-xs">
                {timeAgo(viewingStory.group.stories[viewingStory.index].createdAt)}
              </span>
              <button onClick={() => { setViewingStory(null); fetchStories() }} className="ml-auto text-white/70 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story image */}
            <img
              src={viewingStory.group.stories[viewingStory.index].imageUrl}
              alt=""
              className="w-full h-full object-contain"
            />

            {/* Caption */}
            {viewingStory.group.stories[viewingStory.index].caption && (
              <div className="absolute bottom-16 left-0 right-0 px-4">
                <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                  {viewingStory.group.stories[viewingStory.index].caption}
                </p>
              </div>
            )}

            {/* Navigation tap zones */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full"
              onClick={() => {
                if (viewingStory.index > 0) {
                  setViewingStory({ ...viewingStory, index: viewingStory.index - 1 })
                } else {
                  setViewingStory(null); fetchStories()
                }
              }}
            />
            <button
              className="absolute right-0 top-0 w-2/3 h-full"
              onClick={() => {
                const nextIdx = viewingStory.index + 1
                if (nextIdx < viewingStory.group.stories.length) {
                  setViewingStory({ ...viewingStory, index: nextIdx })
                  fetch("/api/community/stories/view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId: viewingStory.group.stories[nextIdx].id }),
                  })
                } else {
                  setViewingStory(null); fetchStories()
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Story Create Modal */}
      {showStoryCreate && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center" onClick={() => setShowStoryCreate(false)}>
          <div className="w-full max-w-lg bg-[#111] border-t border-white/[0.08] rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Novo Story</h3>
              <button onClick={() => setShowStoryCreate(false)} className="text-neutral-500"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-neutral-500">Escolha uma foto para compartilhar por 24h</p>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async () => {
                  const imageUrl = reader.result as string
                  const res = await fetch("/api/community/stories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl }),
                  })
                  if (res.ok) { setShowStoryCreate(false); fetchStories() }
                }
                reader.readAsDataURL(file)
              }}
              className="w-full text-sm text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-semibold file:text-sm"
            />
          </div>
        </div>
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

            {/* Feed filter: Todos / Seguindo */}
            <div className="flex gap-2">
              {(["all", "following"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFeedFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                    feedFilter === f
                      ? "bg-red-600/15 text-red-400 border border-red-500/20"
                      : "text-neutral-500 bg-white/[0.03] border border-white/[0.06]"
                  }`}
                >
                  {f === "all" ? "Todos" : `Seguindo (${followingIds.size})`}
                </button>
              ))}
            </div>

            {/* Post Composer Modal */}
            <AnimatePresence>
              {showComposer && (
                <PostComposer
                  onClose={() => setShowComposer(false)}
                  onPost={() => { setShowComposer(false); fetchFeed() }}
                />
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const filtered = feedFilter === "following"
                ? feed.filter((p) => p.studentId && followingIds.has(p.studentId))
                : feed
              return filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Camera className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm font-medium">
                    {feedFilter === "following" ? "Nenhum post de quem você segue" : "Nenhum post ainda"}
                  </p>
                  <p className="text-neutral-600 text-xs mt-1">
                    {feedFilter === "following" ? "Siga pessoas no ranking para ver posts aqui!" : "Seja o primeiro a compartilhar!"}
                  </p>
                </div>
              ) : (
                filtered.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    onLike={() => toggleLike(post.id)}
                    onReaction={(type) => toggleReaction(post.id, type)}
                    onCommentAdded={fetchFeed}
                  />
                ))
              )
            })()}
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
                      ? "bg-red-600/15 text-red-400 border border-red-500/20"
                      : "text-neutral-500 bg-white/[0.03] border border-white/[0.06] hover:text-neutral-300"
                  }`}
                >
                  {p === "week" ? "Semana" : p === "month" ? "Mês" : "Geral"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Nenhum treino registrado neste período</p>
              </div>
            ) : (
              <>
                {ranking.length >= 3 && (
                  <div className="flex items-end justify-center gap-3 pt-4 pb-2">
                    <PodiumCard student={ranking[1]} position={2} />
                    <PodiumCard student={ranking[0]} position={1} />
                    <PodiumCard student={ranking[2]} position={3} />
                  </div>
                )}
                <div className="space-y-2">
                  {ranking.slice(ranking.length >= 3 ? 3 : 0).map((student) => (
                    <motion.div
                      key={student.studentId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => router.push(`/community/profile/${student.studentId}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm cursor-pointer active:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-xs font-bold text-neutral-600 w-6 text-center">{student.position}</span>
                      <Avatar name={student.name} avatar={student.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{student.name}</p>
                        <p className="text-[10px] text-neutral-500">
                          {formatVolume(student.totalVolume)} · {student.totalSessions} sessões · {student.streakWeeks}w streak
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-red-400">{student.consistency}%</p>
                        <p className="text-[9px] text-neutral-600 uppercase tracking-wider">consist.</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                          <span className="text-xs font-semibold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
}: {
  post: FeedPost
  onLike: () => void
  onReaction: (type: string) => void
  onCommentAdded: () => void
}) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
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
    setSubmitting(true)
    const res = await fetch(`/api/community/posts/${post.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", content: commentText }),
    })
    if (res.ok) {
      setCommentText("")
      setTotalComments(prev => prev + 1)
      await loadComments()
      onCommentAdded()
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
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <Avatar name={post.studentName} avatar={post.studentAvatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{post.studentName}</p>
            <p className="text-[10px] text-neutral-500">{timeAgo(post.createdAt)}</p>
          </div>
        </button>
        {!isUserPost && <PostTypeBadge type={post.type} />}
        {/* 3-dot menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-neutral-500 hover:text-white">
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

      {/* Image */}
      {post.imageUrl && (
        <div className="relative w-full bg-neutral-900">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full max-h-[500px] object-cover"
            onDoubleClick={onLike}
          />
        </div>
      )}

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
          {/* Emoji reactions for non-user-posts */}
          {!isUserPost && (
            <div className="flex gap-1.5 ml-auto">
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

        {/* Likes count */}
        {post.likesCount > 0 && (
          <p className="text-xs font-semibold text-white mt-2">
            {post.likesCount} curtida{post.likesCount > 1 ? "s" : ""}
          </p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
            <span className="font-semibold text-white mr-1.5">{post.studentName.split(" ")[0]}</span>
            {post.content}
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
                      <span className="font-semibold text-white mr-1">{c.studentName.split(" ")[0]}</span>
                      {c.content}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
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
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
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
    if (file.size > 5 * 1024 * 1024) { alert("Arquivo muito grande. Máximo 5MB."); return }
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function submit() {
    if ((!text.trim() && !imagePreview) || posting) return
    setPosting(true)
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, imageUrl: imagePreview }),
    })
    if (res.ok) onPost()
    setPosting(false)
  }

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
        style={{ maxHeight: "90dvh" }}
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
            disabled={(!text.trim() && !imagePreview) || posting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-30 min-h-11 flex items-center"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar"}
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

          {/* Media preview */}
          {imagePreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-white/[0.08]">
              <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Media buttons — Instagram style action bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
// SUB-COMPONENTS
// ═══════════════════════════════════════

function Avatar({ name, avatar, size = "sm" }: { name: string; avatar: string | null; size?: "xs" | "sm" | "md" }) {
  const sizeClasses = { xs: "w-6 h-6 text-[8px]", sm: "w-9 h-9 text-[10px]", md: "w-14 h-14 text-sm" }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 font-semibold shrink-0 overflow-hidden`}>
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

function PodiumCard({ student, position }: { student: RankedStudent; position: 1 | 2 | 3 }) {
  const isFirst = position === 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`flex flex-col items-center ${isFirst ? "mb-4" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${MEDAL_COLORS[position - 1]} flex items-center justify-center mb-2 shadow-lg ${MEDAL_GLOW[position - 1]}`}>
        {position === 1 ? <Crown className="w-4 h-4 text-white" /> : <Medal className="w-4 h-4 text-white" />}
      </div>
      <div className={`relative mb-2 ${isFirst ? "scale-110" : ""}`}>
        <Avatar name={student.name} avatar={student.avatar} size="md" />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${MEDAL_COLORS[position - 1]} flex items-center justify-center text-[10px] font-bold text-white shadow-md`}>
          {position}
        </div>
      </div>
      <p className="text-xs font-semibold text-white text-center max-w-[90px] truncate">{student.name.split(" ")[0]}</p>
      <p className="text-[10px] text-neutral-500 text-center">{formatVolume(student.totalVolume)}</p>
      <p className="text-[9px] text-red-400/80 font-medium">{student.consistency}%</p>
      <div className={`mt-2 rounded-t-lg bg-gradient-to-t from-white/[0.02] to-white/[0.06] border border-white/[0.08] border-b-0 ${
        isFirst ? "w-20 h-16" : position === 2 ? "w-18 h-12" : "w-18 h-8"
      } flex items-center justify-center`}>
        <TrendingUp className="w-3.5 h-3.5 text-neutral-600" />
      </div>
    </motion.div>
  )
}

function PostTypeBadge({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Award; label: string; color: string }> = {
    ACHIEVEMENT: { icon: Award, label: "PR", color: "text-yellow-400 bg-yellow-400/10" },
    MILESTONE: { icon: Zap, label: "Marco", color: "text-blue-400 bg-blue-400/10" },
    ANNOUNCEMENT: { icon: HandMetal, label: "Aviso", color: "text-red-400 bg-red-400/10" },
  }
  const c = config[type] || config.ACHIEVEMENT
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.color}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}
