"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  UserPlus, Phone, Mail, Plus, X, Trash2,
  MessageCircle, Instagram, Globe, Users,
  Star, Send, GripVertical, Clock,
  Loader2, ExternalLink, Flame, Snowflake,
  Thermometer, BarChart3, TrendingUp, Target,
  Zap, RefreshCw, Tag, Search, Filter,
  FileText, Webhook, Copy, ToggleLeft, ToggleRight,
  ChevronDown, Eye, Pencil, AlertCircle, Bot,
  Play, Pause, Settings2, Smartphone, QrCode,
  Wifi, WifiOff, Power, PowerOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════
// Toast hook — usado por todos os sub-componentes
// ═══════════════════════════════════════

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null)
  function showToast(msg: string, type: "error" | "success" = "error") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }
  return { toast, showToast }
}

function ToastUI({ toast }: { toast: { msg: string; type: "error" | "success" } | null }) {
  if (!toast) return null
  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl animate-slide-up",
      toast.type === "error" ? "bg-red-500/90 text-white" : "bg-emerald-500/90 text-white"
    )}>
      {toast.msg}
    </div>
  )
}

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  status: string
  temperature: string
  notes: string | null
  value: number | null
  score: number
  tags: string[]
  lastContactAt: string | null
  assignedTo: string | null
  lostReason: string | null
  createdAt: string
  updatedAt: string
  followUps: { id: string; type: string; content: string; createdAt: string }[]
  _count: { followUps: number; activities: number; conversations: number }
}

type Pipeline = {
  NEW: number; CONTACTED: number; TRIAL: number
  NEGOTIATING: number; CONVERTED: number; LOST: number; total: number
}

type Temperatures = { HOT: number; WARM: number; COLD: number }

type DashboardData = {
  overview: {
    totalLeads: number; activeLeads: number; convertedLeads: number; lostLeads: number
    conversionRate: number; newThisWeek: number; convertedThisMonth: number; lostThisMonth: number
    pipelineValue: number; convertedValue: number
  }
  temperatures: Temperatures
  leadsBySource: { source: string; count: number }[]
  topLeads: { id: string; name: string; score: number; temperature: string; value: number | null; status: string; source: string }[]
  recentActivities: { id: string; action: string; details: string | null; leadName: string; createdAt: string }[]
  funnel?: { stage: string; count: number; reached: number; rate: number }[]
  weeklyCapture?: number[]
}

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

