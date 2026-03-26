"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Users, Flame, Clock, UserPlus,
  Trophy, Sparkles, Camera, Loader2,
} from "lucide-react"
import { SafeImage, SafeAvatar } from "@/components/ui/safe-image"
import { StaggerContainer, StaggerItem } from "@/components/ui/motion"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type ChallengeCard = {
  id: string
  title: string
  description: string | null
  metric: string
  targetValue: number | null
  participantCount: number
  daysRemaining: number
  startDate: string
  endDate: string
}

type TopPerformer = {
  studentId: string
  name: string
  avatar: string | null
  sessionsCount: number
}

type NewMember = {
  studentId: string
  name: string
  avatar: string | null
  goals: string | null
  joinedAt: string
  isMe: boolean
}

type Transformation = {
  studentId: string
  name: string
  avatar: string | null
  beforePhoto: string
  afterPhoto: string
  beforeDate: string
  afterDate: string
  beforeWeight: number | null
  afterWeight: number | null
  weightDiff: number | null
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const CHALLENGE_GRADIENTS = [
  "from-red-600 to-rose-800",
  "from-blue-600 to-indigo-800",
  "from-emerald-600 to-green-800",
  "from-amber-500 to-orange-700",
  "from-violet-600 to-purple-800",
]

const staggerParent = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

export default function DiscoverPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<ChallengeCard[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [newMembers, setNewMembers] = useState<NewMember[]>([])
  const [transformations, setTransformations] = useState<Transformation[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [discoverRes, followRes] = await Promise.all([
        fetch("/api/community/discover"),
        fetch("/api/community/follow?type=following"),
      ])
      if (discoverRes.ok) {
        const data = await discoverRes.json()
        setChallenges(data.activeChallenges || [])
        setTopPerformers(data.topPerformers || [])
        setNewMembers(data.newMembers || [])
        setTransformations(data.transformations || [])
      }
      if (followRes.ok) {
        const data = await followRes.json()
        setFollowingIds(new Set(data.users?.map((u: { studentId: string }) => u.studentId) ?? []))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleFollow(studentId: string) {
    setFollowLoading(studentId)
    try {
      const isFollowing = followingIds.has(studentId)
      const res = await fetch("/api/community/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      if (res.ok) {
        setFollowingIds(prev => {
          const next = new Set(prev)
          if (isFollowing) next.delete(studentId)
          else next.add(studentId)
          return next
        })
      }
    } catch { /* ignore */ }
    setFollowLoading(null)
  }

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className="min-h-screen pb-28 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => router.push("/community")}
          className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-300" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Explorar</h1>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* ═══ Section 1: Desafios em Alta ═══ */}
          <motion.section variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4.5 h-4.5 text-red-400" />
              <h2 className="text-base font-semibold text-white">Desafios em Alta</h2>
            </div>
            {challenges.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {challenges.map((c, i) => (
                  <motion.button
                    key={c.id}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      shrink-0 w-56 rounded-2xl p-4 text-left
                      bg-gradient-to-br ${CHALLENGE_GRADIENTS[i % CHALLENGE_GRADIENTS.length]}
                      shadow-lg shadow-black/20
                    `}
                  >
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-3">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-xs text-white/80 font-medium">
                          {c.participantCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-xs text-white/80 font-medium">
                          {c.daysRemaining}d restantes
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              /* Mock cards when no challenges exist */
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {[
                  { title: "Desafio 30 Dias de Treino", participants: 0, days: 30, gradient: CHALLENGE_GRADIENTS[0] },
                  { title: "Maior Volume Semanal", participants: 0, days: 7, gradient: CHALLENGE_GRADIENTS[1] },
                  { title: "Streak de Consistencia", participants: 0, days: 14, gradient: CHALLENGE_GRADIENTS[2] },
                ].map((mock, i) => (
                  <div
                    key={i}
                    className={`
                      shrink-0 w-56 rounded-2xl p-4 relative overflow-hidden
                      bg-gradient-to-br ${mock.gradient}
                      opacity-50
                    `}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative">
                      <h3 className="text-sm font-bold text-white leading-snug mb-3">
                        {mock.title}
                      </h3>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider font-medium">
                        Em breve
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* ═══ Section 2: Transformacoes ═══ */}
          <motion.section variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4.5 h-4.5 text-red-400" />
              <h2 className="text-base font-semibold text-white">Transformacoes</h2>
            </div>
            {transformations.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {transformations.map((t) => (
                  <motion.button
                    key={t.studentId}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/community/profile/${t.studentId}`)}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 text-left"
                  >
                    {/* Student info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center shrink-0">
                        {t.avatar ? (
                          <SafeImage src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-red-300">{getInitials(t.name)}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white truncate">{t.name}</span>
                      {t.weightDiff !== null && (
                        <span className={`ml-auto text-xs font-bold ${t.weightDiff <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {t.weightDiff > 0 ? "+" : ""}{t.weightDiff} kg
                        </span>
                      )}
                    </div>
                    {/* Before / After photos */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900">
                        <SafeImage src={t.beforePhoto} alt="Antes" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Antes</span>
                          {t.beforeWeight && (
                            <span className="text-[10px] text-white/60 ml-1.5">{t.beforeWeight}kg</span>
                          )}
                        </div>
                      </div>
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900">
                        <SafeImage src={t.afterPhoto} alt="Depois" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Depois</span>
                          {t.afterWeight && (
                            <span className="text-[10px] text-white/60 ml-1.5">{t.afterWeight}kg</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
                <Camera className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-400">
                  Seja o primeiro a compartilhar sua transformacao!
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Adicione fotos de progresso no seu perfil
                </p>
              </div>
            )}
          </motion.section>

          {/* ═══ Section 3: Destaques da Semana ═══ */}
          <motion.section variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4.5 h-4.5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Destaques da Semana</h2>
            </div>
            {topPerformers.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {topPerformers.map((p, i) => (
                  <motion.button
                    key={p.studentId}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/community/profile/${p.studentId}`)}
                    className="flex flex-col items-center gap-2 shrink-0"
                  >
                    <div className={`
                      relative w-16 h-16 rounded-full
                      ${i === 0
                        ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0a0a0a]"
                        : "ring-2 ring-white/10 ring-offset-2 ring-offset-[#0a0a0a]"
                      }
                    `}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-red-600/30 to-red-900/30 flex items-center justify-center">
                        {p.avatar ? (
                          <SafeImage src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-red-300">{getInitials(p.name)}</span>
                        )}
                      </div>
                      {i < 3 && (
                        <div className={`
                          absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-slate-400 text-black" : "bg-orange-600 text-white"}
                        `}>
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-white truncate max-w-[80px]">
                        {p.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {p.sessionsCount} treinos
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <Trophy className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Nenhum destaque esta semana</p>
              </div>
            )}
          </motion.section>

          {/* ═══ Section 4: Novos Membros ═══ */}
          <motion.section variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4.5 h-4.5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Novos Membros</h2>
            </div>
            {newMembers.filter(m => !m.isMe).length > 0 ? (
              <StaggerContainer className="space-y-2">
                {newMembers.filter(m => !m.isMe).map((m) => (
                  <StaggerItem key={m.studentId}>
                    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                      <button
                        onClick={() => router.push(`/community/profile/${m.studentId}`)}
                        className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center shrink-0"
                      >
                        {m.avatar ? (
                          <SafeImage src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-red-300">{getInitials(m.name)}</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => router.push(`/community/profile/${m.studentId}`)}
                          className="text-sm font-medium text-white truncate block text-left"
                        >
                          {m.name}
                        </button>
                        {m.goals && (
                          <p className="text-xs text-neutral-500 truncate">{m.goals}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleFollow(m.studentId)}
                        disabled={followLoading === m.studentId}
                        className={`
                          shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                          ${followingIds.has(m.studentId)
                            ? "bg-white/[0.06] text-neutral-400 border border-white/[0.08]"
                            : "bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-95"
                          }
                        `}
                      >
                        {followLoading === m.studentId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : followingIds.has(m.studentId) ? (
                          "Seguindo"
                        ) : (
                          "Seguir"
                        )}
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <Users className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Nenhum membro novo esta semana</p>
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </div>
  )
}
