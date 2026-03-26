"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Users,
  Plus, Fuel, Server, Bot, Wrench, Megaphone, Package,
  CreditCard, Banknote, QrCode, ArrowUpRight,
  X, Check, Clock, AlertTriangle, BarChart3, PieChart,
  ChevronRight, Eye, MessageCircle, RefreshCw,
  Download, Info, Target, Zap, Crown, Star,
  ArrowDown, ArrowUp, Percent, CalendarDays,
  Phone, ExternalLink, Receipt, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface Overview {
  monthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  periodRevenue: number
  monthlyCosts: number
  monthProfit: number
  profitMargin: number
  activeSubscriptions: number
  totalStudents: number
  activeStudents: number
  aiInteractionsMonth: number
  estimatedAICostBRL: number
  pendingAmount: number
  pendingCount: number
  costsByCategory: Record<string, number>
  revenueByMethod: { method: string; label: string; total: number; count: number }[]
  revenueByMonth: { month: string; revenue: number; costs: number }[]
  currentMRR: number
  projection: { month: string; projected: number; best: number; worst: number }[]
  churn: { id: string; studentName: string; phone: string | null; planName: string; planPrice: number; endDate: string; daysLeft: number; severity: string }[]
  studentLtv: { name: string; totalPaid: number; paymentCount: number; monthsActive: number; avgMonthly: number }[]
  avgLtv: number
  costPerStudent: number
  revenuePerStudent: number
}

interface Cost {
  id: string
  category: string
  name: string
  amount: number
  recurrence: string
  date: string
  notes: string | null
  active: boolean
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  dueDate: string
  paidAt: string | null
  description: string | null
  student: { user: { name: string } }
  createdAt: string
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const categoryIcons: Record<string, typeof Server> = {
  HOSTING: Server, AI_TOKENS: Bot, SOFTWARE: Wrench,
  GAS: Fuel, EQUIPMENT: Package, MARKETING: Megaphone, OTHER: DollarSign,
}

const categoryLabels: Record<string, string> = {
  HOSTING: "Hospedagem", AI_TOKENS: "Tokens IA", SOFTWARE: "Software",
  GAS: "Gasolina", EQUIPMENT: "Equipamentos", MARKETING: "Marketing", OTHER: "Outros",
}

const categoryColors: Record<string, string> = {
  HOSTING: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  AI_TOKENS: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  SOFTWARE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  GAS: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  EQUIPMENT: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  MARKETING: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  OTHER: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
}

const categoryChartColors: Record<string, string> = {
  HOSTING: "#3b82f6", AI_TOKENS: "#a855f7", SOFTWARE: "#f59e0b",
  GAS: "#f97316", EQUIPMENT: "#06b6d4", MARKETING: "#ec4899", OTHER: "#6b7280",
}

const methodIcons: Record<string, typeof DollarSign> = {
  PIX: QrCode, CASH: Banknote, CREDIT_CARD: CreditCard,
  MERCADOPAGO: Wallet, BANK_TRANSFER: ArrowUpRight,
}

const methodLabels: Record<string, string> = {
  PIX: "PIX", CASH: "Dinheiro", CREDIT_CARD: "Cartão",
  MERCADOPAGO: "Mercado Pago", BANK_TRANSFER: "Transferência",
}

const methodColors: Record<string, string> = {
  PIX: "#10b981", CASH: "#f59e0b", CREDIT_CARD: "#3b82f6",
  MERCADOPAGO: "#06b6d4", BANK_TRANSFER: "#8b5cf6",
}

const recurrenceLabels: Record<string, string> = {
  ONE_TIME: "Único", DAILY: "Diário", MONTHLY: "Mensal",
  QUARTERLY: "Trimestral", ANNUAL: "Anual",
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  PAID: { label: "Pago", color: "text-emerald-400 bg-emerald-500/10", icon: Check },
  PENDING: { label: "Pendente", color: "text-amber-400 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Atrasado", color: "text-red-400 bg-red-500/10", icon: AlertTriangle },
  CANCELLED: { label: "Cancelado", color: "text-neutral-500 bg-neutral-500/10", icon: X },
}

// ═══════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const diff = value - start
    if (Math.abs(diff) < 0.01) { setDisplay(value); return }
    const duration = 800
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + diff * eased)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{prefix}{fmt(display)}{suffix}</>
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
// DETAIL MODAL (reusable)
// ═══════════════════════════════════════

