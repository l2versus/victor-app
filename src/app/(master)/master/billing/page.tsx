"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  CreditCard,
  Receipt,
  Package,
  Plus,
  X,
  Pencil,
  Trash2,
  TrendingUp,
  Users,
  UserCog,
  ChevronDown,
  Check,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import dynamic from "next/dynamic"

const B2CPlansTab = dynamic(() => import("./B2CPlansTab"), { ssr: false })

// ═══ TYPES ═══

interface BillingOverview {
  totalMrr: number
  activeSubscriptions: number
  overdueInvoices: number
  pendingInvoices: number
  ticketMedio: number
  mrrByPlan: { name: string; mrr: number; count: number }[]
}

interface SaasPlan {
  id: string
  name: string
  price: number
  interval: string
  maxProfessionals: number
  maxStudents: number
  features: Record<string, boolean> | null
  active: boolean
  _count?: { subscriptions: number }
}

interface Subscription {
  id: string
  organizationId: string
  planId: string
  status: string
  startDate: string
  endDate: string | null
  trialEndsAt: string | null
  cancelledAt: string | null
  organization: { id: string; name: string; slug: string }
  plan: { id: string; name: string; price: number; interval: string }
}

interface Invoice {
  id: string
  subscriptionId: string
  amount: number
  status: string
  dueDate: string
  paidAt: string | null
  referenceMonth: string
  subscription: {
    organization: { name: string }
    plan: { name: string }
  }
}

// ═══ CONSTANTS ═══

const TABS = [
  { key: "overview", label: "Visao Geral", icon: TrendingUp },
  { key: "plans", label: "Planos SaaS", icon: Package },
  { key: "b2c", label: "Planos B2C", icon: ShoppingBag },
  { key: "subscriptions", label: "Assinaturas", icon: CreditCard },
  { key: "invoices", label: "Faturas", icon: Receipt },
] as const

type TabKey = (typeof TABS)[number]["key"]

const INTERVALS: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
}

