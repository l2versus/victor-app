"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target,
  Plus,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  X,
  MessageSquare,
  Video,
  FileText,
  Send,
  Trash2,
  ChevronDown,
  Search,
  XCircle,
  Clock,
  Zap,
  Copy,
  Check,
  Flame,
  Thermometer,
  Snowflake,
  Globe,
  Bot,
  Smartphone,
  Pause,
  Play,
  Wifi,
  WifiOff,
  Settings2,
  Save,
  RotateCcw,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// ═══ TYPES ═══

interface SaasLead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: "ACADEMY" | "PERSONAL_TRAINER" | "NUTRITIONIST" | "CLINIC"
  status: "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "DEMO_DONE" | "NEGOTIATING" | "CONVERTED" | "LOST"
  notes: string | null
  city: string | null
  state: string | null
  estimatedStudents: number | null
  estimatedMrr: number | null
  source: string | null
  score: number | null
  temperature: "HOT" | "WARM" | "COLD"
  lostReason: string | null
  convertedAt: string | null
  convertedOrgId: string | null
  followUps?: FollowUp[]
  _count?: { followUps: number }
  createdAt: string
  updatedAt: string
}

interface FollowUp {
  id: string
  leadId: string
  type: string
  content: string
  dueDate: string | null
  createdAt: string
}

interface Stats {
  totalLeads: number
  convertedLeads: number
  lostLeads: number
  leadsThisMonth: number
  conversionRate: number
  pipelineMrr: number
  statusCounts: Record<string, number>
  avgScore: number
  autoCapturedThisMonth: number
  temperatureCounts: Record<string, number>
}

// ═══ CONSTANTS ═══

const PIPELINE_COLUMNS: { status: SaasLead["status"]; label: string; color: string }[] = [
  { status: "NEW", label: "Novo", color: "violet" },
  { status: "CONTACTED", label: "Contactado", color: "blue" },
  { status: "DEMO_SCHEDULED", label: "Demo Agendada", color: "amber" },
  { status: "DEMO_DONE", label: "Demo Feita", color: "cyan" },
  { status: "NEGOTIATING", label: "Negociando", color: "orange" },
  { status: "CONVERTED", label: "Convertido", color: "emerald" },
]

