"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart,
  Calculator, Plus, Trash2, Power, Receipt, ArrowUpRight,
  ArrowDownRight, Users, Zap, Globe, Smartphone, Shield,
  Megaphone, Scale, UserCog, HelpCircle, RefreshCw, X,
  Target, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface OverviewData {
  mrr: number
  arr: number
  monthlyCosts: number
  profit: number
  margin: number
  activeOrgs: number
  totalOrgs: number
  churnRate: number
  ticketMedio: number
  ltv: number
  cac: number
  activeSubscriptions: number
  cancelledLast30: number
  newOrgsLast30: number
  estimatedAiCostBRL: number
  aiInteractions: number
  totalAiTokens: number
  costsByCategory: Record<string, number>
  mrrEvolution: { month: string; mrr: number; costs: number }[]
  revenueByPlan: { name: string; mrr: number; count: number }[]
  churnTrend: { month: string; cancelled: number; total: number; rate: number }[]
}

interface MasterCost {
  id: string
  category: string
  name: string
  amount: number
  recurrence: string
  active: boolean
  notes: string | null
  createdAt: string
}

interface CalcDefaults {
  avgPlanPrice: number
  aiCostPerOrgBRL: number
  hostingPerOrg: number
  whatsappPerOrg: number
  currentOrgs: number
}

interface ProjectionMonth {
  month: number
  subscribers: number
  mrr: number
  costs: number
  profit: number
  accumulated: number
  margin: number
}

interface ProjectionScenario {
  label: string
  monthlyMetrics: ProjectionMonth[]
  breakEvenMonth: number | null
}

interface ProjectionsData {
  current: {
    mrr: number
    costs: number
    profit: number
    subscribers: number
    churnRate: number
    growthRate: number
    ticketMedio: number
  }
  scenarios: Record<string, ProjectionScenario>
}

const TABS = [
  { key: "overview", label: "Visão Geral", icon: BarChart3 },
  { key: "costs", label: "Custos", icon: Receipt },
  { key: "calculator", label: "Calculadora", icon: Calculator },
  { key: "projections", label: "Projeções", icon: TrendingUp },
] as const

type TabKey = (typeof TABS)[number]["key"]

