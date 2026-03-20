"use client"

import { useState } from "react"
import { Calendar, List, TrendingUp, Flame, Dumbbell, Clock, Activity, Zap } from "lucide-react"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Session {
  id: string
  templateName: string
  templateType: string
  startedAt: string
  completedAt: string
  durationMin: number | null
  rpe: number | null
  setsCount: number
}

interface HeatmapDay {
  date: string
  count: number
}

interface HistoryProps {
  sessions: Session[]
  heatmap: HeatmapDay[]
  streak: number
}

const TABS = [
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "sessions", label: "Sessões", icon: List },
] as const

type TabId = typeof TABS[number]["id"]

export function HistoryClient({ sessions, heatmap, streak }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<TabId>("calendar")

  // Computed stats from sessions
  const totalSets = sessions.reduce((sum, s) => sum + s.setsCount, 0)
  const sessionsWithDuration = sessions.filter((s) => s.durationMin)
  const avgDuration = sessionsWithDuration.length > 0
    ? Math.round(sessionsWithDuration.reduce((sum, s) => sum + (s.durationMin || 0), 0) / sessionsWithDuration.length)
    : 0

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Histórico</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Sua evolução ao longo do tempo</p>
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400 animate-streak-fire" />
            <span className="text-xs font-bold text-orange-300">{streak}</span>
            <span className="text-[9px] text-orange-400/70 uppercase tracking-wider">
              {streak === 1 ? "semana" : "semanas"}
            </span>
          </div>
        )}
      </div>

      {/* ═══ QUICK STATS ═══ */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3 text-center">
            <Dumbbell className="w-3.5 h-3.5 text-red-400 mx-auto mb-1.5" />
            <p className="text-base font-bold text-white">{sessions.length}</p>
            <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Sessões</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3 text-center">
            <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1.5" />
            <p className="text-base font-bold text-white">{totalSets}</p>
            <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Séries</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3 text-center">
            <Clock className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1.5" />
            <p className="text-base font-bold text-white">{avgDuration || "—"}</p>
            <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Min/sessão</p>
          </div>
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-red-600/15 text-red-400 border border-red-500/20"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      {activeTab === "calendar" && <CalendarHeatmap heatmap={heatmap} />}
      {activeTab === "sessions" && <SessionList sessions={sessions} />}
    </div>
  )
}

/* ═══ CALENDAR HEATMAP ═══ */
function CalendarHeatmap({ heatmap }: { heatmap: HeatmapDay[] }) {
  const heatmapMap = new Map(heatmap.map((h) => [h.date, h.count]))
  const today = new Date()
  const weeks = 13
  const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 1 })

  const dayLabels = ["Seg", "", "Qua", "", "Sex", "", ""]

  // Build grid: 7 rows × 13 columns
  const grid: { date: Date; count: number; isToday: boolean }[][] = []
  for (let w = 0; w < weeks; w++) {
    const week: typeof grid[0] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      const key = format(date, "yyyy-MM-dd")
      const isToday = format(today, "yyyy-MM-dd") === key
      week.push({ date, count: heatmapMap.get(key) || 0, isToday })
    }
    grid.push(week)
  }

  function getIntensity(count: number): string {
    if (count === 0) return "bg-white/[0.03]"
    if (count === 1) return "bg-red-900/40"
    if (count === 2) return "bg-red-700/50"
    return "bg-red-500/70"
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-white/80 mb-4">Últimos 3 meses</h3>

      <div className="flex gap-1.5">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 pt-5">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[14px] flex items-center">
              <span className="text-[8px] text-neutral-600 w-6">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {/* Month label on first week of month */}
                <div className="h-4 flex items-end">
                  {week[0] && week[0].date.getDate() <= 7 && (
                    <span className="text-[8px] text-neutral-600">
                      {format(week[0].date, "MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[14px] h-[14px] rounded-[3px] transition-all duration-200 ${getIntensity(day.count)} ${
                      day.isToday ? "ring-1 ring-red-500/50" : ""
                    } hover:scale-125 hover:ring-1 hover:ring-white/20`}
                    title={`${format(day.date, "dd/MM/yyyy")}: ${day.count} sessão${day.count !== 1 ? "ões" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4">
        <span className="text-[8px] text-neutral-600">Menos</span>
        <div className="w-[10px] h-[10px] rounded-sm bg-white/[0.03]" />
        <div className="w-[10px] h-[10px] rounded-sm bg-red-900/40" />
        <div className="w-[10px] h-[10px] rounded-sm bg-red-700/50" />
        <div className="w-[10px] h-[10px] rounded-sm bg-red-500/70" />
        <span className="text-[8px] text-neutral-600">Mais</span>
      </div>
    </div>
  )
}

/* ═══ SESSION LIST ═══ */
function SessionList({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <Dumbbell className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-400 font-medium">Nenhuma sessão ainda</p>
        <p className="text-neutral-600 text-xs mt-1">Complete seu primeiro treino para ver aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isExpanded = expanded === session.id
        return (
          <button
            key={session.id}
            onClick={() => setExpanded(isExpanded ? null : session.id)}
            className="w-full text-left rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-white/[0.1] transition-all duration-300 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/15 to-red-900/5 flex items-center justify-center text-red-400 border border-red-500/10 shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.templateName}</p>
                <p className="text-[11px] text-neutral-500">
                  {format(new Date(session.startedAt), "dd MMM, HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {session.durationMin && (
                  <span className="flex items-center gap-0.5 text-[10px] text-neutral-500 px-2 py-0.5 rounded-full bg-white/[0.04]">
                    <Clock className="w-3 h-3" />
                    {session.durationMin}min
                  </span>
                )}
                {session.rpe && (
                  <span className="flex items-center gap-0.5 text-[10px] text-neutral-500 px-2 py-0.5 rounded-full bg-white/[0.04]">
                    <Activity className="w-3 h-3" />
                    RPE {session.rpe}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] animate-slide-up">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-neutral-500">Séries</p>
                    <p className="text-sm font-bold text-white">{session.setsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Tipo</p>
                    <p className="text-sm font-bold text-white">{session.templateType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Duração</p>
                    <p className="text-sm font-bold text-white">{session.durationMin ? `${session.durationMin}min` : "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
