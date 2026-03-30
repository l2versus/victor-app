"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp, Dumbbell, Flame, Clock, BarChart3,
  ChevronDown, Trophy, Target, Zap, FileDown,
  Calendar, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, Minus,
  Ruler, Plus, Loader2, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"
import { BodyMap, BodyMapLegend } from "@/components/student/body-map"
import { EnergyBalanceCard } from "@/components/student/energy-balance-card"
import { MuscleBadge } from "@/components/student/muscle-info-card"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FadeIn } from "@/components/ui/motion"
import { ActivityHeatmap } from "@/components/ui/activity-heatmap"
import { MuscleRecoveryPanel } from "@/components/student/muscle-recovery"
import { ShieldCheck } from "lucide-react"

/* ═══ Types ═══ */
type EvolutionData = {
  weeklyFrequency: { week: string; sessions: number }[]
  loadProgression: Record<string, {
    exerciseName: string; muscle: string
    data: { date: string; maxLoad: number }[]
  }>
  rpeTrend: { date: string; rpe: number; template: string }[]
  volumeTrend: { date: string; volume: number; sets: number; template: string; duration: number | null; exercises: { name: string; muscle: string; volume: number; sets: number; maxLoad: number }[] }[]
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

type TabId = "dashboard" | "exercises" | "history" | "medidas" | "recovery"

/* ═══ 3D Anatomy Viewer — Sketchfab Embed ═══ */
function Anatomy3DViewer() {
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-white/90 flex items-center gap-2">
            Anatomia 3D
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">3D</span>
          </h3>
          <p className="text-[9px] text-neutral-600 mt-0.5">Rotacione e explore os musculos</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-all"
        >
          {expanded ? "Minimizar" : "Expandir"}
        </button>
      </div>

      <div className={cn(
        "relative w-full transition-all duration-500 overflow-hidden",
        expanded ? "h-[480px]" : "h-[300px]"
      )}>
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto animate-pulse">
                <svg className="w-6 h-6 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
              </div>
              <p className="text-[10px] text-neutral-600">Carregando modelo 3D...</p>
            </div>
          </div>
        )}

        <iframe
          title="Anatomia 3D — Musculos"
          src="https://sketchfab.com/models/33162ec759e04d2985dbbdf4ec908d66/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=1&ui_stop=0&preload=1&transparent=1&camera=0&dnt=1&ui_controls=0"
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
        {/* Overlays to cover Sketchfab branding (logo, buy, share buttons) */}
        <div className="absolute bottom-0 left-0 w-28 h-16 bg-[#0a0a0a] pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-28 h-12 bg-[#0a0a0a] pointer-events-none z-10" />
        <div className="absolute top-0 left-0 w-16 h-12 bg-[#0a0a0a] pointer-events-none z-10" />
      </div>

      {/* Hint */}
      <div className="px-4 py-2 border-t border-white/[0.04]">
        <p className="text-[9px] text-neutral-600 text-center">
          Arraste para rotacionar · Pinch para zoom · Toque nos musculos
        </p>
      </div>
    </div>
  )
}

