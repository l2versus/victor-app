"use client"

import { useState, useEffect, useRef } from "react"
import {
  Users, UserCheck, UserX, UserMinus, Dumbbell, Clock,
  Calendar, CalendarCheck, CalendarX, TrendingUp, AlertTriangle,
  RefreshCw, Sunrise, Sun, Moon, BarChart3, Target, CreditCard,
  ChevronRight, Eye, Info, Activity, Heart, Zap, Star,
  ArrowUpRight, Shield, Flame, Award, Timer, X,
  MessageCircle, TrendingDown, Percent, Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

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

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const DAY_FULL = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"]
const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ═══════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const diff = value - start
    if (Math.abs(diff) < 0.5) { setDisplay(value); return }
    const duration = 700
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{display}{suffix || ""}</>
}

// ═══════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-[10px] text-neutral-300 whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-neutral-900" />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════

function DetailModal({ open, onClose, title, icon: Icon, iconColor, children, maxWidth = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; icon: typeof Users; iconColor: string; children: React.ReactNode; maxWidth?: string
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = "" }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        maxWidth
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", iconColor)}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// HEALTH SCORE RING
// ═══════════════════════════════════════

function HealthScoreRing({ score, label }: { score: number; label: string }) {
  const [mounted, setMounted] = useState(false)
  const radius = 52
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference

  useEffect(() => { const t = setTimeout(() => setMounted(true), 300); return () => clearTimeout(t) }, [])

  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"
  const statusLabel = score >= 75 ? "Excelente" : score >= 50 ? "Atencao" : "Critico"

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[130px] h-[130px] shrink-0">
        <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
          <circle
            cx="65" cy="65" r={radius} fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${mounted ? filled : 0} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-white">{mounted ? score : 0}</p>
          <p className="text-[9px] text-neutral-500 uppercase">{statusLabel}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-[10px] text-neutral-500 mt-0.5">Baseado em atividade, retencao e engajamento dos alunos</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// RADIAL TIME CHART
// ═══════════════════════════════════════

function RadialTimeChart({ morning, afternoon, evening, totalSessions }: {
  morning: number; afternoon: number; evening: number; totalSessions: number
}) {
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const radius = 55
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  const segments = [
    { key: "morning", pct: morning, color: "#eab308", label: "Manha", icon: Sunrise },
    { key: "afternoon", pct: afternoon, color: "#f97316", label: "Tarde", icon: Sun },
    { key: "evening", pct: evening, color: "#a855f7", label: "Noite", icon: Moon },
  ]

  let currentOffset = 0

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[150px] h-[150px] shrink-0">
        <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
          {segments.map(seg => {
            const segmentLength = (seg.pct / 100) * circumference
            const offset = currentOffset
            currentOffset += segmentLength
            return (
              <circle
                key={seg.key}
                cx="75" cy="75" r={radius}
                fill="none"
                stroke={hovered === seg.key ? seg.color : `${seg.color}bb`}
                strokeWidth={hovered === seg.key ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${mounted ? segmentLength : 0} ${circumference - (mounted ? segmentLength : 0)}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setHovered(seg.key)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-white">{totalSessions}</p>
          <p className="text-[9px] text-neutral-500">treinos</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {segments.map(seg => (
          <button
            key={seg.key}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left",
              hovered === seg.key ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
            )}
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <seg.icon className="w-5 h-5" style={{ color: seg.color }} />
            <span className="text-xs text-neutral-400 flex-1">{seg.label}</span>
            <span className="text-sm font-bold" style={{ color: seg.color }}>{seg.pct}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// ANIMATED BAR CHART (Days)
// ═══════════════════════════════════════

function AnimatedDayChart({ data, onBarClick }: {
  data: number[]
  onBarClick?: (dayIndex: number) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const maxVal = Math.max(...data, 1)
  const totalSessions = data.reduce((a, b) => a + b, 0)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  const peakDay = data.indexOf(Math.max(...data))

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-36 relative">
        {data.map((count, i) => {
          const pct = totalSessions > 0 ? ((count / totalSessions) * 100).toFixed(0) : "0"
          const isPeak = i === peakDay && count > 0
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 relative cursor-pointer group"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={() => onBarClick?.(i)}
            >
              {/* Tooltip */}
              {hoveredBar === i && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150 min-w-[120px]">
                  <p className="text-[10px] text-neutral-400 font-medium">{DAY_FULL[i]}</p>
                  <p className="text-sm font-bold text-white">{count} treinos</p>
                  <p className="text-[9px] text-neutral-500">{pct}% do total</p>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 border-r border-b border-white/10 rotate-45" />
                </div>
              )}

              {/* Count above bar */}
              <span className={cn(
                "text-[10px] font-semibold transition-colors",
                hoveredBar === i ? "text-white" : "text-neutral-600"
              )}>{count}</span>

              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-500 ease-out relative",
                  isPeak ? "bg-gradient-to-t from-emerald-600 to-emerald-400" :
                  i === 0 ? (hoveredBar === i ? "bg-red-400/80" : "bg-red-500/50") :
                  hoveredBar === i ? "bg-blue-400/70" : "bg-blue-500/35"
                )}
                style={{
                  height: mounted ? `${Math.max((count / maxVal) * 100, count > 0 ? 8 : 3)}%` : "3%",
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {isPeak && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Day label */}
              <span className={cn(
                "text-[10px] transition-colors font-medium",
                i === 0 ? "text-red-400" :
                isPeak ? "text-emerald-400" :
                hoveredBar === i ? "text-white" : "text-neutral-500"
              )}>{DAY_LABELS[i]}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-neutral-600 text-center">Passe o mouse para ver detalhes · Dia com coroa = dia mais popular</p>
    </div>
  )
}

// ═══════════════════════════════════════
// INTERACTIVE METRIC CARD
// ═══════════════════════════════════════

function MetricCard({ icon: Icon, label, value, color, suffix, highlight, onClick, tooltip, badge }: {
  icon: typeof Users; label: string; value: number; color: "blue" | "green" | "red" | "yellow"; suffix?: string;
  highlight?: boolean; onClick?: () => void; tooltip?: string; badge?: string
}) {
  const colorMap = {
    blue: { text: "text-white", icon: "text-blue-400", border: "", glow: "hover:shadow-blue-500/10", bg: "bg-blue-500/10 border-blue-500/20" },
    green: { text: "text-white", icon: "text-green-400", border: "", glow: "hover:shadow-green-500/10", bg: "bg-green-500/10 border-green-500/20" },
    red: {
      text: highlight ? "text-red-400" : "text-white",
      icon: "text-red-400",
      border: highlight && value > 0 ? "border-red-500/20" : "",
      glow: "hover:shadow-red-500/10",
      bg: "bg-red-500/10 border-red-500/20",
    },
    yellow: {
      text: highlight ? "text-yellow-400" : "text-white",
      icon: "text-yellow-400",
      border: highlight && value > 0 ? "border-yellow-500/20" : "",
      glow: "hover:shadow-yellow-500/10",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
  }
  const c = colorMap[color]

  const content = (
    <div className={cn(
      "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center space-y-1 transition-all duration-300 group relative",
      c.border,
      onClick && `hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg ${c.glow} cursor-pointer active:scale-[0.98]`,
      highlight && value > 0 && "animate-pulse-subtle"
    )}>
      {/* Badge */}
      {badge && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[8px] font-bold z-10">
          {badge}
        </div>
      )}

      <div className="flex justify-center mb-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110", c.bg)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className={cn("text-2xl font-bold", c.text)}>
        <AnimatedNumber value={value} suffix={suffix ? ` ${suffix}` : undefined} />
      </p>

      {onClick && (
        <div className="flex items-center justify-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] text-neutral-500">Ver detalhes</span>
          <ChevronRight className="w-2.5 h-2.5 text-neutral-600" />
        </div>
      )}
    </div>
  )

  if (tooltip) {
    return (
      <Tooltip text={tooltip}>
        {onClick ? <button onClick={onClick} className="w-full text-left">{content}</button> : content}
      </Tooltip>
    )
  }

  return onClick ? <button onClick={onClick} className="w-full text-left">{content}</button> : content
}

// ═══════════════════════════════════════
// INSIGHT CARD
// ═══════════════════════════════════════

function InsightCard({ icon: Icon, text, type, action, actionLabel }: {
  icon: typeof Zap; text: string; type: "success" | "warning" | "danger" | "info"
  action?: () => void; actionLabel?: string
}) {
  const styles = {
    success: "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-300",
    warning: "border-amber-500/15 bg-amber-500/[0.04] text-amber-300",
    danger: "border-red-500/15 bg-red-500/[0.04] text-red-300",
    info: "border-blue-500/15 bg-blue-500/[0.04] text-blue-300",
  }
  const iconStyles = {
    success: "text-emerald-400 bg-emerald-500/15",
    warning: "text-amber-400 bg-amber-500/15",
    danger: "text-red-400 bg-red-500/15",
    info: "text-blue-400 bg-blue-500/15",
  }

  return (
    <div className={cn("rounded-xl border p-3 flex items-center gap-3 transition-all hover:scale-[1.01]", styles[type])}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconStyles[type])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs flex-1">{text}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white text-[10px] font-medium hover:bg-white/[0.1] transition-all shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════

function ProgressBar({ value, max, color, label, showPct = true }: {
  value: number; max: number; color: string; label?: string; showPct?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const pct = max > 0 ? (value / max) * 100 : 0
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-neutral-500">{label}</span>
          {showPct && <span className="text-[10px] font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: mounted ? `${Math.min(pct, 100)}%` : "0%", backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export function BiTreinoClient() {
  const [data, setData] = useState<BiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [modalAlunos, setModalAlunos] = useState(false)
  const [modalTreinos, setModalTreinos] = useState(false)
  const [modalPagamentos, setModalPagamentos] = useState(false)
  const [modalSessions, setModalSessions] = useState(false)
  const [modalDayDetail, setModalDayDetail] = useState<number | null>(null)

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/admin/bi-treino")
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchData() }, [])

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 animate-pulse">Analisando dados de treino...</p>
      </div>
    )
  }

  // ═══ CALCULATE HEALTH SCORE ═══
  const retentionRate = data.students.total > 0 ? (data.students.active / data.students.total) * 100 : 0
  const engagementRate = data.students.active > 0 ? (data.students.trainedThisMonth / data.students.active) * 100 : 0
  const planCoverage = data.students.active > 0 ? (data.students.withPlan / data.students.active) * 100 : 0
  const upToDateRate = data.students.active > 0 ? (data.students.upToDate / data.students.active) * 100 : 0

  const healthScore = Math.round(
    (retentionRate * 0.3) + (engagementRate * 0.3) + (planCoverage * 0.2) + (upToDateRate * 0.2)
  )

  // ═══ GENERATE INSIGHTS ═══
  const insights: { icon: typeof Zap; text: string; type: "success" | "warning" | "danger" | "info"; action?: () => void; actionLabel?: string }[] = []

  if (data.students.withoutPlan > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${data.students.withoutPlan} aluno${data.students.withoutPlan > 1 ? "s" : ""} ativo${data.students.withoutPlan > 1 ? "s" : ""} sem ficha de treino — podem perder motivacao`,
      type: "danger",
      action: () => setModalTreinos(true),
      actionLabel: "Ver quem",
    })
  }
  if (data.students.notFollowed > 0) {
    insights.push({
      icon: UserMinus,
      text: `${data.students.notFollowed} aluno${data.students.notFollowed > 1 ? "s" : ""} nao treinou nos ultimos 30 dias`,
      type: "warning",
      action: () => setModalAlunos(true),
      actionLabel: "Detalhes",
    })
  }
  if (data.plans.expired > 0) {
    insights.push({
      icon: CalendarX,
      text: `${data.plans.expired} assinatura${data.plans.expired > 1 ? "s" : ""} expirada${data.plans.expired > 1 ? "s" : ""} — alunos podem estar sem acesso`,
      type: "danger",
    })
  }
  if (data.plans.expiringSoon > 0) {
    insights.push({
      icon: Clock,
      text: `${data.plans.expiringSoon} contrato${data.plans.expiringSoon > 1 ? "s" : ""} expirando nos proximos 7 dias`,
      type: "warning",
    })
  }
  if (data.payments.pendingCount > 0) {
    insights.push({
      icon: CreditCard,
      text: `R$ ${fmt(data.payments.pendingTotal)} em pagamentos pendentes (${data.payments.pendingCount})`,
      type: "warning",
      action: () => setModalPagamentos(true),
      actionLabel: "Ver",
    })
  }
  if (data.plans.recentlyRenewed > 0) {
    insights.push({
      icon: Star,
      text: `${data.plans.recentlyRenewed} renovacao${data.plans.recentlyRenewed > 1 ? "es" : ""} nos ultimos 30 dias!`,
      type: "success",
    })
  }
  if (engagementRate >= 80) {
    insights.push({
      icon: Flame,
      text: `${engagementRate.toFixed(0)}% dos alunos treinaram este mes — excelente engajamento!`,
      type: "success",
    })
  }

  const totalDaySessions = data.charts.dayOfWeek.reduce((a, b) => a + b, 0)
  const peakDayIndex = data.charts.dayOfWeek.indexOf(Math.max(...data.charts.dayOfWeek))

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Business Intelligence
          </h1>
          <p className="text-[10px] text-neutral-600 mt-1">
            Ultima atualizacao: {new Date(data.updatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs hover:text-white hover:bg-white/[0.08] transition-all min-h-[44px]",
            refreshing && "opacity-50"
          )}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* ═══ HEALTH SCORE + QUICK STATS ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <HealthScoreRing score={healthScore} label="Saude do Negocio" />
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
              <p className="text-[9px] text-emerald-400/60 uppercase font-medium">Retencao</p>
              <p className="text-lg font-black text-emerald-400">{retentionRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
              <p className="text-[9px] text-blue-400/60 uppercase font-medium">Engajamento</p>
              <p className="text-lg font-black text-blue-400">{engagementRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
              <p className="text-[9px] text-amber-400/60 uppercase font-medium">Com Ficha</p>
              <p className="text-lg font-black text-amber-400">{planCoverage.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
              <p className="text-[9px] text-purple-400/60 uppercase font-medium">Em dia</p>
              <p className="text-lg font-black text-purple-400">{upToDateRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ INSIGHTS ═══ */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Insights & Alertas
          </h3>
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} />
          ))}
        </div>
      )}

      {/* ═══ ROW 1: Student metrics — CLICKABLE ═══ */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Alunos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={Users} label="Total de Alunos" value={data.students.total} color="blue" onClick={() => setModalAlunos(true)} tooltip="Todos os alunos cadastrados" />
          <MetricCard icon={UserCheck} label="Alunos Ativos" value={data.students.active} color="green" onClick={() => setModalAlunos(true)} tooltip="Alunos com status ativo" />
          <MetricCard icon={UserX} label="Alunos Inativos" value={data.students.inactive} color="red" onClick={() => setModalAlunos(true)} tooltip="Alunos que cancelaram ou pausaram" />
          <MetricCard icon={UserMinus} label="Nao acompanhados" value={data.students.notFollowed} color="yellow" highlight onClick={() => setModalAlunos(true)} tooltip="Ativos que nao treinaram em 30 dias" badge={data.students.notFollowed > 0 ? "!" : undefined} />
          <MetricCard icon={Target} label="Em acompanhamento" value={data.students.trainedThisMonth} color="blue" onClick={() => setModalAlunos(true)} tooltip="Alunos que treinaram este mes" />
        </div>
      </div>

      {/* ═══ ROW 2: Training status — CLICKABLE ═══ */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-3 flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5" /> Status de Treino
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={AlertTriangle} label="Treinos Vencidos" value={data.plans.expired} color="red" highlight onClick={() => setModalTreinos(true)} tooltip="Assinaturas expiradas com status ativo" badge={data.plans.expired > 0 ? String(data.plans.expired) : undefined} />
          <MetricCard icon={Dumbbell} label="Alunos sem treino" value={data.students.withoutPlan} color="red" highlight onClick={() => setModalTreinos(true)} tooltip="Ativos sem ficha de treino cadastrada" badge={data.students.withoutPlan > 0 ? String(data.students.withoutPlan) : undefined} />
          <MetricCard icon={TrendingUp} label="Treinos a Vencer" value={data.plans.expiringSoon} color="yellow" highlight onClick={() => setModalTreinos(true)} tooltip="Contratos expirando nos proximos 7 dias" />
          <MetricCard icon={CalendarCheck} label="Treinos em dia" value={data.students.upToDate} color="green" onClick={() => setModalTreinos(true)} tooltip="Alunos que treinaram nos ultimos 7 dias" />
          <MetricCard icon={CreditCard} label="Contratos a vencer" value={data.plans.expiringSoon} color="yellow" highlight onClick={() => setModalTreinos(true)} tooltip="Assinaturas expirando em ate 7 dias" />
        </div>
      </div>

      {/* ═══ ROW 3: Sessions — CLICKABLE ═══ */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Sessoes de Treino
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={Flame} label="Treinos hoje" value={data.sessions.today} color="blue" onClick={() => setModalSessions(true)} tooltip="Sessoes registradas hoje" />
          <MetricCard icon={Calendar} label="Treinos na semana" value={data.sessions.thisWeek} color="blue" onClick={() => setModalSessions(true)} tooltip="Sessoes desta semana (seg-dom)" />
          <MetricCard icon={Dumbbell} label="Alunos com treino" value={data.students.withPlan} color="green" onClick={() => setModalSessions(true)} tooltip="Alunos com ficha de treino ativa" />
          <MetricCard icon={Timer} label="Duracao media" value={data.sessions.avgDurationMinutes} suffix="min" color="blue" onClick={() => setModalSessions(true)} tooltip="Media de duracao dos treinos (30 dias)" />
        </div>
      </div>

      {/* ═══ ROW 4: Renewals + Payments — CLICKABLE ═══ */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-3 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /> Financeiro
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard icon={RefreshCw} label="Renovados recentemente" value={data.plans.recentlyRenewed} color="green" highlight onClick={() => setModalPagamentos(true)} tooltip="Novas assinaturas nos ultimos 30 dias" />
          <MetricCard icon={CreditCard} label="Pagamentos pendentes" value={data.payments.pendingCount} color="yellow" onClick={() => setModalPagamentos(true)} tooltip="Pagamentos aguardando confirmacao" badge={data.payments.pendingCount > 0 ? String(data.payments.pendingCount) : undefined} />
          <button
            onClick={() => setModalPagamentos(true)}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg transition-all group cursor-pointer active:scale-[0.98]"
          >
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Total a receber</p>
            <p className="text-2xl font-bold text-green-400">
              R$ {fmt(data.payments.pendingTotal)}
            </p>
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] text-neutral-500">Ver detalhes</span>
              <ChevronRight className="w-2.5 h-2.5 text-neutral-600" />
            </div>
          </button>
        </div>
      </div>

      {/* ═══ ROW 5: Charts — INTERACTIVE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Days of week chart — Animated with tooltips */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Dias que treinaram
            </h3>
            <Tooltip text={`${totalDaySessions} treinos nos ultimos 30 dias`}>
              <div className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-semibold cursor-help">
                {totalDaySessions} total
              </div>
            </Tooltip>
          </div>
          <p className="text-[10px] text-neutral-600 mb-4">Treinos nos ultimos 30 dias</p>
          <AnimatedDayChart
            data={data.charts.dayOfWeek}
            onBarClick={(i) => setModalDayDetail(i)}
          />
        </div>

        {/* Time of day — Radial Chart */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            Horarios que treinaram
          </h3>
          <p className="text-[10px] text-neutral-600 mb-4">Treinos nos ultimos 30 dias</p>
          <RadialTimeChart
            morning={data.charts.timePercentages.morning}
            afternoon={data.charts.timePercentages.afternoon}
            evening={data.charts.timePercentages.evening}
            totalSessions={data.sessions.thisMonth}
          />
        </div>
      </div>

      {/* ═══ RETENTION METRICS ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Indicadores de Retencao
          <Tooltip text="Metricas que indicam a saude da base de alunos">
            <Info className="w-3.5 h-3.5 text-neutral-600 cursor-help" />
          </Tooltip>
        </h3>
        <div className="space-y-3">
          <ProgressBar value={data.students.active} max={data.students.total} color="#10b981" label={`Retencao (${data.students.active}/${data.students.total} alunos)`} />
          <ProgressBar value={data.students.trainedThisMonth} max={data.students.active} color="#3b82f6" label={`Engajamento mensal (${data.students.trainedThisMonth}/${data.students.active} ativos)`} />
          <ProgressBar value={data.students.withPlan} max={data.students.active} color="#f59e0b" label={`Cobertura de fichas (${data.students.withPlan}/${data.students.active} ativos)`} />
          <ProgressBar value={data.students.upToDate} max={data.students.active} color="#a855f7" label={`Em dia - treinou na semana (${data.students.upToDate}/${data.students.active} ativos)`} />
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ═══ MODALS ═══ */}
      {/* ═══════════════════════════════════════ */}

      {/* ALUNOS MODAL */}
      <DetailModal
        open={modalAlunos}
        onClose={() => setModalAlunos(false)}
        title="Visao Detalhada — Alunos"
        icon={Users}
        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
              <p className="text-2xl font-black text-blue-400">{data.students.total}</p>
              <p className="text-[9px] text-blue-400/60">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
              <p className="text-2xl font-black text-emerald-400">{data.students.active}</p>
              <p className="text-[9px] text-emerald-400/60">Ativos</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[9px] text-neutral-500 uppercase font-medium mb-2">Taxa de retencao</p>
            <div className="flex items-center gap-3">
              <p className={cn("text-2xl font-black", retentionRate >= 70 ? "text-emerald-400" : "text-amber-400")}>
                {retentionRate.toFixed(0)}%
              </p>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${retentionRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <StatRow label="Inativos" value={data.students.inactive} icon={UserX} color="text-red-400" />
            <StatRow label="Sem treinar (30d)" value={data.students.notFollowed} icon={UserMinus} color="text-amber-400" />
            <StatRow label="Treinaram este mes" value={data.students.trainedThisMonth} icon={Target} color="text-emerald-400" />
            <StatRow label="Com ficha de treino" value={data.students.withPlan} icon={Dumbbell} color="text-blue-400" />
            <StatRow label="Sem ficha" value={data.students.withoutPlan} icon={AlertTriangle} color="text-red-400" />
            <StatRow label="Em dia (semana)" value={data.students.upToDate} icon={CalendarCheck} color="text-emerald-400" />
          </div>
        </div>
      </DetailModal>

      {/* TREINOS MODAL */}
      <DetailModal
        open={modalTreinos}
        onClose={() => setModalTreinos(false)}
        title="Status de Treinos & Planos"
        icon={Dumbbell}
        iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 text-center">
              <p className="text-2xl font-black text-red-400">{data.plans.expired}</p>
              <p className="text-[9px] text-red-400/60">Vencidos</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 text-center">
              <p className="text-2xl font-black text-amber-400">{data.plans.expiringSoon}</p>
              <p className="text-[9px] text-amber-400/60">A vencer</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
              <p className="text-2xl font-black text-emerald-400">{data.students.upToDate}</p>
              <p className="text-[9px] text-emerald-400/60">Em dia</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[9px] text-neutral-500 uppercase font-medium mb-2">Cobertura de fichas</p>
            <ProgressBar value={data.students.withPlan} max={data.students.active} color="#f59e0b" />
            <p className="text-[10px] text-neutral-500 mt-2">
              {data.students.withPlan} de {data.students.active} alunos ativos tem ficha de treino
            </p>
          </div>

          <div className="space-y-2">
            <StatRow label="Alunos sem ficha" value={data.students.withoutPlan} icon={AlertTriangle} color="text-red-400" />
            <StatRow label="Assinaturas expiradas" value={data.plans.expired} icon={CalendarX} color="text-red-400" />
            <StatRow label="Expirando em 7 dias" value={data.plans.expiringSoon} icon={Clock} color="text-amber-400" />
            <StatRow label="Renovacoes recentes" value={data.plans.recentlyRenewed} icon={RefreshCw} color="text-emerald-400" />
          </div>

          {data.students.withoutPlan > 0 && (
            <div className="p-3 rounded-xl bg-red-500/[0.04] border border-red-500/10">
              <p className="text-xs text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Acao necessaria: {data.students.withoutPlan} aluno{data.students.withoutPlan > 1 ? "s" : ""} precisa{data.students.withoutPlan > 1 ? "m" : ""} de ficha
              </p>
            </div>
          )}
        </div>
      </DetailModal>

      {/* SESSIONS MODAL */}
      <DetailModal
        open={modalSessions}
        onClose={() => setModalSessions(false)}
        title="Sessoes de Treino"
        icon={Activity}
        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
              <p className="text-2xl font-black text-blue-400">{data.sessions.today}</p>
              <p className="text-[9px] text-blue-400/60">Hoje</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
              <p className="text-2xl font-black text-blue-400">{data.sessions.thisWeek}</p>
              <p className="text-[9px] text-blue-400/60">Esta semana</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
              <p className="text-2xl font-black text-emerald-400">{data.sessions.thisMonth}</p>
              <p className="text-[9px] text-emerald-400/60">Este mes</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10 text-center">
              <p className="text-2xl font-black text-purple-400">{data.sessions.avgDurationMinutes}<span className="text-sm ml-0.5">min</span></p>
              <p className="text-[9px] text-purple-400/60">Duracao media</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[9px] text-neutral-500 uppercase font-medium mb-2">Distribuicao por periodo</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="text-xs text-neutral-400 w-12">Manha</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full bg-yellow-400 transition-all duration-700" style={{ width: `${data.charts.timePercentages.morning}%` }} />
                </div>
                <span className="text-xs font-bold text-yellow-400 w-8 text-right">{data.charts.timePercentages.morning}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs text-neutral-400 w-12">Tarde</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full bg-orange-400 transition-all duration-700" style={{ width: `${data.charts.timePercentages.afternoon}%` }} />
                </div>
                <span className="text-xs font-bold text-orange-400 w-8 text-right">{data.charts.timePercentages.afternoon}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs text-neutral-400 w-12">Noite</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full bg-purple-400 transition-all duration-700" style={{ width: `${data.charts.timePercentages.evening}%` }} />
                </div>
                <span className="text-xs font-bold text-purple-400 w-8 text-right">{data.charts.timePercentages.evening}%</span>
              </div>
            </div>
          </div>

          {data.schedule.total > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-500 uppercase font-medium">Agenda da semana</p>
              <StatRow label="Slots agendados" value={data.schedule.total} icon={Calendar} color="text-blue-400" />
              <StatRow label="Confirmados" value={data.schedule.confirmed} icon={CalendarCheck} color="text-emerald-400" />
              <StatRow label="Faltaram" value={data.schedule.noShow} icon={UserX} color="text-red-400" />
            </div>
          )}
        </div>
      </DetailModal>

      {/* PAGAMENTOS MODAL */}
      <DetailModal
        open={modalPagamentos}
        onClose={() => setModalPagamentos(false)}
        title="Financeiro Rapido"
        icon={CreditCard}
        iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.08] to-blue-500/[0.08] border border-white/[0.08]">
            <p className="text-[9px] text-neutral-400 uppercase font-medium mb-2">Total a receber</p>
            <p className="text-3xl font-black text-emerald-400">R$ {fmt(data.payments.pendingTotal)}</p>
            <p className="text-xs text-neutral-500 mt-1">{data.payments.pendingCount} pagamento{data.payments.pendingCount !== 1 ? "s" : ""} pendente{data.payments.pendingCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="space-y-2">
            <StatRow label="Renovacoes (30d)" value={data.plans.recentlyRenewed} icon={RefreshCw} color="text-emerald-400" />
            <StatRow label="Pagamentos pendentes" value={data.payments.pendingCount} icon={Clock} color="text-amber-400" />
          </div>

          <a
            href="/admin/finance"
            className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" /> Abrir Financeiro Completo
          </a>
        </div>
      </DetailModal>

      {/* DAY DETAIL MODAL */}
      <DetailModal
        open={modalDayDetail !== null}
        onClose={() => setModalDayDetail(null)}
        title={modalDayDetail !== null ? `Treinos — ${DAY_FULL[modalDayDetail]}` : ""}
        icon={Calendar}
        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        maxWidth="max-w-sm"
      >
        {modalDayDetail !== null && (() => {
          const count = data.charts.dayOfWeek[modalDayDetail]
          const pct = totalDaySessions > 0 ? ((count / totalDaySessions) * 100).toFixed(1) : "0"
          const isPeak = modalDayDetail === peakDayIndex && count > 0
          return (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
                <p className="text-4xl font-black text-blue-400">{count}</p>
                <p className="text-xs text-blue-400/60">treinos em {DAY_FULL[modalDayDetail]}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className="text-lg font-bold text-white">{pct}%</p>
                  <p className="text-[9px] text-neutral-500">do total</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className="text-lg font-bold text-white">{(count / 4).toFixed(1)}</p>
                  <p className="text-[9px] text-neutral-500">media/semana</p>
                </div>
              </div>

              {isPeak && (
                <div className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <p className="text-xs text-amber-300">Dia mais popular para treinos!</p>
                </div>
              )}

              {modalDayDetail === 0 && count > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-300">Alunos comprometidos treinando no domingo!</p>
                </div>
              )}
            </div>
          )
        })()}
      </DetailModal>
    </div>
  )
}

// ═══════════════════════════════════════
// STAT ROW (for modals)
// ═══════════════════════════════════════

function StatRow({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: typeof Users; color: string
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-all">
      <span className="text-xs text-neutral-400 flex items-center gap-1.5">
        <Icon className={cn("w-3.5 h-3.5", color)} /> {label}
      </span>
      <span className={cn("text-sm font-bold", color)}>{value}</span>
    </div>
  )
}
