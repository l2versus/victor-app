"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, ShieldCheck, AlertTriangle, Flame, Clock } from "lucide-react"
import dynamic from "next/dynamic"

// react-body-highlighter — professional anatomical SVG (anterior + posterior)
import type { Muscle } from "react-body-highlighter"
const Model = dynamic(() => import("react-body-highlighter"), { ssr: false })

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

// Map our muscle names → react-body-highlighter slug(s)
const MUSCLE_TO_SLUG: Record<string, Muscle[]> = {
  "Peito": ["chest"],
  "Costas": ["upper-back", "lower-back"],
  "Ombros": ["front-deltoids", "back-deltoids"],
  "Bíceps": ["biceps"],
  "Tríceps": ["triceps"],
  "Quadríceps": ["quadriceps"],
  "Posterior de Coxa": ["hamstring"],
  "Glúteos": ["gluteal"],
  "Panturrilha": ["calves"],
  "Abdômen": ["abs", "obliques"],
  "Trapézio": ["trapezius"],
  "Antebraço": ["forearm"],
  "Adutores": ["adductor"],
  "Abdutores": ["abductors"],
}

// Reverse mapping: slug → our muscle name
const SLUG_TO_MUSCLE: Record<string, string> = {}
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_SLUG)) {
  for (const slug of slugs) SLUG_TO_MUSCLE[slug] = muscle
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

// Color palette: index 0 = trained 1x, 1 = recovering, 2 = ready, 3 = fresh
const HIGHLIGHT_COLORS = [
  "#22c55e", // 1x — green (recovered)
  "#eab308", // 2x — yellow (recovering)
  "#f97316", // 3x — orange (moderate)
  "#ef4444", // 4x — red (freshly trained)
]

function formatTimeSince(hours: number | null): string {
  if (hours === null) return "Sem dados"
  if (hours < 1) return "Agora"
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1 dia atrás"
  return `${days} dias atrás`
}

function getFrequencyFromRecovery(percent: number): number {
  // Map recovery % to frequency (higher freq = less recovered = more red)
  if (percent >= 90) return 1  // Recovered → green
  if (percent >= 50) return 2  // Recovering → yellow
  if (percent >= 20) return 3  // Moderate → orange
  return 4                     // Fresh/just trained → red
}

// Determine which view (anterior/posterior) best shows each muscle
const MUSCLE_VIEW: Record<string, "anterior" | "posterior"> = {
  "Peito": "anterior",
  "Abdômen": "anterior",
  "Bíceps": "anterior",
  "Quadríceps": "anterior",
  "Ombros": "anterior",
  "Antebraço": "anterior",
  "Adutores": "anterior",
  "Abdutores": "posterior",
  "Costas": "posterior",
  "Trapézio": "posterior",
  "Tríceps": "posterior",
  "Posterior de Coxa": "posterior",
  "Glúteos": "posterior",
  "Panturrilha": "posterior",
}

/** Mini anatomical icon — renders a tiny body with only one muscle highlighted */
function MuscleIcon({ muscle, color }: { muscle: string; color: string }) {
  const slugs = MUSCLE_TO_SLUG[muscle]
  if (!slugs) return null

  const view = MUSCLE_VIEW[muscle] || "anterior"
  const iconData = [{ name: muscle, muscles: slugs, frequency: 1 }]

  return (
    <div className="w-10 h-10 shrink-0 rounded-lg bg-white/[0.03] overflow-hidden flex items-center justify-center">
      <Model
        data={iconData}
        type={view}
        bodyColor="#1a1a2e"
        highlightedColors={[color]}
        style={{ width: 36, height: 36, padding: 0, margin: 0 }}
        svgStyle={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}

// Status → highlight color for the mini icon
const STATUS_ICON_COLOR: Record<string, string> = {
  fresh: "#ef4444",
  recovering: "#eab308",
  ready: "#22c55e",
  overdue: "#525252",
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

  // Convert recovery data → react-body-highlighter format
  // Each muscle becomes an "exercise" entry with frequency based on recovery %
  const bodyData = data
    .filter(d => d.status !== "overdue" && MUSCLE_TO_SLUG[d.muscle])
    .map(d => ({
      name: d.muscle,
      muscles: MUSCLE_TO_SLUG[d.muscle] || [],
      frequency: getFrequencyFromRecovery(d.recoveryPercent),
    }))

  const selectedData = selectedMuscle ? data.find(d => d.muscle === selectedMuscle) : null

  // Handle muscle click on the body model
  function handleMuscleClick(muscleStats: { muscle: string }) {
    const muscleName = SLUG_TO_MUSCLE[muscleStats.muscle] || muscleStats.muscle
    setSelectedMuscle(prev => prev === muscleName ? null : muscleName)
  }

  return (
    <div className="space-y-4">
      {/* ── Status summary pills ── */}
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

      {/* ── Anatomical Body (anterior + posterior) ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-4">
        <div className="flex items-stretch justify-center gap-2">
          {/* Anterior (front) */}
          <div className="flex-1 max-w-[180px]">
            <p className="text-[9px] text-neutral-600 text-center mb-1 uppercase tracking-wider">Frente</p>
            <Model
              data={bodyData}
              type="anterior"
              bodyColor="#1a1a2e"
              highlightedColors={HIGHLIGHT_COLORS}
              onClick={handleMuscleClick}
              style={{ width: "100%", padding: 0 }}
              svgStyle={{ width: "100%", height: "auto" }}
            />
          </div>

          {/* Posterior (back) */}
          <div className="flex-1 max-w-[180px]">
            <p className="text-[9px] text-neutral-600 text-center mb-1 uppercase tracking-wider">Costas</p>
            <Model
              data={bodyData}
              type="posterior"
              bodyColor="#1a1a2e"
              highlightedColors={HIGHLIGHT_COLORS}
              onClick={handleMuscleClick}
              style={{ width: "100%", padding: 0 }}
              svgStyle={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-neutral-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Treinado</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Recuperando</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pronto</span>
        </div>

        {/* Selected muscle detail card */}
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
              <span className={cn("text-lg font-black tabular-nums", STATUS_CONFIG[selectedData.status].color)}>
                {selectedData.recoveryPercent}%
              </span>
            </div>
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

      {/* ── Muscle List ── */}
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
              <MuscleIcon muscle={muscle.muscle} color={STATUS_ICON_COLOR[muscle.status]} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{muscle.muscle}</span>
                  <span className={cn("text-sm font-bold tabular-nums", config.color)}>
                    {muscle.recoveryPercent}%
                  </span>
                </div>
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