/* ═══ Tooltip ═══ */
function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: Array<{ value: number; payload?: Record<string, unknown> }>; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as Record<string, unknown> | undefined
  const exercises = data?.exercises as Array<{ name: string; volume: number; maxLoad: number; sets: number; muscle: string }> | undefined

  return (
    <div className="rounded-xl bg-[#111]/95 backdrop-blur-xl border border-white/[0.08] px-3 py-2.5 shadow-2xl max-w-[240px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] text-neutral-500">{label}</p>
        {typeof data?.template === "string" && <p className="text-[8px] text-neutral-600 truncate">{data.template}</p>}
      </div>
      <p className="text-sm font-bold text-white">{payload[0].value.toLocaleString("pt-BR")}{unit || ""}</p>
      {exercises && exercises.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] space-y-1.5">
          {[...exercises]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 6)
            .map((ex, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] text-neutral-400 truncate flex-1">{ex.name}</span>
                <span className="text-[8px] text-white font-semibold shrink-0">{ex.volume.toLocaleString("pt-BR")} kg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] text-neutral-600">{ex.sets}s x {ex.maxLoad}kg max</span>
                <div className="flex-1 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500/60"
                    style={{ width: `${Math.min(100, (ex.volume / Math.max(...exercises.map(e => e.volume))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {exercises.length > 6 && (
            <p className="text-[7px] text-neutral-600 text-center">+{exercises.length - 6} exercícios</p>
          )}
        </div>
      )}
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
  const [volumeDetail, setVolumeDetail] = useState<number | null>(null) // index into volumeTrend
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([])
  const [heatmapLoading, setHeatmapLoading] = useState(true)

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
        // Ensure all required fields exist with defaults
        const safeEvo = {
          weeklyFrequency: e.weeklyFrequency || [],
          loadProgression: e.loadProgression || {},
          rpeTrend: e.rpeTrend || [],
          volumeTrend: (e.volumeTrend || []).map((v: Record<string, unknown>) => ({
            ...v,
            exercises: v.exercises || [],
          })),
          muscleDistribution: e.muscleDistribution || [],
          totalVolume: e.totalVolume || 0,
          totalSessions: e.totalSessions || 0,
          totalSets: e.totalSets || 0,
          avgSetsPerSession: e.avgSetsPerSession || 0,
          avgDuration: e.avgDuration || 0,
          avgRPE: e.avgRPE || 0,
          daysSinceStart: e.daysSinceStart || 0,
        }
        setEvo({ ...e, ...safeEvo } as unknown as EvolutionData)
        setStats(s)
        setHistory(h)
        const keys = Object.keys(safeEvo.loadProgression)
        if (keys.length > 0) setSelectedEx(keys[0])
      } catch { /* network error — show empty state */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Fetch heatmap data separately (non-blocking)
  useEffect(() => {
    fetch("/api/student/activity-heatmap")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.data) setHeatmapData(d.data) })
      .catch(() => {})
      .finally(() => setHeatmapLoading(false))
  }, [])

  function handleExportPdf() {
    if (!evo || !stats) return
    setExportingPdf(true)

    const esc = (s: string) => String(s).replace(/[<>&"']/g, "")
    const fmtNum = (n: number) => n.toLocaleString("pt-BR")
    const dateStr = new Date().toLocaleDateString("pt-BR")
    const totalVol = fmtNum(evo.summary.totalVolume)
    const sessPerWeek = (evo.summary.totalSessions / Math.max(evo.summary.periodDays / 7, 1)).toFixed(1)
    const setsPerSession = (evo.summary.totalSets / Math.max(evo.summary.totalSessions, 1)).toFixed(0)

    // --- PRs table ---
    const prsRows = stats.prs.slice(0, 10).map((pr, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`
      return `<tr><td style="text-align:center;width:40px">${medal}</td><td>${esc(pr.exerciseName)}</td><td class="dim">${esc(pr.muscle)}</td><td class="r bold">${pr.loadKg} kg</td><td class="dim r">${pr.date.slice(5)}</td></tr>`
    }).join("")
    const prsSection = stats.prs.length > 0
      ? `<h2>🏆 Records Pessoais</h2><table><thead><tr><th></th><th>Exercicio</th><th>Musculo</th><th class="r">Carga</th><th class="r">Data</th></tr></thead><tbody>${prsRows}</tbody></table>`
      : ""

    // --- Volume per session table ---
    const volRows = evo.volumeTrend.slice(-15).map(v => {
      const exList = (v.exercises || []).slice(0, 3).map(e => esc(e.name)).join(", ")
      return `<tr><td>${v.date.slice(5)}</td><td>${esc(v.template)}</td><td class="r bold">${fmtNum(v.volume)} kg</td><td class="r">${v.sets}s</td><td class="r">${v.duration ? `${v.duration} min` : "—"}</td><td class="dim">${exList}${(v.exercises || []).length > 3 ? "..." : ""}</td></tr>`
    }).join("")
    const volSection = evo.volumeTrend.length > 0
      ? `<h2>📊 Volume por Sessao</h2><p class="sub">Ultimas ${Math.min(15, evo.volumeTrend.length)} sessoes</p><table><thead><tr><th>Data</th><th>Treino</th><th class="r">Volume</th><th class="r">Series</th><th class="r">Duracao</th><th>Exercicios</th></tr></thead><tbody>${volRows}</tbody></table>`
      : ""

    // --- Volume bar chart (CSS bars) ---
    const maxVol = Math.max(...evo.volumeTrend.slice(-12).map(v => v.volume), 1)
    const volBars = evo.volumeTrend.slice(-12).map(v => {
      const pct = Math.round((v.volume / maxVol) * 100)
      return `<div class="bar-row"><span class="bar-label">${v.date.slice(5)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="bar-val">${fmtNum(v.volume)} kg</span></div>`
    }).join("")
    const volChart = evo.volumeTrend.length > 0
      ? `<h2>📈 Grafico de Volume</h2><div class="bar-chart">${volBars}</div>`
      : ""

    // --- Frequency chart (CSS bars) ---
    const maxFreq = Math.max(...evo.weeklyFrequency.slice(-12).map(w => w.sessions), 1)
    const freqBars = evo.weeklyFrequency.slice(-12).map(w => {
      const pct = Math.round((w.sessions / maxFreq) * 100)
      const color = w.sessions >= 4 ? "#22c55e" : w.sessions >= 2 ? "#3b82f6" : w.sessions >= 1 ? "#6366f1" : "#333"
      return `<div class="bar-row"><span class="bar-label">${w.week}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="bar-val">${w.sessions}x</span></div>`
    }).join("")
    const freqSection = evo.weeklyFrequency.length > 0
      ? `<h2>📅 Frequencia Semanal</h2><div class="bar-chart">${freqBars}</div>`
      : ""

    // --- RPE trend ---
    const rpeRows = evo.rpeTrend.slice(-15).map(r =>
      `<tr><td>${r.date.slice(5)}</td><td>${esc(r.template)}</td><td class="r bold">${r.rpe}/10</td><td class="r"><div class="rpe-bar"><div class="rpe-fill" style="width:${r.rpe * 10}%;background:${r.rpe >= 8 ? "#ef4444" : r.rpe >= 6 ? "#f59e0b" : "#22c55e"}"></div></div></td></tr>`
    ).join("")
    const rpeSection = evo.rpeTrend.length > 2
      ? `<h2>💪 Intensidade (RPE)</h2><table><thead><tr><th>Data</th><th>Treino</th><th class="r">RPE</th><th class="r" style="width:120px">Nivel</th></tr></thead><tbody>${rpeRows}</tbody></table>`
      : ""

    // --- Muscle distribution ---
    const totalMuscleVol = evo.muscleDistribution.reduce((a, b) => a + b.volume, 0)
    const maxMuscleVol = Math.max(...evo.muscleDistribution.map(m => m.volume), 1)
    const muscleRows = evo.muscleDistribution
      .sort((a, b) => b.volume - a.volume)
      .map(m => {
        const pct = totalMuscleVol > 0 ? Math.round((m.volume / totalMuscleVol) * 100) : 0
        const barPct = Math.round((m.volume / maxMuscleVol) * 100)
        return `<tr><td class="bold">${esc(m.muscle)}</td><td class="r">${fmtNum(m.volume)} kg</td><td class="r bold">${pct}%</td><td><div class="muscle-bar"><div class="muscle-fill" style="width:${barPct}%"></div></div></td></tr>`
      }).join("")
    const muscleSection = evo.muscleDistribution.length > 0
      ? `<h2>🎯 Distribuicao Muscular</h2><table><thead><tr><th>Musculo</th><th class="r">Volume</th><th class="r">%</th><th style="width:120px"></th></tr></thead><tbody>${muscleRows}</tbody></table>`
      : ""

    // --- Heatmap (calendar) ---
    const heatmapDots = stats.heatmap.slice(-60).filter(h => h.count > 0).map(h => {
      const d = new Date(h.date)
      const dayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()]
      return `<span class="heat-dot" style="opacity:${Math.min(0.3 + h.count * 0.25, 1)}">${h.date.slice(5)} (${dayName}) — ${h.count}x</span>`
    }).join("")
    const heatmapSection = stats.heatmap.length > 0
      ? `<h2>🔥 Dias de Treino (ultimos 60 dias)</h2><div class="heat-grid">${heatmapDots}</div>`
      : ""

    // --- Load progression for top exercises ---
    const topExercises = Object.entries(evo.loadProgression)
      .filter(([, ex]) => ex.data.length >= 2)
      .slice(0, 5)
    const loadSections = topExercises.map(([, ex]) => {
      const first = ex.data[0]?.maxLoad || 0
      const last = ex.data[ex.data.length - 1]?.maxLoad || 0
      const diff = first > 0 ? Math.round(((last - first) / first) * 100) : 0
      const diffStr = diff >= 0 ? `+${diff}%` : `${diff}%`
      const diffColor = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#a3a3a3"
      const maxLoad = Math.max(...ex.data.map(d => d.maxLoad), 1)
      const rows = ex.data.slice(-10).map(d => {
        const barPct = Math.round((d.maxLoad / maxLoad) * 100)
        return `<tr><td>${d.date.slice(5)}</td><td class="r bold">${d.maxLoad} kg</td><td><div class="muscle-bar"><div class="muscle-fill" style="width:${barPct}%;background:#3b82f6"></div></div></td></tr>`
      }).join("")
      return `<div class="ex-card"><div class="ex-header"><span>${esc(ex.exerciseName)}</span><span class="dim">${esc(ex.muscle)}</span><span style="color:${diffColor};font-weight:700">${diffStr}</span></div><table><thead><tr><th>Data</th><th class="r">Carga Max</th><th style="width:120px">Progresso</th></tr></thead><tbody>${rows}</tbody></table></div>`
    }).join("")
    const loadSection = topExercises.length > 0
      ? `<h2>📈 Progressão de Carga</h2><p class="sub">Top ${topExercises.length} exercícios com mais sessões</p>${loadSections}`
      : ""

    const html = [
      "<!DOCTYPE html><html><head><meta charset='utf-8'>",
      "<title>Evolucao — VO Personal</title>",
      "<style>",
      "*{margin:0;padding:0;box-sizing:border-box}",
      "body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:800px;margin:0 auto;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}",
      ".header{background:linear-gradient(135deg,#1a0000,#0d0000);border:1px solid #dc2626;border-radius:16px;padding:28px;margin-bottom:24px}",
      ".header h1{font-size:26px;color:#fff;margin-bottom:4px}",
      ".header p{color:#a3a3a3;font-size:13px}",
      ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}",
      ".card{background:#111;border:1px solid #262626;border-radius:12px;padding:18px;text-align:center}",
      ".card .val{font-size:26px;font-weight:900;color:#fff}",
      ".card .lbl{font-size:9px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.12em;margin-top:4px}",
      ".card .sub-val{font-size:10px;color:#737373;margin-top:2px}",
      "h2{font-size:15px;color:#fff;margin:28px 0 10px;padding-bottom:8px;border-bottom:1px solid #dc262640}",
      ".sub{font-size:11px;color:#737373;margin:-6px 0 12px}",
      "table{width:100%;border-collapse:collapse;background:#111;border-radius:12px;overflow:hidden;border:1px solid #262626;margin-bottom:12px}",
      "thead{background:#161616}",
      "th{padding:8px 12px;font-size:10px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;text-align:left}",
      "td{padding:8px 12px;border-top:1px solid #1a1a1a;font-size:12px;color:#d4d4d4}",
      ".r{text-align:right}",
      ".bold{font-weight:700;color:#fff}",
      ".dim{color:#737373;font-size:11px}",
      // Bar chart styles
      ".bar-chart{background:#111;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:12px}",
      ".bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}",
      ".bar-label{font-size:10px;color:#737373;width:44px;text-align:right;shrink:0}",
      ".bar-track{flex:1;height:18px;background:#1a1a1a;border-radius:4px;overflow:hidden}",
      ".bar-fill{height:100%;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:4px;transition:width 0.3s}",
      ".bar-val{font-size:10px;color:#d4d4d4;width:64px;font-weight:600}",
      // RPE inline bar
      ".rpe-bar{width:100%;height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden}",
      ".rpe-fill{height:100%;border-radius:4px}",
      // Muscle bar
      ".muscle-bar{width:100%;height:10px;background:#1a1a1a;border-radius:4px;overflow:hidden}",
      ".muscle-fill{height:100%;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:4px}",
      // Exercise card
      ".ex-card{margin-bottom:16px}",
      ".ex-header{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#161616;border:1px solid #262626;border-bottom:0;border-radius:12px 12px 0 0;font-size:13px;color:#fff;font-weight:600}",
      ".ex-card table{border-radius:0 0 12px 12px}",
      // Heatmap
      ".heat-grid{display:flex;flex-wrap:wrap;gap:6px;padding:12px;background:#111;border:1px solid #262626;border-radius:12px}",
      ".heat-dot{font-size:10px;padding:4px 8px;background:#dc262620;color:#fca5a5;border-radius:6px}",
      // Footer
      ".footer{margin-top:32px;padding-top:16px;border-top:1px solid #dc262640;color:#525252;font-size:11px;text-align:center}",
      // Print
      "@media print{body{background:#0a0a0a!important}*{color-adjust:exact!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.bar-fill,.rpe-fill,.muscle-fill{print-color-adjust:exact!important}}",
      "@page{margin:12mm;size:A4}",
      "</style></head><body>",
      // Header
      `<div class="header"><h1>Relatorio de Evolucao</h1><p>${dateStr} — Ultimos ${evo.summary.periodDays} dias</p></div>`,
      // Summary cards
      '<div class="grid">',
      `<div class="card"><div class="val">${evo.summary.totalSessions}</div><div class="lbl">Sessoes</div><div class="sub-val">${sessPerWeek}/semana</div></div>`,
      `<div class="card"><div class="val">${totalVol}</div><div class="lbl">Volume Total (kg)</div></div>`,
      `<div class="card"><div class="val">${evo.summary.totalSets}</div><div class="lbl">Series</div><div class="sub-val">${setsPerSession}/sessao</div></div>`,
      `<div class="card"><div class="val">${evo.summary.avgDuration || "—"}<span style="font-size:14px;color:#737373"> min</span></div><div class="lbl">Duracao Media</div>${stats.avgRpe ? `<div class="sub-val">RPE medio: ${stats.avgRpe}</div>` : ""}</div>`,
      "</div>",
      // Sections
      volChart,
      volSection,
      freqSection,
      rpeSection,
      muscleSection,
      prsSection,
      loadSection,
      heatmapSection,
      // Footer
      '<div class="footer">Gerado pelo Victor App — VO Personal • CREF 016254-G/CE</div>',
      "</body></html>",
    ].join("\n")

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, "_blank")

    setTimeout(() => {
      URL.revokeObjectURL(url)
      setExportingPdf(false)
    }, 1000)

    if (!win) {
      const a = document.createElement("a")
      a.href = url
      a.download = "evolucao-vo-personal.html"
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        setExportingPdf(false)
      }, 500)
    }
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
          { id: "recovery" as const, label: "Recuperação", icon: ShieldCheck },
          { id: "exercises" as const, label: "Exercicios", icon: Dumbbell },
          { id: "medidas" as const, label: "Medidas", icon: Ruler },
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

          {/* ═══ ENERGY BALANCE ═══ */}
          <EnergyBalanceCard />

          {/* ═══ VOLUME CHART (Hevy-style area) ═══ */}
          <Section title="Volume por sessao" subtitle="Toque no ponto para ver detalhes">
            <div className="px-1 pb-2 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={evo.volumeTrend}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  onClick={(e) => {
                    if (volumeDetail !== null) return // modal already open, ignore chart clicks
                    if (e?.activeTooltipIndex != null) setVolumeDetail(Number(e.activeTooltipIndex))
                  }}
                >
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
                  <Area
                    type={evo.volumeTrend.length > 1 ? "monotone" : "linear"}
                    dataKey="volume"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#volG)"
                    dot={evo.volumeTrend.length === 1 ? { r: 5, fill: "#ef4444", stroke: "#0a0a0a", strokeWidth: 2 } : false}
                    activeDot={evo.volumeTrend.length > 1 ? { r: 4, fill: "#ef4444", stroke: "#0a0a0a", strokeWidth: 2 } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* ═══ VOLUME DETAIL MODAL ═══ */}
          {volumeDetail !== null && evo.volumeTrend[volumeDetail] && (() => {
            const session = evo.volumeTrend[volumeDetail]
            const exercises = session.exercises || []
            return (
              <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setVolumeDetail(null)}>
                <div
                  className="w-full max-w-lg rounded-t-3xl bg-[#0c0c0c] border-t border-white/[0.08] p-5 pb-8 max-h-[75dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle */}
                  <div className="w-10 h-1 rounded-full bg-white/[0.1] mx-auto mb-4" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">{session.template}</h3>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{session.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{session.volume.toLocaleString("pt-BR")}<span className="text-xs text-neutral-500 ml-1">kg</span></p>
                      <p className="text-[9px] text-neutral-600">{session.sets} series · {session.duration ? `${session.duration} min` : "—"}</p>
                    </div>
                  </div>

                  {/* Exercises breakdown */}
                  {exercises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium">Detalhes por exercicio</p>
                      {[...exercises].sort((a, b) => b.volume - a.volume).map((ex, i) => {
                        const maxVol = Math.max(...exercises.map(e => e.volume), 1)
                        return (
                          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-white font-medium truncate">{ex.name}</span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-500 shrink-0">{ex.muscle}</span>
                              </div>
                              <span className="text-xs font-bold text-white shrink-0 ml-2">{ex.volume.toLocaleString("pt-BR")} kg</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-500/70"
                                  style={{ width: `${Math.min(100, (ex.volume / maxVol) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-neutral-600 shrink-0">{ex.sets}s · {ex.maxLoad}kg max</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={() => setVolumeDetail(null)}
                    className="w-full mt-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-sm font-medium hover:bg-white/[0.06] transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ═══ PR PROGRESS — How close to beating PRs ═══ */}
          {stats.prs.length > 0 && evo.volumeTrend.length > 0 && (() => {
            // Build current max load per exercise from the last 3 sessions
            const recentSessions = evo.volumeTrend.slice(-3)
            const currentMaxByExercise = new Map<string, { name: string; currentMax: number }>()
            for (const session of recentSessions) {
              for (const ex of (session.exercises || [])) {
                const existing = currentMaxByExercise.get(ex.name)
                if (!existing || ex.maxLoad > existing.currentMax) {
                  currentMaxByExercise.set(ex.name, { name: ex.name, currentMax: ex.maxLoad })
                }
              }
            }

            // Match against PRs
            const prProgress = stats.prs
              .map((pr) => {
                const current = currentMaxByExercise.get(pr.exerciseName)
                if (!current) return null
                const pctOfPr = pr.loadKg > 0 ? Math.round((current.currentMax / pr.loadKg) * 100) : (current.currentMax > 0 ? 100 : 0)
                const diff = pr.loadKg - current.currentMax
                const goalPlus5 = pr.loadKg + 5
                const diffToGoal = goalPlus5 - current.currentMax
                return {
                  name: pr.exerciseName,
                  muscle: pr.muscle,
                  pr: pr.loadKg,
                  current: current.currentMax,
                  pctOfPr: Math.min(pctOfPr, 100),
                  diff,
                  goalPlus5,
                  diffToGoal,
                  isAtPr: diff <= 0,
                }
              })
              .filter(Boolean) as Array<{
                name: string; muscle: string; pr: number; current: number
                pctOfPr: number; diff: number; goalPlus5: number; diffToGoal: number; isAtPr: boolean
              }>

            if (prProgress.length === 0) return null

            return (
              <Section title="Progresso para o PR" subtitle="Baseado nas ultimas 3 sessoes">
                <div className="px-3 pb-3 space-y-2.5">
                  {prProgress.slice(0, 5).map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] text-white font-medium truncate">{item.name}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-600 shrink-0">{item.muscle}</span>
                        </div>
                        <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: item.isAtPr ? "#22c55e" : item.pctOfPr >= 90 ? "#f59e0b" : "#ef4444" }}>
                          {item.isAtPr ? "No PR!" : `Falta ${item.diff}kg (${100 - item.pctOfPr}%)`}
                        </span>
                      </div>
                      {/* Progress bar to PR */}
                      <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.pctOfPr}%`,
                            background: item.isAtPr
                              ? "linear-gradient(90deg, #22c55e, #16a34a)"
                              : item.pctOfPr >= 90
                              ? "linear-gradient(90deg, #f59e0b, #d97706)"
                              : "linear-gradient(90deg, #ef4444, #dc2626)",
                          }}
                        />
                      </div>
                      {/* Labels row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-neutral-600">Atual: {item.current}kg</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-neutral-500">PR: {item.pr}kg</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">
                            Meta +5kg: {item.goalPlus5}kg {!item.isAtPr ? "" : `(falta ${item.diffToGoal}kg)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )
          })()}

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

          {/* ═══ 3D ANATOMY VIEWER — Sketchfab embed ═══ */}
          <Anatomy3DViewer />

          {/* ═══ BODY MAP — Muscle Distribution Visual ═══ */}
          {evo.muscleDistribution.length > 0 && (() => {
            const total = evo.muscleDistribution.reduce((a, b) => a + b.volume, 0)
            const bodyMapData = evo.muscleDistribution.map(m => ({
              muscle: m.muscle,
              volume: m.volume,
              percentage: total > 0 ? (m.volume / total) * 100 : 0,
            }))
            return (
              <Section title="Seus musculos treinados" subtitle="Toque para ver detalhes">
                <div className="px-3 pb-3">
                  <BodyMap data={bodyMapData} className="h-[280px]" />
                  <BodyMapLegend />

                  {/* Muscle badges below map — tap for educational info */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[9px] text-neutral-600 uppercase tracking-wider">Toque no musculo para saber mais</p>
                    <div className="flex flex-wrap gap-1.5">
                      {evo.muscleDistribution.slice(0, 8).map((m) => {
                        const pct = total > 0 ? Math.round((m.volume / total) * 100) : 0
                        return (
                          <div key={m.muscle} className="flex items-center gap-1">
                            <MuscleBadge muscle={m.muscle} />
                            <span className="text-[9px] text-neutral-600 font-medium">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Section>
            )
          })()}

          {/* ═══ RADAR — Muscle Distribution ═══ */}
          {evo.muscleDistribution.length > 0 && (() => {
            const totalVol = evo.muscleDistribution.reduce((a, b) => a + b.volume, 0)
            const radarData = evo.muscleDistribution.map(m => ({
              muscle: m.muscle,
              value: totalVol > 0 ? Math.round((m.volume / totalVol) * 100) : 0,
            }))
            return (
              <FadeIn delay={0.15}>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Distribuição Muscular</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="muscle" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name="Volume" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-neutral-600 text-center mt-2">% de séries por grupo muscular</p>
                </div>
              </FadeIn>
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

          {/* ═══ ACTIVITY HEATMAP ═══ */}
          <Section title="Frequencia de Treino" subtitle="Atividade dos ultimos meses">
            <div className="px-4 pb-3.5 pt-1">
              {heatmapLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                </div>
              ) : (
                <ActivityHeatmap data={heatmapData} />
              )}
            </div>
          </Section>
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

              {/* ═══ Progressao por Exercicio (endpoint dedicado) ═══ */}
              <ExerciseProgressionSection />
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

      {/* ═══════════════ TAB: RECUPERAÇÃO ═══════════════ */}
      {tab === "recovery" && <MuscleRecoveryPanel />}

      {/* ═══════════════ TAB: MEDIDAS ═══════════════ */}
      {tab === "medidas" && <MedidasTab />}
    </div>
  )
}

/* ═══ Medidas Corporais Tab ═══ */

type MeasurementEntry = {
  id: string; createdAt: string; weight: number | null; bodyFat: number | null
  neck: number | null; chest: number | null; shoulders: number | null
  leftBicep: number | null; rightBicep: number | null; waist: number | null
  abdomen: number | null; hips: number | null; leftThigh: number | null
  rightThigh: number | null; leftCalf: number | null; rightCalf: number | null
  notes: string | null
}

const MEASURE_FIELDS = [
  { key: "weight", label: "Peso", unit: "kg", emoji: "⚖️" },
  { key: "bodyFat", label: "Gordura", unit: "%", emoji: "📊" },
  { key: "neck", label: "Pescoço", unit: "cm", emoji: "📏" },
  { key: "chest", label: "Peitoral", unit: "cm", emoji: "📏" },
  { key: "shoulders", label: "Ombros", unit: "cm", emoji: "📏" },
  { key: "leftBicep", label: "Bíceps E", unit: "cm", emoji: "💪" },
  { key: "rightBicep", label: "Bíceps D", unit: "cm", emoji: "💪" },
  { key: "waist", label: "Cintura", unit: "cm", emoji: "📏" },
  { key: "abdomen", label: "Abdômen", unit: "cm", emoji: "📏" },
  { key: "hips", label: "Quadril", unit: "cm", emoji: "📏" },
  { key: "leftThigh", label: "Coxa E", unit: "cm", emoji: "🦵" },
  { key: "rightThigh", label: "Coxa D", unit: "cm", emoji: "🦵" },
  { key: "leftCalf", label: "Pant. E", unit: "cm", emoji: "🦵" },
  { key: "rightCalf", label: "Pant. D", unit: "cm", emoji: "🦵" },
] as const

function MedidasTab() {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchMeasurements()
  }, [])

  async function fetchMeasurements() {
    try {
      const res = await fetch("/api/student/measurements")
      if (res.ok) {
        const data = await res.json()
        setMeasurements(data.measurements || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const payload: Record<string, string | number | null> = { notes: notes || null }
      for (const f of MEASURE_FIELDS) {
        payload[f.key] = formData[f.key] || null
      }
      const res = await fetch("/api/student/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({})
        setNotes("")
        fetchMeasurements()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta medição?")) return
    await fetch("/api/student/measurements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchMeasurements()
  }

  // Calculate diff between latest and previous
  function getDiff(key: string): { value: number; diff: number | null } | null {
    if (measurements.length === 0) return null
    const latest = measurements[0][key as keyof MeasurementEntry] as number | null
    if (latest === null) return null
    const prev = measurements.length > 1 ? (measurements[1][key as keyof MeasurementEntry] as number | null) : null
    return { value: latest, diff: prev !== null ? Math.round((latest - prev) * 10) / 10 : null }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">{measurements.length} medições registradas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova medição
        </button>
      </div>

      {/* New measurement form */}
      {showForm && (
        <div className="rounded-2xl border border-red-500/20 bg-red-600/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Registrar medidas</p>
          <p className="text-[10px] text-neutral-500">Preencha o que souber — não precisa preencher tudo</p>

          <div className="grid grid-cols-2 gap-2.5">
            {MEASURE_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-2">
                <span className="text-xs">{f.emoji}</span>
                <div className="flex-1">
                  <label className="text-[9px] text-neutral-500 uppercase tracking-wider">{f.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData[f.key] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".")
                        if (v === "" || /^\d{0,3}\.?\d{0,1}$/.test(v)) {
                          setFormData(prev => ({ ...prev, [f.key]: v }))
                        }
                      }}
                      placeholder="—"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white placeholder-neutral-700 text-center focus:outline-none focus:border-red-500/50"
                    />
                    <span className="text-[9px] text-neutral-600 w-5">{f.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-[9px] text-neutral-500 uppercase tracking-wider">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="Ex: em jejum, pós-treino..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-red-500/50 mt-1"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-sm">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Latest measurements summary — diff cards */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {MEASURE_FIELDS.map((f) => {
            const data = getDiff(f.key)
            if (!data) return null
            return (
              <div key={f.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                <p className="text-[8px] text-neutral-500 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{data.value} <span className="text-[9px] text-neutral-500 font-normal">{f.unit}</span></p>
                {data.diff !== null && data.diff !== 0 && (
                  <p className={cn("text-[10px] font-semibold mt-0.5 flex items-center gap-0.5",
                    // For weight/bodyFat/waist/abdomen: negative = good (green). For arms/chest: positive = good
                    ["weight", "bodyFat", "waist", "abdomen"].includes(f.key)
                      ? data.diff < 0 ? "text-green-400" : "text-red-400"
                      : data.diff > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {data.diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {data.diff > 0 ? "+" : ""}{data.diff} {f.unit}
                  </p>
                )}
                {data.diff === 0 && <p className="text-[10px] text-neutral-600 mt-0.5 flex items-center gap-0.5"><Minus className="w-3 h-3" /> Igual</p>}
              </div>
            )
          }).filter(Boolean)}
        </div>
      )}

      {/* Evolution chart — waist, bicep, weight over time */}
      {measurements.length >= 2 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h3 className="text-xs font-semibold text-white/90 mb-3">Evolução</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[...measurements].reverse().map(m => ({
              date: format(new Date(m.createdAt), "dd/MM", { locale: ptBR }),
              Peso: m.weight,
              Cintura: m.waist,
              "Bíceps D": m.rightBicep,
              Peitoral: m.chest,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 9 }} />
              <YAxis tick={{ fill: "#525252", fontSize: 9 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }}
                labelStyle={{ color: "#999" }}
              />
              <Line type="monotone" dataKey="Peso" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Cintura" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Bíceps D" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Peitoral" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[
              { label: "Peso", color: "#ef4444" },
              { label: "Cintura", color: "#f97316" },
              { label: "Bíceps D", color: "#3b82f6" },
              { label: "Peitoral", color: "#22c55e" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[9px] text-neutral-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Measurement history */}
      {measurements.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium px-1">Histórico</p>
          {measurements.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white">
                  {format(new Date(m.createdAt), "dd MMM yyyy", { locale: ptBR })}
                </p>
                <button onClick={() => handleDelete(m.id)} className="text-neutral-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                {MEASURE_FIELDS.map(f => {
                  const val = m[f.key as keyof MeasurementEntry] as number | null
                  if (val === null) return null
                  return (
                    <div key={f.key} className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">{f.label}</span>
                      <span className="text-[11px] text-white font-medium">{val} {f.unit}</span>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
              {m.notes && <p className="text-[10px] text-neutral-500 mt-2 italic">{m.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {measurements.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Ruler className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm font-medium">Nenhuma medida registrada</p>
          <p className="text-neutral-600 text-xs mt-1">Registre suas medidas para acompanhar sua evolução</p>
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

/* ═══ Exercise Progression Section (dedicated endpoint) ═══ */

type ExProgressData = {
  date: string
  maxLoad: number
  totalVolume: number
  sets: number
}

type ExOption = { id: string; name: string; muscle: string }

function ExerciseProgressionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload: ExProgressData }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="rounded-xl bg-[#111]/95 backdrop-blur-xl border border-white/[0.08] px-3 py-2.5 shadow-2xl">
      <p className="text-[9px] text-neutral-500 mb-1">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-neutral-400">Carga max</span>
          <span className="text-xs font-bold text-red-400">{d.maxLoad} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-neutral-400">Volume</span>
          <span className="text-xs font-bold text-white">{d.totalVolume.toLocaleString("pt-BR")} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-neutral-400">Series</span>
          <span className="text-xs font-bold text-neutral-300">{d.sets}</span>
        </div>
      </div>
    </div>
  )
}

function ExerciseProgressionSection() {
  const [exercises, setExercises] = useState<ExOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ExProgressData[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Load exercise list on mount
  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetch("/api/student/exercise-progress?exerciseId=__list__")
        if (!res.ok) return
        const data = await res.json()
        setExercises(data.exercises || [])
        if (data.exercises?.length > 0) {
          setSelectedId(data.exercises[0].id)
        }
      } catch { /* ignore */ }
      finally { setInitialLoad(false) }
    }
    loadList()
  }, [])

  // Load progress data when exercise changes
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    async function loadProgress() {
      try {
        const res = await fetch(`/api/student/exercise-progress?exerciseId=${selectedId}`)
        if (!res.ok) return
        const data = await res.json()
        setProgress(data.progress || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    loadProgress()
  }, [selectedId])

  const selected = exercises.find((e) => e.id === selectedId)

  if (initialLoad) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-600 animate-spin" />
      </div>
    )
  }

  if (exercises.length === 0) return null

  // Stats
  const maxLoad = progress.length > 0 ? Math.max(...progress.map((d) => d.maxLoad)) : 0
  const firstLoad = progress[0]?.maxLoad || 0
  const lastLoad = progress[progress.length - 1]?.maxLoad || 0
  const progressPct = firstLoad > 0 ? Math.round(((lastLoad - firstLoad) / firstLoad) * 100) : 0

  return (
    <FadeIn direction="up" delay={0.1}>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3.5 pb-1.5">
          <h3 className="text-xs font-semibold text-white/90 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            Progressao por Exercicio
          </h3>
          <p className="text-[9px] text-neutral-600 mt-0.5">Evolucao detalhada de carga e volume</p>
        </div>

        {/* Exercise selector */}
        <div className="px-4 py-2">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Dumbbell className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate font-medium text-xs">{selected?.name || "Selecionar exercicio"}</span>
              {selected && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-500 shrink-0">
                  {selected.muscle}
                </span>
              )}
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-500 shrink-0 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="mt-1.5 rounded-xl bg-[#0c0c0c] border border-white/[0.08] overflow-hidden max-h-48 overflow-y-auto">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => { setSelectedId(ex.id); setOpen(false) }}
                  className={cn(
                    "w-full text-left px-3.5 py-2 text-xs hover:bg-white/[0.04] transition-colors flex items-center justify-between border-b border-white/[0.03] last:border-0",
                    selectedId === ex.id ? "text-red-400 bg-red-600/[0.06]" : "text-neutral-300",
                  )}
                >
                  <span className="truncate font-medium">{ex.name}</span>
                  <span className="text-[9px] text-neutral-600 shrink-0 ml-2">{ex.muscle}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-4 py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-neutral-600 animate-spin" />
          </div>
        )}

        {/* Chart + stats */}
        {!loading && progress.length >= 2 && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-t border-white/[0.04]">
              <ExStat label="Max" value={`${maxLoad} kg`} highlight />
              <ExStat label="Sessoes" value={progress.length.toString()} />
              <ExStat
                label="Progresso"
                value={`${progressPct >= 0 ? "+" : ""}${progressPct}%`}
                trend={lastLoad > firstLoad ? "up" : lastLoad < firstLoad ? "down" : "flat"}
              />
            </div>

            {/* Line chart */}
            <div className="px-1 py-2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="progLoadG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8, fill: "#404040" }}
                    tickFormatter={(v: string) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 8, fill: "#404040" }} unit=" kg" />
                  <Tooltip content={<ExerciseProgressionTooltip />} />
                  <Area type="monotone" dataKey="maxLoad" stroke="transparent" fill="url(#progLoadG)" />
                  <Line
                    type="monotone"
                    dataKey="maxLoad"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ fill: "#dc2626", r: 3.5, stroke: "#0a0a0a", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#dc2626", stroke: "#0a0a0a", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Label */}
            <div className="px-4 pb-3">
              <p className="text-[10px] text-neutral-600 text-center">
                Carga maxima (kg) por sessao ao longo do tempo
              </p>
            </div>
          </>
        )}

        {/* Not enough data */}
        {!loading && progress.length < 2 && progress.length > 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-neutral-500 text-xs">Precisa de pelo menos 2 sessoes para mostrar o grafico</p>
          </div>
        )}

        {!loading && progress.length === 0 && selectedId && (
          <div className="px-4 py-6 text-center">
            <p className="text-neutral-500 text-xs">Nenhum dado encontrado para este exercicio</p>
          </div>
        )}
      </div>
    </FadeIn>
  )
}
