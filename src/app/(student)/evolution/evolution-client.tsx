"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp, Dumbbell, Flame, Clock, BarChart3,
  ChevronDown, Trophy, Target, Zap, FileDown,
  Calendar, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie, LineChart, Line,
} from "recharts"
import { BodyMap, BodyMapLegend } from "@/components/student/body-map"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"

/* ═══ Types ═══ */
type EvolutionData = {
  weeklyFrequency: { week: string; sessions: number }[]
  loadProgression: Record<string, {
    exerciseName: string; muscle: string
    data: { date: string; maxLoad: number }[]
  }>
  rpeTrend: { date: string; rpe: number; template: string }[]
  volumeTrend: { date: string; volume: number; sets: number; template: string; duration: number | null }[]
  muscleDistribution: { muscle: string; volume: number }[]
  summary: {
    totalSessions: number; totalVolume: number; totalSets: number
    avgDuration: number | null; periodDays: number
  }
}

type StatsData = {
  totalSessions: number; avgRpe: number | null; streak: number
  heatmap: { date: string; count: number }[]
  prs: { exerciseId: string; exerciseName: string; muscle: string; loadKg: number; date: string }[]
  volumeByWeek: { week: string; volume: number }[]
}

type HistoryData = {
  sessions: Array<{
    id: string; startedAt: string; completedAt: string | null; rpe: number | null
    durationMin: number | null; template: { name: string; type: string }; _count: { sets: number }
    sets: Array<{ reps: number; loadKg: number }>
  }>
  total: number
}

/* ═══ Colors ═══ */
const MUSCLE_COLORS: Record<string, string> = {
  Quadriceps: "#ef4444", Posterior: "#f97316", Gluteos: "#eab308",
  Peito: "#22c55e", Costas: "#3b82f6", Ombros: "#8b5cf6",
  Biceps: "#ec4899", Triceps: "#14b8a6", Core: "#f59e0b",
  Panturrilha: "#6366f1", Trapezio: "#84cc16", Antebraco: "#06b6d4",
}
const PIE_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#22c55e", "#8b5cf6", "#eab308", "#ec4899", "#14b8a6"]

type TabId = "dashboard" | "exercises" | "history"

/* ═══ Tooltip ═══ */
function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-[#111]/95 backdrop-blur-xl border border-white/[0.08] px-2.5 py-1.5 shadow-2xl">
      <p className="text-[9px] text-neutral-500">{label}</p>
      <p className="text-xs font-bold text-white">{payload[0].value.toLocaleString("pt-BR")}{unit || ""}</p>
    </div>
  )
}

