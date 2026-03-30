"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, ShieldCheck, AlertTriangle, Flame, Clock } from "lucide-react"
import { BodyMap } from "@/components/student/body-map"

interface MuscleRecoveryData {
  muscle: string
  lastWorkedAt: string | null
  hoursSince: number | null
  recoveryHours: number
  recoveryPercent: number
  status: "fresh" | "recovering" | "ready" | "overdue"
  totalVolume: number
  sets: number
}

const STATUS_CONFIG = {
  fresh: {
    label: "Treinado",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    barColor: "bg-red-500",
    icon: Flame,
    badge: "bg-red-500",
  },
  recovering: {
    label: "Recuperando",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    barColor: "bg-amber-500",
    icon: Clock,
    badge: "bg-amber-500",
  },
  ready: {
    label: "Pronto",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    barColor: "bg-emerald-500",
    icon: ShieldCheck,
    badge: "bg-emerald-500",
  },
  overdue: {
    label: "Sem treinar",
    color: "text-neutral-500",
    bg: "bg-neutral-500/10 border-neutral-500/20",
    barColor: "bg-neutral-600",
    icon: AlertTriangle,
    badge: "bg-neutral-600",
  },
}

function formatTimeSince(hours: number | null): string {
  if (hours === null) return "Sem dados"
  if (hours < 1) return "Agora"
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1 dia atrás"
  return `${days} dias atrás`
}

export function MuscleRecoveryPanel() {
  const [data, setData] = useState<MuscleRecoveryData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/student/evolution/recovery")
        if (res.ok) {
          const json = await res.json()
          setData(json.recovery || [])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">Nenhum dado de treino ainda</p>
        <p className="text-xs text-neutral-600 mt-1">Complete alguns treinos para ver a recuperação</p>
      </div>
    )
  }

  // Stats
  const freshCount = data.filter(d => d.status === "fresh").length
  const recoveringCount = data.filter(d => d.status === "recovering").length
  const readyCount = data.filter(d => d.status === "ready").length
  const overdueCount = data.filter(d => d.status === "overdue").length

  // Body map data (invert: 100% recovery = 0% intensity on map → red = needs rest)
  const bodyMapData = data.map(d => ({
    muscle: d.muscle,
    volume: d.totalVolume,
    percentage: Math.max(0, 100 - d.recoveryPercent),
  }))

  const selectedData = selectedMuscle ? data.find(d => d.muscle === selectedMuscle) : null

  return (
    <div className="space-y-4">
      {/* ── Header: Status summary pills ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { count: freshCount, label: "Treinado", color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-500" },
          { count: recoveringCount, label: "Recuperando", color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
          { count: readyCount, label: "Pronto", color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
          { count: overdueCount, label: "Parado", color: "text-neutral-500", bg: "bg-neutral-500/10", dot: "bg-neutral-600" },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-xl py-2.5 px-1 text-center", s.bg)}>
            <p className={cn("text-xl font-black tabular-nums", s.color)}>{s.count}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
              <p className="text-[8px] text-neutral-500 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Body Map (frente + costas) — ALWAYS visible ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <BodyMap
          data={bodyMapData}
          view="both"
          selectedMuscle={selectedMuscle}
          onMuscleSelect={(m) => setSelectedMuscle(m === selectedMuscle ? null : m)}
        />

        {/* Legend inline */}
        <div className="flex items-center justify-center gap-5 mt-2 text-[9px] text-neutral-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Treinado</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Recuperando</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pronto</span>
        </div>

        {/* Selected muscle detail card — overlays below body map */}
        {selectedData && (
          <div className={cn(
            "mt-3 rounded-xl border p-3 space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-200",
            STATUS_CONFIG[selectedData.status].bg,
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => { const Icon = STATUS_CONFIG[selectedData.status].icon; return <Icon className="w-4 h-4" /> })()}
                <span className="text-sm font-bold text-white">{selectedData.muscle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-black tabular-nums", STATUS_CONFIG[selectedData.status].color)}>
                  {selectedData.recoveryPercent}%
                </span>
              </div>
            </div>
            {/* Recovery bar */}
            <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", STATUS_CONFIG[selectedData.status].barColor)}
                style={{ width: `${selectedData.recoveryPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>{formatTimeSince(selectedData.hoursSince)}</span>
              <span>{STATUS_CONFIG[selectedData.status].label}</span>
            </div>
            {selectedData.sets > 0 && (
              <p className="text-[10px] text-neutral-600">
                Último treino: {selectedData.sets} séries · {selectedData.totalVolume >= 1000 ? `${(selectedData.totalVolume / 1000).toFixed(1)}t` : `${selectedData.totalVolume}kg`} volume
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Muscle List — ALWAYS visible below body map ── */}
      <div className="space-y-1">
        <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium px-1 mb-2">Músculos</p>
        {data.map((muscle) => {
          const config = STATUS_CONFIG[muscle.status]
          const Icon = config.icon
          const isSelected = muscle.muscle === selectedMuscle
          return (
            <div
              key={muscle.muscle}
              onClick={() => setSelectedMuscle(isSelected ? null : muscle.muscle)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98]",
                isSelected ? config.bg : "border-transparent hover:bg-white/[0.02]",
              )}
            >
              {/* Status dot */}
              <div className={cn("w-2 h-2 rounded-full shrink-0", config.badge)} />

              {/* Icon */}
              <Icon className={cn("w-4 h-4 shrink-0", config.color)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{muscle.muscle}</span>
                  <span className={cn("text-sm font-bold tabular-nums", config.color)}>
                    {muscle.recoveryPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-white/[0.04] mt-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", config.barColor)}
                    style={{ width: `${muscle.recoveryPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-neutral-600">
                    {muscle.lastWorkedAt ? formatTimeSince(muscle.hoursSince) : "Sem dados"}
                  </span>
                  {muscle.sets > 0 && (
                    <span className="text-[10px] text-neutral-600">
                      {muscle.sets} séries · {muscle.totalVolume >= 1000 ? `${(muscle.totalVolume / 1000).toFixed(1)}t` : `${muscle.totalVolume}kg`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