const SUB_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  TRIAL: { label: "Trial", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  PAST_DUE: { label: "Inadimplente", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  CANCELLED: { label: "Cancelado", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
  EXPIRED: { label: "Expirado", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
}

const INVOICE_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pendente", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  paid: { label: "Pago", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  overdue: { label: "Vencido", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
}

const FEATURE_OPTIONS = [
  { key: "crm", label: "CRM" },
  { key: "community", label: "Comunidade" },
  { key: "aiChat", label: "IA Chat" },
  { key: "postureAi", label: "Correcao Postura" },
  { key: "machines3d", label: "3D Maquinas" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

// ═══ MAIN PAGE ═══

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [overview, setOverview] = useState<BillingOverview | null>(null)
  const [plans, setPlans] = useState<SaasPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceFilter, setInvoiceFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null)

  const fetchOverview = useCallback(() => {
    fetch("/api/master/billing")
      .then((r) => r.json())
      .then((d) => setOverview(d))
      .catch(() => {})
  }, [])

  const fetchPlans = useCallback(() => {
    fetch("/api/master/billing/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d))
      .catch(() => {})
  }, [])

  const fetchSubscriptions = useCallback(() => {
    fetch("/api/master/billing/subscriptions")
      .then((r) => r.json())
      .then((d) => setSubscriptions(d))
      .catch(() => {})
  }, [])

  const fetchInvoices = useCallback(
    (filter?: string) => {
      const f = filter ?? invoiceFilter
      const qs = f !== "all" ? `?status=${f}` : ""
      fetch(`/api/master/billing/invoices${qs}`)
        .then((r) => r.json())
        .then((d) => setInvoices(d))
        .catch(() => {})
    },
    [invoiceFilter]
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/master/billing").then((r) => r.json()),
      fetch("/api/master/billing/plans").then((r) => r.json()),
      fetch("/api/master/billing/subscriptions").then((r) => r.json()),
      fetch("/api/master/billing/invoices").then((r) => r.json()),
    ])
      .then(([ov, pl, sub, inv]) => {
        setOverview(ov)
        setPlans(Array.isArray(pl) ? pl : [])
        setSubscriptions(Array.isArray(sub) ? sub : [])
        setInvoices(Array.isArray(inv) ? inv : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleInvoiceFilter = (f: string) => {
    setInvoiceFilter(f)
    fetchInvoices(f)
  }

  const handleDeletePlan = async (id: string) => {
    await fetch(`/api/master/billing/plans/${id}`, { method: "DELETE" })
    fetchPlans()
  }

  const handleEditPlan = (plan: SaasPlan) => {
    setEditingPlan(plan)
    setShowPlanModal(true)
  }

  const handleNewPlan = () => {
    setEditingPlan(null)
    setShowPlanModal(true)
  }

  const handlePlanSaved = () => {
    setShowPlanModal(false)
    setEditingPlan(null)
    fetchPlans()
    fetchOverview()
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Faturamento{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-300">
                SaaS
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Planos, assinaturas e faturas da plataforma
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <OverviewTab key="overview" data={overview} loading={loading} />
        )}
        {activeTab === "plans" && (
          <PlansTab
            key="plans"
            plans={plans}
            loading={loading}
            onNew={handleNewPlan}
            onEdit={handleEditPlan}
            onDelete={handleDeletePlan}
          />
        )}
        {activeTab === "b2c" && <B2CPlansTab key="b2c" />}
        {activeTab === "subscriptions" && (
          <SubscriptionsTab key="subscriptions" subscriptions={subscriptions} loading={loading} />
        )}
        {activeTab === "invoices" && (
          <InvoicesTab
            key="invoices"
            invoices={invoices}
            loading={loading}
            filter={invoiceFilter}
            onFilterChange={handleInvoiceFilter}
          />
        )}
      </AnimatePresence>

      {/* ═══ PLAN MODAL ═══ */}
      <AnimatePresence>
        {showPlanModal && (
          <PlanModal
            plan={editingPlan}
            onClose={() => {
              setShowPlanModal(false)
              setEditingPlan(null)
            }}
            onSaved={handlePlanSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════
// TAB: VISAO GERAL
// ═══════════════════════════════════════

function OverviewTab({ data, loading }: { data: BillingOverview | null; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              index={0}
              icon={DollarSign}
              label="MRR Total"
              value={`R$ ${(data?.totalMrr ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              detail="receita recorrente mensal"
            />
            <StatCard
              index={1}
              icon={CreditCard}
              label="Assinaturas Ativas"
              value={data?.activeSubscriptions ?? 0}
              detail="ativas + trial"
            />
            <StatCard
              index={2}
              icon={AlertCircle}
              label="Faturas Pendentes"
              value={data?.pendingInvoices ?? 0}
              detail={`${data?.overdueInvoices ?? 0} vencidas`}
            />
            <StatCard
              index={3}
              icon={TrendingUp}
              label="Ticket Medio"
              value={`R$ ${(data?.ticketMedio ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              detail="por assinatura"
            />
          </>
        )}
      </div>

      {/* MRR by Plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <Package className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
            MRR por Plano
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : !data?.mrrByPlan?.length ? (
          <EmptyState icon={Package} text="Nenhum plano com assinaturas ativas" />
        ) : (
          <div className="space-y-3">
            {data.mrrByPlan.map((item, i) => {
              const maxMrr = Math.max(...data.mrrByPlan.map((p) => p.mrr), 1)
              const pct = (item.mrr / maxMrr) * 100
              return (
                <motion.div
                  key={item.name}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-medium text-white/80">{item.name}</p>
                      <p className="text-[10px] text-neutral-500">{item.count} assinaturas</p>
                    </div>
                    <p className="text-sm font-bold text-violet-400">
                      R$ {item.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {/* Bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-violet-600/10 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// TAB: PLANOS SAAS
// ═══════════════════════════════════════

function PlansTab({
  plans,
  loading,
  onNew,
  onEdit,
  onDelete,
}: {
  plans: SaasPlan[]
  loading: boolean
  onNew: () => void
  onEdit: (p: SaasPlan) => void
  onDelete: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">{plans.length} planos cadastrados</p>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Plano
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !plans.length ? (
        <EmptyState icon={Package} text="Nenhum plano cadastrado" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className={`relative rounded-2xl border bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.04] group ${
                plan.active ? "border-white/[0.06] hover:border-white/[0.1]" : "border-red-500/10 opacity-60"
              }`}
            >
              {!plan.active && (
                <span className="absolute top-3 right-3 text-[9px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Inativo
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-base font-bold text-white/90">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-violet-400">
                    R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-neutral-500">/{INTERVALS[plan.interval] ?? plan.interval}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <UserCog className="w-3.5 h-3.5 text-violet-500/60" />
                  <span>Ate {plan.maxProfessionals} profissionais</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Users className="w-3.5 h-3.5 text-violet-500/60" />
                  <span>Ate {plan.maxStudents} alunos</span>
                </div>
                {plan._count && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{plan._count.subscriptions} assinaturas</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features && typeof plan.features === "object" && (
                <div className="space-y-1.5 mb-4 pt-3 border-t border-white/[0.06]">
                  {FEATURE_OPTIONS.map((f) => {
                    const enabled = (plan.features as Record<string, boolean>)?.[f.key]
                    return (
                      <div key={f.key} className="flex items-center gap-2 text-[11px]">
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                            enabled ? "bg-violet-600/20 text-violet-400" : "bg-white/[0.03] text-neutral-700"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={enabled ? "text-neutral-300" : "text-neutral-600 line-through"}>
                          {f.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => onEdit(plan)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
                {plan.active && (
                  <button
                    onClick={() => onDelete(plan.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Desativar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════
// TAB: ASSINATURAS
// ═══════════════════════════════════════

function SubscriptionsTab({
  subscriptions,
  loading,
}: {
  subscriptions: Subscription[]
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <CreditCard className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
            Assinaturas
          </h3>
          <span className="text-[10px] text-neutral-600 ml-auto">{subscriptions.length} total</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : !subscriptions.length ? (
          <EmptyState icon={CreditCard} text="Nenhuma assinatura encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <Th>Organizacao</Th>
                  <Th>Plano</Th>
                  <Th>Status</Th>
                  <Th className="hidden sm:table-cell">Inicio</Th>
                  <Th className="hidden md:table-cell">Fim</Th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, i) => {
                  const status = SUB_STATUS_CONFIG[sub.status] ?? SUB_STATUS_CONFIG.CANCELLED
                  return (
                    <motion.tr
                      key={sub.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-[10px] font-semibold border border-violet-500/10">
                            {sub.organization.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white/80 font-medium text-xs truncate max-w-[140px]">
                              {sub.organization.name}
                            </p>
                            <p className="text-neutral-600 text-[10px]">{sub.organization.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-white/70 text-xs">{sub.plan.name}</p>
                        <p className="text-neutral-600 text-[10px]">
                          R$ {sub.plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-500 text-[11px] hidden sm:table-cell">
                        {format(new Date(sub.startDate), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-3 text-neutral-500 text-[11px] hidden md:table-cell">
                        {sub.endDate
                          ? format(new Date(sub.endDate), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// TAB: FATURAS
// ═══════════════════════════════════════

function InvoicesTab({
  invoices,
  loading,
  filter,
  onFilterChange,
}: {
  invoices: Invoice[]
  loading: boolean
  filter: string
  onFilterChange: (f: string) => void
}) {
  const filters = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendentes" },
    { key: "paid", label: "Pagas" },
    { key: "overdue", label: "Vencidas" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <Receipt className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">Faturas</h3>
          <div className="flex gap-1 ml-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => onFilterChange(f.key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                    : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : !invoices.length ? (
          <EmptyState icon={Receipt} text="Nenhuma fatura encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <Th>Organizacao</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th className="hidden sm:table-cell">Vencimento</Th>
                  <Th className="hidden md:table-cell">Pago em</Th>
                  <Th className="hidden lg:table-cell">Referencia</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const status = INVOICE_STATUS_CONFIG[inv.status] ?? INVOICE_STATUS_CONFIG.pending
                  return (
                    <motion.tr
                      key={inv.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="py-3 px-3 text-white/80 text-xs">
                        {inv.subscription.organization.name}
                      </td>
                      <td className="py-3 px-3 text-white/70 text-xs font-medium">
                        R$ {inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-500 text-[11px] hidden sm:table-cell">
                        {format(new Date(inv.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-3 text-neutral-500 text-[11px] hidden md:table-cell">
                        {inv.paidAt
                          ? format(new Date(inv.paidAt), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-neutral-500 text-[11px] hidden lg:table-cell">
                        {inv.referenceMonth}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// PLAN EDITOR MODAL
// ═══════════════════════════════════════

function PlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: SaasPlan | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!plan
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(plan?.name ?? "")
  const [price, setPrice] = useState(plan?.price?.toString() ?? "")
  const [interval, setInterval] = useState(plan?.interval ?? "MONTHLY")
  const [maxProfessionals, setMaxProfessionals] = useState(plan?.maxProfessionals?.toString() ?? "1")
  const [maxStudents, setMaxStudents] = useState(plan?.maxStudents?.toString() ?? "10")
  const [features, setFeatures] = useState<Record<string, boolean>>(() => {
    if (plan?.features && typeof plan.features === "object") {
      return plan.features as Record<string, boolean>
    }
    return { crm: false, community: false, aiChat: false, postureAi: false, machines3d: false }
  })

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!name.trim() || !price) return
    setSaving(true)

    const body = {
      name: name.trim(),
      price: parseFloat(price),
      interval,
      maxProfessionals: parseInt(maxProfessionals) || 1,
      maxStudents: parseInt(maxStudents) || 10,
      features,
    }

    try {
      if (isEdit) {
        await fetch(`/api/master/billing/plans/${plan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        await fetch("/api/master/billing/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      onSaved()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-neutral-950 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white/90">
            {isEdit ? "Editar Plano" : "Novo Plano SaaS"}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Nome do Plano
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Starter, Professional..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          {/* Price + Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Preco (R$)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.90"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Intervalo
              </label>
              <div className="relative">
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors appearance-none"
                >
                  {Object.entries(INTERVALS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-neutral-900 text-white">
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Max Profissionais
              </label>
              <input
                type="number"
                value={maxProfessionals}
                onChange={(e) => setMaxProfessionals(e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Max Alunos
              </label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2 block">
              Features
            </label>
            <div className="space-y-2">
              {FEATURE_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFeature(f.key)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      features[f.key]
                        ? "bg-violet-600 text-white"
                        : "bg-white/[0.04] border border-white/[0.1] text-transparent"
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-xs text-white/80">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !price}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar Plano"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════

function StatCard({
  index,
  icon: Icon,
  label,
  value,
  detail,
}: {
  index: number
  icon: typeof DollarSign
  label: string
  value: number | string
  detail: string
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <div className="relative z-10">
        <div className="mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-violet-600/10 text-violet-500">
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
        <p className="text-xl sm:text-[28px] font-bold text-white tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">
          {label}
        </p>
        <p className="text-[9px] text-neutral-600 mt-0.5 hidden sm:block">{detail}</p>
      </div>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-violet-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 animate-pulse">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] mb-3 sm:mb-4" />
      <div className="h-8 w-16 bg-white/[0.05] rounded mb-1" />
      <div className="h-3 w-24 bg-white/[0.03] rounded" />
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof DollarSign; text: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-neutral-600" />
      </div>
      <p className="text-neutral-400 text-sm">{text}</p>
    </div>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium ${className}`}
    >
      {children}
    </th>
  )
}
