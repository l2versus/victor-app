"use client"

import { useState } from "react"
import {
  Plus, Sparkles, Camera, MessageCircle, Salad, Users,
  Crown, Check, X, Pencil, Trash2, UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Plan = {
  id: string
  name: string
  interval: string
  price: number
  active: boolean
  hasAI: boolean
  hasPostureCamera: boolean
  hasVipGroup: boolean
  hasNutrition: boolean
  maxSessionsWeek: number | null
  description: string | null
  _count: { subscriptions: number }
}

type StudentWithSub = {
  id: string
  user: { name: string }
  subscriptions: Array<{
    plan: { name: string; interval: string }
  }>
}

const intervalLabels: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
}

const intervalOrder: Record<string, number> = {
  MONTHLY: 0,
  QUARTERLY: 1,
  SEMIANNUAL: 2,
  ANNUAL: 3,
}

const tierOrder: Record<string, number> = {
  Essencial: 0,
  Pro: 1,
  Elite: 2,
}

function sortPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    const intervalDiff = (intervalOrder[a.interval] ?? 99) - (intervalOrder[b.interval] ?? 99)
    if (intervalDiff !== 0) return intervalDiff
    return (tierOrder[a.name] ?? 99) - (tierOrder[b.name] ?? 99)
  })
}

const featureConfig = [
  { key: "hasAI" as const, label: "Chat IA", icon: Sparkles, color: "text-purple-400" },
  { key: "hasPostureCamera" as const, label: "Câmera Postura", icon: Camera, color: "text-blue-400" },
  { key: "hasVipGroup" as const, label: "Grupo VIP", icon: MessageCircle, color: "text-emerald-400" },
  { key: "hasNutrition" as const, label: "Nutrição", icon: Salad, color: "text-amber-400" },
]

export function PlansClient({
  initialPlans,
  students,
}: {
  initialPlans: Plan[]
  students: StudentWithSub[]
}) {
  const [plans, setPlans] = useState(initialPlans)
  const [showForm, setShowForm] = useState(false)
  const [showAssign, setShowAssign] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    interval: "MONTHLY",
    price: "",
    hasAI: false,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: "",
    description: "",
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          maxSessionsWeek: form.maxSessionsWeek ? parseInt(form.maxSessionsWeek) : null,
        }),
      })
      if (res.ok) {
        const plan = await res.json()
        setPlans((prev) => [...prev, { ...plan, _count: { subscriptions: 0 } }])
        setShowForm(false)
        setForm({
          name: "", interval: "MONTHLY", price: "", hasAI: false,
          hasPostureCamera: false, hasVipGroup: false, hasNutrition: false,
          maxSessionsWeek: "", description: "",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(studentId: string, planId: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, planId }),
      })
      if (res.ok) {
        setShowAssign(null)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Plans Grid — sorted by duration then tier (Essencial → Pro → Elite) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortPlans(plans).map((plan) => (
          <div
            key={plan.id}
            className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 hover:border-white/[0.12] transition-all duration-500"
          >
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase tracking-wider">
                  {intervalLabels[plan.interval]}
                </span>
              </div>

              <p className="text-3xl font-bold text-white mb-1">
                R$ {plan.price.toFixed(2)}
                <span className="text-sm text-neutral-500 font-normal">/{intervalLabels[plan.interval].toLowerCase()}</span>
              </p>

              {plan.description && (
                <p className="text-neutral-500 text-xs mt-2 mb-3">{plan.description}</p>
              )}

              <div className="space-y-2 mt-4 mb-4">
                {featureConfig.map((feat) => (
                  <div key={feat.key} className="flex items-center gap-2">
                    {plan[feat.key] ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-neutral-600" />
                    )}
                    <feat.icon className={cn("w-3.5 h-3.5", plan[feat.key] ? feat.color : "text-neutral-600")} />
                    <span className={cn("text-xs", plan[feat.key] ? "text-neutral-300" : "text-neutral-600")}>
                      {feat.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-neutral-300">
                    {plan.maxSessionsWeek ? `${plan.maxSessionsWeek} treinos/semana` : "Treinos ilimitados"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {plan._count.subscriptions} assinantes
                </span>
                <button
                  onClick={() => setShowAssign(plan.id)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  Atribuir aluno
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Plan Card */}
        <button
          onClick={() => setShowForm(true)}
          className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-5 flex flex-col items-center justify-center min-h-[280px] hover:border-amber-500/30 hover:bg-white/[0.03] transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 group-hover:text-amber-400 group-hover:border-amber-500/20 transition-all duration-300 mb-3">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-neutral-400 text-sm font-medium">Criar Novo Plano</p>
          <p className="text-neutral-600 text-xs mt-1">Defina preço e features</p>
        </button>
      </div>

      {/* Students with Plans */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-lg bg-amber-600/10 flex items-center justify-center">
            <Users className="w-3 h-3 text-amber-500" />
          </div>
          Alunos & Planos
        </h3>
        <div className="space-y-1.5">
          {students.map((s) => {
            const activeSub = s.subscriptions[0]
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center text-red-400/80 text-sm font-medium border border-red-500/10">
                  {s.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium truncate">{s.user.name}</p>
                </div>
                {activeSub ? (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    {activeSub.plan.name} — {intervalLabels[activeSub.plan.interval]}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-neutral-500/10 text-neutral-500 border border-neutral-500/15">
                    Sem plano
                  </span>
                )}
              </div>
            )
          })}
          {students.length === 0 && (
            <p className="text-center text-neutral-500 text-sm py-6">Nenhum aluno cadastrado</p>
          )}
        </div>
      </div>

      {/* Create Plan Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Novo Plano
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Nome do plano</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Premium"
                  required
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Período</label>
                  <select
                    value={form.interval}
                    onChange={(e) => setForm({ ...form, interval: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/30"
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="SEMIANNUAL">Semestral</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="150.00"
                    required
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Max. treinos/semana (vazio = ilimitado)</label>
                <input
                  type="number"
                  value={form.maxSessionsWeek}
                  onChange={(e) => setForm({ ...form, maxSessionsWeek: e.target.value })}
                  placeholder="Ilimitado"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-2 block">Features incluídas</label>
                <div className="grid grid-cols-2 gap-2">
                  {featureConfig.map((feat) => (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => setForm({ ...form, [feat.key]: !form[feat.key] })}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all",
                        form[feat.key]
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:border-white/[0.12]"
                      )}
                    >
                      <feat.icon className="w-3.5 h-3.5" />
                      {feat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Descrição (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes do plano..."
                  rows={2}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/30 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.06] text-neutral-400 text-sm hover:bg-white/[0.04] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar Plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Atribuir Plano
            </h2>
            <p className="text-neutral-500 text-xs mb-4">
              Plano: {plans.find((p) => p.id === showAssign)?.name}
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAssign(s.id, showAssign)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center text-red-400/80 text-xs font-medium border border-red-500/10">
                    {s.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate">{s.user.name}</p>
                    {s.subscriptions[0] && (
                      <p className="text-neutral-600 text-[10px]">
                        Atual: {s.subscriptions[0].plan.name}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssign(null)}
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-white/[0.06] text-neutral-400 text-sm hover:bg-white/[0.04] transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