const COLUMNS = [
  { status: "NEW", label: "Novos", color: "border-blue-500", dot: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/5" },
  { status: "CONTACTED", label: "Contactados", color: "border-cyan-500", dot: "bg-cyan-500", text: "text-cyan-400", bg: "bg-cyan-500/5" },
  { status: "TRIAL", label: "Experimental", color: "border-purple-500", dot: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/5" },
  { status: "NEGOTIATING", label: "Negociando", color: "border-amber-500", dot: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/5" },
  { status: "CONVERTED", label: "Convertidos", color: "border-emerald-500", dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/5" },
  { status: "LOST", label: "Perdidos", color: "border-red-500", dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/5" },
]

const SOURCE_ICONS: Record<string, typeof Phone> = {
  WALK_IN: Users, REFERRAL: Star, INSTAGRAM: Instagram,
  WHATSAPP: MessageCircle, WEBSITE: Globe, MANYCHAT: Zap,
  FACEBOOK: Globe, TIKTOK: Globe, OTHER: UserPlus,
}

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Visita", REFERRAL: "Indicação", INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp", WEBSITE: "Site", MANYCHAT: "ManyChat",
  FACEBOOK: "Facebook", TIKTOK: "TikTok", OTHER: "Outro",
}

const TEMP_CONFIG = {
  HOT: { icon: Flame, label: "Quente", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-500" },
  WARM: { icon: Thermometer, label: "Morno", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-500" },
  COLD: { icon: Snowflake, label: "Frio", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500" },
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Lead criado",
  STATUS_CHANGED: "Status alterado",
  NOTE_ADDED: "Nota adicionada",
  SCORED: "Score atualizado",
  TEMPERATURE_CHANGED: "Temperatura alterada",
  CONVERTED: "Convertido",
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export function CrmClient() {
  type CrmTab = "pipeline" | "dashboard" | "inbox" | "broadcasts" | "templates" | "webhooks" | "bots" | "whatsapp"
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get("tab") as CrmTab) || "pipeline"
  const [tab, setTabState] = useState<CrmTab>(initialTab)

  function setTab(newTab: CrmTab) {
    setTabState(newTab)
    router.replace(`?tab=${newTab}`, { scroll: false })
  }
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [temperatures, setTemperatures] = useState<Temperatures | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [followUpText, setFollowUpText] = useState("")
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTemp, setFilterTemp] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const { toast, showToast } = useToast()
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "OTHER", notes: "", value: "", temperature: "COLD",
  })

  // ─── Data fetching ───
  async function fetchLeads() {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (filterTemp) params.set("temperature", filterTemp)
      const res = await fetch(`/api/admin/crm?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setPipeline(data.pipeline)
        setTemperatures(data.temperatures)
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/crm/dashboard")
      if (res.ok) setDashboard(await res.json())
    } catch { showToast("Erro ao processar. Tente novamente.") }
  }

  // Debounce search — evita spam de requests ao digitar
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])
  useEffect(() => { fetchLeads() }, [debouncedSearch, filterTemp])
  useEffect(() => { if (tab === "dashboard") fetchDashboard() }, [tab])

  // ─── Actions ───
  async function createLead() {
    // Validação
    if (!form.name.trim()) { showToast("Nome é obrigatório"); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast("Email inválido"); return }
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) { showToast("Telefone deve ter pelo menos 10 dígitos"); return }
    if (form.value && (isNaN(Number(form.value)) || Number(form.value) < 0)) { showToast("Valor deve ser um número positivo"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone ? form.phone.replace(/\D/g, "") : "",
          value: form.value ? String(form.value) : "",
        }),
      })
      if (res.ok) {
        showToast("Lead criado!", "success")
        setShowForm(false)
        setForm({ name: "", phone: "", email: "", source: "OTHER", notes: "", value: "", temperature: "COLD" })
        fetchLeads()
      } else {
        showToast("Erro ao criar lead")
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setSaving(false)
  }

  async function updateLead(id: string, data: Record<string, unknown>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } as Lead : l))
    await fetch(`/api/admin/crm?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    fetchLeads()
  }

  async function deleteLead(id: string) {
    await fetch(`/api/admin/crm?id=${id}`, { method: "DELETE" })
    setSelectedLead(null)
    fetchLeads()
  }

  async function addFollowUp(leadId: string) {
    if (!followUpText.trim()) return
    await fetch(`/api/admin/crm?id=${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUp: { type: "NOTE", content: followUpText } }),
    })
    setFollowUpText("")
    fetchLeads()
  }

  async function scoreAllLeads() {
    setScoring(true)
    try {
      await fetch("/api/admin/crm/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      fetchLeads()
      if (tab === "dashboard") fetchDashboard()
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setScoring(false)
  }

  async function addTag(leadId: string, tag: string) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.tags.includes(tag)) return
    await updateLead(leadId, { tags: [...lead.tags, tag] })
  }

  async function removeTag(leadId: string, tag: string) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    await updateLead(leadId, { tags: lead.tags.filter(t => t !== tag) })
  }

  // ─── Drag & Drop (mouse + touch) ───
  const touchStartRef = React.useRef<{ id: string; x: number; y: number } | null>(null)

  function handleDragStart(leadId: string) { setDraggedLead(leadId) }
  function handleDragOver(e: React.DragEvent, status: string) { e.preventDefault(); setDragOverCol(status) }
  function handleDrop(status: string) {
    if (draggedLead) {
      updateLead(draggedLead, { status })
      showToast(`Lead movido para ${COLUMNS.find(c => c.status === status)?.label || status}`, "success")
    }
    setDraggedLead(null)
    setDragOverCol(null)
  }
  function handleDragEnd() { setDraggedLead(null); setDragOverCol(null) }

  // Touch: long-press to start drag, move to detect column, release to drop
  function handleTouchStart(leadId: string, e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStartRef.current = { id: leadId, x: touch.clientX, y: touch.clientY }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    // Ativar drag após mover 20px horizontal
    if (dx > 20 && !draggedLead) {
      setDraggedLead(touchStartRef.current.id)
    }
    if (draggedLead) {
      // Detectar coluna sob o dedo
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const colEl = el?.closest("[data-col-status]")
      if (colEl) {
        const status = colEl.getAttribute("data-col-status")
        if (status) setDragOverCol(status)
      }
    }
  }
  function handleTouchEnd() {
    if (draggedLead && dragOverCol) {
      handleDrop(dragOverCol)
    }
    touchStartRef.current = null
    setDraggedLead(null)
    setDragOverCol(null)
  }

  // ─── Helpers ───
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = leads.filter(l => l.status === col.status)
    return acc
  }, {} as Record<string, Lead[]>)

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "hoje"
    if (days === 1) return "ontem"
    return `${days}d atrás`
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-orange-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-blue-400"
    return "text-neutral-600"
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return "Muito Quente"
    if (score >= 60) return "Quente"
    if (score >= 40) return "Morno"
    if (score >= 20) return "Frio"
    return "Gelado"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ToastUI toast={toast} />
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-400" />
            CRM — Pipeline de Vendas
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {pipeline ? `${pipeline.total} leads · R$ ${leads.reduce((s, l) => s + (l.value || 0), 0).toLocaleString("pt-BR")} em pipeline` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={scoreAllLeads}
            disabled={scoring}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", scoring && "animate-spin")} />
            {scoring ? "Pontuando..." : "AI Score"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold shadow-lg shadow-red-600/20"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancelar" : "Novo Lead"}
          </button>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl overflow-x-auto scrollbar-hide">
          {[
            { key: "pipeline" as const, label: "Pipeline", icon: Target },
            { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
            { key: "inbox" as const, label: "Caixa de Entrada", icon: MessageCircle },
            { key: "broadcasts" as const, label: "Envios", icon: Send },
            { key: "templates" as const, label: "Templates", icon: FileText },
            { key: "webhooks" as const, label: "Webhooks", icon: Webhook },
            { key: "bots" as const, label: "Bots", icon: Bot },
            { key: "whatsapp" as const, label: "WhatsApp", icon: Smartphone, highlight: true },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                tab === t.key ? "bg-white/[0.08] text-white" : "text-neutral-500 hover:text-neutral-300",
                "highlight" in t && t.highlight && tab !== t.key && "text-green-500/70 hover:text-green-400"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TEMPERATURE PILLS ═══ */}
      {/* Bot status inline */}
      {tab === "pipeline" && <BotPauseControl botType="victor" botName="Victor Bot" botDescription="Personal Trainer — atende leads de treino" />}

      {tab === "pipeline" && temperatures && (
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar lead..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterTemp(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                !filterTemp ? "bg-white/[0.08] border-white/[0.12] text-white" : "bg-transparent border-white/[0.04] text-neutral-600 hover:text-neutral-400"
              )}
            >
              Todos
            </button>
            {(["HOT", "WARM", "COLD"] as const).map(temp => {
              const cfg = TEMP_CONFIG[temp]
              const count = temperatures[temp]
              return (
                <button
                  key={temp}
                  onClick={() => setFilterTemp(filterTemp === temp ? null : temp)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                    filterTemp === temp
                      ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                      : "bg-transparent border-white/[0.04] text-neutral-600 hover:text-neutral-400"
                  )}
                >
                  <cfg.icon className="w-3 h-3" />
                  {cfg.label}
                  <span className={cn("ml-0.5", filterTemp === temp ? cfg.color : "text-neutral-700")}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ NEW LEAD FORM ═══ */}
      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-red-500/30 [color-scheme:dark]">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-red-500/30 [color-scheme:dark]">
              <option value="HOT">🔥 Quente</option>
              <option value="WARM">🌡 Morno</option>
              <option value="COLD">❄ Frio</option>
            </select>
            <input type="text" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Valor mensal R$"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30 resize-none" rows={2} />
          <button onClick={createLead} disabled={!form.name || saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40">
            {saving ? "Salvando..." : "Adicionar Lead"}
          </button>
        </div>
      )}

      {/* ═══ PIPELINE TAB ═══ */}
      {tab === "pipeline" && (
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {COLUMNS.map(col => {
            const colLeads = grouped[col.status] || []
            const isDragOver = dragOverCol === col.status

            return (
              <div
                key={col.status}
                className={cn(
                  "min-w-[280px] w-[280px] flex-shrink-0 rounded-2xl border-t-2 snap-start transition-all",
                  col.color,
                  isDragOver ? "bg-white/[0.04]" : "bg-white/[0.015]"
                )}
                data-col-status={col.status}
                onDragOver={e => handleDragOver(e, col.status)}
                onDrop={() => handleDrop(col.status)}
                onDragLeave={() => setDragOverCol(null)}
              >
                {/* Column header */}
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", col.dot)} />
                    <span className="text-xs font-semibold text-white">{col.label}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", col.bg, col.text)}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="px-2 pb-2 space-y-2 min-h-[100px]">
                  {colLeads.map(lead => {
                    const SourceIcon = SOURCE_ICONS[lead.source] || UserPlus
                    const isDragging = draggedLead === lead.id
                    const tempCfg = TEMP_CONFIG[lead.temperature as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.COLD
                    const TempIcon = tempCfg.icon

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={e => handleTouchStart(lead.id, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          "rounded-xl bg-[#111] border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing transition-all hover:border-white/[0.12] group",
                          isDragging && "opacity-40 scale-95"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-neutral-700 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                {lead.score > 0 && (
                                  <span className={cn("text-[9px] font-bold", getScoreColor(lead.score))}>
                                    {lead.score}
                                  </span>
                                )}
                                <TempIcon className={cn("w-3 h-3", tempCfg.color)} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <SourceIcon className="w-3 h-3 text-neutral-600" />
                              <span className="text-[10px] text-neutral-600">{SOURCE_LABELS[lead.source] || lead.source}</span>
                              <span className="text-[10px] text-neutral-700">·</span>
                              <Clock className="w-2.5 h-2.5 text-neutral-700" />
                              <span className="text-[10px] text-neutral-700">{timeAgo(lead.createdAt)}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Phone className="w-2.5 h-2.5 text-neutral-600" />
                                <span className="text-[10px] text-neutral-500">{lead.phone}</span>
                              </div>
                            )}
                            {lead.value && (
                              <p className="text-[10px] font-semibold text-emerald-400 mt-1">R$ {lead.value}/mês</p>
                            )}
                            {/* Tags */}
                            {lead.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {lead.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.05] text-neutral-500 border border-white/[0.04]">
                                    {tag}
                                  </span>
                                ))}
                                {lead.tags.length > 3 && (
                                  <span className="text-[8px] text-neutral-700">+{lead.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                            {lead._count.followUps > 0 && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <MessageCircle className="w-2.5 h-2.5 text-neutral-600" />
                                <span className="text-[10px] text-neutral-600">{lead._count.followUps} notas</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {colLeads.length === 0 && (
                    <div className={cn(
                      "rounded-xl border-2 border-dashed py-6 text-center transition-all",
                      isDragOver ? "border-white/[0.15] bg-white/[0.02]" : "border-white/[0.04]"
                    )}>
                      <p className="text-[10px] text-neutral-700">
                        {isDragOver ? "Solte aqui" : "Arraste leads aqui"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ DASHBOARD TAB ═══ */}
      {tab === "dashboard" && (
        <CrmDashboard data={dashboard} onRefresh={fetchDashboard} />
      )}

      {/* ═══ INBOX TAB ═══ */}
      {tab === "inbox" && <CrmInbox />}

      {/* ═══ BROADCASTS TAB ═══ */}
      {tab === "broadcasts" && <CrmBroadcasts />}

      {/* ═══ TEMPLATES TAB ═══ */}
      {tab === "templates" && <CrmTemplates />}

      {/* ═══ WEBHOOKS TAB ═══ */}
      {tab === "webhooks" && <CrmWebhooks />}

      {/* ═══ BOTS TAB ═══ */}
      {tab === "bots" && <CrmBots />}

      {/* ═══ WHATSAPP TAB ═══ */}
      {tab === "whatsapp" && (
        <div className="space-y-6">
          <BotPauseControl botType="victor" botName="Victor Bot" botDescription="Personal Trainer — atende leads de treino" />
          <WhatsAppConnection />
        </div>
      )}

      {/* ═══ LEAD DETAIL MODAL ═══ */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={updateLead}
          onDeleteLead={deleteLead}
          onAddFollowUp={addFollowUp}
          followUpText={followUpText}
          setFollowUpText={setFollowUpText}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          tagInput={tagInput}
          setTagInput={setTagInput}
          getScoreColor={getScoreColor}
          getScoreLabel={getScoreLabel}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// Dashboard Component
// ═══════════════════════════════════════

function CrmDashboard({ data, onRefresh }: { data: DashboardData | null; onRefresh: () => void }) {
  if (!data) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
    </div>
  )

  const { overview, temperatures, leadsBySource, topLeads, recentActivities } = data

  return (
    <div className="space-y-4 animate-slide-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Leads", value: overview.totalLeads, color: "text-white" },
          { label: "Ativos", value: overview.activeLeads, color: "text-blue-400" },
          { label: "Convertidos", value: overview.convertedLeads, color: "text-emerald-400" },
          { label: "Perdidos", value: overview.lostLeads, color: "text-red-400" },
          { label: "Conversão", value: `${overview.conversionRate}%`, color: "text-amber-400" },
          { label: "Novos (7d)", value: overview.newThisWeek, color: "text-purple-400" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[9px] text-neutral-600 uppercase tracking-wider">{kpi.label}</p>
            <p className={cn("text-lg font-bold mt-1", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Temperature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Revenue */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Receita Pipeline</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Pipeline ativo</span>
                <span className="text-emerald-400 font-semibold">R$ {overview.pipelineValue.toLocaleString("pt-BR")}/mês</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${overview.pipelineValue > 0 ? Math.min((overview.pipelineValue / (overview.pipelineValue + overview.convertedValue || 1)) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Convertido</span>
                <span className="text-white font-semibold">R$ {overview.convertedValue.toLocaleString("pt-BR")}/mês</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                  style={{ width: `${overview.convertedValue > 0 ? Math.min((overview.convertedValue / (overview.pipelineValue + overview.convertedValue || 1)) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Temperature distribution */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Temperatura dos Leads</p>
          <div className="space-y-2.5">
            {(["HOT", "WARM", "COLD"] as const).map(temp => {
              const cfg = TEMP_CONFIG[temp]
              const count = temperatures[temp]
              const total = temperatures.HOT + temperatures.WARM + temperatures.COLD || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={temp}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={cn("flex items-center gap-1.5", cfg.color)}>
                      <cfg.icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <span className="text-neutral-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", temp === "HOT" ? "bg-orange-500" : temp === "WARM" ? "bg-yellow-500" : "bg-blue-500")}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sources + Top Leads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Sources */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Leads por Fonte</p>
          <div className="space-y-2">
            {leadsBySource.map(s => {
              const totalLeads = leadsBySource.reduce((a, b) => a + b.count, 0) || 1
              const pct = Math.round((s.count / totalLeads) * 100)
              const Icon = SOURCE_ICONS[s.source] || UserPlus
              return (
                <div key={s.source} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-neutral-600 shrink-0" />
                  <span className="text-xs text-neutral-400 w-20 shrink-0">{SOURCE_LABELS[s.source] || s.source}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-neutral-600 w-8 text-right">{s.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Leads */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Top Leads (Score)</p>
            <button onClick={onRefresh} className="text-neutral-600 hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {topLeads.map((lead, i) => {
              const tempCfg = TEMP_CONFIG[lead.temperature as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.COLD
              return (
                <div key={lead.id} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-neutral-700 w-4">{i + 1}.</span>
                  <tempCfg.icon className={cn("w-3 h-3 shrink-0", tempCfg.color)} />
                  <span className="text-xs text-white truncate flex-1">{lead.name}</span>
                  {lead.value && <span className="text-[10px] text-emerald-400/60">R${lead.value}</span>}
                  <span className={cn("text-[10px] font-bold", lead.score >= 60 ? "text-orange-400" : lead.score >= 30 ? "text-yellow-400" : "text-blue-400")}>
                    {lead.score}
                  </span>
                </div>
              )
            })}
            {topLeads.length === 0 && <p className="text-xs text-neutral-700">Nenhum lead pontuado ainda</p>}
          </div>
        </div>
      </div>

      {/* Funil de Conversão */}
      {data.funnel && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Funil de Conversão</p>
          <div className="space-y-2">
            {(data.funnel as { stage: string; count: number; reached: number; rate: number }[]).map((step, i) => {
              const labels: Record<string, string> = { NEW: "Novos", CONTACTED: "Contactados", TRIAL: "Experimental", NEGOTIATING: "Negociando", CONVERTED: "Convertidos" }
              const colors = ["bg-blue-500", "bg-cyan-500", "bg-yellow-500", "bg-orange-500", "bg-emerald-500"]
              const maxReached = (data.funnel as { reached: number }[])[0]?.reached || 1
              const width = Math.max((step.reached / maxReached) * 100, 8)
              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-400">{labels[step.stage] || step.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">{step.reached}</span>
                      {i > 0 && <span className={cn("text-[9px] font-bold", step.rate >= 50 ? "text-emerald-400" : step.rate >= 25 ? "text-yellow-400" : "text-red-400")}>{step.rate}%</span>}
                    </div>
                  </div>
                  <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", colors[i])} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leads por Semana */}
      {data.weeklyCapture && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Captura Semanal (últimas 4 semanas)</p>
          <div className="flex items-end gap-2 h-24">
            {(data.weeklyCapture as number[]).map((count, i) => {
              const max = Math.max(...(data.weeklyCapture as number[]), 1)
              const height = Math.max((count / max) * 100, 4)
              const labels = ["4 sem", "3 sem", "2 sem", "Esta"]
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-neutral-500 font-bold">{count}</span>
                  <div className="w-full rounded-t-lg bg-red-500/60 transition-all" style={{ height: `${height}%` }} />
                  <span className="text-[8px] text-neutral-700">{labels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Atividade Recente</p>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {recentActivities.map(a => (
            <div key={a.id} className="flex items-start gap-2 py-1.5 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-neutral-500">{ACTION_LABELS[a.action] || a.action}</span>
                <span className="text-neutral-700"> · </span>
                <span className="text-white font-medium">{a.leadName}</span>
                {a.details && <p className="text-neutral-600 text-[10px] mt-0.5 truncate">{a.details}</p>}
              </div>
              <span className="text-[10px] text-neutral-700 shrink-0">
                {new Date(a.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
          {recentActivities.length === 0 && <p className="text-xs text-neutral-700">Nenhuma atividade ainda</p>}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Lead Detail Modal
// ═══════════════════════════════════════

function LeadDetailModal({
  lead, onClose, onUpdateLead, onDeleteLead, onAddFollowUp,
  followUpText, setFollowUpText, onAddTag, onRemoveTag,
  tagInput, setTagInput, getScoreColor, getScoreLabel,
}: {
  lead: Lead
  onClose: () => void
  onUpdateLead: (id: string, data: Record<string, unknown>) => void
  onDeleteLead: (id: string) => void
  onAddFollowUp: (id: string) => void
  followUpText: string
  setFollowUpText: (v: string) => void
  onAddTag: (id: string, tag: string) => void
  onRemoveTag: (id: string, tag: string) => void
  tagInput: string
  setTagInput: (v: string) => void
  getScoreColor: (s: number) => string
  getScoreLabel: (s: number) => string
}) {
  const tempCfg = TEMP_CONFIG[lead.temperature as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.COLD

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85dvh] rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">{lead.name}</h2>
                {lead.score > 0 && (
                  <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold", tempCfg.bg, tempCfg.border, "border")}>
                    <tempCfg.icon className={cn("w-3 h-3", tempCfg.color)} />
                    <span className={tempCfg.color}>{lead.score}</span>
                    <span className="text-neutral-500">· {getScoreLabel(lead.score)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                {lead.phone && (
                  <a href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`} target="_blank" className="flex items-center gap-1 hover:text-green-400 transition-colors">
                    <Phone className="w-3 h-3" /> {lead.phone}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {lead.email}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Temperature selector */}
          <div className="flex items-center gap-1.5 mt-3">
            {(["HOT", "WARM", "COLD"] as const).map(temp => {
              const cfg = TEMP_CONFIG[temp]
              const isActive = lead.temperature === temp
              return (
                <button
                  key={temp}
                  onClick={() => onUpdateLead(lead.id, { temperature: temp })}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                    isActive ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-transparent border-white/[0.04] text-neutral-600 hover:text-neutral-400"
                  )}
                >
                  <cfg.icon className="w-3 h-3" /> {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Pipeline progress */}
          <div className="flex items-center gap-1 mt-3">
            {COLUMNS.filter(c => c.status !== "LOST").map(col => {
              const isAt = col.status === lead.status
              const isPast = COLUMNS.findIndex(c => c.status === col.status) < COLUMNS.findIndex(c => c.status === lead.status)
              return (
                <button
                  key={col.status}
                  onClick={() => onUpdateLead(lead.id, { status: col.status })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[8px] uppercase font-bold transition-all",
                    isAt ? `${col.bg} ${col.text} border ${col.color.replace("border-", "border-")}/25` :
                    isPast ? "bg-emerald-500/5 text-emerald-500/50" : "bg-white/[0.03] text-neutral-600"
                  )}
                >
                  {col.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Info row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
              <p className="text-[9px] text-neutral-600 uppercase">Fonte</p>
              <p className="text-xs text-white font-medium">{SOURCE_LABELS[lead.source]}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
              <p className="text-[9px] text-neutral-600 uppercase">Valor</p>
              <p className="text-xs text-emerald-400 font-medium">{lead.value ? `R$ ${lead.value}` : "—"}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
              <p className="text-[9px] text-neutral-600 uppercase">Score</p>
              <p className={cn("text-xs font-bold", getScoreColor(lead.score))}>{lead.score || "—"}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
              <p className="text-[9px] text-neutral-600 uppercase">Criado</p>
              <p className="text-xs text-white font-medium">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] text-neutral-600 uppercase mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {lead.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-white/[0.05] text-neutral-400 border border-white/[0.06] group">
                  {tag}
                  <button onClick={() => onRemoveTag(lead.id, tag)} className="text-neutral-700 hover:text-red-400 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="+ tag"
                  className="w-16 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04] text-[10px] text-white placeholder:text-neutral-700 outline-none focus:border-red-500/20"
                  onKeyDown={e => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      onAddTag(lead.id, tagInput.trim().toLowerCase())
                      setTagInput("")
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="bg-white/[0.02] rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-neutral-600 uppercase mb-1">Observações</p>
              <p className="text-xs text-neutral-400">{lead.notes}</p>
            </div>
          )}

          {/* Follow-ups */}
          <div>
            <p className="text-[10px] text-neutral-600 uppercase mb-2">Histórico</p>
            {lead.followUps.length > 0 ? (
              <div className="space-y-1.5">
                {lead.followUps.map(f => (
                  <div key={f.id} className="text-xs text-neutral-400 bg-white/[0.02] rounded-lg px-3 py-2 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-neutral-600">{new Date(f.createdAt).toLocaleDateString("pt-BR")}</span>
                      {" — "}{f.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-700">Nenhuma nota ainda</p>
            )}
          </div>

          {/* Add follow-up */}
          <div className="flex gap-2">
            <input
              type="text"
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              placeholder="Adicionar nota..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
              onKeyDown={e => e.key === "Enter" && onAddFollowUp(lead.id)}
            />
            <button onClick={() => onAddFollowUp(lead.id)} className="px-3 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 hover:bg-red-600/30 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex justify-between">
          <button
            onClick={() => { onUpdateLead(lead.id, { status: "LOST" }); onClose() }}
            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
          >
            Marcar como perdido
          </button>
          <button
            onClick={() => onDeleteLead(lead.id)}
            className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Templates Component
// ═══════════════════════════════════════

type Template = {
  id: string; name: string; content: string; type: string
  category: string | null; variables: string[]; createdAt: string; updatedAt: string
}

function CrmTemplates() {
  const { toast, showToast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: "", content: "", type: "whatsapp", category: "" })

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/crm/templates")
      if (res.ok) setTemplates((await res.json()).templates)
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  async function saveTemplate() {
    if (!form.name || !form.content) return
    const method = editing ? "PATCH" : "POST"
    const url = editing ? `/api/admin/crm/templates?id=${editing.id}` : "/api/admin/crm/templates"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowForm(false)
    setEditing(null)
    setForm({ name: "", content: "", type: "whatsapp", category: "" })
    fetchTemplates()
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/admin/crm/templates?id=${id}`, { method: "DELETE" })
    fetchTemplates()
  }

  function startEdit(t: Template) {
    setEditing(t)
    setForm({ name: t.name, content: t.content, type: t.type, category: t.category || "" })
    setShowForm(true)
  }

  // Detect variables in content
  const detectedVars = form.content.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/[{}]/g, "")) || []

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>

  return (
    <div className="space-y-4 animate-slide-up">
      <ToastUI toast={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Templates de Mensagem</h2>
          <p className="text-[10px] text-neutral-600 mt-0.5">{templates.length} templates · WhatsApp, Email, SMS</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", content: "", type: "whatsapp", category: "" }) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs hover:bg-red-600/30 transition-all">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Template"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do template *"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none [color-scheme:dark]">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Categoria (ex: boas-vindas)"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
          </div>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Conteúdo da mensagem... Use {{nome}}, {{telefone}}, {{valor}} para variáveis"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30 resize-none" rows={4} />
          {detectedVars.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-600">Variáveis:</span>
              {detectedVars.map(v => (
                <span key={v} className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">{`{{${v}}}`}</span>
              ))}
            </div>
          )}
          <button onClick={saveTemplate} disabled={!form.name || !form.content}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40">
            {editing ? "Atualizar Template" : "Criar Template"}
          </button>
        </div>
      )}

      {/* Template list */}
      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 group hover:border-white/[0.12] transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.05] text-neutral-500 uppercase">{t.type}</span>
                  {t.category && <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/10 text-purple-400">{t.category}</span>}
                </div>
                <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{t.content}</p>
                {t.variables.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {t.variables.map(v => (
                      <span key={v} className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400/60">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-600 hover:text-white transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && !showForm && (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
            <p className="text-xs text-neutral-600">Nenhum template criado</p>
            <p className="text-[10px] text-neutral-700 mt-1">Crie templates para agilizar comunicação com leads</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Webhooks Component
// ═══════════════════════════════════════

type WebhookData = {
  id: string; name: string; token: string; action: string; active: boolean
  config: Record<string, string> | null; createdAt: string
  _count: { logs: number }
}

type WebhookLog = {
  id: string; payload: unknown; status: string; response: string | null; createdAt: string
}

function CrmWebhooks() {
  const { toast, showToast } = useToast()
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", action: "create_lead" })
  const [viewLogs, setViewLogs] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/admin/crm/webhooks")
      if (res.ok) setWebhooks((await res.json()).webhooks)
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  async function fetchLogs(webhookId: string) {
    try {
      const res = await fetch(`/api/admin/crm/webhooks?logs=1&webhookId=${webhookId}`)
      if (res.ok) setLogs((await res.json()).logs)
    } catch { showToast("Erro ao processar. Tente novamente.") }
  }

  useEffect(() => { fetchWebhooks() }, [])

  async function createWebhook() {
    if (!form.name) return
    await fetch("/api/admin/crm/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ name: "", action: "create_lead" })
    fetchWebhooks()
  }

  async function toggleWebhook(id: string, active: boolean) {
    await fetch(`/api/admin/crm/webhooks?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    fetchWebhooks()
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/admin/crm/webhooks?id=${id}`, { method: "DELETE" })
    fetchWebhooks()
  }

  function copyUrl(token: string) {
    const baseUrl = window.location.origin
    navigator.clipboard.writeText(`${baseUrl}/api/webhooks/crm?token=${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>

  return (
    <div className="space-y-4 animate-slide-up">
      <ToastUI toast={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Webhooks de Entrada</h2>
          <p className="text-[10px] text-neutral-600 mt-0.5">Integre ManyChat, Zapier, Make, n8n e mais</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs hover:bg-red-600/30 transition-all">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Webhook"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome (ex: ManyChat Leads) *"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none [color-scheme:dark]">
              <option value="create_lead">Criar Lead</option>
              <option value="update_lead">Atualizar Lead</option>
              <option value="custom">Custom (só log)</option>
            </select>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-3">
            <p className="text-[10px] text-neutral-500 mb-1.5">Campos aceitos no payload JSON:</p>
            <div className="flex flex-wrap gap-1">
              {["name", "phone", "email", "source", "value", "notes", "tags"].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[9px] bg-white/[0.04] text-neutral-400 font-mono">{f}</span>
              ))}
            </div>
          </div>
          <button onClick={createWebhook} disabled={!form.name}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40">
            Criar Webhook
          </button>
        </div>
      )}

      {/* Webhook list */}
      <div className="space-y-2">
        {webhooks.map(wh => (
          <div key={wh.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => toggleWebhook(wh.id, wh.active)} className="shrink-0">
                  {wh.active
                    ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                    : <ToggleLeft className="w-5 h-5 text-neutral-600" />
                  }
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-neutral-600" />
                    <span className="text-sm font-medium text-white">{wh.name}</span>
                    <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase font-semibold",
                      wh.active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-500/10 text-neutral-500"
                    )}>
                      {wh.active ? "ativo" : "inativo"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.05] text-neutral-500">
                      {wh.action === "create_lead" ? "Criar Lead" : wh.action === "update_lead" ? "Atualizar Lead" : "Custom"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[9px] text-neutral-600 font-mono truncate max-w-[300px]">
                      /api/webhooks/crm?token={wh.token.substring(0, 12)}...
                    </code>
                    <button onClick={() => copyUrl(wh.token)} className="text-neutral-600 hover:text-white transition-colors">
                      <Copy className={cn("w-3 h-3", copied === wh.token && "text-emerald-400")} />
                    </button>
                    {copied === wh.token && <span className="text-[9px] text-emerald-400">Copiado!</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setViewLogs(viewLogs === wh.id ? null : wh.id); if (viewLogs !== wh.id) fetchLogs(wh.id) }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-all">
                  <Eye className="w-3 h-3" /> {wh._count.logs} logs
                </button>
                <button onClick={() => deleteWebhook(wh.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Logs */}
            {viewLogs === wh.id && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5 max-h-[200px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-[10px]">
                    <span className={cn("px-1.5 py-0.5 rounded font-semibold shrink-0",
                      log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {log.status}
                    </span>
                    <span className="text-neutral-600 shrink-0">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                    <span className="text-neutral-500 truncate">{log.response || JSON.stringify(log.payload).substring(0, 80)}</span>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-[10px] text-neutral-700">Nenhum log ainda</p>}
              </div>
            )}
          </div>
        ))}
        {webhooks.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Webhook className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
            <p className="text-xs text-neutral-600">Nenhum webhook criado</p>
            <p className="text-[10px] text-neutral-700 mt-1">Crie webhooks para receber leads do ManyChat, Zapier, etc.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Inbox Component
// ═══════════════════════════════════════

type Conversation = {
  id: string; leadId: string; channel: string; status: string
  assignedTo: string | null; unreadCount: number; lastMessage: string | null
  lastMessageAt: string | null; createdAt: string
  lead: { id: string; name: string; phone: string | null; temperature: string; score: number; status: string }
}

type CrmMsg = {
  id: string; content: string; fromMe: boolean; type: string; status: string; createdAt: string
}

function CrmInbox() {
  const { toast, showToast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<CrmMsg[]>([])
  const [msgText, setMsgText] = useState("")
  const [statusFilter, setStatusFilter] = useState("OPEN")
  const [unreadTotal, setUnreadTotal] = useState(0)

  async function fetchConversations() {
    try {
      const res = await fetch(`/api/admin/crm/conversations?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
        setUnreadTotal(data.unreadTotal)
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  async function fetchMessages(convId: string) {
    try {
      const res = await fetch(`/api/admin/crm/conversations?id=${convId}`)
      if (res.ok) setMessages((await res.json()).conversation.messages)
    } catch { showToast("Erro ao processar. Tente novamente.") }
  }

  useEffect(() => { fetchConversations() }, [statusFilter])

  async function sendMessage() {
    if (!msgText.trim() || !selected) return
    await fetch("/api/admin/crm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected, content: msgText }),
    })
    setMsgText("")
    fetchMessages(selected)
    fetchConversations()
  }

  async function closeConversation(id: string) {
    await fetch(`/api/admin/crm/conversations?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    })
    setSelected(null)
    fetchConversations()
  }

  const selectedConv = conversations.find(c => c.id === selected)

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>

  return (
    <div className="animate-slide-up">
      <ToastUI toast={toast} />
      <div className="flex items-center gap-2 mb-4">
        {["OPEN", "CLOSED", "ALL"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all",
              statusFilter === s ? "bg-white/[0.08] border-white/[0.12] text-white" : "border-white/[0.04] text-neutral-600"
            )}>
            {s === "OPEN" ? "Abertas" : s === "CLOSED" ? "Fechadas" : "Todas"}
            {s === "OPEN" && unreadTotal > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px]">{unreadTotal}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3 min-h-[400px]">
        {/* List */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {conversations.map(conv => {
              const cfg = TEMP_CONFIG[conv.lead.temperature as keyof typeof TEMP_CONFIG] || TEMP_CONFIG.COLD
              return (
                <button key={conv.id} onClick={() => { setSelected(conv.id); fetchMessages(conv.id) }}
                  className={cn("w-full p-3 text-left transition-all hover:bg-white/[0.03]", selected === conv.id && "bg-white/[0.05]")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <cfg.icon className={cn("w-3 h-3 shrink-0", cfg.color)} />
                      <span className="text-xs font-medium text-white truncate">{conv.lead.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {conv.unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold">{conv.unreadCount}</span>}
                      <span className="text-[8px] text-neutral-700 uppercase">{conv.channel}</span>
                    </div>
                  </div>
                  {conv.lastMessage && <p className="text-[10px] text-neutral-600 mt-1 truncate">{conv.lastMessage}</p>}
                </button>
              )
            })}
            {conversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="w-6 h-6 text-neutral-800 mx-auto mb-2" />
                <p className="text-[10px] text-neutral-700">Nenhuma conversa</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{selectedConv.lead.name}</span>
                  {selectedConv.lead.phone && (
                    <a href={`https://wa.me/55${selectedConv.lead.phone.replace(/\D/g, "")}`} target="_blank"
                      className="text-[10px] text-neutral-500 hover:text-green-400 flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" /> {selectedConv.lead.phone}
                    </a>
                  )}
                </div>
                <button onClick={() => closeConversation(selectedConv.id)}
                  className="text-[10px] text-neutral-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
                  Fechar
                </button>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[350px]">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] px-3 py-2 rounded-xl text-xs",
                      msg.fromMe ? "bg-red-600/20 text-white rounded-br-none" : "bg-white/[0.05] text-neutral-300 rounded-bl-none")}>
                      <p>{msg.content}</p>
                      <p className={cn("text-[8px] mt-1", msg.fromMe ? "text-red-300/40" : "text-neutral-600")}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-[10px] text-neutral-700 py-8">Nenhuma mensagem</p>}
              </div>
              <div className="p-3 border-t border-white/[0.06] flex gap-2">
                <input type="text" value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                  onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <button onClick={sendMessage} className="px-3 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 hover:bg-red-600/30 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
                <p className="text-xs text-neutral-600">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Broadcasts Component
// ═══════════════════════════════════════

type Broadcast = {
  id: string; name: string; content: string; status: string
  filters: Record<string, unknown> | null; sentCount: number; failedCount: number
  createdAt: string; _count: { recipients: number }
}

function CrmBroadcasts() {
  const { toast, showToast } = useToast()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [form, setForm] = useState({ name: "", content: "", temperatures: [] as string[], minScore: 0 })

  async function fetchBroadcasts() {
    try {
      const res = await fetch("/api/admin/crm/broadcasts")
      if (res.ok) setBroadcasts((await res.json()).broadcasts)
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  useEffect(() => { fetchBroadcasts() }, [])

  async function previewRecipients() {
    const filters: Record<string, unknown> = {}
    if (form.temperatures.length > 0) filters.temperatures = form.temperatures
    if (form.minScore > 0) filters.minScore = form.minScore
    const res = await fetch("/api/admin/crm/broadcasts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "count", filters }),
    })
    if (res.ok) setPreviewCount((await res.json()).count)
  }

  async function createBroadcast() {
    if (!form.name || !form.content) return
    const filters: Record<string, unknown> = {}
    if (form.temperatures.length > 0) filters.temperatures = form.temperatures
    if (form.minScore > 0) filters.minScore = form.minScore
    await fetch("/api/admin/crm/broadcasts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, content: form.content, filters }),
    })
    setShowForm(false)
    setForm({ name: "", content: "", temperatures: [], minScore: 0 })
    setPreviewCount(null)
    fetchBroadcasts()
  }

  async function sendBroadcast(id: string) {
    setSending(id)
    await fetch(`/api/admin/crm/broadcasts?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    })
    setSending(null)
    fetchBroadcasts()
  }

  async function deleteBroadcast(id: string) {
    await fetch(`/api/admin/crm/broadcasts?id=${id}`, { method: "DELETE" })
    fetchBroadcasts()
  }

  function toggleTemp(temp: string) {
    setForm(prev => ({
      ...prev,
      temperatures: prev.temperatures.includes(temp)
        ? prev.temperatures.filter(t => t !== temp)
        : [...prev.temperatures, temp],
    }))
  }

  const STATUS_STYLE: Record<string, string> = {
    DRAFT: "bg-neutral-500/10 text-neutral-400", SENDING: "bg-amber-500/10 text-amber-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-400", CANCELLED: "bg-red-500/10 text-red-400",
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>

  return (
    <div className="space-y-4 animate-slide-up">
      <ToastUI toast={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Broadcasts</h2>
          <p className="text-[10px] text-neutral-600 mt-0.5">Envie mensagens em massa para seus leads</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setPreviewCount(null) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs hover:bg-red-600/30 transition-all">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Broadcast"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome da campanha *"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Mensagem... Use {{nome}} para personalizar"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30 resize-none" rows={3} />
          <div className="bg-white/[0.02] rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Filtros</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-600">Temperatura:</span>
              {(["HOT", "WARM", "COLD"] as const).map(temp => {
                const cfg = TEMP_CONFIG[temp]
                return (
                  <button key={temp} onClick={() => toggleTemp(temp)}
                    className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-all",
                      form.temperatures.includes(temp) ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-white/[0.04] text-neutral-600")}>
                    <cfg.icon className="w-3 h-3" /> {cfg.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-600">Score mínimo:</span>
              <input type="number" value={form.minScore || ""} onChange={e => setForm({ ...form, minScore: parseInt(e.target.value) || 0 })}
                placeholder="0" className="w-16 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[10px] text-white outline-none" />
            </div>
            <button onClick={previewRecipients} className="text-[10px] text-red-400 hover:text-red-300">Contar destinatários</button>
            {previewCount !== null && <p className="text-[10px] text-emerald-400 font-semibold">{previewCount} leads serão alcançados</p>}
          </div>
          <button onClick={createBroadcast} disabled={!form.name || !form.content}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40">
            Criar Broadcast (Rascunho)
          </button>
        </div>
      )}

      <div className="space-y-2">
        {broadcasts.map(bc => (
          <div key={bc.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-neutral-600" />
                <span className="text-sm font-medium text-white">{bc.name}</span>
                <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase font-semibold", STATUS_STYLE[bc.status] || "")}>
                  {bc.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {bc.status === "DRAFT" && (
                  <button onClick={() => sendBroadcast(bc.id)} disabled={sending === bc.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-40">
                    {sending === bc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Enviar
                  </button>
                )}
                <button onClick={() => deleteBroadcast(bc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 line-clamp-1">{bc.content}</p>
            {bc.status === "COMPLETED" && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-emerald-400">{bc.sentCount} enviados</span>
                {bc.failedCount > 0 && <span className="text-[10px] text-red-400">{bc.failedCount} falharam</span>}
              </div>
            )}
          </div>
        ))}
        {broadcasts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Send className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
            <p className="text-xs text-neutral-600">Nenhum broadcast</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// Bot Flows / Automações Component
// ═══════════════════════════════════════

type BotFlow = {
  id: string; name: string; trigger: string
  nodes: unknown[]; edges: unknown[]; active: boolean
  createdAt: string; updatedAt: string
}

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "Novo Lead", keyword: "Palavra-chave",
  status_change: "Mudança de Status", manual: "Manual",
}

const TRIGGER_COLORS: Record<string, string> = {
  new_lead: "bg-blue-500/10 text-blue-400",
  keyword: "bg-purple-500/10 text-purple-400",
  status_change: "bg-amber-500/10 text-amber-400",
  manual: "bg-neutral-500/10 text-neutral-400",
}

// Pre-built automation templates
const BOT_TEMPLATES = [
  {
    name: "Boas-vindas novo lead",
    trigger: "new_lead",
    nodes: [
      { id: "1", type: "trigger", data: { label: "Novo Lead entra" } },
      { id: "2", type: "delay", data: { label: "Esperar 5 min", minutes: 5 } },
      { id: "3", type: "message", data: { label: "Enviar boas-vindas", content: "Oi {{nome}}! Vi que você se interessou pelo treino. Sou o Victor, personal trainer. Posso te ajudar?" } },
    ],
    edges: [{ source: "1", target: "2" }, { source: "2", target: "3" }],
  },
  {
    name: "Follow-up pós-treino",
    trigger: "manual",
    nodes: [
      { id: "1", type: "trigger", data: { label: "Aluno termina treino" } },
      { id: "2", type: "delay", data: { label: "Esperar 2h", minutes: 120 } },
      { id: "3", type: "message", data: { label: "Perguntar como foi", content: "E aí {{nome}}, como foi o treino hoje? Sentiu algo diferente?" } },
    ],
    edges: [{ source: "1", target: "2" }, { source: "2", target: "3" }],
  },
  {
    name: "Lead frio → re-engajamento",
    trigger: "status_change",
    nodes: [
      { id: "1", type: "trigger", data: { label: "Lead ficou COLD" } },
      { id: "2", type: "delay", data: { label: "Esperar 3 dias", minutes: 4320 } },
      { id: "3", type: "message", data: { label: "Re-engajar", content: "Fala {{nome}}! Tudo bem? Vi que faz um tempo que não conversamos. Tá treinando? Se precisar de ajuda, é só chamar!" } },
    ],
    edges: [{ source: "1", target: "2" }, { source: "2", target: "3" }],
  },
  {
    name: "Recuperar lead perdido",
    trigger: "status_change",
    nodes: [
      { id: "1", type: "trigger", data: { label: "Lead marcado LOST" } },
      { id: "2", type: "delay", data: { label: "Esperar 7 dias", minutes: 10080 } },
      { id: "3", type: "message", data: { label: "Oferta especial", content: "{{nome}}, tudo bem? Lembrei de você e queria te fazer uma proposta especial. Que tal uma aula experimental grátis?" } },
    ],
    edges: [{ source: "1", target: "2" }, { source: "2", target: "3" }],
  },
]

function CrmBots() {
  const { toast, showToast } = useToast()
  const [flows, setFlows] = useState<BotFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  async function fetchFlows() {
    try {
      const res = await fetch("/api/admin/crm/bots")
      if (res.ok) setFlows((await res.json()).flows)
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  useEffect(() => { fetchFlows() }, [])

  async function createFromTemplate(tpl: typeof BOT_TEMPLATES[number]) {
    await fetch("/api/admin/crm/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tpl.name,
        trigger: tpl.trigger,
        nodes: tpl.nodes,
        edges: tpl.edges,
      }),
    })
    setShowTemplates(false)
    fetchFlows()
  }

  async function toggleFlow(id: string, active: boolean) {
    await fetch(`/api/admin/crm/bots?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    fetchFlows()
  }

  async function deleteFlow(id: string) {
    await fetch(`/api/admin/crm/bots?id=${id}`, { method: "DELETE" })
    fetchFlows()
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>

  return (
    <div className="space-y-4 animate-slide-up">
      <ToastUI toast={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Automações & Bot Flows</h2>
          <p className="text-[10px] text-neutral-600 mt-0.5">Automatize follow-ups, boas-vindas e re-engajamento</p>
        </div>
        <button onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs hover:bg-red-600/30 transition-all">
          {showTemplates ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showTemplates ? "Cancelar" : "Nova Automação"}
        </button>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOT_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => createFromTemplate(tpl)}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left hover:border-white/[0.12] transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition-colors" />
                <span className="text-xs font-medium text-white">{tpl.name}</span>
              </div>
              <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase font-semibold", TRIGGER_COLORS[tpl.trigger])}>
                {TRIGGER_LABELS[tpl.trigger]}
              </span>
              <div className="flex items-center gap-1 mt-2">
                {(tpl.nodes as Array<{type: string; data: {label: string}}>).map((node, j) => (
                  <span key={j} className="flex items-center gap-0.5">
                    <span className="text-[8px] text-neutral-600">{node.data.label}</span>
                    {j < tpl.nodes.length - 1 && <span className="text-[8px] text-neutral-700">→</span>}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Flow list */}
      <div className="space-y-2">
        {flows.map(flow => {
          const nodeList = Array.isArray(flow.nodes) ? flow.nodes as Array<{type: string; data: {label: string; content?: string}}> : []
          return (
            <div key={flow.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleFlow(flow.id, flow.active)} className="shrink-0">
                    {flow.active
                      ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                      : <ToggleLeft className="w-5 h-5 text-neutral-600" />
                    }
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="text-sm font-medium text-white">{flow.name}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase font-semibold",
                        flow.active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-500/10 text-neutral-500")}>
                        {flow.active ? "ativo" : "inativo"}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] uppercase font-semibold", TRIGGER_COLORS[flow.trigger])}>
                        {TRIGGER_LABELS[flow.trigger] || flow.trigger}
                      </span>
                    </div>
                    {/* Visual flow */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {nodeList.map((node, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          <span className={cn("px-1.5 py-0.5 rounded text-[8px]",
                            node.type === "trigger" ? "bg-blue-500/10 text-blue-400" :
                            node.type === "delay" ? "bg-amber-500/10 text-amber-400" :
                            "bg-purple-500/10 text-purple-400"
                          )}>
                            {node.data.label}
                          </span>
                          {i < nodeList.length - 1 && <span className="text-[8px] text-neutral-700">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteFlow(flow.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
        {flows.length === 0 && !showTemplates && (
          <div className="text-center py-12">
            <Bot className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
            <p className="text-xs text-neutral-600">Nenhuma automação criada</p>
            <p className="text-[10px] text-neutral-700 mt-1">Use templates prontos para começar rapidamente</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// WhatsApp Connection (Evolution API)
// ═══════════════════════════════════════

function WhatsAppConnection() {
  const { toast, showToast } = useToast()
  const [status, setStatus] = useState<string>("loading")
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(false)
  const [instanceName, setInstanceName] = useState("")

  async function fetchStatus() {
    try {
      const res = await fetch("/api/admin/crm/integrations/whatsapp")
      if (res.ok) {
        const data = await res.json()
        setConfigured(data.configured !== false)
        setStatus(data.status || "not_created")
        setInstanceName(data.instanceName || "")
      } else {
        const data = await res.json()
        if (data.configured === false) setConfigured(false)
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  useEffect(() => { fetchStatus() }, [])

  // Poll status every 5s when waiting for QR scan
  useEffect(() => {
    if (!qrcode) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/crm/integrations/whatsapp?action=status")
        if (res.ok) {
          const data = await res.json()
          if (data.status === "open" || data.status === "connected") {
            setStatus("open")
            setQrcode(null)
          }
        }
      } catch { showToast("Erro ao processar. Tente novamente.") }
    }, 5000)
    return () => clearInterval(interval)
  }, [qrcode])

  async function connect() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/crm/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.qrcode) {
          setQrcode(data.qrcode)
          setStatus("waiting_qr")
        } else if (data.status === "open" || data.status === "connected") {
          setStatus("open")
        }
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  async function disconnect() {
    setLoading(true)
    try {
      await fetch("/api/admin/crm/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      })
      setStatus("disconnected")
      setQrcode(null)
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  async function refreshQr() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/crm/integrations/whatsapp?action=qrcode")
      if (res.ok) {
        const data = await res.json()
        if (data.qrcode) setQrcode(data.qrcode)
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setLoading(false)
  }

  const isConnected = status === "open" || status === "connected"

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-green-400" />
          Conexão WhatsApp (Evolution API)
        </h2>
        <p className="text-[10px] text-neutral-600 mt-0.5">
          Conecte seu número pessoal via QR code para enviar/receber mensagens
        </p>
      </div>
      <ToastUI toast={toast} />

      {!configured ? (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-400 font-medium">Z-API não configurada</p>
              <p className="text-xs text-neutral-400 mt-1">
                Adicione as variáveis de ambiente no <code className="text-amber-400/60">.env</code>:
              </p>
              <pre className="mt-2 text-[10px] text-neutral-500 bg-black/30 rounded-lg p-3 font-mono">
{`ZAPI_INSTANCE_ID=seu-instance-id
ZAPI_TOKEN=seu-token-aqui`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isConnected ? "bg-green-500/10" : "bg-neutral-500/10"
                )}>
                  {isConnected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-neutral-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {isConnected ? "Conectado" : status === "waiting_qr" ? "Aguardando QR scan..." : "Desconectado"}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    Instância: <code className="text-neutral-500">{instanceName || "victor-app"}</code>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <button onClick={disconnect} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all disabled:opacity-40">
                    <PowerOff className="w-3.5 h-3.5" /> Desconectar
                  </button>
                ) : (
                  <button onClick={connect} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all disabled:opacity-40">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                    {loading ? "Conectando..." : "Conectar WhatsApp"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          {qrcode && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-center">
                <QrCode className="w-6 h-6 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-1">Escaneie o QR Code</p>
                <p className="text-[10px] text-neutral-600 mb-4">
                  Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar aparelho
                </p>
                <div className="inline-block bg-white p-4 rounded-2xl">
                  <img
                    src={qrcode.startsWith("data:") ? qrcode : `data:image/png;base64,${qrcode}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={refreshQr} disabled={loading}
                    className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-white transition-colors">
                    <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Atualizar QR
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-neutral-500">Aguardando leitura do QR code...</span>
                </div>
              </div>
            </div>
          )}

          {/* Features info */}
          {isConnected && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
              <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider mb-2 font-semibold">Funcionalidades ativas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Auto-captura de leads (números novos → CRM)",
                  "Bot pós-treino (mensagem após aluno completar sessão)",
                  "Respostas IA como Victor (Claude)",
                  "Broadcasts em massa para leads",
                  "Inbox de conversas no CRM",
                  "Notificações in-app de novas mensagens",
                ].map(feat => (
                  <div key={feat} className="flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <span className="text-[10px] text-neutral-400">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// Bot Pause/Resume Control
// ═══════════════════════════════════════

function BotPauseControl({ botType, botName, botDescription }: { botType: string; botName: string; botDescription: string }) {
  const [paused, setPaused] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/master/crm/whatsapp")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.bots) {
          const bot = data.bots.find((b: { type: string }) => b.type === botType)
          if (bot) setPaused(bot.paused)
        }
      })
      .catch(() => {})
  }, [botType])

  async function togglePause() {
    setLoading(true)
    try {
      const res = await fetch("/api/master/crm/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType, action: paused ? "resume" : "pause" }),
      })
      if (res.ok) setPaused(!paused)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            paused === false ? "bg-green-500/10" : paused === true ? "bg-amber-500/10" : "bg-neutral-500/10"
          )}>
            <Bot className={cn("w-5 h-5", paused === false ? "text-green-400" : paused === true ? "text-amber-400" : "text-neutral-500")} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{botName}</p>
            <p className="text-[10px] text-neutral-600">{botDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {paused !== null && (
            <>
              <span className={cn("text-[10px] font-medium", paused ? "text-amber-400" : "text-green-400")}>
                {paused ? "Pausado" : "Ativo"}
              </span>
              <button
                onClick={togglePause}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40",
                  paused
                    ? "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                )}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {paused ? "Retomar" : "Pausar"}
              </button>
            </>
          )}
          {paused === null && (
            <span className="text-[10px] text-neutral-600">Carregando...</span>
          )}
        </div>
      </div>
    </div>
  )
}