const CATEGORY_META: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  AI_TOKENS: { label: "IA / Tokens", icon: Zap, color: "text-violet-400" },
  HOSTING: { label: "Hospedagem", icon: Globe, color: "text-blue-400" },
  WHATSAPP: { label: "WhatsApp / Z-API", icon: Smartphone, color: "text-emerald-400" },
  DOMAINS: { label: "Domínios / DNS", icon: Globe, color: "text-cyan-400" },
  SOFTWARE: { label: "Software / Ferramentas", icon: Shield, color: "text-amber-400" },
  MARKETING: { label: "Marketing / Ads", icon: Megaphone, color: "text-pink-400" },
  LEGAL: { label: "Jurídico / Contabilidade", icon: Scale, color: "text-orange-400" },
  TEAM: { label: "Equipe / Salários", icon: UserCog, color: "text-indigo-400" },
  OTHER: { label: "Outros", icon: HelpCircle, color: "text-zinc-400" },
}

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const PCT = (v: number) => `${v.toFixed(1)}%`

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function FinanceMasterClient() {
  const [tab, setTab] = useState<TabKey>("overview")
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [costs, setCosts] = useState<MasterCost[]>([])
  const [calcDefaults, setCalcDefaults] = useState<CalcDefaults | null>(null)
  const [projections, setProjections] = useState<ProjectionsData | null>(null)
  const [projectionsLoading, setProjectionsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/master/finance/overview")
      if (res.ok) setOverview(await res.json())
    } catch {}
  }, [])

  const fetchCosts = useCallback(async () => {
    try {
      const res = await fetch("/api/master/finance/costs")
      if (res.ok) setCosts(await res.json())
    } catch {}
  }, [])

  const fetchCalcDefaults = useCallback(async () => {
    try {
      const res = await fetch("/api/master/finance/calculator")
      if (res.ok) setCalcDefaults(await res.json())
    } catch {}
  }, [])

  const fetchProjections = useCallback(async () => {
    if (projections) return // already loaded
    setProjectionsLoading(true)
    try {
      const res = await fetch("/api/master/finance/projections")
      if (res.ok) setProjections(await res.json())
    } catch {} finally { setProjectionsLoading(false) }
  }, [projections])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchOverview(), fetchCosts(), fetchCalcDefaults()]).finally(() => setLoading(false))
  }, [fetchOverview, fetchCosts, fetchCalcDefaults])

  // Lazy-load projections when tab is selected
  useEffect(() => {
    if (tab === "projections") fetchProjections()
  }, [tab, fetchProjections])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-zinc-900 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-sm text-zinc-500">Visão financeira da plataforma ONEFIT</p>
          </div>
          <button onClick={() => { fetchOverview(); fetchCosts(); setProjections(null) }} className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/50 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
                tab === t.key ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && overview && <OverviewTab data={overview} />}
        {tab === "costs" && <CostsTab costs={costs} onRefresh={fetchCosts} />}
        {tab === "calculator" && <CalculatorTab defaults={calcDefaults} />}
        {tab === "projections" && (
          projectionsLoading ? (
            <div className="space-y-4">
              <div className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
              <div className="h-64 bg-zinc-900 rounded-xl animate-pulse" />
            </div>
          ) : projections ? (
            <ProjectionsTab data={projections} />
          ) : (
            <div className="text-center py-12 text-zinc-600">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Erro ao carregar projeções</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ data }: { data: OverviewData }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <KpiCard label="MRR" value={BRL(data.mrr)} icon={DollarSign} color="violet" tooltip="Receita Recorrente Mensal — quanto tu fatura por mês com assinaturas ativas. É o número mais importante do SaaS." />
        <KpiCard label="ARR" value={BRL(data.arr)} icon={TrendingUp} color="violet" tooltip="Receita Recorrente Anual — é o MRR × 12. Mostra o potencial anual se manter o ritmo atual." />
        <KpiCard label="Custos/mês" value={BRL(data.monthlyCosts)} icon={TrendingDown} color="red" tooltip="Soma de todos os custos operacionais mensais — hospedagem, IA, WhatsApp, domínios, marketing, equipe, etc." />
        <KpiCard label="Lucro Líquido" value={BRL(data.profit)} icon={DollarSign} color={data.profit >= 0 ? "emerald" : "red"} tooltip="MRR menos custos. Se tá verde, tu tá lucrando. Se tá vermelho, tá gastando mais do que fatura." />
        <KpiCard label="Margem" value={PCT(data.margin)} icon={PieChart} color={data.margin >= 50 ? "emerald" : data.margin >= 0 ? "amber" : "red"} tooltip="Percentual do faturamento que sobra depois dos custos. Acima de 50% é excelente pra SaaS. Acima de 80% é elite." />
        <KpiCard label="Orgs Ativas" value={String(data.activeOrgs)} sub={`de ${data.totalOrgs}`} icon={Users} color="blue" tooltip="Quantas academias/profissionais estão com assinatura ativa na plataforma." />
        <KpiCard label="Churn" value={PCT(data.churnRate)} sub={`${data.cancelledLast30} cancel.`} icon={TrendingDown} color={data.churnRate < 5 ? "emerald" : "red"} tooltip="Taxa de cancelamento mensal. Abaixo de 5% é bom. Acima de 10% é preocupante — significa que tá perdendo clientes rápido demais." />
        <KpiCard label="Ticket Médio" value={BRL(data.ticketMedio)} icon={Receipt} color="violet" tooltip="Valor médio que cada cliente paga por mês. Quanto maior, melhor — significa que estão nos planos mais caros." />
        <KpiCard label="LTV" value={BRL(data.ltv)} icon={TrendingUp} color="emerald" tooltip="Lifetime Value — quanto um cliente vale durante toda a vida dele na plataforma. Calculado: ticket médio ÷ churn. Se o LTV for 10x o CAC, o negócio é muito saudável." />
        <KpiCard label="CAC" value={BRL(data.cac)} icon={Megaphone} color="amber" tooltip="Custo de Aquisição de Cliente — quanto tu gasta em marketing/vendas pra conquistar 1 novo cliente. Ideal: LTV ser pelo menos 3x maior que o CAC." />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* MRR Evolution */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Evolução MRR (6 meses)</h3>
          <div className="flex items-end gap-2 h-40">
            {data.mrrEvolution.map((m, i) => {
              const maxVal = Math.max(...data.mrrEvolution.map(e => Math.max(e.mrr, e.costs)), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                    <div className="flex-1 bg-violet-600 rounded-t" style={{ height: `${(m.mrr / maxVal) * 100}%`, minHeight: "2px" }} />
                    <div className="flex-1 bg-red-600/60 rounded-t" style={{ height: `${(m.costs / maxVal) * 100}%`, minHeight: "2px" }} />
                  </div>
                  <span className="text-[10px] text-zinc-500">{m.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-600" /> MRR</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-600/60" /> Custos</span>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Receita por Plano</h3>
          {data.revenueByPlan.length === 0 ? (
            <p className="text-zinc-600 text-sm">Nenhuma assinatura ativa</p>
          ) : (
            <div className="space-y-3">
              {data.revenueByPlan.map((p, i) => {
                const maxMrr = Math.max(...data.revenueByPlan.map(x => x.mrr), 1)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300">{p.name} <span className="text-zinc-600">({p.count})</span></span>
                      <span className="text-violet-400 font-medium">{BRL(p.mrr)}/mês</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${(p.mrr / maxMrr) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Costs Breakdown + Churn + AI */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Costs by Category */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Custos por Categoria</h3>
          <div className="space-y-2">
            {Object.entries(data.costsByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.OTHER
              return (
                <div key={cat} className="flex items-center justify-between">
                  <span className={cn("text-sm flex items-center gap-2", meta.color)}>
                    <meta.icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </span>
                  <span className="text-sm text-zinc-300">{BRL(val)}</span>
                </div>
              )
            })}
            {Object.keys(data.costsByCategory).length === 0 && (
              <p className="text-zinc-600 text-sm">Nenhum custo cadastrado</p>
            )}
          </div>
        </div>

        {/* Churn Trend */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Churn (3 meses)</h3>
          <div className="space-y-3">
            {data.churnTrend.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400 w-10">{m.month}</span>
                <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", m.rate > 10 ? "bg-red-500" : m.rate > 5 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(m.rate, 100)}%` }} />
                </div>
                <span className="text-sm text-zinc-300 w-12 text-right">{PCT(m.rate)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Usage */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Custo IA (30 dias)</h3>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-violet-400">{BRL(data.estimatedAiCostBRL)}</p>
              <p className="text-xs text-zinc-500 mt-1">Estimativa baseada em tokens Groq</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Interações</span>
                <span className="text-zinc-300">{data.aiInteractions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tokens totais</span>
                <span className="text-zinc-300">{(data.totalAiTokens / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Custo/org estimado</span>
                <span className="text-zinc-300">{data.activeOrgs > 0 ? BRL(data.estimatedAiCostBRL / data.activeOrgs) : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════

function KpiCard({ label, value, sub, icon: Icon, color, tooltip }: {
  label: string; value: string; sub?: string; icon: typeof DollarSign; color: string; tooltip?: string
}) {
  const [showTip, setShowTip] = useState(false)
  const colorMap: Record<string, string> = {
    violet: "text-violet-400 bg-violet-600/10",
    emerald: "text-emerald-400 bg-emerald-600/10",
    red: "text-red-400 bg-red-600/10",
    amber: "text-amber-400 bg-amber-600/10",
    blue: "text-blue-400 bg-blue-600/10",
  }
  const [textC, bgC] = (colorMap[color] || colorMap.violet).split(" ")

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative" onClick={() => tooltip && setShowTip(!showTip)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", bgC)}>
          <Icon className={cn("w-3.5 h-3.5", textC)} />
        </div>
        <span className="text-xs text-zinc-500">{label}</span>
        {tooltip && <HelpCircle className="w-3 h-3 text-zinc-600 cursor-pointer" />}
      </div>
      {showTip && tooltip && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 leading-relaxed shadow-xl">
          {tooltip}
        </div>
      )}
      <p className="text-lg font-bold text-white truncate">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COSTS TAB
// ═══════════════════════════════════════════════════════════════

function CostsTab({ costs, onRefresh }: { costs: MasterCost[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: "HOSTING", name: "", amount: "", recurrence: "MONTHLY", notes: "" })
  const [saving, setSaving] = useState(false)

  const totalMonthly = costs.filter(c => c.active).reduce((sum, c) => {
    if (c.recurrence === "ANNUAL") return sum + c.amount / 12
    if (c.recurrence === "ONE_TIME") return sum
    return sum + c.amount
  }, 0)

  async function saveCost() {
    if (!form.name || !form.amount) return
    setSaving(true)
    try {
      const res = await fetch("/api/master/finance/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (res.ok) {
        setForm({ category: "HOSTING", name: "", amount: "", recurrence: "MONTHLY", notes: "" })
        setShowForm(false)
        onRefresh()
      }
    } finally { setSaving(false) }
  }

  async function toggleCost(id: string, active: boolean) {
    await fetch("/api/master/finance/costs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    })
    onRefresh()
  }

  async function deleteCost(id: string) {
    if (!confirm("Excluir este custo?")) return
    await fetch("/api/master/finance/costs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custos Operacionais</h3>
          <p className="text-sm text-zinc-500">Total mensal: <span className="text-red-400 font-medium">{BRL(totalMonthly)}</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome (ex: Vercel Pro)" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Valor (R$)" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
            <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              <option value="MONTHLY">Mensal</option>
              <option value="ANNUAL">Anual</option>
              <option value="ONE_TIME">Único</option>
            </select>
          </div>
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações (opcional)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={saveCost} disabled={saving || !form.name || !form.amount} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cost List */}
      <div className="space-y-2">
        {costs.map(c => {
          const meta = CATEGORY_META[c.category] || CATEGORY_META.OTHER
          return (
            <div key={c.id} className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-center gap-3", !c.active && "opacity-50")}>
              <div className={cn("p-2 rounded-lg bg-zinc-800", meta.color)}>
                <meta.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <p className="text-xs text-zinc-500">{meta.label} · {c.recurrence === "ANNUAL" ? "Anual" : c.recurrence === "ONE_TIME" ? "Único" : "Mensal"}</p>
              </div>
              <span className="text-sm font-semibold text-zinc-300 shrink-0">{BRL(c.amount)}</span>
              <button onClick={() => toggleCost(c.id, c.active)} className={cn("p-1.5 rounded-lg transition", c.active ? "text-emerald-400 hover:bg-emerald-600/10" : "text-zinc-600 hover:bg-zinc-800")}>
                <Power className="w-4 h-4" />
              </button>
              <button onClick={() => deleteCost(c.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-600/10 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
        {costs.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum custo cadastrado</p>
            <p className="text-sm mt-1">Adicione seus custos operacionais pra calcular a margem</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CALCULATOR TAB
// ═══════════════════════════════════════════════════════════════

function CalculatorTab({ defaults }: { defaults: CalcDefaults | null }) {
  const [clients, setClients] = useState(defaults?.currentOrgs || 10)
  const [planPrice, setPlanPrice] = useState(defaults?.avgPlanPrice || 197)
  const [aiCost, setAiCost] = useState(defaults?.aiCostPerOrgBRL || 3)
  const [hostingCost, setHostingCost] = useState(defaults?.hostingPerOrg || 15)
  const [whatsappCost, setWhatsappCost] = useState(defaults?.whatsappPerOrg || 50)
  const [overhead, setOverhead] = useState(15) // % taxes + payment fees

  useEffect(() => {
    if (defaults) {
      setClients(defaults.currentOrgs || 10)
      setPlanPrice(defaults.avgPlanPrice || 197)
      setAiCost(defaults.aiCostPerOrgBRL || 3)
      setHostingCost(defaults.hostingPerOrg || 15)
      setWhatsappCost(defaults.whatsappPerOrg || 50)
    }
  }, [defaults])

  // Calculations
  const revenue = clients * planPrice
  const variableCosts = clients * (aiCost + hostingCost + whatsappCost)
  const overheadCost = revenue * (overhead / 100)
  const totalCosts = variableCosts + overheadCost
  const profit = revenue - totalCosts
  const profitPerClient = clients > 0 ? profit / clients : 0
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const breakeven = profitPerClient > 0 ? Math.ceil(overheadCost / (planPrice - aiCost - hostingCost - whatsappCost - planPrice * overhead / 100)) : 0
  const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Calculadora de Operação</h3>
        <p className="text-sm text-zinc-500">Simule cenários de revenda da plataforma</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-300">Parâmetros</h4>

          <CalcInput label="Número de clientes" value={clients} onChange={setClients} min={1} max={500} step={1} suffix="academias" />
          <CalcInput label="Plano médio" value={planPrice} onChange={setPlanPrice} min={50} max={1000} step={10} suffix="R$/mês" />
          <CalcInput label="Custo IA por org" value={aiCost} onChange={setAiCost} min={0} max={50} step={0.5} suffix="R$/mês" />
          <CalcInput label="Custo hospedagem por org" value={hostingCost} onChange={setHostingCost} min={0} max={100} step={1} suffix="R$/mês" />
          <CalcInput label="Custo WhatsApp por org" value={whatsappCost} onChange={setWhatsappCost} min={0} max={200} step={5} suffix="R$/mês" />
          <CalcInput label="Overhead (impostos + taxas)" value={overhead} onChange={setOverhead} min={0} max={50} step={1} suffix="%" />
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Resultado Mensal</h4>
            <div className="space-y-3">
              <ResultRow label="Receita mensal" value={BRL(revenue)} color="text-violet-400" icon={ArrowUpRight} />
              <ResultRow label="Custos variáveis" value={BRL(variableCosts)} color="text-red-400" icon={ArrowDownRight} sub={`${BRL(aiCost + hostingCost + whatsappCost)}/org`} />
              <ResultRow label="Overhead" value={BRL(overheadCost)} color="text-amber-400" icon={ArrowDownRight} sub={`${overhead}%`} />
              <div className="border-t border-zinc-800 pt-3">
                <ResultRow label="Lucro líquido" value={BRL(profit)} color={profit >= 0 ? "text-emerald-400" : "text-red-400"} icon={DollarSign} bold />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniCard label="Margem" value={PCT(margin)} color={margin >= 50 ? "emerald" : margin >= 0 ? "amber" : "red"} />
            <MiniCard label="Lucro/cliente" value={BRL(profitPerClient)} color={profitPerClient >= 0 ? "emerald" : "red"} />
            <MiniCard label="Break-even" value={`${breakeven} clientes`} color="blue" />
            <MiniCard label="ROI" value={PCT(roi)} color={roi >= 100 ? "emerald" : "amber"} />
          </div>

          {/* Scale Projection */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">Projeção de Escala</h4>
            <div className="space-y-2 text-sm">
              {[10, 25, 50, 100, 200].map(n => {
                const rev = n * planPrice
                const cost = n * (aiCost + hostingCost + whatsappCost) + rev * (overhead / 100)
                const prof = rev - cost
                return (
                  <div key={n} className={cn("flex justify-between items-center py-1", n === clients && "bg-violet-600/10 -mx-2 px-2 rounded")}>
                    <span className="text-zinc-400">{n} clientes</span>
                    <span className="text-zinc-300">{BRL(rev)}</span>
                    <span className={prof >= 0 ? "text-emerald-400" : "text-red-400"}>{BRL(prof)}</span>
                    <span className={cn("text-xs", prof >= 0 ? "text-emerald-600" : "text-red-600")}>{PCT(rev > 0 ? (prof / rev) * 100 : 0)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROJECTIONS TAB
// ═══════════════════════════════════════════════════════════════

type ScenarioKey = "pessimistic" | "realistic" | "optimistic"

const SCENARIO_META: Record<ScenarioKey, { label: string; color: string; bg: string; border: string; barColor: string; accent: string }> = {
  pessimistic: { label: "Pessimista", color: "text-red-400", bg: "bg-red-600/10", border: "border-red-800/50", barColor: "bg-red-500", accent: "text-red-300" },
  realistic: { label: "Realista", color: "text-violet-400", bg: "bg-violet-600/10", border: "border-violet-800/50", barColor: "bg-violet-500", accent: "text-violet-300" },
  optimistic: { label: "Otimista", color: "text-emerald-400", bg: "bg-emerald-600/10", border: "border-emerald-800/50", barColor: "bg-emerald-500", accent: "text-emerald-300" },
}

function ProjectionsTab({ data }: { data: ProjectionsData }) {
  const [scenario, setScenario] = useState<ScenarioKey>("realistic")

  const current = data.current
  const activeScenario = data.scenarios[scenario]
  const meta = SCENARIO_META[scenario]

  if (!activeScenario) return null

  const metrics = activeScenario.monthlyMetrics

  // Max values for chart scaling
  const maxMrrCost = Math.max(...metrics.map(m => Math.max(m.mrr, m.costs)), 1)
  const maxAccumulated = Math.max(...metrics.map(m => Math.abs(m.accumulated)), 1)

  return (
    <div className="space-y-6">
      {/* ── Current Snapshot KPIs ── */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Snapshot Atual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="MRR Atual" value={BRL(current.mrr)} icon={DollarSign} color="violet" />
          <KpiCard label="Custos Atuais" value={BRL(current.costs)} icon={TrendingDown} color="red" />
          <KpiCard label="Lucro Atual" value={BRL(current.profit)} icon={DollarSign} color={current.profit >= 0 ? "emerald" : "red"} />
          <KpiCard label="Assinantes" value={String(current.subscribers)} icon={Users} color="blue" />
          <KpiCard label="Churn" value={PCT(current.churnRate)} icon={TrendingDown} color={current.churnRate < 5 ? "emerald" : "red"} />
          <KpiCard label="Growth Rate" value={PCT(current.growthRate)} icon={TrendingUp} color={current.growthRate > 0 ? "emerald" : "amber"} />
          <KpiCard label="Ticket Médio" value={BRL(current.ticketMedio)} icon={Receipt} color="violet" />
        </div>
      </div>

      {/* ── Scenario Selector ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm text-zinc-500 shrink-0">Cenário:</span>
        <div className="flex gap-1 bg-zinc-900/50 rounded-xl p-1">
          {(Object.keys(SCENARIO_META) as ScenarioKey[]).map(key => {
            const sm = SCENARIO_META[key]
            const isActive = scenario === key
            return (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition",
                  isActive
                    ? cn(sm.barColor, "text-white")
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
              >
                {sm.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Break-even Indicators ── */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(SCENARIO_META) as ScenarioKey[]).map(key => {
          const sc = data.scenarios[key]
          const sm = SCENARIO_META[key]
          if (!sc) return null
          const be = sc.breakEvenMonth
          let badgeColor = "bg-red-600/15 text-red-400 border-red-800/40"
          let icon = AlertTriangle
          if (be !== null && be <= 1) {
            badgeColor = "bg-emerald-600/15 text-emerald-400 border-emerald-800/40"
            icon = CheckCircle2
          } else if (be !== null && be <= 6) {
            badgeColor = "bg-amber-600/15 text-amber-400 border-amber-800/40"
            icon = Clock
          }
          const Icon = icon
          return (
            <div key={key} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm", badgeColor)}>
              <Icon className="w-3.5 h-3.5" />
              <span className="font-medium">{sm.label}:</span>
              {be !== null ? `Break-even no mês ${be}` : "Sem break-even em 12 meses"}
            </div>
          )
        })}
      </div>

      {/* ── 12-Month Timeline Chart ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">
          Projeção 12 Meses — {meta.label}
        </h3>

        {/* Bar chart: MRR vs Costs */}
        <div className="flex items-end gap-1.5 h-48 mb-2">
          {metrics.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                <div
                  className={cn("flex-1 rounded-t transition-all", meta.barColor)}
                  style={{ height: `${(m.mrr / maxMrrCost) * 100}%`, minHeight: "2px" }}
                />
                <div
                  className="flex-1 bg-red-600/60 rounded-t transition-all"
                  style={{ height: `${(m.costs / maxMrrCost) * 100}%`, minHeight: "2px" }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">M{m.month}</span>

              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="font-semibold text-zinc-200 mb-1">Mês {m.month}</p>
                  <p className={meta.color}>MRR: {BRL(m.mrr)}</p>
                  <p className="text-red-400">Custos: {BRL(m.costs)}</p>
                  <p className={m.profit >= 0 ? "text-emerald-400" : "text-red-400"}>
                    Lucro: {BRL(m.profit)}
                  </p>
                  <p className="text-zinc-400">Acumulado: {BRL(m.accumulated)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Accumulated profit line (simplified bar representation) */}
        <div className="mt-4">
          <p className="text-xs text-zinc-500 mb-2">Lucro Acumulado</p>
          <div className="flex items-center gap-1.5 h-10">
            {metrics.map((m) => {
              const pct = maxAccumulated > 0 ? (Math.abs(m.accumulated) / maxAccumulated) * 100 : 0
              const isPositive = m.accumulated >= 0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all",
                      isPositive ? "bg-emerald-500/70" : "bg-red-500/70"
                    )}
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className={cn("w-2 h-2 rounded", meta.barColor)} /> MRR
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-600/60" /> Custos
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500/70" /> Acumulado +
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500/70" /> Acumulado -
          </span>
        </div>
      </div>

      {/* ── Key Metrics Table ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300">
            Detalhamento Mensal — {meta.label}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left px-4 py-2 font-medium">Mês</th>
                <th className="text-right px-4 py-2 font-medium">Assinantes</th>
                <th className="text-right px-4 py-2 font-medium">MRR</th>
                <th className="text-right px-4 py-2 font-medium">Custos</th>
                <th className="text-right px-4 py-2 font-medium">Lucro</th>
                <th className="text-right px-4 py-2 font-medium">Acumulado</th>
                <th className="text-right px-4 py-2 font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr
                  key={m.month}
                  className={cn(
                    "border-b border-zinc-800/50 hover:bg-zinc-800/30 transition",
                    activeScenario.breakEvenMonth === m.month && "bg-emerald-600/5"
                  )}
                >
                  <td className="px-4 py-2 text-zinc-300 font-medium">Mês {m.month}</td>
                  <td className="px-4 py-2 text-right text-zinc-300">{m.subscribers}</td>
                  <td className={cn("px-4 py-2 text-right font-medium", meta.color)}>{BRL(m.mrr)}</td>
                  <td className="px-4 py-2 text-right text-red-400">{BRL(m.costs)}</td>
                  <td className={cn("px-4 py-2 text-right font-medium", m.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {BRL(m.profit)}
                  </td>
                  <td className={cn("px-4 py-2 text-right", m.accumulated >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {BRL(m.accumulated)}
                  </td>
                  <td className={cn("px-4 py-2 text-right", m.margin >= 50 ? "text-emerald-400" : m.margin >= 0 ? "text-amber-400" : "text-red-400")}>
                    {PCT(m.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comparison Cards (Month 6 & 12) ── */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Comparativo dos Cenários</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[6, 12].map(targetMonth => (
            <div key={targetMonth} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Mês {targetMonth}</h4>
              <div className="space-y-3">
                {(Object.keys(SCENARIO_META) as ScenarioKey[]).map(key => {
                  const sc = data.scenarios[key]
                  const sm = SCENARIO_META[key]
                  if (!sc) return null
                  const m = sc.monthlyMetrics[targetMonth - 1]
                  if (!m) return null
                  return (
                    <div key={key} className={cn("border rounded-lg p-3", sm.border, key === scenario && "ring-1 ring-zinc-600")}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("w-2 h-2 rounded-full", sm.barColor)} />
                        <span className={cn("text-sm font-medium", sm.color)}>{sm.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-zinc-500">MRR</p>
                          <p className={cn("font-semibold", sm.accent)}>{BRL(m.mrr)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Lucro</p>
                          <p className={cn("font-semibold", m.profit >= 0 ? "text-emerald-400" : "text-red-400")}>{BRL(m.profit)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Acumulado</p>
                          <p className={cn("font-semibold", m.accumulated >= 0 ? "text-emerald-400" : "text-red-400")}>{BRL(m.accumulated)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CalcInput({ label, value, onChange, min, max, step, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix: string
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{value} {suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-600"
      />
    </div>
  )
}

function ResultRow({ label, value, color, icon: Icon, sub, bold }: {
  label: string; value: string; color: string; icon: typeof DollarSign; sub?: string; bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className={cn("text-sm", bold ? "text-white font-semibold" : "text-zinc-400")}>{label}</span>
        {sub && <span className="text-xs text-zinc-600">({sub})</span>}
      </div>
      <span className={cn("font-medium", bold ? "text-lg" : "text-sm", color)}>{value}</span>
    </div>
  )
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-800/50 text-emerald-400",
    red: "border-red-800/50 text-red-400",
    amber: "border-amber-800/50 text-amber-400",
    blue: "border-blue-800/50 text-blue-400",
  }
  return (
    <div className={cn("bg-zinc-900/50 border rounded-xl p-3 text-center", colorMap[color] || colorMap.amber)}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
