"use client"

import { useState, useEffect } from "react"
import {
  Users, UserCheck, UserX, UserMinus, Dumbbell, Clock,
  Calendar, CalendarCheck, CalendarX, TrendingUp, AlertTriangle,
  RefreshCw, Sunrise, Sun, Moon, BarChart3, Target, CreditCard,
} from "lucide-react"

type BiData = {
  students: {
    total: number; active: number; inactive: number
    withPlan: number; withoutPlan: number; upToDate: number
    notFollowed: number; trainedThisMonth: number
  }
  plans: { expiringSoon: number; expired: number; recentlyRenewed: number }
  sessions: { today: number; thisWeek: number; thisMonth: number; avgDurationMinutes: number }
  schedule: { total: number; confirmed: number; noShow: number }
  payments: { pendingCount: number; pendingTotal: number }
  charts: { dayOfWeek: number[]; timePercentages: { morning: number; afternoon: number; evening: number } }
  updatedAt: string
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function BiTreinoClient() {
  const [data, setData] = useState<BiData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/bi-treino")
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const maxDayCount = Math.max(...data.charts.dayOfWeek, 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-400" />
            Business Intelligence
          </h1>
          <p className="text-[10px] text-neutral-600 mt-1">
            Última atualização: {new Date(data.updatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs hover:text-white transition-colors min-h-[44px]">
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* ═══ ROW 1: Student metrics (like Pacto) ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={Users} label="Total de Alunos" value={data.students.total} color="blue" />
        <MetricCard icon={UserCheck} label="Alunos Ativos" value={data.students.active} color="green" />
        <MetricCard icon={UserX} label="Alunos Inativos" value={data.students.inactive} color="red" />
        <MetricCard icon={UserMinus} label="Não acompanhados" value={data.students.notFollowed} color="yellow" />
        <MetricCard icon={Target} label="Em acompanhamento" value={data.students.trainedThisMonth} color="blue" />
      </div>

      {/* ═══ ROW 2: Training status ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={AlertTriangle} label="Treinos Vencidos" value={data.plans.expired} color="red" highlight />
        <MetricCard icon={Dumbbell} label="Alunos sem treino" value={data.students.withoutPlan} color="red" highlight />
        <MetricCard icon={TrendingUp} label="Treinos a Vencer" value={data.plans.expiringSoon} color="yellow" highlight />
        <MetricCard icon={CalendarCheck} label="Treinos em dia" value={data.students.upToDate} color="green" />
        <MetricCard icon={CreditCard} label="Contratos a vencer" value={data.plans.expiringSoon} color="yellow" highlight />
      </div>

      {/* ═══ ROW 3: Sessions + Schedule ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Dumbbell} label="Treinos hoje" value={data.sessions.today} color="blue" />
        <MetricCard icon={Calendar} label="Treinos na semana" value={data.sessions.thisWeek} color="blue" />
        <MetricCard icon={Dumbbell} label="Alunos com treino" value={data.students.withPlan} color="green" />
        <MetricCard icon={Clock} label="Duração média" value={data.sessions.avgDurationMinutes} suffix="min" color="blue" />
      </div>

      {/* ═══ ROW 4: Renewed + Payments ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard icon={RefreshCw} label="Renovados recentemente" value={data.plans.recentlyRenewed} color="green" highlight />
        <MetricCard icon={CreditCard} label="Pagamentos pendentes" value={data.payments.pendingCount} color="yellow" />
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Total a receber</p>
          <p className="text-2xl font-bold text-green-400">
            R$ {data.payments.pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ═══ ROW 5: Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Days of week chart */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Dias que treinaram
          </h3>
          <p className="text-[10px] text-neutral-600 mb-4">Treinos nos últimos 30 dias</p>
          <div className="flex items-end gap-2 h-32">
            {data.charts.dayOfWeek.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-neutral-500">{count}</span>
                <div
                  className={`w-full rounded-t-lg transition-all ${i === 0 ? "bg-red-500/60" : "bg-blue-500/40"}`}
                  style={{ height: `${(count / maxDayCount) * 100}%`, minHeight: count > 0 ? "4px" : "2px" }}
                />
                <span className={`text-[9px] ${i === 0 ? "text-red-400" : "text-neutral-500"}`}>{DAY_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time of day distribution */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            Horários que treinaram
          </h3>
          <p className="text-[10px] text-neutral-600 mb-4">Treinos nos últimos 30 dias</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-white">{data.sessions.thisMonth}</p>
              <p className="text-[10px] text-neutral-500">treinos</p>
            </div>
            <div className="space-y-3">
              <TimeRow icon={Sunrise} label="Manhã" pct={data.charts.timePercentages.morning} color="text-yellow-400" />
              <TimeRow icon={Sun} label="Tarde" pct={data.charts.timePercentages.afternoon} color="text-orange-400" />
              <TimeRow icon={Moon} label="Noite" pct={data.charts.timePercentages.evening} color="text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color, suffix, highlight }: {
  icon: typeof Users; label: string; value: number; color: "blue" | "green" | "red" | "yellow"; suffix?: string; highlight?: boolean
}) {
  const colorMap = {
    blue: { text: "text-white", icon: "text-blue-400", border: "" },
    green: { text: "text-white", icon: "text-green-400", border: "" },
    red: { text: highlight ? "text-red-400" : "text-white", icon: "text-red-400", border: highlight && value > 0 ? "border-red-500/20" : "" },
    yellow: { text: highlight ? "text-yellow-400" : "text-white", icon: "text-yellow-400", border: highlight && value > 0 ? "border-yellow-500/20" : "" },
  }
  const c = colorMap[color]

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center space-y-1 ${c.border}`}>
      <div className="flex justify-center mb-2">
        <Icon className={`w-5 h-5 ${c.icon} opacity-60`} />
      </div>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>
        {value}{suffix ? <span className="text-sm text-neutral-500 ml-1">{suffix}</span> : null}
      </p>
    </div>
  )
}

function TimeRow({ icon: Icon, label, pct, color }: {
  icon: typeof Sunrise; label: string; pct: number; color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xs text-neutral-400 w-12">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{pct}%</span>
    </div>
  )
}
