"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target, Plus, Trophy, Users, Calendar,
  X, Check, Trash2, Clock, ArrowLeft,
} from "lucide-react"

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
  leaderboard: { position: number; name: string; avatar: string | null; value: number }[]
}

const METRICS = [
  { value: "volume_total", label: "Volume Total (kg)" },
  { value: "sessoes_semana", label: "Sessões na Semana" },
  { value: "streak_dias", label: "Streak (Dias)" },
  { value: "series_exercicio", label: "Séries de Exercício" },
  { value: "consistencia", label: "Consistência (%)" },
]

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    metric: "volume_total",
    targetValue: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  })

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/community/challenges")
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchChallenges() }, [fetchChallenges])

  async function createChallenge() {
    if (!form.title.trim() || !form.endDate) return
    setSaving(true)
    try {
      const res = await fetch("/api/community/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetValue: form.targetValue ? Number(form.targetValue) : null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ title: "", description: "", metric: "volume_total", targetValue: "", startDate: new Date().toISOString().split("T")[0], endDate: "" })
        fetchChallenges()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const active = challenges.filter(c => c.status === "ACTIVE")
  const past = challenges.filter(c => c.status !== "ACTIVE")

  return (
    <div className="space-y-6">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Desafios</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Crie desafios semanais para seus alunos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Desafio"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Título do Desafio</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Quem faz mais volume essa semana?"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Descrição (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Regras, detalhes..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Métrica</label>
                  <select
                    value={form.metric}
                    onChange={(e) => setForm({ ...form, metric: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  >
                    {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Meta (opcional)</label>
                  <input
                    type="number"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    placeholder="Ex: 10000"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Início</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Fim</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  />
                </div>
              </div>
              <button
                onClick={createChallenge}
                disabled={!form.title.trim() || !form.endDate || saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40 transition-all min-h-[44px] shadow-lg shadow-red-600/20"
              >
                {saving ? "Criando..." : "Criar Desafio"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : challenges.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhum desafio criado</p>
          <p className="text-neutral-600 text-xs mt-1">Crie seu primeiro desafio para motivar os alunos!</p>
        </div>
      ) : (
        <>
          {/* Active challenges */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ativos ({active.length})
              </h2>
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} getInitials={getInitials} />
              ))}
            </div>
          )}

          {/* Past challenges */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Encerrados ({past.length})
              </h2>
              {past.map((c) => (
                <ChallengeCard key={c.id} challenge={c} getInitials={getInitials} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChallengeCard({ challenge, getInitials }: { challenge: ChallengeItem; getInitials: (n: string) => string }) {
  const isActive = challenge.status === "ACTIVE"
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                isActive ? "bg-green-500/15 text-green-400" : "bg-neutral-500/15 text-neutral-400"
              }`}>
                {isActive ? "Ativo" : "Encerrado"}
              </span>
              {isActive && (
                <span className="text-[10px] text-neutral-500">{daysLeft} dias restantes</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-xs text-neutral-400 mt-1">{challenge.description}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-semibold text-neutral-400">{challenge.participantCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {METRICS.find(m => m.value === challenge.metric)?.label || challenge.metric}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(challenge.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {new Date(challenge.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      {challenge.leaderboard.length > 0 && (
        <div className="border-t border-white/[0.04] px-4 py-3 space-y-1.5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">
            <Trophy className="w-3 h-3 inline mr-1" />
            Top participantes
          </p>
          {challenge.leaderboard.slice(0, 5).map((entry) => (
            <div key={entry.position} className="flex items-center gap-2 py-1 text-neutral-400">
              <span className={`text-[10px] font-bold w-4 text-center ${entry.position <= 3 ? "text-yellow-400" : ""}`}>
                {entry.position}
              </span>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[8px] font-semibold">
                {entry.avatar ? (
                  <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
                ) : getInitials(entry.name)}
              </div>
              <span className="text-xs flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

const METRICS_REF = [
  { value: "volume_total", label: "Volume Total (kg)" },
  { value: "sessoes_semana", label: "Sessões na Semana" },
  { value: "streak_dias", label: "Streak (Dias)" },
  { value: "series_exercicio", label: "Séries de Exercício" },
  { value: "consistencia", label: "Consistência (%)" },
]