function DetailModal({ open, onClose, title, icon: Icon, iconColor, children, maxWidth = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; icon: typeof DollarSign; iconColor: string; children: React.ReactNode; maxWidth?: string
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full max-h-[85dvh] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl overflow-hidden overflow-y-auto",
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
// INTERACTIVE KPI CARD
// ═══════════════════════════════════════

function KpiCard({ title, value, subtitle, trend, icon: Icon, color, onClick, pulse }: {
  title: string; value: string; subtitle?: string; trend?: number; icon: typeof DollarSign; color: string; onClick?: () => void; pulse?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all duration-300 group w-full",
        onClick && "hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]",
        pulse && "animate-pulse"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110", color)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
              trend >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
          {onClick && (
            <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
          )}
        </div>
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-neutral-600 mt-0.5">{subtitle}</p>}
    </button>
  )
}

// ═══════════════════════════════════════
// ANIMATED BAR CHART WITH TOOLTIPS
// ═══════════════════════════════════════

function AnimatedBarChart({ data, onBarClick }: {
  data: { month: string; revenue: number; costs: number }[]
  onBarClick?: (month: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.costs)), 1)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  return (
    <div className="flex items-end gap-2 h-40 relative">
      {data.map((d, i) => {
        const profit = d.revenue - d.costs
        return (
          <div
            key={i}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 relative cursor-pointer group",
              onBarClick && "hover:opacity-100"
            )}
            onMouseEnter={() => setHoveredBar(i)}
            onMouseLeave={() => setHoveredBar(null)}
            onClick={() => onBarClick?.(d.month)}
          >
            {/* Tooltip */}
            {hoveredBar === i && (
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150 min-w-[140px]">
                <p className="text-[10px] text-neutral-400 uppercase mb-1.5 font-medium">{d.month}</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-[11px] text-emerald-400 font-semibold">R$ {fmt(d.revenue)}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-sm bg-red-500" />
                  <span className="text-[11px] text-red-400 font-semibold">R$ {fmt(d.costs)}</span>
                </div>
                <div className="border-t border-white/10 pt-1 mt-1">
                  <span className={cn("text-[11px] font-bold", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {profit >= 0 ? "+" : ""}R$ {fmt(profit)}
                  </span>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 border-r border-b border-white/10 rotate-45" />
              </div>
            )}

            <div className="w-full flex gap-0.5 items-end" style={{ height: 120 }}>
              <div
                className={cn(
                  "flex-1 rounded-t min-h-[2px] transition-all duration-700 ease-out",
                  hoveredBar === i ? "bg-emerald-500/80" : "bg-emerald-500/50"
                )}
                style={{
                  height: mounted ? `${(d.revenue / maxVal) * 100}%` : "2px",
                  transitionDelay: `${i * 80}ms`,
                }}
              />
              <div
                className={cn(
                  "flex-1 rounded-t min-h-[2px] transition-all duration-700 ease-out",
                  hoveredBar === i ? "bg-red-500/60" : "bg-red-500/30"
                )}
                style={{
                  height: mounted ? `${(d.costs / maxVal) * 100}%` : "2px",
                  transitionDelay: `${i * 80 + 40}ms`,
                }}
              />
            </div>
            <span className={cn(
              "text-[9px] uppercase transition-colors",
              hoveredBar === i ? "text-white font-medium" : "text-neutral-600"
            )}>{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════
// ANIMATED DONUT CHART
// ═══════════════════════════════════════

function DonutChart({ data, total }: {
  data: { category: string; amount: number; color: string }[]
  total: number
}) {
  const [mounted, setMounted] = useState(false)
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  const radius = 70
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  let currentOffset = 0

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
          {data.map((d) => {
            const pct = total > 0 ? d.amount / total : 0
            const segmentLength = pct * circumference
            const offset = currentOffset
            currentOffset += segmentLength

            return (
              <circle
                key={d.category}
                cx="90" cy="90" r={radius}
                fill="none"
                stroke={hoveredSlice === d.category ? d.color : `${d.color}bb`}
                strokeWidth={hoveredSlice === d.category ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${mounted ? segmentLength : 0} ${circumference - (mounted ? segmentLength : 0)}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setHoveredSlice(d.category)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-black text-white">R$ {fmt(total)}</p>
          <p className="text-[9px] text-neutral-500">Total mensal</p>
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        {data.map(d => {
          const pct = total > 0 ? ((d.amount / total) * 100).toFixed(1) : "0"
          return (
            <div
              key={d.category}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-default",
                hoveredSlice === d.category ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              )}
              onMouseEnter={() => setHoveredSlice(d.category)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-neutral-400 flex-1 truncate">{categoryLabels[d.category] || d.category}</span>
              <span className="text-[11px] font-semibold text-white">R$ {fmt(d.amount)}</span>
              <span className="text-[9px] text-neutral-600 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// SPARKLINE
// ═══════════════════════════════════════

function Sparkline({ values, color = "#10b981", height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const width = 100
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-in fade-in duration-700"
      />
    </svg>
  )
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export function FinanceClient({ students }: { students: { id: string; name: string }[] }) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview" | "costs" | "payments">("overview")

  // Modals
  const [showAddCost, setShowAddCost] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [kpiModal, setKpiModal] = useState<"receita" | "custos" | "lucro" | "assinaturas" | null>(null)
  const [studentModal, setStudentModal] = useState<Overview["studentLtv"][0] | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null)
  const [methodModal, setMethodModal] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [ovRes, costsRes, payRes] = await Promise.all([
      fetch("/api/admin/finance/overview"),
      fetch("/api/admin/finance/costs"),
      fetch("/api/admin/finance/payments?limit=30"),
    ])
    if (ovRes.ok) setOverview(await ovRes.json())
    if (costsRes.ok) setCosts(await costsRes.json())
    if (payRes.ok) setPayments(await payRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading || !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 animate-pulse">Carregando dados financeiros...</p>
      </div>
    )
  }

  const filteredPayments = paymentFilter
    ? payments.filter(p => p.status === paymentFilter)
    : payments

  return (
    <div className="space-y-6">
      {/* ═══ TABS ═══ */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit overflow-x-auto">
        {([
          { key: "overview", label: "Visão Geral", icon: BarChart3 },
          { key: "costs", label: "Custos", icon: TrendingDown },
          { key: "payments", label: "Pagamentos", icon: Wallet },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key ? "bg-white/[0.08] text-white shadow-sm" : "text-neutral-500 hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ═══ OVERVIEW TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">

          {/* ═══ KPI CARDS — CLICKABLE ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              title="Receita do mes"
              value={`R$ ${fmt(overview.monthRevenue)}`}
              subtitle={`Mes anterior: R$ ${fmt(overview.lastMonthRevenue)}`}
              trend={overview.revenueGrowth}
              icon={DollarSign}
              color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              onClick={() => setKpiModal("receita")}
            />
            <KpiCard
              title="Custos mensais"
              value={`R$ ${fmt(overview.monthlyCosts)}`}
              subtitle={`IA: R$ ${fmt(overview.estimatedAICostBRL)} · ${overview.aiInteractionsMonth} interacoes`}
              icon={TrendingDown}
              color="text-red-400 bg-red-500/10 border-red-500/20"
              onClick={() => setKpiModal("custos")}
            />
            <KpiCard
              title="Lucro liquido"
              value={`R$ ${fmt(overview.monthProfit)}`}
              subtitle={`Margem: ${overview.profitMargin}%`}
              icon={TrendingUp}
              color={overview.monthProfit >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}
              onClick={() => setKpiModal("lucro")}
            />
            <KpiCard
              title="Assinaturas ativas"
              value={`${overview.activeSubscriptions}`}
              subtitle={`${overview.activeStudents}/${overview.totalStudents} alunos ativos`}
              icon={Users}
              color="text-blue-400 bg-blue-500/10 border-blue-500/20"
              onClick={() => setKpiModal("assinaturas")}
            />
          </div>

          {/* ═══ PENDING ALERT — INTERACTIVE ═══ */}
          {overview.pendingCount > 0 && (
            <button
              onClick={() => { setTab("payments"); setPaymentFilter("PENDING") }}
              className="w-full rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 flex items-center gap-3 hover:bg-amber-500/[0.08] hover:border-amber-500/25 transition-all group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">{overview.pendingCount} pagamento{overview.pendingCount > 1 ? "s" : ""} pendente{overview.pendingCount > 1 ? "s" : ""}</p>
                <p className="text-xs text-amber-400/60">Total: R$ {fmt(overview.pendingAmount)} — Clique para ver detalhes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </button>
          )}

          {/* ═══ CHARTS ROW ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Revenue vs Costs — Animated Chart */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Receita vs Custos</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Receita</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60" />Custos</span>
                </div>
              </div>
              <AnimatedBarChart data={overview.revenueByMonth} />
              <p className="text-[9px] text-neutral-600 mt-2 text-center">Passe o mouse sobre as barras para ver detalhes</p>
            </div>

            {/* Revenue by Method — CLICKABLE */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-white">Receita por Metodo</h3>
              </div>
              {overview.revenueByMethod.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-600 text-sm">Nenhum pagamento registrado</p>
                  <button
                    onClick={() => { setTab("payments"); setShowAddPayment(true) }}
                    className="text-xs text-emerald-500 hover:text-emerald-400 mt-2 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Registrar primeiro pagamento
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {overview.revenueByMethod.map(m => {
                    const Icon = methodIcons[m.method] || DollarSign
                    const total = overview.revenueByMethod.reduce((s, x) => s + x.total, 0)
                    const pct = total > 0 ? (m.total / total) * 100 : 0
                    const color = methodColors[m.method] || "#6b7280"
                    return (
                      <button
                        key={m.method}
                        onClick={() => setMethodModal(m.method)}
                        className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] shrink-0" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-300">{m.label}</span>
                            <span className="text-xs font-semibold text-white">R$ {fmt(m.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-neutral-600 w-8 text-right">{m.count}x</span>
                          <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Costs Breakdown — DONUT CHART */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Custos por Categoria (mensal)</h3>
                <button
                  onClick={() => { setTab("costs"); setShowAddCost(true) }}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {Object.keys(overview.costsByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-600 text-sm mb-2">Nenhum custo cadastrado</p>
                  <button onClick={() => { setTab("costs"); setShowAddCost(true) }} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar custo
                  </button>
                </div>
              ) : (
                <DonutChart
                  data={Object.entries(overview.costsByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => ({
                      category: cat,
                      amount,
                      color: categoryChartColors[cat] || "#6b7280",
                    }))
                  }
                  total={overview.monthlyCosts}
                />
              )}
            </div>

            {/* AI Usage — Interactive */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Uso de IA este mes</h3>
                <Tooltip text="Apenas planos Pro e Elite usam IA (chat pos-treino)">
                  <Info className="w-3.5 h-3.5 text-neutral-600 cursor-help" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10 hover:border-purple-500/20 transition-all group">
                  <p className="text-2xl font-black text-purple-300 transition-transform group-hover:scale-105">{overview.aiInteractionsMonth}</p>
                  <p className="text-[10px] text-purple-400/60 mt-0.5">Interacoes pos-treino</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10 hover:border-purple-500/20 transition-all group">
                  <p className="text-2xl font-black text-purple-300 transition-transform group-hover:scale-105">R$ {fmt(overview.estimatedAICostBRL)}</p>
                  <p className="text-[10px] text-purple-400/60 mt-0.5">Custo estimado</p>
                  <Tooltip text="~R$ 0,025 por interacao">
                    <p className="text-[9px] text-purple-500/40 mt-1 flex items-center gap-0.5 cursor-help">
                      <Info className="w-2.5 h-2.5" /> Como calculamos
                    </p>
                  </Tooltip>
                </div>
              </div>
              {overview.aiInteractionsMonth > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-purple-500/[0.04] border border-purple-500/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-purple-400/60">Custo por interacao</span>
                    <span className="text-purple-300 font-semibold">R$ {fmt(overview.estimatedAICostBRL / overview.aiInteractionsMonth)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1">
                    <span className="text-purple-400/60">% dos custos totais</span>
                    <span className="text-purple-300 font-semibold">
                      {overview.monthlyCosts > 0 ? ((overview.estimatedAICostBRL / overview.monthlyCosts) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ MRR + PROJECTIONS + METRICS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* MRR & Projection */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Projecao de Receita (3 meses)
                <Tooltip text="Baseado no MRR atual e assinaturas ativas">
                  <Info className="w-3.5 h-3.5 text-neutral-600 cursor-help" />
                </Tooltip>
              </h3>
              <div className="mb-4 flex items-baseline gap-2">
                <p className="text-3xl font-black text-white">R$ <AnimatedNumber value={overview.currentMRR} /></p>
                <p className="text-xs text-neutral-500">MRR atual</p>
              </div>

              {/* Sparkline */}
              {overview.revenueByMonth.length >= 2 && (
                <div className="mb-4">
                  <Sparkline values={overview.revenueByMonth.map(m => m.revenue)} />
                </div>
              )}

              {overview.projection && overview.projection.length > 0 ? (
                <div className="space-y-2.5">
                  {overview.projection.map((p, i) => (
                    <Tooltip key={i} text={`Melhor: R$ ${fmt(p.best)} · Pior: R$ ${fmt(p.worst)}`}>
                      <div className="flex items-center gap-3 w-full cursor-help">
                        <span className="text-[10px] text-neutral-500 w-8 uppercase font-medium">{p.month}</span>
                        <div className="flex-1 h-7 bg-neutral-900/50 rounded-full overflow-hidden relative group">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600/40 to-emerald-500/20 rounded-full transition-all duration-700 group-hover:from-emerald-600/60 group-hover:to-emerald-500/40"
                            style={{ width: `${overview.currentMRR > 0 ? Math.min(100, (p.projected / overview.currentMRR) * 80) : 0}%` }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold">
                            R$ {p.projected.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-600">Sem assinaturas ativas para projetar</p>
              )}
            </div>

            {/* Per-Student Metrics — INTERACTIVE */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-blue-400" />
                Metricas por Aluno
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Tooltip text="Receita total dividida pelo numero de alunos ativos">
                  <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 hover:border-emerald-500/25 transition-all cursor-help w-full">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowUp className="w-3 h-3 text-emerald-500/40" />
                      <p className="text-[9px] text-emerald-400/60 uppercase font-medium">Receita/aluno</p>
                    </div>
                    <p className="text-xl font-black text-emerald-400">R$ {fmt(overview.revenuePerStudent)}</p>
                    <p className="text-[9px] text-emerald-400/40 mt-0.5">por mes</p>
                  </div>
                </Tooltip>
                <Tooltip text="Custos totais divididos pelo numero de alunos ativos">
                  <div className="p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:border-red-500/25 transition-all cursor-help w-full">
                    <div className="flex items-center gap-1 mb-1">
                      <ArrowDown className="w-3 h-3 text-red-500/40" />
                      <p className="text-[9px] text-red-400/60 uppercase font-medium">Custo/aluno</p>
                    </div>
                    <p className="text-xl font-black text-red-400">R$ {fmt(overview.costPerStudent)}</p>
                    <p className="text-[9px] text-red-400/40 mt-0.5">por mes</p>
                  </div>
                </Tooltip>
              </div>
              <Tooltip text="Valor total medio que cada aluno gera durante toda a permanencia">
                <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 hover:border-amber-500/25 transition-all cursor-help">
                  <div className="flex items-center gap-1 mb-1">
                    <Crown className="w-3 h-3 text-amber-500/40" />
                    <p className="text-[9px] text-amber-400/60 uppercase font-medium">LTV medio</p>
                  </div>
                  <p className="text-xl font-black text-amber-400">R$ {overview.avgLtv.toLocaleString("pt-BR")}</p>
                  <p className="text-[9px] text-amber-400/40 mt-0.5">valor total por aluno</p>
                </div>
              </Tooltip>
              {overview.revenuePerStudent > 0 && overview.costPerStudent > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Margem por aluno
                    </span>
                    <span className="text-sm font-bold text-emerald-400">R$ {fmt(overview.revenuePerStudent - overview.costPerStudent)}/mes</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ CHURN ALERTS — INTERACTIVE ═══ */}
          {overview.churn && overview.churn.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Risco de Churn — {overview.churn.length} assinatura{overview.churn.length !== 1 ? "s" : ""} expirando
              </h3>
              <div className="space-y-2">
                {overview.churn.map(c => (
                  <div key={c.id} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.01]",
                    c.severity === "critical" ? "bg-red-500/5 border-red-500/15 hover:border-red-500/30" :
                    c.severity === "warning" ? "bg-yellow-500/5 border-yellow-500/15 hover:border-yellow-500/30" :
                    "bg-blue-500/5 border-blue-500/15 hover:border-blue-500/30"
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.studentName}</p>
                      <p className="text-[10px] text-neutral-500">{c.planName} · R$ {fmt(c.planPrice)}</p>
                      <p className="text-[9px] text-neutral-600 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-2.5 h-2.5" />
                        Expira: {new Date(c.endDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="text-right mr-1">
                        <p className={cn(
                          "text-xs font-bold",
                          c.severity === "critical" ? "text-red-400" :
                          c.severity === "warning" ? "text-yellow-400" : "text-blue-400"
                        )}>
                          {c.daysLeft === 0 ? "Expira hoje!" : `${c.daysLeft} dias`}
                        </p>
                      </div>
                      {c.phone && (
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold hover:bg-green-500/20 hover:border-green-500/30 transition-all"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}
                      <Tooltip text="Renovar assinatura">
                        <button className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TOP STUDENTS LTV — CLICKABLE ROWS ═══ */}
          {overview.studentLtv && overview.studentLtv.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-400" />
                Top Alunos por Valor (LTV)
                <span className="text-[9px] text-neutral-600 ml-auto">Clique para ver detalhes</span>
              </h3>
              <div className="space-y-1">
                {overview.studentLtv.slice(0, 10).map((s, i) => {
                  const maxLtv = overview.studentLtv[0]?.totalPaid || 1
                  const medal = i === 0 ? "text-amber-400 bg-amber-500/20" : i === 1 ? "text-neutral-300 bg-neutral-400/20" : i === 2 ? "text-orange-400 bg-orange-500/20" : "bg-white/[0.04] text-neutral-500"
                  return (
                    <button
                      key={i}
                      onClick={() => setStudentModal(s)}
                      className="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-all group text-left"
                    >
                      <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0", medal)}>
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs text-white truncate group-hover:text-emerald-300 transition-colors">{s.name}</p>
                          <p className="text-xs font-bold text-emerald-400 shrink-0">R$ {s.totalPaid.toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                            style={{ width: `${(s.totalPaid / maxLtv) * 100}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-neutral-600 mt-0.5">
                          {s.monthsActive} meses · {s.paymentCount} pagamentos · ~R$ {s.avgMonthly}/mes
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 shrink-0 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ EXPORT CSV ═══ */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!overview) return
                const date = new Date().toLocaleDateString("pt-BR")
                const sep = ";"
                const rows = [
                  ["RELATORIO FINANCEIRO - VICTOR PERSONAL"],
                  [`Gerado em: ${date}`],
                  [],
                  ["RESUMO DO MES"],
                  ["Indicador", "Valor"],
                  ["Receita do Mes", fmt(overview.monthRevenue)],
                  ["Custos Mensais", fmt(overview.monthlyCosts)],
                  ["Lucro Liquido", fmt(overview.monthProfit)],
                  ["Margem de Lucro", `${overview.profitMargin}%`],
                  [],
                  ["ASSINATURAS"],
                  ["Indicador", "Valor"],
                  ["MRR (Receita Recorrente)", fmt(overview.currentMRR)],
                  ["Assinaturas Ativas", String(overview.activeSubscriptions)],
                  ["Total de Alunos", String(overview.totalStudents)],
                  ["Alunos Ativos", String(overview.activeStudents)],
                  [],
                  ["METRICAS POR ALUNO"],
                  ["Indicador", "Valor"],
                  ["Receita Media/Aluno", fmt(overview.revenuePerStudent)],
                  ["Custo Medio/Aluno", fmt(overview.costPerStudent)],
                  ["Margem/Aluno", fmt(overview.revenuePerStudent - overview.costPerStudent)],
                  ["LTV Medio", fmt(overview.avgLtv)],
                  [],
                  ["PENDENCIAS"],
                  ["Indicador", "Valor"],
                  ["Valor Pendente", fmt(overview.pendingAmount)],
                  ["Pagamentos Pendentes", String(overview.pendingCount)],
                  ["Risco de Churn", `${overview.churn?.length || 0} alunos`],
                  [],
                  ["RISCO DE CHURN (assinaturas expirando)"],
                  ["Aluno", "Plano", "Valor", "Dias Restantes"],
                  ...(overview.churn || []).map(c => [c.studentName, c.planName, fmt(c.planPrice), String(c.daysLeft)]),
                  [],
                  ["RECEITA POR METODO"],
                  ["Metodo", "Valor Total", "Qtd Pagamentos"],
                  ...(overview.revenueByMethod || []).map(m => [m.label, fmt(m.total), String(m.count)]),
                  [],
                  ["HISTORICO MENSAL"],
                  ["Mes", "Receita", "Custos"],
                  ...(overview.revenueByMonth || []).map(m => [m.month, fmt(m.revenue), fmt(m.costs)]),
                  [],
                  ["RANKING DE ALUNOS POR LTV"],
                  ["#", "Aluno", "Total Pago", "Meses Ativo", "Pagamentos", "Media Mensal"],
                  ...(overview.studentLtv || []).map((s, i) => [String(i + 1), s.name, fmt(s.totalPaid), String(s.monthsActive), String(s.paymentCount), fmt(s.avgMonthly)]),
                  [],
                  ["USO DE IA"],
                  ["Indicador", "Valor"],
                  ["Interacoes IA no Mes", String(overview.aiInteractionsMonth)],
                  ["Custo Estimado IA", fmt(overview.estimatedAICostBRL)],
                ]
                const bom = "\uFEFF"
                const csv = bom + rows.map(r => r.join(sep)).join("\n")
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `financeiro-victor-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs font-medium hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] transition-all group"
            >
              <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
              Exportar CSV para Contador
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ COSTS TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab === "costs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Custos Operacionais</h3>
            <button
              onClick={() => setShowAddCost(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Novo custo
            </button>
          </div>

          {costs.length === 0 ? (
            <div className="text-center py-12">
              <Server className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">Nenhum custo cadastrado ainda</p>
              <p className="text-neutral-700 text-xs mt-1">Adicione seus custos fixos: hosting, gasolina, tokens IA...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {costs.map(cost => {
                const Icon = categoryIcons[cost.category] || DollarSign
                const colors = categoryColors[cost.category] || categoryColors.OTHER
                return (
                  <div key={cost.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    cost.active
                      ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]"
                      : "border-white/[0.03] bg-white/[0.01] opacity-50"
                  )}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border shrink-0", colors)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{cost.name}</p>
                      <p className="text-[10px] text-neutral-500">
                        {categoryLabels[cost.category]} · {recurrenceLabels[cost.recurrence]}
                        {cost.notes && ` · ${cost.notes}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">R$ {fmt(cost.amount)}</p>
                      <p className="text-[10px] text-neutral-600">{recurrenceLabels[cost.recurrence]}</p>
                    </div>
                    <Tooltip text={cost.active ? "Desativar custo" : "Ativar custo"}>
                      <button
                        onClick={async () => {
                          await fetch("/api/admin/finance/costs", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: cost.id, active: !cost.active }),
                          })
                          fetchAll()
                        }}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center border text-xs transition-all shrink-0",
                          cost.active ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" : "border-neutral-700 text-neutral-600 hover:bg-white/[0.05]"
                        )}
                      >
                        {cost.active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ PAYMENTS TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Pagamentos</h3>
              {/* Filter pills */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaymentFilter(null)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                    !paymentFilter ? "bg-white/[0.08] text-white" : "text-neutral-500 hover:text-white"
                  )}
                >
                  Todos
                </button>
                {(["PAID", "PENDING", "OVERDUE"] as const).map(s => {
                  const cfg = statusConfig[s]
                  const count = payments.filter(p => p.status === s).length
                  return (
                    <button
                      key={s}
                      onClick={() => setPaymentFilter(paymentFilter === s ? null : s)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1",
                        paymentFilter === s ? cfg.color : "text-neutral-500 hover:text-white"
                      )}
                    >
                      {cfg.label}
                      {count > 0 && <span className="text-[8px] opacity-60">({count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar pagamento
            </button>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">
                {paymentFilter ? `Nenhum pagamento ${statusConfig[paymentFilter]?.label.toLowerCase()}` : "Nenhum pagamento registrado"}
              </p>
              {paymentFilter && (
                <button onClick={() => setPaymentFilter(null)} className="text-xs text-blue-400 hover:text-blue-300 mt-2">
                  Ver todos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map(pay => {
                const Icon = methodIcons[pay.method] || DollarSign
                const st = statusConfig[pay.status] || statusConfig.PENDING
                return (
                  <div key={pay.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] shrink-0 hidden sm:flex" style={{ backgroundColor: `${methodColors[pay.method] || "#6b7280"}15` }}>
                        <Icon className="w-4 h-4" style={{ color: methodColors[pay.method] || "#6b7280" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{pay.student.user.name}</p>
                        <p className="text-[10px] text-neutral-500">
                          {methodLabels[pay.method] || pay.method}
                          {pay.description && ` · ${pay.description}`}
                          {` · ${new Date(pay.createdAt).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">R$ {fmt(pay.amount)}</p>
                      </div>
                      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0", st.color)}>
                        <st.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{st.label}</span>
                      </div>
                      {pay.status !== "PAID" && pay.status !== "CANCELLED" && (
                        <Tooltip text="Marcar como pago">
                          <button
                            onClick={async () => {
                              await fetch("/api/admin/finance/payments", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: pay.id, status: "PAID" }),
                              })
                              fetchAll()
                            }}
                            className="w-7 h-7 rounded-lg border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-all shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ KPI DETAIL MODALS ═══ */}
      {/* ═══════════════════════════════════════ */}

      {/* RECEITA MODAL */}
      <DetailModal
        open={kpiModal === "receita"}
        onClose={() => setKpiModal(null)}
        title="Detalhes da Receita"
        icon={DollarSign}
        iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
              <p className="text-[9px] text-emerald-400/60 uppercase font-medium mb-1">Este mes</p>
              <p className="text-xl font-black text-emerald-400">R$ {fmt(overview.monthRevenue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[9px] text-neutral-500 uppercase font-medium mb-1">Mes anterior</p>
              <p className="text-xl font-black text-neutral-300">R$ {fmt(overview.lastMonthRevenue)}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[9px] text-neutral-500 uppercase font-medium mb-1">Variacao</p>
            <div className="flex items-center gap-2">
              {overview.revenueGrowth >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <p className={cn("text-2xl font-black", overview.revenueGrowth >= 0 ? "text-emerald-400" : "text-red-400")}>
                {overview.revenueGrowth >= 0 ? "+" : ""}{overview.revenueGrowth}%
              </p>
            </div>
            <p className="text-[9px] text-neutral-600 mt-1">
              {overview.revenueGrowth >= 0
                ? `Crescimento de R$ ${fmt(overview.monthRevenue - overview.lastMonthRevenue)}`
                : `Queda de R$ ${fmt(overview.lastMonthRevenue - overview.monthRevenue)}`
              }
            </p>
          </div>

          <div>
            <p className="text-[10px] text-neutral-500 uppercase font-medium mb-2">Historico (6 meses)</p>
            <Sparkline values={overview.revenueByMonth.map(m => m.revenue)} height={48} />
            <div className="flex justify-between mt-1">
              {overview.revenueByMonth.map((m, i) => (
                <span key={i} className="text-[8px] text-neutral-600 uppercase">{m.month}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-neutral-500 uppercase font-medium mb-2">Por metodo</p>
            {overview.revenueByMethod.map(m => (
              <div key={m.method} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-neutral-400">{m.label}</span>
                <span className="text-xs font-semibold text-white">R$ {fmt(m.total)} ({m.count}x)</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setKpiModal(null); setTab("payments") }}
            className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" /> Ver todos os pagamentos
          </button>
        </div>
      </DetailModal>

      {/* CUSTOS MODAL */}
      <DetailModal
        open={kpiModal === "custos"}
        onClose={() => setKpiModal(null)}
        title="Detalhes dos Custos"
        icon={TrendingDown}
        iconColor="text-red-400 bg-red-500/10 border-red-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10">
              <p className="text-[9px] text-red-400/60 uppercase font-medium mb-1">Custos fixos</p>
              <p className="text-xl font-black text-red-400">R$ {fmt(overview.monthlyCosts - overview.estimatedAICostBRL)}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
              <p className="text-[9px] text-purple-400/60 uppercase font-medium mb-1">Custo IA</p>
              <p className="text-xl font-black text-purple-400">R$ {fmt(overview.estimatedAICostBRL)}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-neutral-500 uppercase font-medium mb-2">Breakdown por categoria</p>
            {Object.entries(overview.costsByCategory).sort(([, a], [, b]) => b - a).map(([cat, amount]) => {
              const Icon = categoryIcons[cat] || DollarSign
              const pct = overview.monthlyCosts > 0 ? ((amount / overview.monthlyCosts) * 100).toFixed(1) : "0"
              return (
                <div key={cat} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${categoryChartColors[cat]}15` }}>
                    <Icon className="w-4 h-4" style={{ color: categoryChartColors[cat] }} />
                  </div>
                  <span className="flex-1 text-xs text-neutral-300">{categoryLabels[cat] || cat}</span>
                  <span className="text-xs text-neutral-500">{pct}%</span>
                  <span className="text-xs font-semibold text-white">R$ {fmt(amount)}</span>
                </div>
              )
            })}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Total mensal</span>
              <span className="text-lg font-black text-white">R$ {fmt(overview.monthlyCosts)}</span>
            </div>
          </div>

          <button
            onClick={() => { setKpiModal(null); setTab("costs") }}
            className="w-full py-2.5 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Wrench className="w-3.5 h-3.5" /> Gerenciar custos
          </button>
        </div>
      </DetailModal>

      {/* LUCRO MODAL */}
      <DetailModal
        open={kpiModal === "lucro"}
        onClose={() => setKpiModal(null)}
        title="Análise de Lucro"
        icon={TrendingUp}
        iconColor={overview.monthProfit >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.08] to-blue-500/[0.08] border border-white/[0.08]">
            <p className="text-[9px] text-neutral-400 uppercase font-medium mb-2">Lucro liquido do mes</p>
            <p className={cn("text-3xl font-black", overview.monthProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
              R$ {fmt(overview.monthProfit)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Margem: {overview.profitMargin}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/[0.04]">
              <span className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Receita</span>
              <span className="text-xs font-bold text-emerald-400">R$ {fmt(overview.monthRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/[0.04]">
              <span className="text-xs text-red-400 flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Custos</span>
              <span className="text-xs font-bold text-red-400">- R$ {fmt(overview.monthlyCosts)}</span>
            </div>
            <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-medium">= Lucro</span>
              <span className={cn("text-sm font-black", overview.monthProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                R$ {fmt(overview.monthProfit)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-neutral-500 uppercase font-medium mb-2">Evolucao mensal</p>
            <Sparkline
              values={overview.revenueByMonth.map(m => m.revenue - m.costs)}
              color={overview.monthProfit >= 0 ? "#10b981" : "#ef4444"}
              height={48}
            />
          </div>
        </div>
      </DetailModal>

      {/* ASSINATURAS MODAL */}
      <DetailModal
        open={kpiModal === "assinaturas"}
        onClose={() => setKpiModal(null)}
        title="Assinaturas & Alunos"
        icon={Users}
        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
              <p className="text-2xl font-black text-blue-400">{overview.activeSubscriptions}</p>
              <p className="text-[9px] text-blue-400/60">Assinaturas</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
              <p className="text-2xl font-black text-emerald-400">{overview.activeStudents}</p>
              <p className="text-[9px] text-emerald-400/60">Ativos</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-500/[0.06] border border-neutral-500/10 text-center">
              <p className="text-2xl font-black text-neutral-400">{overview.totalStudents - overview.activeStudents}</p>
              <p className="text-[9px] text-neutral-400/60">Inativos</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">Taxa de retencao</span>
              <span className="text-sm font-bold text-emerald-400">
                {overview.totalStudents > 0 ? ((overview.activeStudents / overview.totalStudents) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${overview.totalStudents > 0 ? (overview.activeStudents / overview.totalStudents) * 100 : 0}%` }}
              />
            </div>
          </div>

          {overview.churn && overview.churn.length > 0 && (
            <div className="p-3 rounded-xl bg-yellow-500/[0.04] border border-yellow-500/10">
              <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overview.churn.length} aluno{overview.churn.length !== 1 ? "s" : ""} com risco de churn
              </p>
              <p className="text-[10px] text-yellow-400/60 mt-1">Assinaturas expirando nos proximos 30 dias</p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
            <p className="text-[9px] text-amber-400/60 uppercase font-medium mb-1">MRR (Receita Recorrente Mensal)</p>
            <p className="text-2xl font-black text-amber-400">R$ {fmt(overview.currentMRR)}</p>
          </div>
        </div>
      </DetailModal>

      {/* STUDENT LTV DETAIL MODAL */}
      <DetailModal
        open={!!studentModal}
        onClose={() => setStudentModal(null)}
        title={studentModal?.name || "Aluno"}
        icon={Crown}
        iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        maxWidth="max-w-md"
      >
        {studentModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                <p className="text-[9px] text-emerald-400/60 uppercase font-medium mb-1">Total pago (LTV)</p>
                <p className="text-xl font-black text-emerald-400">R$ {fmt(studentModal.totalPaid)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
                <p className="text-[9px] text-blue-400/60 uppercase font-medium mb-1">Media mensal</p>
                <p className="text-xl font-black text-blue-400">R$ {fmt(studentModal.avgMonthly)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Tempo ativo
                </span>
                <span className="text-xs font-semibold text-white">{studentModal.monthsActive} meses</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" /> Pagamentos
                </span>
                <span className="text-xs font-semibold text-white">{studentModal.paymentCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Pontualidade
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  {studentModal.paymentCount > 0 && studentModal.monthsActive > 0
                    ? `${((studentModal.paymentCount / studentModal.monthsActive) * 100).toFixed(0)}%`
                    : "N/A"
                  }
                </span>
              </div>
            </div>

            {/* Compared to avg */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[9px] text-neutral-500 uppercase font-medium mb-2">Comparado com a media</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">LTV medio:</span>
                <span className="text-xs text-neutral-300">R$ {fmt(overview.avgLtv)}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  studentModal.totalPaid >= overview.avgLtv ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                )}>
                  {studentModal.totalPaid >= overview.avgLtv ? "+" : ""}{((studentModal.totalPaid - overview.avgLtv) / (overview.avgLtv || 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* METHOD DETAIL MODAL */}
      <DetailModal
        open={!!methodModal}
        onClose={() => setMethodModal(null)}
        title={`Pagamentos via ${methodLabels[methodModal || ""] || methodModal}`}
        icon={methodIcons[methodModal || ""] || DollarSign}
        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        maxWidth="max-w-md"
      >
        {methodModal && (() => {
          const methodData = overview.revenueByMethod.find(m => m.method === methodModal)
          const methodPayments = payments.filter(p => p.method === methodModal)
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                  <p className="text-[9px] text-emerald-400/60 uppercase font-medium mb-1">Total recebido</p>
                  <p className="text-xl font-black text-emerald-400">R$ {fmt(methodData?.total || 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
                  <p className="text-[9px] text-blue-400/60 uppercase font-medium mb-1">Quantidade</p>
                  <p className="text-xl font-black text-blue-400">{methodData?.count || 0}x</p>
                </div>
              </div>

              {methodPayments.length > 0 && (
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-medium mb-2">Ultimos pagamentos</p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {methodPayments.slice(0, 10).map(pay => (
                      <div key={pay.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                        <div>
                          <p className="text-xs text-white">{pay.student.user.name}</p>
                          <p className="text-[9px] text-neutral-600">{new Date(pay.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">R$ {fmt(pay.amount)}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded", statusConfig[pay.status]?.color || "")}>
                            {statusConfig[pay.status]?.label || pay.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setMethodModal(null); setTab("payments") }}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> Ver todos os pagamentos
              </button>
            </div>
          )
        })()}
      </DetailModal>

      {/* ═══ ADD COST MODAL ═══ */}
      {showAddCost && (
        <AddCostModal onClose={() => setShowAddCost(false)} onSaved={fetchAll} />
      )}

      {/* ═══ ADD PAYMENT MODAL ═══ */}
      {showAddPayment && (
        <AddPaymentModal students={students} onClose={() => setShowAddPayment(false)} onSaved={fetchAll} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// ADD COST MODAL
// ═══════════════════════════════════════

function AddCostModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: "HOSTING",
    name: "",
    amount: "",
    recurrence: "MONTHLY",
    notes: "",
  })

  const suggestions: Record<string, { name: string; amount: string; recurrence: string }[]> = {
    HOSTING: [{ name: "VPS Coolify", amount: "50", recurrence: "MONTHLY" }],
    AI_TOKENS: [{ name: "Claude API (pos-treino)", amount: "30", recurrence: "MONTHLY" }],
    SOFTWARE: [{ name: "Manutencao do app", amount: "500", recurrence: "QUARTERLY" }],
    GAS: [{ name: "Gasolina (personal presencial)", amount: "200", recurrence: "MONTHLY" }],
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/admin/finance/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85dvh] rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Novo Custo</h3>
            <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Categoria</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, category: key }))
                        const sug = suggestions[key]?.[0]
                        if (sug && !form.name) setForm(f => ({ ...f, ...sug }))
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all",
                        form.category === key
                          ? "border-red-500/30 bg-red-500/10 text-white"
                          : "border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: VPS Coolify, Gasolina semanal..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Recorrencia</label>
                <select
                  value={form.recurrence}
                  onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-red-500/30"
                >
                  {Object.entries(recurrenceLabels).map(([k, l]) => (
                    <option key={k} value={k} className="bg-[#0a0a0a]">{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Observacoes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {saving ? "Salvando..." : "Adicionar custo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// ADD PAYMENT MODAL
// ═══════════════════════════════════════

function AddPaymentModal({ students, onClose, onSaved }: {
  students: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    method: "PIX",
    description: "",
    paidAt: new Date().toISOString().split("T")[0],
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/admin/finance/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : null,
      }),
    })
    if (res.ok) {
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85dvh] rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Registrar Pagamento</h3>
            <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Aluno</label>
              <select
                value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/30"
                required
              >
                <option value="" className="bg-[#0a0a0a]">Selecione o aluno</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#0a0a0a]">{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Metodo</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {Object.entries(methodLabels).map(([key, label]) => {
                  const Icon = methodIcons[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, method: key }))}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all",
                        form.method === key
                          ? "border-emerald-500/30 bg-emerald-500/10 text-white"
                          : "border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Data</label>
                <input
                  type="date"
                  value={form.paidAt}
                  onChange={e => setForm(f => ({ ...f, paidAt: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Descricao</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Mensalidade marco, PIX avulso..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {saving ? "Salvando..." : "Registrar pagamento"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
