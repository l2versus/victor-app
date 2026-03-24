"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy, Flame, Target, Users, Medal,
  HandMetal, Zap, Crown, ChevronRight,
  Calendar, TrendingUp, Award, Lock,
  Heart, MessageCircle, Send, Camera,
  Image as ImageIcon, X, Plus, Loader2,
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
  const [tab, setTab] = useState<Tab>("feed")
  const [period, setPeriod] = useState<"week" | "month" | "all">("month")
  const [ranking, setRanking] = useState<RankedStudent[]>([])
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState<{ hasVipGroup: boolean; planName: string | null }>({ hasVipGroup: false, planName: null })
  const [showComposer, setShowComposer] = useState(false)

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/student/subscription")
      if (res.ok) {
        const data = await res.json()
        setFeatures({ hasVipGroup: data.hasVipGroup ?? false, planName: data.planName ?? null })
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

  useEffect(() => { fetchFeatures() }, [fetchFeatures])

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Comunidade</h1>
            <p className="text-xs text-neutral-500">Ironberg Family</p>
          </div>
        </div>
      </div>

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
            ) : feed.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm font-medium">Nenhum post ainda</p>
                <p className="text-neutral-600 text-xs mt-1">Seja o primeiro a compartilhar!</p>
              </div>
            ) : (
              feed.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onLike={() => toggleLike(post.id)}
                  onReaction={(type) => toggleReaction(post.id, type)}
                  onCommentAdded={fetchFeed}
                />
              ))
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5">
        <Avatar name={post.studentName} avatar={post.studentAvatar} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{post.studentName}</p>
          <p className="text-[10px] text-neutral-500">{timeAgo(post.createdAt)}</p>
        </div>
        {!isUserPost && <PostTypeBadge type={post.type} />}
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
          <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed">
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
                    <p className="text-xs text-neutral-300">
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

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo 2MB.")
      return
    }

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#111] border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold text-white">Novo Post</h3>
          <button
            onClick={submit}
            disabled={(!text.trim() && !imagePreview) || posting}
            className="text-sm font-semibold text-red-400 disabled:text-neutral-700 flex items-center gap-1.5"
          >
            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar"}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que está treinando hoje? Compartilhe com a galera..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none resize-none min-h-[100px]"
            autoFocus
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-neutral-800">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-xs">Foto</span>
          </button>
          <button
            onClick={() => { if (fileRef.current) fileRef.current.capture = "environment"; fileRef.current?.click() }}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Câmera</span>
          </button>
        </div>
      </div>
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
