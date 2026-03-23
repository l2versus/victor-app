"use client"

import { useState, useEffect } from "react"
import { CreditCard, Crown, Calendar, ArrowRightLeft, Check, Loader2 } from "lucide-react"

type Subscription = {
  id: string
  status: string
  startDate: string
  endDate: string
  plan: { name: string; interval: string; price: number }
}

type Plan = {
  id: string
  name: string
  interval: string
  price: number
  active: boolean
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
}

export function StudentSubscription({ studentId }: { studentId: string }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  const fetchData = async () => {
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetch(`/api/admin/subscriptions?studentId=${studentId}`),
        fetch("/api/admin/plans"),
      ])
      const subsData = await subsRes.json()
      const plansData = await plansRes.json()
      setSubscriptions(Array.isArray(subsData) ? subsData : [])
      setPlans(Array.isArray(plansData) ? plansData.filter((p: Plan) => p.active) : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [studentId])

  const active = subscriptions.find((s) => s.status === "ACTIVE" || s.status === "TRIAL")
  const past = subscriptions.filter((s) => s.status !== "ACTIVE" && s.status !== "TRIAL")

  const daysRemaining = active
    ? Math.ceil((new Date(active.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const assignPlan = async (planId: string) => {
    setChanging(true)
    try {
      await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, planId }),
      })
      await fetchData()
      setShowPlanPicker(false)
    } catch {
      // silent
    } finally {
      setChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando plano...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-emerald-500" />
        Plano & Assinatura
      </h3>

      {active ? (
        <div className="space-y-4">
          {/* Current plan card */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-600/10 to-emerald-800/5 border border-emerald-500/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{active.plan.name}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    {active.status === "TRIAL" ? "Trial" : "Ativo"}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">
                  R$ {active.plan.price.toFixed(2).replace(".", ",")} / {INTERVAL_LABELS[active.plan.interval] || active.plan.interval}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${daysRemaining !== null && daysRemaining <= 7 ? "text-red-400" : "text-white"}`}>
                  {daysRemaining}d
                </p>
                <p className="text-[10px] text-neutral-500 uppercase">restantes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(active.startDate).toLocaleDateString("pt-BR")}
              </span>
              <span>→</span>
              <span>{new Date(active.endDate).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          {/* Change plan button */}
          <button
            onClick={() => setShowPlanPicker(!showPlanPicker)}
            className="w-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Trocar Plano
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <CreditCard className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm mb-3">Nenhum plano ativo</p>
          <button
            onClick={() => setShowPlanPicker(!showPlanPicker)}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            Atribuir Plano
          </button>
        </div>
      )}

      {/* Plan picker dropdown */}
      {showPlanPicker && (
        <div className="mt-4 space-y-2 border-t border-neutral-800 pt-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Selecione um plano</p>
          {plans.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum plano criado. Vá em Planos para criar.</p>
          ) : (
            plans.map((plan) => {
              const isCurrent = active?.plan.name === plan.name && active?.plan.interval === plan.interval
              return (
                <button
                  key={plan.id}
                  onClick={() => !isCurrent && assignPlan(plan.id)}
                  disabled={changing || isCurrent}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isCurrent
                      ? "border-emerald-500/30 bg-emerald-500/5 cursor-default"
                      : "border-neutral-800 hover:border-neutral-700 hover:bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{plan.name}</p>
                    <p className="text-xs text-neutral-500">
                      R$ {plan.price.toFixed(2).replace(".", ",")} — {INTERVAL_LABELS[plan.interval] || plan.interval}
                    </p>
                  </div>
                  {isCurrent ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : changing ? (
                    <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                  ) : null}
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Past subscriptions */}
      {past.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Histórico</p>
          <div className="space-y-1.5">
            {past.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between text-xs text-neutral-600 py-1">
                <span>{sub.plan.name} — {INTERVAL_LABELS[sub.plan.interval] || sub.plan.interval}</span>
                <span className={
                  sub.status === "CANCELLED" ? "text-red-500/60" :
                  sub.status === "EXPIRED" ? "text-yellow-500/60" : "text-neutral-600"
                }>
                  {sub.status === "CANCELLED" ? "Cancelado" : sub.status === "EXPIRED" ? "Expirado" : sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
