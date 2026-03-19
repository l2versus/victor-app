"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Users,
  Plus, Fuel, Server, Bot, Wrench, Megaphone, Package,
  CreditCard, Banknote, QrCode, ArrowUpRight, ArrowDownRight,
  X, Check, Clock, AlertTriangle, BarChart3, PieChart,
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
  HOSTING: Server,
  AI_TOKENS: Bot,
  SOFTWARE: Wrench,
  GAS: Fuel,
  EQUIPMENT: Package,
  MARKETING: Megaphone,
  OTHER: DollarSign,
}

const categoryLabels: Record<string, string> = {
  HOSTING: "Hospedagem",
  AI_TOKENS: "Tokens IA",
  SOFTWARE: "Software",
  GAS: "Gasolina",
  EQUIPMENT: "Equipamentos",
  MARKETING: "Marketing",
  OTHER: "Outros",
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

const methodIcons: Record<string, typeof DollarSign> = {
  PIX: QrCode,
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  MERCADOPAGO: Wallet,
  BANK_TRANSFER: ArrowUpRight,
}

const methodLabels: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão",
  MERCADOPAGO: "Mercado Pago",
  BANK_TRANSFER: "Transferência",
}

const recurrenceLabels: Record<string, string> = {
  ONE_TIME: "Único",
  DAILY: "Diário",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  ANNUAL: "Anual",
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  PAID: { label: "Pago", color: "text-emerald-400 bg-emerald-500/10", icon: Check },
  PENDING: { label: "Pendente", color: "text-amber-400 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Atrasado", color: "text-red-400 bg-red-500/10", icon: AlertTriangle },
  CANCELLED: { label: "Cancelado", color: "text-neutral-500 bg-neutral-500/10", icon: X },
}

// ═══════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════

function KpiCard({ title, value, subtitle, trend, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; trend?: number; icon: typeof DollarSign; color: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", color)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
            trend >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
          )}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-neutral-600 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ═══════════════════════════════════════
// MINI BAR CHART
// ═══════════════════════════════════════

