"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Users, Target, Calendar, Crown,
  ShieldCheck, Globe, EyeOff, DoorOpen, LogOut, Plus,
  Loader2, X, Trash2,
} from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"

type GroupDetail = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  visibility: string
  creatorName: string
  creatorAvatar: string | null
  isMember: boolean
  isOwner: boolean
  myRole: string | null
  members: { studentId: string; name: string; avatar: string | null; role: string; joinedAt: string }[]
  challenges: {
    id: string; title: string; description: string | null; metric: string; targetValue: number | null
    status: string; startDate: string; endDate: string; participantCount: number; isParticipating: boolean
    leaderboard: { position: number; name: string; avatar: string | null; value: number; isMe: boolean }[]
    myEntry: { value: number } | null
  }[]
}

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  volume_total: { label: "Volume Total", unit: "kg" },
  sessoes_total: { label: "Sessões", unit: "" },
  sessoes_semana: { label: "Sessões/Semana", unit: "" },
  streak_dias: { label: "Streak", unit: "dias" },
  consistencia: { label: "Consistência", unit: "%" },
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewChallenge, setShowNewChallenge] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchGroup = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/groups/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setGroup(data.group)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [groupId])

  useEffect(() => { fetchGroup() }, [fetchGroup])

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/community/groups/${groupId}`, {
        method: action === "delete" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        if (action === "leave" || action === "delete") {
          router.back()
        } else {
          fetchGroup()
        }
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function createChallenge(data: { title: string; metric: string; targetValue?: number; endDate: string; description?: string }) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/community/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-challenge", ...data }),
      })
      if (res.ok) {
        setShowNewChallenge(false)
        fetchGroup()
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function joinChallenge(challengeId: string) {
    try {
      await fetch("/api/community/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      fetchGroup()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-24">
        <p className="text-neutral-500">Grupo não encontrado</p>
        <button onClick={() => router.back()} className="mt-3 text-red-400 text-sm">Voltar</button>
      </div>
    )
  }

  const visIcon = group.visibility === "PUBLIC" ? Globe : group.visibility === "PRIVATE" ? ShieldCheck : EyeOff
  const VisIcon = visIcon

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-300" />
        </button>
        <h1 className="text-lg font-bold text-white truncate flex-1">{group.name}</h1>
        <VisIcon className="w-4 h-4 text-neutral-500 shrink-0" />
      </div>

      {/* Group Info Card */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/15 flex items-center justify-center shrink-0 overflow-hidden">
            {group.imageUrl ? (
              <SafeImage src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-7 h-7 text-red-400/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {group.description && <p className="text-xs text-neutral-400">{group.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.members.length} membros</span>
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{group.challenges.length} desafios</span>
            </div>
            <p className="text-[10px] text-neutral-600 mt-1">
              Criado por <span className="text-neutral-400">{group.creatorName}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!group.isMember && group.visibility !== "INVITE_ONLY" && (
            <button
              onClick={() => handleAction("join")}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold hover:from-red-500 hover:to-red-600 transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DoorOpen className="w-3.5 h-3.5" /> Entrar</>}
            </button>
          )}
          {group.isMember && !group.isOwner && (
            <button
              onClick={() => handleAction("leave")}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-medium hover:bg-white/[0.06] transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair do Grupo
            </button>
          )}
          {group.isOwner && (
            <button
              onClick={() => { if (confirm("Tem certeza que quer deletar este grupo?")) handleAction("delete") }}
              disabled={actionLoading}
              className="py-2.5 px-4 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-600/20 transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Deletar
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" /> Membros ({group.members.length})
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {group.members.slice(0, 8).map((m) => (
            <button
              key={m.studentId}
              onClick={() => router.push(`/community/profile/${m.studentId}`)}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[9px] font-bold shrink-0 overflow-hidden">
                {m.avatar ? <SafeImage src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : getInitials(m.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">{m.name.split(" ")[0]}</p>
                <p className="text-[9px] text-neutral-600">
                  {m.role === "OWNER" && <Crown className="w-2.5 h-2.5 inline text-yellow-500 mr-0.5" />}
                  {m.role === "ADMIN" && <ShieldCheck className="w-2.5 h-2.5 inline text-blue-400 mr-0.5" />}
                  {m.role === "OWNER" ? "Dono" : m.role === "ADMIN" ? "Admin" : "Membro"}
                </p>
              </div>
            </button>
          ))}
        </div>
        {group.members.length > 8 && (
          <p className="text-[10px] text-neutral-600 text-center">+{group.members.length - 8} membros</p>
        )}
      </div>

      {/* Challenges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-neutral-500" /> Desafios do Grupo
          </h2>
          {group.isMember && (
            <button
              onClick={() => setShowNewChallenge(true)}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </button>
          )}
        </div>

        {group.challenges.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
            <p className="text-neutral-500 text-xs">Nenhum desafio ativo</p>
            {group.isMember && (
              <button
                onClick={() => setShowNewChallenge(true)}
                className="mt-2 text-red-400 text-xs hover:text-red-300"
              >
                Criar primeiro desafio
              </button>
            )}
          </div>
        ) : (
          group.challenges.map((ch) => (
            <div key={ch.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-500/15 text-green-400">Ativo</span>
                      <span className="text-[10px] text-neutral-600">
                        <Calendar className="w-3 h-3 inline mr-0.5" />
                        até {new Date(ch.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{ch.title}</h3>
                    {ch.description && <p className="text-xs text-neutral-400 mt-0.5">{ch.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-neutral-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs">{ch.participantCount}</span>
                  </div>
                </div>

                {ch.myEntry && ch.targetValue && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                      <span>Seu progresso</span>
                      <span>{Math.round((ch.myEntry.value / ch.targetValue) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (ch.myEntry.value / ch.targetValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {!ch.isParticipating && (
                  <button
                    onClick={() => joinChallenge(ch.id)}
                    className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[40px]"
                  >
                    Participar
                  </button>
                )}
              </div>

              {ch.leaderboard.length > 0 && (
                <div className="border-t border-white/[0.04] px-4 py-3 space-y-1">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-1">Ranking</p>
                  {ch.leaderboard.slice(0, 5).map((e) => (
                    <div key={e.position} className={`flex items-center gap-2 py-0.5 ${e.isMe ? "text-red-400" : "text-neutral-400"}`}>
                      <span className="text-[10px] font-bold w-4 text-center">{e.position}</span>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-[7px] font-bold overflow-hidden shrink-0">
                        {e.avatar ? <img src={e.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(e.name)}
                      </div>
                      <span className="text-xs flex-1 truncate">{e.name}</span>
                      <span className="text-xs font-semibold">
                        {e.value}{METRIC_LABELS[ch.metric]?.unit ? ` ${METRIC_LABELS[ch.metric].unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Challenge Modal */}
      <AnimatePresence>
        {showNewChallenge && (
          <NewChallengeModal
            onClose={() => setShowNewChallenge(false)}
            onCreate={createChallenge}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════
// NEW CHALLENGE MODAL
// ═══════════════════════════════════════

function NewChallengeModal({ onClose, onCreate, loading }: {
  onClose: () => void
  onCreate: (data: { title: string; metric: string; targetValue?: number; endDate: string; description?: string }) => void
  loading: boolean
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [metric, setMetric] = useState("volume_total")
  const [targetValue, setTargetValue] = useState("")
  const [days, setDays] = useState("7")

  const metrics = [
    { value: "volume_total", label: "Volume Total (kg)" },
    { value: "sessoes_total", label: "Total de Sessões" },
    { value: "streak_dias", label: "Streak (dias seguidos)" },
    { value: "consistencia", label: "Consistência (%)" },
  ]

  function handleCreate() {
    if (!title.trim()) return
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + Number(days))
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      metric,
      targetValue: targetValue ? Number(targetValue) : undefined,
      endDate: endDate.toISOString(),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain bg-[#0f0f0f] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Novo Desafio</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.06]"><X className="w-5 h-5 text-neutral-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desafio 7 Dias de Treino"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-red-500/30 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-red-500/30 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Métrica</label>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    metric === m.value
                      ? "border-red-500/30 bg-red-600/10 text-red-400"
                      : "border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:bg-white/[0.04]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">Meta (opcional)</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 10000"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-neutral-600 focus:border-red-500/30 focus:outline-none min-h-[44px]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">Duração</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:border-red-500/30 focus:outline-none min-h-[44px]"
              >
                <option value="7">7 dias</option>
                <option value="14">14 dias</option>
                <option value="21">21 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !title.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-50 min-h-[48px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Criar Desafio"}
        </button>
      </motion.div>
    </motion.div>
  )
}