/* ═══ Main ═══ */
export function EvolutionClient() {
  const [evo, setEvo] = useState<EvolutionData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>("dashboard")
  const [selectedEx, setSelectedEx] = useState<string | null>(null)
  const [showExPicker, setShowExPicker] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [evoRes, statsRes, histRes] = await Promise.all([
          fetch("/api/student/evolution"),
          fetch("/api/student/stats"),
          fetch("/api/student/history?limit=50"),
        ])
        if (!evoRes.ok || !statsRes.ok || !histRes.ok) return
        const [e, s, h] = await Promise.all([evoRes.json(), statsRes.json(), histRes.json()])
        if (e.loadProgression) {
          setEvo(e)
          setStats(s)
          setHistory(h)
          const keys = Object.keys(e.loadProgression)
          if (keys.length > 0) setSelectedEx(keys[0])
        }
      } catch { /* network error — show empty state */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function handleExportPdf() {
    if (!evo || !stats) return
    setExportingPdf(true)

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setExportingPdf(false)
      alert("Permita pop-ups para gerar o PDF do relatorio.")
      return
    }

    // Build the print document using DOM APIs (safe, no XSS risk — all data is from our own API)
    const doc = printWindow.document
    doc.open()

    const style = doc.createElement("style")
    style.textContent = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px}.header{background:linear-gradient(135deg,#1a0000,#0a0a0a);border:1px solid #dc2626;border-radius:16px;padding:24px;margin-bottom:24px}.header h1{font-size:24px;color:#fff;margin-bottom:4px}.header p{color:#737373;font-size:13px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}.card{background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center}.card .val{font-size:24px;font-weight:900;color:#fff}.card .lbl{font-size:10px;color:#737373;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px}h2{font-size:16px;color:#fff;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #dc2626}table{width:100%;border-collapse:collapse;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222}td{padding:6px 12px;border-bottom:1px solid #222}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #dc2626;color:#525252;font-size:11px;text-align:center}@media print{body{background:#fff;color:#111}.header{background:#f5f5f5;border-color:#dc2626}.card{background:#f9f9f9;border-color:#e5e5e5}.card .val{color:#111}table{background:#f9f9f9;border-color:#e5e5e5}td{border-color:#e5e5e5!important}h2{color:#111}.footer{color:#999}}`
    doc.head.appendChild(style)
    doc.title = "Evolucao — VO Personal"

    // Header
    const header = doc.createElement("div")
    header.className = "header"
    const h1 = doc.createElement("h1")
    h1.textContent = "Relatorio de Evolucao"
    const p = doc.createElement("p")
    p.textContent = `${new Date().toLocaleDateString("pt-BR")} — Ultimos ${evo.summary.periodDays} dias`
    header.appendChild(h1)
    header.appendChild(p)
    doc.body.appendChild(header)

    // Stats grid
    const grid = doc.createElement("div")
    grid.className = "grid"
    const statsData = [
      [evo.summary.totalSessions.toString(), "Sessoes"],
      [evo.summary.totalVolume.toLocaleString("pt-BR"), "Volume (kg)"],
      [evo.summary.totalSets.toString(), "Series"],
      [`${evo.summary.avgDuration || "—"} min`, "Duracao media"],
    ]
    for (const [val, lbl] of statsData) {
      const card = doc.createElement("div")
      card.className = "card"
      const v = doc.createElement("div")
      v.className = "val"
      v.textContent = val
      const l = doc.createElement("div")
      l.className = "lbl"
      l.textContent = lbl
      card.appendChild(v)
      card.appendChild(l)
      grid.appendChild(card)
    }
    doc.body.appendChild(grid)

    // PRs table
    if (stats.prs.length > 0) {
      const h2 = doc.createElement("h2")
      h2.textContent = "Records Pessoais"
      doc.body.appendChild(h2)
      const table = doc.createElement("table")
      for (const pr of stats.prs.slice(0, 8)) {
        const tr = doc.createElement("tr")
        const td1 = doc.createElement("td")
        td1.textContent = pr.exerciseName
        const td2 = doc.createElement("td")
        td2.textContent = `${pr.loadKg} kg`
        td2.style.textAlign = "right"
        td2.style.fontWeight = "700"
        tr.appendChild(td1)
        tr.appendChild(td2)
        table.appendChild(tr)
      }
      doc.body.appendChild(table)
    }

    // Footer
    const footer = doc.createElement("div")
    footer.className = "footer"
    footer.textContent = `Gerado pelo Victor App — VO Personal • CREF 016254-G/CE`
    doc.body.appendChild(footer)

    doc.close()
    setTimeout(() => { printWindow.print(); setExportingPdf(false) }, 500)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded-lg bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-2.5">{[...Array(4)].map((_, i) => <div key={i} className="h-[88px] rounded-2xl bg-white/[0.03]" />)}</div>
        <div className="h-48 rounded-2xl bg-white/[0.03]" />
        <div className="h-48 rounded-2xl bg-white/[0.03]" />
      </div>
    )
  }

  if (!evo || !stats || evo.summary.totalSessions === 0) {
    return (
      <div className="space-y-6 pt-4">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600/15 to-red-900/10 border border-red-500/15 flex items-center justify-center mx-auto">
            <TrendingUp className="w-9 h-9 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Sua evolucao comeca aqui</h2>
            <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">
              Complete seus primeiros treinos e veja graficos de volume, forca e frequencia.
            </p>
          </div>
        </div>

        {/* Preview cards — show what they'll unlock */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Flame, label: "Volume total", desc: "kg levantados", color: "text-orange-400 bg-orange-600/10" },
            { icon: Target, label: "Mapa corporal", desc: "musculos treinados", color: "text-red-400 bg-red-600/10" },
            { icon: TrendingUp, label: "Progressao", desc: "carga por exercicio", color: "text-blue-400 bg-blue-600/10" },
            { icon: Trophy, label: "Records", desc: "seus PRs pessoais", color: "text-amber-400 bg-amber-600/10" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 opacity-50">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", item.color.split(" ")[1])}>
                <item.icon className={cn("w-4 h-4", item.color.split(" ")[0])} />
              </div>
              <p className="text-xs font-medium text-white">{item.label}</p>
              <p className="text-[9px] text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="/today" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-[0.97]">
            <Dumbbell className="w-4 h-4" />
            Ir para o treino
          </a>
          <p className="text-[10px] text-neutral-600 mt-3">Cada treino conta. Comece hoje.</p>
        </div>
      </div>
    )
  }

  const selectedExData = selectedEx ? evo.loadProgression[selectedEx] : null

  return (
    <div className="space-y-4 pb-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center border border-red-500/10">
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Evolucao</h1>
            <p className="text-neutral-600 text-[10px]">{evo.summary.periodDays} dias de dados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-orange-300">{stats.streak}</span>
            </div>
          )}
          <button onClick={handleExportPdf} disabled={exportingPdf} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-[10px] font-medium hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-50">
            <FileDown className="w-3 h-3" />
            PDF
          </button>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        {([
          { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
          { id: "exercises" as const, label: "Exercicios", icon: Dumbbell },
          { id: "history" as const, label: "Historico", icon: Calendar },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-300",
            tab === t.id ? "bg-red-600/15 text-red-400 border border-red-500/20" : "text-neutral-500 hover:text-neutral-300"
          )}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: DASHBOARD ═══════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          {/* Performance cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard icon={Dumbbell} value={evo.summary.totalSessions} label="Sessoes" sub={`${(evo.summary.totalSessions / (evo.summary.periodDays / 7)).toFixed(1)}/sem`} color="red" />
            <StatCard icon={Flame} value={evo.summary.totalVolume} label="Volume (kg)" fmt color="orange" />
            <StatCard icon={Target} value={evo.summary.totalSets} label="Series" sub={`${(evo.summary.totalSets / Math.max(evo.summary.totalSessions, 1)).toFixed(0)}/sessao`} color="blue" />
            <StatCard icon={Clock} value={evo.summary.avgDuration || 0} label="Min/sessao" sub={stats.avgRpe ? `RPE ${stats.avgRpe}` : undefined} color="purple" />
          </div>

          {/* ═══ VOLUME CHART (Hevy-style area) ═══ */}
          <Section title="Volume por sessao" subtitle="Reps x Carga (kg)">
            <div className="px-1 pb-2 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evo.volumeTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#404040" }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 8, fill: "#404040" }} />
                  <Tooltip content={<ChartTooltip unit=" kg" />} />
                  <Area type="monotone" dataKey="volume" stroke="#ef4444" strokeWidth={2} fill="url(#volG)" dot={false} activeDot={{ r: 4, fill: "#ef4444", stroke: "#0a0a0a", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* ═══ FREQUENCY (Hevy-style bar) ═══ */}
          <Section title="Frequencia semanal" subtitle="Sessoes por semana">
            <div className="px-1 pb-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evo.weeklyFrequency.slice(-12)} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="week" tick={{ fontSize: 8, fill: "#404040" }} />
                  <YAxis tick={{ fontSize: 8, fill: "#404040" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit=" treinos" />} />
                  <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                    {evo.weeklyFrequency.slice(-12).map((e, i) => (
                      <Cell key={i} fill={e.sessions >= 4 ? "#22c55e" : e.sessions >= 2 ? "#3b82f6" : e.sessions >= 1 ? "#6366f1" : "rgba(255,255,255,0.04)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* ═══ RPE TREND ═══ */}
          {evo.rpeTrend.length > 2 && (
            <Section title="Intensidade (RPE)" subtitle="Percepcao de esforco">
              <div className="px-1 pb-2 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evo.rpeTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rpeG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#404040" }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                    <YAxis domain={[1, 10]} tick={{ fontSize: 8, fill: "#404040" }} />
                    <Tooltip content={<ChartTooltip unit="/10" />} />
                    <Area type="monotone" dataKey="rpe" stroke="#f59e0b" strokeWidth={2} fill="url(#rpeG)" dot={{ fill: "#f59e0b", r: 2.5, stroke: "#0a0a0a", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {/* ═══ BODY MAP — Muscle Distribution Visual ═══ */}
          {evo.muscleDistribution.length > 0 && (() => {
            const total = evo.muscleDistribution.reduce((a, b) => a + b.volume, 0)
            const bodyMapData = evo.muscleDistribution.map(m => ({
              muscle: m.muscle,
              volume: m.volume,
              percentage: total > 0 ? (m.volume / total) * 100 : 0,
            }))
            return (
              <Section title="Mapa corporal" subtitle="Toque para ver detalhes">
                <div className="px-3 pb-3">
                  <BodyMap data={bodyMapData} className="h-[280px]" />
                  <BodyMapLegend />

                  {/* Muscle bars below map */}
                  <div className="mt-4 space-y-1.5">
                    {evo.muscleDistribution.slice(0, 8).map((m, i) => {
                      const pct = total > 0 ? Math.round((m.volume / total) * 100) : 0
                      return (
                        <div key={m.muscle} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MUSCLE_COLORS[m.muscle] || PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-[10px] text-neutral-400 flex-1 truncate">{m.muscle}</span>
                          <div className="w-20 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: `rgba(239, 68, 68, ${0.3 + pct / 100 * 0.7})` }} />
                          </div>
                          <span className="text-[10px] text-white font-semibold w-7 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Section>
            )
          })()}

          {/* ═══ PERSONAL RECORDS ═══ */}
          {stats.prs.length > 0 && (
            <Section title="Records pessoais" subtitle="Maior carga registrada">
              <div className="px-3 pb-3 space-y-1">
                {stats.prs.slice(0, 6).map((pr, i) => (
                  <div key={pr.exerciseId} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                      i === 0 ? "bg-amber-500/15 text-amber-400" : i === 1 ? "bg-neutral-400/10 text-neutral-400" : i === 2 ? "bg-orange-800/15 text-orange-700" : "bg-white/[0.04] text-neutral-600"
                    )}>
                      {i < 3 ? <Trophy className="w-3 h-3" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{pr.exerciseName}</p>
                      <p className="text-[9px] text-neutral-600">{pr.muscle}</p>
                    </div>
                    <span className="text-sm font-black text-white">{pr.loadKg}<span className="text-[9px] text-neutral-500 font-normal ml-0.5">kg</span></span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: EXERCISES ═══════════════ */}
      {tab === "exercises" && (
        <div className="space-y-4">
          {Object.keys(evo.loadProgression).length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">Ainda nao ha dados suficientes</p>
              <p className="text-neutral-600 text-xs mt-1">Precisa de pelo menos 2 sessoes com o mesmo exercicio</p>
            </div>
          ) : (
            <>
              {/* Exercise selector */}
              <div>
                <button onClick={() => setShowExPicker(!showExPicker)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm text-white hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <Dumbbell className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate font-medium">{selectedExData?.exerciseName || "Selecionar"}</span>
                    {selectedExData && <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-500 shrink-0">{selectedExData.muscle}</span>}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-neutral-500 shrink-0 transition-transform", showExPicker && "rotate-180")} />
                </button>
                {showExPicker && (
                  <div className="mt-1.5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] overflow-hidden max-h-52 overflow-y-auto">
                    {Object.entries(evo.loadProgression).map(([id, ex]) => (
                      <button key={id} onClick={() => { setSelectedEx(id); setShowExPicker(false) }} className={cn(
                        "w-full text-left px-4 py-2.5 text-xs hover:bg-white/[0.04] transition-colors flex items-center justify-between border-b border-white/[0.03] last:border-0",
                        selectedEx === id ? "text-red-400 bg-red-600/[0.06]" : "text-neutral-300"
                      )}>
                        <span className="truncate font-medium">{ex.exerciseName}</span>
                        <span className="text-[10px] text-neutral-600 shrink-0 ml-2">{ex.data.length} sessoes</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercise detail card (Hevy-style) */}
              {selectedExData && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                  {/* Exercise stats row */}
                  <div className="grid grid-cols-4 divide-x divide-white/[0.04] border-b border-white/[0.04]">
                    <ExStat label="Sessoes" value={selectedExData.data.length.toString()} />
                    <ExStat label="Max" value={`${Math.max(...selectedExData.data.map(d => d.maxLoad))} kg`} highlight />
                    <ExStat label="Min" value={`${Math.min(...selectedExData.data.map(d => d.maxLoad))} kg`} />
                    <ExStat label="Progresso" value={(() => {
                      const first = selectedExData.data[0]?.maxLoad || 0
                      const last = selectedExData.data[selectedExData.data.length - 1]?.maxLoad || 0
                      const diff = first > 0 ? Math.round(((last - first) / first) * 100) : 0
                      return `${diff >= 0 ? "+" : ""}${diff}%`
                    })()} trend={(() => {
                      const first = selectedExData.data[0]?.maxLoad || 0
                      const last = selectedExData.data[selectedExData.data.length - 1]?.maxLoad || 0
                      return last > first ? "up" : last < first ? "down" : "flat"
                    })()} />
                  </div>

                  {/* Progression chart */}
                  <div className="px-1 py-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedExData.data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="loadG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#404040" }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 8, fill: "#404040" }} unit=" kg" />
                        <Tooltip content={<ChartTooltip unit=" kg" />} />
                        <Area type="monotone" dataKey="maxLoad" stroke="transparent" fill="url(#loadG)" />
                        <Line type="monotone" dataKey="maxLoad" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 3.5, stroke: "#0a0a0a", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#0a0a0a", strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data label */}
                  <div className="px-4 pb-3">
                    <p className="text-[10px] text-neutral-600 text-center">Progressao de carga maxima ao longo do tempo</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: HISTORY ═══════════════ */}
      {tab === "history" && (
        <div className="space-y-4">
          {/* Heatmap */}
          {stats.heatmap.length > 0 && <CalendarHeatmap heatmap={stats.heatmap} />}

          {/* Session list */}
          {history && history.sessions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium px-1">{history.total} sessoes concluidas</p>
              {history.sessions.map((s) => {
                const volume = s.sets.reduce((a, set) => a + set.reps * set.loadKg, 0)
                return (
                  <div key={s.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3.5 hover:border-white/[0.1] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/15 to-red-900/5 flex items-center justify-center text-red-400 border border-red-500/10 shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.template.name}</p>
                        <p className="text-[10px] text-neutral-500">{format(new Date(s.startedAt), "dd MMM, HH:mm", { locale: ptBR })}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/[0.03]">
                      <MiniStat icon={Target} value={`${s._count.sets}`} label="series" />
                      {s.durationMin && <MiniStat icon={Clock} value={`${s.durationMin}`} label="min" />}
                      {s.rpe && <MiniStat icon={Activity} value={`${s.rpe}`} label="RPE" />}
                      <MiniStat icon={Flame} value={`${Math.round(volume).toLocaleString("pt-BR")}`} label="kg" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">Nenhuma sessao registrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══ Sub-components ═══ */

function StatCard({ icon: Icon, value, label, sub, color, fmt }: {
  icon: typeof Dumbbell; value: number; label: string; sub?: string; color: string; fmt?: boolean
}) {
  const colors = { red: ["bg-red-600/10", "text-red-400"], orange: ["bg-orange-600/10", "text-orange-400"], blue: ["bg-blue-600/10", "text-blue-400"], purple: ["bg-purple-600/10", "text-purple-400"] }
  const [bg, text] = colors[color as keyof typeof colors] || colors.red
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3 hover:border-white/[0.1] transition-all duration-300">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", bg)}>
        <Icon className={cn("w-3.5 h-3.5", text)} />
      </div>
      <p className="text-lg font-black text-white tracking-tight">{fmt ? value.toLocaleString("pt-BR") : value}</p>
      <p className="text-[8px] text-neutral-500 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[9px] text-neutral-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="px-4 pt-3.5 pb-1.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-white/90">{title}</h3>
          {subtitle && <p className="text-[9px] text-neutral-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function ExStat({ label, value, highlight, trend }: { label: string; value: string; highlight?: boolean; trend?: "up" | "down" | "flat" }) {
  return (
    <div className="py-2.5 px-2 text-center">
      <p className="text-[8px] text-neutral-600 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-center justify-center gap-0.5">
        {trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
        {trend === "down" && <ArrowDownRight className="w-3 h-3 text-red-400" />}
        {trend === "flat" && <Minus className="w-3 h-3 text-neutral-500" />}
        <p className={cn("text-sm font-bold", highlight ? "text-amber-400" : trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white")}>{value}</p>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-neutral-500">
      <Icon className="w-3 h-3" />
      <span className="text-white font-medium">{value}</span>
      <span>{label}</span>
    </div>
  )
}

/* ═══ Calendar Heatmap ═══ */
function CalendarHeatmap({ heatmap }: { heatmap: { date: string; count: number }[] }) {
  const heatmapMap = new Map(heatmap.map((h) => [h.date, h.count]))
  const today = new Date()
  const weeks = 13
  const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 1 })
  const dayLabels = ["Seg", "", "Qua", "", "Sex", "", ""]

  const grid: { date: Date; count: number; isToday: boolean }[][] = []
  for (let w = 0; w < weeks; w++) {
    const week: typeof grid[0] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      const key = format(date, "yyyy-MM-dd")
      week.push({ date, count: heatmapMap.get(key) || 0, isToday: format(today, "yyyy-MM-dd") === key })
    }
    grid.push(week)
  }

  function getI(c: number) { return c === 0 ? "bg-white/[0.03]" : c === 1 ? "bg-red-900/40" : c === 2 ? "bg-red-700/50" : "bg-red-500/70" }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
      <h3 className="text-xs font-semibold text-white/80 mb-3">Ultimos 3 meses</h3>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1 pt-4">
          {dayLabels.map((l, i) => <div key={i} className="h-[13px] flex items-center"><span className="text-[7px] text-neutral-600 w-5">{l}</span></div>)}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-[3px]">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                <div className="h-3.5 flex items-end">
                  {week[0] && week[0].date.getDate() <= 7 && <span className="text-[7px] text-neutral-600">{format(week[0].date, "MMM", { locale: ptBR })}</span>}
                </div>
                {week.map((day, di) => (
                  <div key={di} className={cn("w-[13px] h-[13px] rounded-[3px] transition-all duration-200", getI(day.count), day.isToday && "ring-1 ring-red-500/50", "hover:scale-125")} title={`${format(day.date, "dd/MM")}: ${day.count}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[7px] text-neutral-600">Menos</span>
        {[0, 1, 2, 3].map(c => <div key={c} className={cn("w-[9px] h-[9px] rounded-sm", getI(c))} />)}
        <span className="text-[7px] text-neutral-600">Mais</span>
      </div>
    </div>
  )
}