function MiniBarChart({ data }: { data: { month: string; revenue: number; costs: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.costs)), 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: 100 }}>
            <div
              className="flex-1 rounded-t bg-emerald-500/60 min-h-[2px] transition-all duration-500"
              style={{ height: `${(d.revenue / maxVal) * 100}%` }}
              title={`Receita: R$ ${fmt(d.revenue)}`}
            />
            <div
              className="flex-1 rounded-t bg-red-500/40 min-h-[2px] transition-all duration-500"
              style={{ height: `${(d.costs / maxVal) * 100}%` }}
              title={`Custos: R$ ${fmt(d.costs)}`}
            />
          </div>
          <span className="text-[9px] text-neutral-600 uppercase">{d.month}</span>
        </div>
      ))}
    </div>
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

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
              tab === t.key ? "bg-white/[0.08] text-white" : "text-neutral-500 hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              title="Receita do mês"
              value={`R$ ${fmt(overview.monthRevenue)}`}
              subtitle={`Mês anterior: R$ ${fmt(overview.lastMonthRevenue)}`}
              trend={overview.revenueGrowth}
              icon={DollarSign}
              color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            />
            <KpiCard
              title="Custos mensais"
              value={`R$ ${fmt(overview.monthlyCosts)}`}
              subtitle={`IA: R$ ${fmt(overview.estimatedAICostBRL)} · ${overview.aiInteractionsMonth} interações`}
              icon={TrendingDown}
              color="text-red-400 bg-red-500/10 border-red-500/20"
            />
            <KpiCard
              title="Lucro líquido"
              value={`R$ ${fmt(overview.monthProfit)}`}
              subtitle={`Margem: ${overview.profitMargin}%`}
              icon={TrendingUp}
              color={overview.monthProfit >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}
            />
            <KpiCard
              title="Assinaturas ativas"
              value={`${overview.activeSubscriptions}`}
              subtitle={`${overview.activeStudents}/${overview.totalStudents} alunos ativos`}
              icon={Users}
              color="text-blue-400 bg-blue-500/10 border-blue-500/20"
            />
          </div>

          {/* Pending alert */}
          {overview.pendingCount > 0 && (
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">{overview.pendingCount} pagamento{overview.pendingCount > 1 ? "s" : ""} pendente{overview.pendingCount > 1 ? "s" : ""}</p>
                <p className="text-xs text-amber-400/60">Total: R$ {fmt(overview.pendingAmount)}</p>
              </div>
              <button onClick={() => setTab("payments")} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                Ver
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue vs Costs Chart */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Receita vs Custos</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" />Receita</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/40" />Custos</span>
                </div>
              </div>
              <MiniBarChart data={overview.revenueByMonth} />
            </div>

            {/* Revenue by Method */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-white">Receita por Método</h3>
              </div>
              {overview.revenueByMethod.length === 0 ? (
                <p className="text-neutral-600 text-sm py-6 text-center">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {overview.revenueByMethod.map(m => {
                    const Icon = methodIcons[m.method] || DollarSign
                    const total = overview.revenueByMethod.reduce((s, x) => s + x.total, 0)
                    const pct = total > 0 ? (m.total / total) * 100 : 0
                    return (
                      <div key={m.method} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-300">{m.label}</span>
                            <span className="text-xs font-semibold text-white">R$ {fmt(m.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/50 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-600 w-8 text-right">{m.count}x</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Costs Breakdown */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Custos por Categoria (mensal)</h3>
              {Object.keys(overview.costsByCategory).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-600 text-sm mb-2">Nenhum custo cadastrado</p>
                  <button onClick={() => { setTab("costs"); setShowAddCost(true) }} className="text-xs text-red-400 hover:text-red-300">
                    + Adicionar custo
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(overview.costsByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount]) => {
                      const Icon = categoryIcons[cat] || DollarSign
                      const colors = categoryColors[cat] || categoryColors.OTHER
                      return (
                        <div key={cat} className="flex items-center gap-3 py-1">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", colors)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="flex-1 text-xs text-neutral-300">{categoryLabels[cat] || cat}</span>
                          <span className="text-sm font-semibold text-white">R$ {fmt(amount)}</span>
                        </div>
                      )
                    })}
                  <div className="border-t border-white/[0.06] pt-2 mt-2 flex justify-between">
                    <span className="text-xs text-neutral-500 font-medium">Total mensal</span>
                    <span className="text-sm font-bold text-white">R$ {fmt(overview.monthlyCosts)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Usage */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Uso de IA este mês</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
                  <p className="text-2xl font-black text-purple-300">{overview.aiInteractionsMonth}</p>
                  <p className="text-[10px] text-purple-400/60 mt-0.5">Interações pós-treino</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
                  <p className="text-2xl font-black text-purple-300">R$ {fmt(overview.estimatedAICostBRL)}</p>
                  <p className="text-[10px] text-purple-400/60 mt-0.5">Custo estimado</p>
                </div>
              </div>
              <p className="text-[10px] text-neutral-600 mt-3 leading-relaxed">
                Apenas planos Pro e Elite usam IA (chat pós-treino). Custo médio: ~R$ 0,025/interação.
                Plano Essencial não gera custo de IA.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COSTS TAB ═══ */}
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
                      ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
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
                      title={cost.active ? "Desativar" : "Ativar"}
                    >
                      {cost.active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ PAYMENTS TAB ═══ */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Pagamentos</h3>
            <button
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar pagamento
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(pay => {
                const Icon = methodIcons[pay.method] || DollarSign
                const st = statusConfig[pay.status] || statusConfig.PENDING
                return (
                  <div key={pay.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-all">
                    <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
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
                      {st.label}
                    </div>
                    {pay.status !== "PAID" && pay.status !== "CANCELLED" && (
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
                        title="Marcar como pago"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
    AI_TOKENS: [{ name: "Claude API (pós-treino)", amount: "30", recurrence: "MONTHLY" }],
    SOFTWARE: [{ name: "Manutenção do app", amount: "500", recurrence: "QUARTERLY" }],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Novo Custo</h3>
            <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
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

            {/* Name */}
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
              {/* Amount */}
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

              {/* Recurrence */}
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Recorrência</label>
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

            {/* Notes */}
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Observações</label>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Registrar Pagamento</h3>
            <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student */}
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Aluno</label>
              <select
                value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-red-500/30"
                required
              >
                <option value="" className="bg-[#0a0a0a]">Selecione o aluno</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#0a0a0a]">{s.name}</option>
                ))}
              </select>
            </div>

            {/* Method */}
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Método</label>
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
              {/* Amount */}
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

              {/* Date */}
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Data</label>
                <input
                  type="date"
                  value={form.paidAt}
                  onChange={e => setForm(f => ({ ...f, paidAt: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-red-500/30"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-neutral-400 font-medium mb-1.5 block">Descrição</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Mensalidade março, PIX avulso..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30"
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
