"use client"

import { useEffect, useState } from "react"
import { Flame, Utensils, TrendingDown, TrendingUp, Minus, Zap, Droplets, Target, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type EnergyData = {
  bmr: number
  tdee: number
  activityLevel: string
  avgIntake: number | null
  avgProtein: number | null
  avgCarbs: number | null
  avgFat: number | null
  proteinTarget: number
  daysLogged: number
  dailyBalance: number | null
  weeklyBalance: number | null
  projectedWeightChangeKg: number | null
  goalType: "cut" | "bulk" | "maintain" | "unknown"
  goalAlignment: "on_track" | "off_track" | "needs_data"
  goalMessage: string
  totalWorkoutCals: number
  totalCardioCals: number
  sessionsPerWeek: number
  avgWorkoutCals: number
  weight: number
}

export function EnergyBalanceCard() {
  const [data, setData] = useState<EnergyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/energy")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse">
      <div className="h-4 bg-neutral-800 rounded w-1/3 mb-3" />
      <div className="h-20 bg-neutral-800/50 rounded" />
    </div>
  )

  if (!data) return null

  const balance = data.dailyBalance
  const isDeficit = balance !== null && balance < 0
  const isSurplus = balance !== null && balance > 0

  const goalColors = {
    on_track: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    off_track: "text-red-400 bg-red-500/10 border-red-500/20",
    needs_data: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.04]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Balanço Energético</h3>
          <p className="text-[10px] text-neutral-500">Últimos 7 dias</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Main energy metrics */}
        <div className="grid grid-cols-3 gap-2">
          <MetricBox
            label="TMB"
            value={`${data.bmr}`}
            unit="kcal"
            sub="Metabolismo basal"
            color="text-blue-400"
          />
          <MetricBox
            label="TDEE"
            value={`${data.tdee}`}
            unit="kcal"
            sub={data.activityLevel}
            color="text-orange-400"
          />
          <MetricBox
            label="Ingestão"
            value={data.avgIntake !== null ? `${data.avgIntake}` : "—"}
            unit="kcal"
            sub={data.daysLogged > 0 ? `${data.daysLogged} dias` : "Sem registro"}
            color="text-green-400"
          />
        </div>

        {/* Balance bar */}
        {balance !== null && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Balanço diário</span>
              <span className={cn("text-sm font-bold", isDeficit ? "text-blue-400" : isSurplus ? "text-orange-400" : "text-neutral-400")}>
                {balance > 0 ? "+" : ""}{balance} kcal
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden relative">
              <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-600 z-10" />
              {isDeficit ? (
                <div
                  className="absolute inset-y-0 right-1/2 rounded-l-full bg-gradient-to-l from-blue-500 to-blue-600"
                  style={{ width: `${Math.min(Math.abs(balance) / (data.tdee * 0.5) * 50, 50)}%` }}
                />
              ) : (
                <div
                  className="absolute inset-y-0 left-1/2 rounded-r-full bg-gradient-to-r from-orange-500 to-red-500"
                  style={{ width: `${Math.min(balance / (data.tdee * 0.5) * 50, 50)}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-blue-400/60">Déficit</span>
              <span className="text-[9px] text-orange-400/60">Superávit</span>
            </div>
          </div>
        )}

        {/* Goal alignment */}
        <div className={cn("rounded-xl border p-3 flex items-start gap-2.5", goalColors[data.goalAlignment])}>
          {data.goalAlignment === "on_track" ? <Target className="w-4 h-4 shrink-0 mt-0.5" /> :
           data.goalAlignment === "off_track" ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
           <Utensils className="w-4 h-4 shrink-0 mt-0.5" />}
          <div>
            <p className="text-xs font-semibold">
              {data.goalType === "cut" ? "Objetivo: Emagrecimento" :
               data.goalType === "bulk" ? "Objetivo: Ganho de Massa" :
               data.goalType === "maintain" ? "Objetivo: Manutenção" :
               "Objetivo não definido"}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">{data.goalMessage}</p>
          </div>
        </div>

        {/* Workout + Cardio calories */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Dumbbell className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-neutral-500">Musculação</span>
            </div>
            <p className="text-sm font-bold text-white">{data.totalWorkoutCals} <span className="text-[10px] text-neutral-500 font-normal">kcal</span></p>
            <p className="text-[9px] text-neutral-600">{data.sessionsPerWeek} sessões · ~{data.avgWorkoutCals}/treino</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-neutral-500">Cardio/Extra</span>
            </div>
            <p className="text-sm font-bold text-white">{data.totalCardioCals} <span className="text-[10px] text-neutral-500 font-normal">kcal</span></p>
            <p className="text-[9px] text-neutral-600">Na semana</p>
          </div>
        </div>

        {/* Macros */}
        {data.avgProtein !== null && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Macros (média/dia)</p>
            <div className="grid grid-cols-3 gap-2">
              <MacroBar label="Proteína" value={data.avgProtein!} target={data.proteinTarget} unit="g" color="bg-red-500" />
              <MacroBar label="Carboidrato" value={data.avgCarbs!} unit="g" color="bg-amber-500" />
              <MacroBar label="Gordura" value={data.avgFat!} unit="g" color="bg-blue-500" />
            </div>
            {data.avgProtein! < data.proteinTarget && (
              <p className="text-[10px] text-amber-400/80 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Proteína abaixo do ideal ({data.proteinTarget}g/dia para {data.weight}kg)
              </p>
            )}
          </div>
        )}

        {/* Projected weight change */}
        {data.projectedWeightChangeKg !== null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            {data.projectedWeightChangeKg < 0 ?
              <TrendingDown className="w-4 h-4 text-blue-400 shrink-0" /> :
              data.projectedWeightChangeKg > 0 ?
              <TrendingUp className="w-4 h-4 text-orange-400 shrink-0" /> :
              <Minus className="w-4 h-4 text-neutral-400 shrink-0" />
            }
            <p className="text-[11px] text-neutral-400">
              Projeção semanal: <span className="font-semibold text-white">
                {data.projectedWeightChangeKg > 0 ? "+" : ""}{data.projectedWeightChangeKg} kg/semana
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function MetricBox({ label, value, unit, sub, color }: { label: string; value: string; unit: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
      <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-base font-bold", color)}>{value}</p>
      <p className="text-[8px] text-neutral-600">{unit}</p>
      <p className="text-[9px] text-neutral-500 mt-0.5">{sub}</p>
    </div>
  )
}

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target?: number; unit: string; color: string }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 100
  return (
    <div>
      <p className="text-[10px] text-neutral-400 mb-1">{label}</p>
      <p className="text-xs font-bold text-white">{value}{unit}</p>
      {target && (
        <div className="h-1 rounded-full bg-neutral-800 mt-1 overflow-hidden">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

// Need the Dumbbell icon
import { Dumbbell } from "lucide-react"