const TYPE_CONFIG: Record<SaasLead["type"], { label: string; classes: string }> = {
  ACADEMY: { label: "Academia", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  PERSONAL_TRAINER: { label: "Personal", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  NUTRITIONIST: { label: "Nutricionista", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CLINIC: { label: "Clínica", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
}

const TEMPERATURE_CONFIG: Record<string, { label: string; icon: typeof Flame; classes: string }> = {
  HOT: { label: "HOT", icon: Flame, classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  WARM: { label: "WARM", icon: Thermometer, classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  COLD: { label: "COLD", icon: Snowflake, classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
}

const SOURCE_CONFIG: Record<string, { label: string; classes: string }> = {
  WEBSITE: { label: "Website", classes: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  WEBHOOK: { label: "Webhook", classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  MANYCHAT: { label: "ManyChat", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  N8N: { label: "n8n", classes: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  REFERRAL: { label: "Indicacao", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  INSTAGRAM: { label: "Instagram", classes: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  WHATSAPP: { label: "WhatsApp", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
}

const FOLLOWUP_TYPES = [
  { value: "call", label: "Ligação", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Reunião", icon: Video },
  { value: "note", label: "Nota", icon: FileText },
]

const STATUS_OPTIONS: { value: SaasLead["status"]; label: string }[] = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "DEMO_SCHEDULED", label: "Demo Agendada" },
  { value: "DEMO_DONE", label: "Demo Feita" },
  { value: "NEGOTIATING", label: "Negociando" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "LOST", label: "Perdido" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

// ═══ MAIN PAGE ═══

export default function MasterCrmPage() {
  const [leads, setLeads] = useState<SaasLead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<SaasLead | null>(null)
  const [showLostModal, setShowLostModal] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState("")
  const [activeTab, setActiveTab] = useState<"pipeline" | "automacoes" | "whatsapp">("pipeline")
  const [copied, setCopied] = useState(false)

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const res = await fetch(`/api/master/crm?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLeads(data)
    }
  }, [search])

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/master/crm/stats")
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([fetchLeads(), fetchStats()]).finally(() => setLoading(false))
  }, [fetchLeads, fetchStats])

  async function updateLeadStatus(leadId: string, newStatus: SaasLead["status"]) {
    if (newStatus === "LOST") {
      setShowLostModal(leadId)
      return
    }
    const data: Record<string, unknown> = { status: newStatus }
    if (newStatus === "CONVERTED") data.convertedAt = new Date().toISOString()

    const res = await fetch(`/api/master/crm/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      await Promise.all([fetchLeads(), fetchStats()])
    }
  }

  async function confirmLost() {
    if (!showLostModal) return
    await fetch(`/api/master/crm/${showLostModal}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LOST", lostReason }),
    })
    setShowLostModal(null)
    setLostReason("")
    await Promise.all([fetchLeads(), fetchStats()])
  }

  async function deleteLead(id: string) {
    if (!confirm("Excluir este lead permanentemente?")) return
    await fetch(`/api/master/crm/${id}`, { method: "DELETE" })
    setSelectedLead(null)
    await Promise.all([fetchLeads(), fetchStats()])
  }

  function openLeadDetail(lead: SaasLead) {
    fetch(`/api/master/crm/${lead.id}`)
      .then((r) => r.json())
      .then((data) => setSelectedLead(data))
  }

  const lostLeads = leads.filter((l) => l.status === "LOST")

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Pipeline{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-300">
                  de Vendas
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                CRM SaaS — Vendas da plataforma
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>
      </motion.div>

      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={Users} label="Total Leads" value={stats?.totalLeads ?? 0} detail={`${stats?.leadsThisMonth ?? 0} este mês`} />
        <StatCard index={1} icon={TrendingUp} label="Conversão" value={`${stats?.conversionRate ?? 0}%`} detail={`${stats?.convertedLeads ?? 0} convertidos`} />
        <StatCard index={2} icon={DollarSign} label="MRR Pipeline" value={`R$${((stats?.pipelineMrr ?? 0) / 1).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`} detail="em negociação" />
        <StatCard index={3} icon={Calendar} label="Este Mês" value={stats?.leadsThisMonth ?? 0} detail="novos leads" />
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            activeTab === "pipeline"
              ? "bg-violet-600/10 text-violet-400 border-violet-500/20"
              : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:border-white/[0.1]"
          }`}
        >
          <Target className="w-4 h-4" />
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab("automacoes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            activeTab === "automacoes"
              ? "bg-violet-600/10 text-violet-400 border-violet-500/20"
              : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:border-white/[0.1]"
          }`}
        >
          <Zap className="w-4 h-4" />
          Automacoes
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            activeTab === "whatsapp"
              ? "bg-green-600/10 text-green-400 border-green-500/20"
              : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:border-white/[0.1]"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          WhatsApp
        </button>
      </div>

      {activeTab === "whatsapp" ? (
        <WhatsAppSection />
      ) : activeTab === "automacoes" ? (
        <AutomationSection stats={stats} copied={copied} setCopied={setCopied} />
      ) : (
      <>
      {/* ═══ SEARCH ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar leads por nome, empresa, email, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.05] transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <XCircle className="w-4 h-4 text-neutral-500 hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ KANBAN BOARD ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="overflow-x-auto pb-2 -mx-2 px-2"
        >
          <div className="flex gap-3 min-w-[900px]">
            {PIPELINE_COLUMNS.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.status)
              return (
                <KanbanColumn
                  key={col.status}
                  column={col}
                  leads={colLeads}
                  onCardClick={openLeadDetail}
                  onStatusChange={updateLeadStatus}
                />
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ LOST LEADS ═══ */}
      {lostLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-[0.06em]">
              Perdidos ({lostLeads.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lostLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => openLeadDetail(lead)}
                className="text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-red-500/20 transition-all"
              >
                <p className="text-sm text-white/70 font-medium truncate">{lead.company || lead.name}</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">{lead.lostReason || "Sem motivo"}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
      </>
      )}

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {showNewModal && (
          <NewLeadModal
            onClose={() => setShowNewModal(false)}
            onCreated={() => {
              setShowNewModal(false)
              fetchLeads()
              fetchStats()
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={() => {
              if (selectedLead) openLeadDetail(selectedLead)
              fetchLeads()
              fetchStats()
            }}
            onDelete={() => deleteLead(selectedLead.id)}
            onStatusChange={(status) => {
              updateLeadStatus(selectedLead.id, status)
              setSelectedLead(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLostModal && (
          <LostReasonModal
            reason={lostReason}
            onReasonChange={setLostReason}
            onConfirm={confirmLost}
            onClose={() => {
              setShowLostModal(null)
              setLostReason("")
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══ STAT CARD ═══

function StatCard({
  index,
  icon: Icon,
  label,
  value,
  detail,
}: {
  index: number
  icon: typeof Users
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
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <div className="relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-600/10 text-violet-500 mb-3">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none mb-1">{value}</p>
        <p className="text-[9px] text-neutral-400 uppercase tracking-[0.12em] font-medium">{label}</p>
        <p className="text-[9px] text-neutral-600 mt-0.5 hidden sm:block">{detail}</p>
      </div>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  )
}

// ═══ KANBAN COLUMN ═══

function KanbanColumn({
  column,
  leads,
  onCardClick,
  onStatusChange,
}: {
  column: (typeof PIPELINE_COLUMNS)[number]
  leads: SaasLead[]
  onCardClick: (lead: SaasLead) => void
  onStatusChange: (leadId: string, status: SaasLead["status"]) => void
}) {
  const colorMap: Record<string, string> = {
    violet: "border-violet-500/20 bg-violet-500/[0.03]",
    blue: "border-blue-500/20 bg-blue-500/[0.03]",
    amber: "border-amber-500/20 bg-amber-500/[0.03]",
    cyan: "border-cyan-500/20 bg-cyan-500/[0.03]",
    orange: "border-orange-500/20 bg-orange-500/[0.03]",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.03]",
  }

  const dotMap: Record<string, string> = {
    violet: "bg-violet-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
    emerald: "bg-emerald-500",
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("text/plain")
    if (leadId) onStatusChange(leadId, column.status)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div
      className={`flex-1 min-w-[160px] rounded-2xl border ${colorMap[column.color] ?? ""} p-3 transition-all`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${dotMap[column.color] ?? ""}`} />
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.08em]">
          {column.label}
        </span>
        <span className="text-[10px] text-neutral-600 ml-auto">{leads.length}</span>
      </div>
      <div className="space-y-2 min-h-[80px]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
      </div>
    </div>
  )
}

// ═══ LEAD CARD ═══

function LeadCard({ lead, onClick }: { lead: SaasLead; onClick: () => void }) {
  const typeConf = TYPE_CONFIG[lead.type]
  const tempConf = TEMPERATURE_CONFIG[lead.temperature] ?? TEMPERATURE_CONFIG.COLD
  const TempIcon = tempConf.icon
  const sourceConf = lead.source ? SOURCE_CONFIG[lead.source.toUpperCase()] : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] text-white/90 font-medium leading-tight truncate">
          {lead.company || lead.name}
        </p>
        <span className={`shrink-0 text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${typeConf.classes}`}>
          {typeConf.label}
        </span>
      </div>

      {/* Temperature + Score row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full border ${tempConf.classes}`}>
          <TempIcon className="w-2.5 h-2.5" />
          {tempConf.label}
        </span>
        {lead.score != null && (
          <span className="text-[9px] text-neutral-400 font-mono">
            Score: {lead.score}
          </span>
        )}
      </div>

      {/* Source badge */}
      {sourceConf && (
        <div className="mb-1.5">
          <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${sourceConf.classes}`}>
            {sourceConf.label}
          </span>
        </div>
      )}
      {lead.source && !sourceConf && (
        <div className="mb-1.5">
          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full border bg-neutral-500/10 text-neutral-400 border-neutral-500/20">
            {lead.source}
          </span>
        </div>
      )}

      {lead.company && (
        <p className="text-[11px] text-neutral-500 mb-1.5 flex items-center gap-1">
          <User className="w-3 h-3" />
          {lead.name}
        </p>
      )}

      {(lead.city || lead.state) && (
        <p className="text-[11px] text-neutral-600 mb-1.5 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {[lead.city, lead.state].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        {lead.estimatedStudents && (
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {lead.estimatedStudents}
          </span>
        )}
        {lead.estimatedMrr && (
          <span className="text-[10px] text-emerald-500/70 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            R${lead.estimatedMrr}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          {lead.phone && <Phone className="w-3 h-3 text-neutral-600 hover:text-violet-400 transition-colors" />}
          {lead.email && <Mail className="w-3 h-3 text-neutral-600 hover:text-violet-400 transition-colors" />}
        </div>
        <span className="text-[9px] text-neutral-700">
          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </motion.div>
  )
}

// ═══ NEW LEAD MODAL ═══

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    type: "ACADEMY" as SaasLead["type"],
    city: "",
    state: "",
    estimatedStudents: "",
    estimatedMrr: "",
    source: "",
    notes: "",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch("/api/master/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) onCreated()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Novo Lead</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Nome *" value={form.name} onChange={(v) => updateField("name", v)} />
            <InputField label="Empresa" value={form.company} onChange={(v) => updateField("company", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
            <InputField label="Telefone" value={form.phone} onChange={(v) => updateField("phone", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Cidade" value={form.city} onChange={(v) => updateField("city", v)} />
            <InputField label="Estado" value={form.state} onChange={(v) => updateField("state", v)} />
          </div>
          <div>
            <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Tipo
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all appearance-none"
            >
              <option value="ACADEMY">Academia</option>
              <option value="PERSONAL_TRAINER">Personal Trainer</option>
              <option value="NUTRITIONIST">Nutricionista</option>
              <option value="CLINIC">Clínica</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Alunos estimados" type="number" value={form.estimatedStudents} onChange={(v) => updateField("estimatedStudents", v)} />
            <InputField label="MRR estimado (R$)" type="number" value={form.estimatedMrr} onChange={(v) => updateField("estimatedMrr", v)} />
          </div>
          <InputField label="Origem" value={form.source} onChange={(v) => updateField("source", v)} placeholder="Instagram, indicação, etc." />
          <div>
            <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
          >
            {saving ? "Salvando..." : "Criar Lead"}
          </button>
        </form>
      </motion.div>
    </ModalOverlay>
  )
}

// ═══ LEAD DETAIL MODAL ═══

function LeadDetailModal({
  lead,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
}: {
  lead: SaasLead
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
  onStatusChange: (status: SaasLead["status"]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...lead })
  const [saving, setSaving] = useState(false)
  const [fuType, setFuType] = useState("note")
  const [fuContent, setFuContent] = useState("")
  const [fuDate, setFuDate] = useState("")
  const [addingFu, setAddingFu] = useState(false)

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function saveChanges() {
    setSaving(true)
    await fetch(`/api/master/crm/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    onUpdate()
  }

  async function addFollowUp() {
    if (!fuContent.trim()) return
    setAddingFu(true)
    await fetch(`/api/master/crm/${lead.id}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: fuType, content: fuContent, dueDate: fuDate || null }),
    })
    setFuContent("")
    setFuDate("")
    setAddingFu(false)
    onUpdate()
  }

  const typeConf = TYPE_CONFIG[lead.type]
  const tempConf = TEMPERATURE_CONFIG[lead.temperature] ?? TEMPERATURE_CONFIG.COLD
  const DetailTempIcon = tempConf.icon
  const followUps = lead.followUps ?? []

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-sm font-semibold border border-violet-500/10">
              {(lead.company || lead.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{lead.company || lead.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${typeConf.classes}`}>
                  {typeConf.label}
                </span>
                <span className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${tempConf.classes}`}>
                  <DetailTempIcon className="w-3 h-3" />
                  {tempConf.label}
                </span>
                {lead.score != null && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Score: {lead.score}
                  </span>
                )}
                {lead.source && (
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${
                    SOURCE_CONFIG[lead.source.toUpperCase()]?.classes ?? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                  }`}>
                    {SOURCE_CONFIG[lead.source.toUpperCase()]?.label ?? lead.source}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Excluir lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Status:</label>
            <div className="relative">
              <select
                value={editing ? (form.status as string) : lead.status}
                onChange={(e) => {
                  if (editing) {
                    updateField("status", e.target.value)
                  } else {
                    onStatusChange(e.target.value as SaasLead["status"])
                  }
                }}
                className="appearance-none px-3 py-1.5 pr-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="ml-auto text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Editar
              </button>
            ) : (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-[11px] text-neutral-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          {/* Info grid */}
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nome" value={form.name} onChange={(v) => updateField("name", v)} />
              <InputField label="Empresa" value={form.company ?? ""} onChange={(v) => updateField("company", v)} />
              <InputField label="Email" value={form.email ?? ""} onChange={(v) => updateField("email", v)} />
              <InputField label="Telefone" value={form.phone ?? ""} onChange={(v) => updateField("phone", v)} />
              <InputField label="Cidade" value={form.city ?? ""} onChange={(v) => updateField("city", v)} />
              <InputField label="Estado" value={form.state ?? ""} onChange={(v) => updateField("state", v)} />
              <InputField label="Alunos estimados" type="number" value={String(form.estimatedStudents ?? "")} onChange={(v) => updateField("estimatedStudents", v)} />
              <InputField label="MRR estimado" type="number" value={String(form.estimatedMrr ?? "")} onChange={(v) => updateField("estimatedMrr", v)} />
              <InputField label="Origem" value={form.source ?? ""} onChange={(v) => updateField("source", v)} />
              <div>
                <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all appearance-none"
                >
                  <option value="ACADEMY">Academia</option>
                  <option value="PERSONAL_TRAINER">Personal Trainer</option>
                  <option value="NUTRITIONIST">Nutricionista</option>
                  <option value="CLINIC">Clínica</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">Notas</label>
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow icon={User} label="Nome" value={lead.name} />
              <InfoRow icon={Building2} label="Empresa" value={lead.company} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
              <InfoRow icon={MapPin} label="Localização" value={[lead.city, lead.state].filter(Boolean).join(", ") || null} />
              <InfoRow icon={Users} label="Alunos est." value={lead.estimatedStudents ? String(lead.estimatedStudents) : null} />
              <InfoRow icon={DollarSign} label="MRR est." value={lead.estimatedMrr ? `R$${lead.estimatedMrr}` : null} />
              <InfoRow icon={Target} label="Origem" value={lead.source} />
              {lead.notes && (
                <div className="col-span-2 mt-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Notas</p>
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Follow-up form */}
          <div className="border-t border-white/[0.06] pt-5">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-[0.06em] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              Follow-ups
            </h3>

            <div className="flex gap-2 mb-4 flex-wrap">
              {FOLLOWUP_TYPES.map((ft) => (
                <button
                  key={ft.value}
                  onClick={() => setFuType(ft.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    fuType === ft.value
                      ? "bg-violet-600/10 text-violet-400 border-violet-500/20"
                      : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:border-white/[0.1]"
                  }`}
                >
                  <ft.icon className="w-3 h-3" />
                  {ft.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar follow-up..."
                value={fuContent}
                onChange={(e) => setFuContent(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
                onKeyDown={(e) => e.key === "Enter" && addFollowUp()}
              />
              <input
                type="date"
                value={fuDate}
                onChange={(e) => setFuDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-violet-500/30 transition-all w-36"
              />
              <button
                onClick={addFollowUp}
                disabled={addingFu || !fuContent.trim()}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline */}
            {followUps.length > 0 && (
              <div className="mt-4 space-y-2">
                {followUps.map((fu) => {
                  const ftConfig = FOLLOWUP_TYPES.find((f) => f.value === fu.type)
                  const FuIcon = ftConfig?.icon ?? FileText
                  return (
                    <div
                      key={fu.id}
                      className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-600/10 flex items-center justify-center shrink-0 mt-0.5">
                        <FuIcon className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-violet-400/60 font-medium uppercase tracking-wider">
                            {ftConfig?.label ?? fu.type}
                          </span>
                          <span className="text-[9px] text-neutral-700">
                            {formatDistanceToNow(new Date(fu.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300">{fu.content}</p>
                        {fu.dueDate && (
                          <p className="text-[10px] text-amber-500/60 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vencimento: {new Date(fu.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  )
}

// ═══ LOST REASON MODAL ═══

function LostReasonModal({
  reason,
  onReasonChange,
  onConfirm,
  onClose,
}: {
  reason: string
  onReasonChange: (v: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-2">Marcar como Perdido</h3>
        <p className="text-sm text-neutral-400 mb-4">Qual o motivo da perda?</p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          placeholder="Preço alto, escolheu concorrente, etc."
          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 transition-all resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-neutral-400 text-sm font-medium hover:bg-white/[0.03] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  )
}

// ═══ AUTOMATION SECTION ═══

// ═══ WHATSAPP SECTION ═══

interface BotStatus {
  type: string
  name: string
  displayName: string
  role: string
  configured: boolean
  paused: boolean
  connectionStatus: string
  phone: string | null
  maxBotReplies: number
  crmTarget: string
}

function WhatsAppSection() {
  const [bots, setBots] = useState<BotStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [instructions, setInstructions] = useState("")
  const [instructionsLoading, setInstructionsLoading] = useState(true)
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [instructionsSaved, setInstructionsSaved] = useState(false)

  const fetchBots = useCallback(async () => {
    const res = await fetch("/api/master/crm/whatsapp")
    if (res.ok) {
      const data = await res.json()
      setBots(data.bots || [])
    }
    setLoading(false)
  }, [])

  const fetchInstructions = useCallback(async () => {
    const res = await fetch("/api/master/crm/whatsapp/instructions?botType=b2b")
    if (res.ok) {
      const data = await res.json()
      setInstructions(data.instructions || "")
    }
    setInstructionsLoading(false)
  }, [])

  useEffect(() => {
    fetchBots()
    fetchInstructions()
  }, [fetchBots, fetchInstructions])

  async function toggleBot(botType: string, currentPaused: boolean) {
    setToggling(botType)
    const res = await fetch("/api/master/crm/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botType, action: currentPaused ? "resume" : "pause" }),
    })
    if (res.ok) await fetchBots()
    setToggling(null)
  }

  async function saveInstructions() {
    setSavingInstructions(true)
    const res = await fetch("/api/master/crm/whatsapp/instructions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botType: "b2b", instructions }),
    })
    if (res.ok) {
      setInstructionsSaved(true)
      setTimeout(() => setInstructionsSaved(false), 3000)
    }
    setSavingInstructions(false)
  }

  const connectionColor: Record<string, string> = {
    connected: "text-green-400",
    Connected: "text-green-400",
    disconnected: "text-red-400",
    Disconnected: "text-red-400",
    not_configured: "text-neutral-600",
    error: "text-amber-400",
  }

  const connectionLabel: Record<string, string> = {
    connected: "Conectado",
    Connected: "Conectado",
    disconnected: "Desconectado",
    Disconnected: "Desconectado",
    not_configured: "Nao Configurado",
    error: "Erro de Conexao",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.02] p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Controle WhatsApp</h3>
            <p className="text-[11px] text-neutral-500">
              Gerencie seus bots — pause, retome, e configure instruções
            </p>
          </div>
        </div>
      </div>

      {/* Bot Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bots.map((bot) => {
            const isConnected = bot.connectionStatus === "connected" || bot.connectionStatus === "Connected"
            const isTogglingThis = toggling === bot.type

            return (
              <motion.div
                key={bot.type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl border p-5 transition-all ${
                  bot.paused
                    ? "border-amber-500/20 bg-amber-500/[0.02]"
                    : isConnected
                      ? "border-green-500/20 bg-green-500/[0.02]"
                      : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {/* Bot Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      bot.type === "b2b" ? "bg-violet-600/10" : bot.type === "nutri" ? "bg-emerald-600/10" : "bg-blue-600/10"
                    }`}>
                      <Bot className={`w-4 h-4 ${
                        bot.type === "b2b" ? "text-violet-500" : bot.type === "nutri" ? "text-emerald-500" : "text-blue-500"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{bot.displayName}</p>
                      <p className="text-[10px] text-neutral-500">{bot.name}</p>
                    </div>
                  </div>
                  {bot.paused && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                      Pausado
                    </span>
                  )}
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 mb-3">
                  {isConnected ? (
                    <Wifi className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                  <span className={`text-[11px] font-medium ${connectionColor[bot.connectionStatus] ?? "text-neutral-500"}`}>
                    {connectionLabel[bot.connectionStatus] ?? bot.connectionStatus}
                  </span>
                  {bot.phone && (
                    <span className="text-[10px] text-neutral-600 ml-auto font-mono">{bot.phone}</span>
                  )}
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-3 text-[10px] text-neutral-500 mb-4">
                  <span>CRM: <span className="text-neutral-400">{bot.crmTarget}</span></span>
                  <span>Max: <span className="text-neutral-400">{bot.maxBotReplies} msgs</span></span>
                  <span className={`${bot.configured ? "text-green-500" : "text-red-400"}`}>
                    {bot.configured ? "Configurado" : "Sem credenciais"}
                  </span>
                </div>

                {/* Toggle Button */}
                {bot.configured && (
                  <button
                    onClick={() => toggleBot(bot.type, bot.paused)}
                    disabled={isTogglingThis}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      bot.paused
                        ? "bg-green-600/10 border-green-500/20 text-green-400 hover:bg-green-600/20"
                        : "bg-amber-600/10 border-amber-500/20 text-amber-400 hover:bg-amber-600/20"
                    } ${isTogglingThis ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {isTogglingThis ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : bot.paused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    {isTogglingThis ? "Aplicando..." : bot.paused ? "Retomar Bot" : "Pausar Bot"}
                  </button>
                )}

                {!bot.configured && (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-600 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Configure as env vars <code className="text-violet-400/70">{bot.type === "b2b" ? "ZAPI_B2B_*" : `ZAPI_${bot.type.toUpperCase()}_*`}</code></span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Custom Instructions (B2B) */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Instruções do Bot B2B</h3>
            <p className="text-[11px] text-neutral-500">
              Adicione instruções extras pro bot — ele vai seguir além do prompt padrão
            </p>
          </div>
        </div>

        {instructionsLoading ? (
          <div className="h-32 rounded-xl bg-white/[0.02] animate-pulse" />
        ) : (
          <>
            <textarea
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value)
                setInstructionsSaved(false)
              }}
              placeholder="Ex: Não mencione preço por enquanto, apenas agende demos. Foque em academias de Fortaleza. Pergunte quantos alunos têm antes de oferecer plano..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all resize-y"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-neutral-600">
                Essas instruções são adicionadas ao prompt do bot Emmanuel.
                Deixe vazio pra usar só o padrão.
              </p>
              <div className="flex items-center gap-2">
                {instructionsSaved && (
                  <span className="text-[11px] text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Salvo
                  </span>
                )}
                <button
                  onClick={saveInstructions}
                  disabled={savingInstructions}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
                >
                  {savingInstructions ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Como Funciona</h3>
            <p className="text-[11px] text-neutral-500">Fluxo de cada bot WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[11px] text-white/80 font-medium mb-1">Quando o bot está ATIVO</p>
            <p className="text-[10px] text-neutral-500">
              Lead manda msg → Bot responde com IA (até {bots.find(b => b.type === "b2b")?.maxBotReplies ?? 3} msgs) → Handoff pra você → Mensagens continuam salvas no CRM
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[11px] text-white/80 font-medium mb-1">Quando o bot está PAUSADO</p>
            <p className="text-[10px] text-neutral-500">
              Lead manda msg → Mensagem salva no CRM → Sem resposta automática → Você responde manualmente pelo WhatsApp
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[11px] text-white/80 font-medium mb-1">Instruções Customizadas</p>
            <p className="text-[10px] text-neutral-500">
              Texto extra adicionado ao prompt do bot. Ex: focar em academias, não mencionar preço, priorizar demos, etc.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[11px] text-white/80 font-medium mb-1">Instância Z-API</p>
            <p className="text-[10px] text-neutral-500">
              O bot B2B usa sua instância Z-API (85998500344). Victor e Nutri precisam de instâncias próprias pra funcionar.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══ AUTOMATION SECTION ═══

function AutomationSection({
  stats,
  copied,
  setCopied,
}: {
  stats: Stats | null
  copied: boolean
  setCopied: (v: boolean) => void
}) {
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/master/crm/webhook?token=YOUR_TOKEN`
    : "/api/master/crm/webhook?token=YOUR_TOKEN"

  const captureUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/master/crm/capture`
    : "/api/master/crm/capture"

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Automation Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-violet-500" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">Auto-capturados este mes</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.autoCapturedThisMonth ?? 0}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">via Webhook, Website, ManyChat, n8n</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">Score Medio</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.avgScore ?? 0}<span className="text-sm text-neutral-500">/100</span></p>
          <p className="text-[10px] text-neutral-600 mt-0.5">de todos os leads com score</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">Temperatura</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-red-400 font-semibold">{stats?.temperatureCounts?.HOT ?? 0} HOT</span>
            <span className="text-sm text-amber-400 font-semibold">{stats?.temperatureCounts?.WARM ?? 0} WARM</span>
            <span className="text-sm text-cyan-400 font-semibold">{stats?.temperatureCounts?.COLD ?? 0} COLD</span>
          </div>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Webhook para Captura de Leads</h3>
            <p className="text-[11px] text-neutral-500">Use esta URL no n8n, ManyChat, ou formularios externos</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2 block">
            Webhook URL (POST)
          </label>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-violet-300 font-mono overflow-x-auto whitespace-nowrap">
              {webhookUrl}
            </code>
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="shrink-0 px-3 py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2">
            Substitua YOUR_TOKEN pelo valor da env <code className="text-violet-400/70">MASTER_CRM_WEBHOOK_TOKEN</code>
          </p>
        </div>

        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2 block">
            Landing Page URL (POST) — Sem token, publico
          </label>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-nowrap">
              {captureUrl}
            </code>
            <button
              onClick={() => copyToClipboard(captureUrl)}
              className="shrink-0 px-3 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Payload example */}
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2 block">
            Exemplo de Payload (JSON)
          </label>
          <pre className="px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-[10px] text-neutral-300 font-mono overflow-x-auto whitespace-pre">{`{
  "name": "Joao Silva",
  "email": "joao@academia.com",
  "phone": "11999999999",
  "company": "Academia FitPro",
  "type": "ACADEMY",
  "source": "MANYCHAT",
  "city": "Sao Paulo",
  "state": "SP",
  "estimatedStudents": 150,
  "estimatedMrr": 500
}`}</pre>
        </div>
      </div>

      {/* Lead Scoring Explanation */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Lead Scoring</h3>
            <p className="text-[11px] text-neutral-500">Score automatico de 0-100 calculado ao criar/editar leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ScoringFactor label="Contato completo" detail="Email (+10), Telefone (+15), Empresa (+15)" max={40} />
          <ScoringFactor label="Tipo de negocio" detail="Academia (+20), Clinica (+15), Personal/Nutri (+10)" max={20} />
          <ScoringFactor label="Volume de alunos" detail=">100 (+20), >50 (+15), >20 (+10)" max={20} />
          <ScoringFactor label="MRR potencial" detail=">R$500 (+15), >R$200 (+10)" max={15} />
          <ScoringFactor label="Localizacao" detail="Cidade/Estado preenchido (+5)" max={5} />
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
              <Flame className="w-3 h-3" /> HOT
            </span>
            <span className="text-[10px] text-neutral-500">Score &gt;= 70</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Thermometer className="w-3 h-3" /> WARM
            </span>
            <span className="text-[10px] text-neutral-500">Score 40-69</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              <Snowflake className="w-3 h-3" /> COLD
            </span>
            <span className="text-[10px] text-neutral-500">Score &lt; 40</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ScoringFactor({ label, detail, max }: { label: string; detail: string; max: number }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/80 font-medium">{label}</span>
        <span className="text-[9px] text-neutral-500 font-mono">max {max}pts</span>
      </div>
      <p className="text-[10px] text-neutral-500">{detail}</p>
    </div>
  )
}

// ═══ SHARED COMPONENTS ═══

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </motion.div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-neutral-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-neutral-300">{value}</p>
      </div>
    </div>
  )
}
