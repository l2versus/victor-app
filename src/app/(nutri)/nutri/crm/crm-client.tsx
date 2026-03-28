"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  UserPlus, Phone, Mail, Plus, X, Trash2,
  MessageCircle, Instagram, Globe, Users,
  Star, Send, GripVertical, Clock,
  Loader2, ExternalLink, Flame, Snowflake,
  Thermometer, BarChart3, TrendingUp, Target,
  Zap, RefreshCw, Tag, Search,
  Bot, Smartphone, Pause, Play,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ===================================
// Toast hook
// ===================================

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

// ===================================
// Types
// ===================================

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

// ===================================
// Constants — nutri context labels
// ===================================

const COLUMNS = [
  { status: "NEW", label: "Novos", color: "border-blue-500", dot: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/5" },
  { status: "CONTACTED", label: "Contactados", color: "border-cyan-500", dot: "bg-cyan-500", text: "text-cyan-400", bg: "bg-cyan-500/5" },
  { status: "TRIAL", label: "Avaliacao", color: "border-purple-500", dot: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/5" },
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
  WALK_IN: "Visita", REFERRAL: "Indicacao", INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp", WEBSITE: "Site", MANYCHAT: "ManyChat",
  FACEBOOK: "Facebook", TIKTOK: "TikTok", OTHER: "Outro",
}

const TEMP_CONFIG = {
  HOT: { icon: Flame, label: "Quente", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-500" },
  WARM: { icon: Thermometer, label: "Morno", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-500" },
  COLD: { icon: Snowflake, label: "Frio", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500" },
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Paciente criado",
  STATUS_CHANGED: "Status alterado",
  NOTE_ADDED: "Nota adicionada",
  SCORED: "Score atualizado",
  TEMPERATURE_CHANGED: "Temperatura alterada",
  CONVERTED: "Convertido",
}

// ===================================
// Main Component
// ===================================

export function CrmClient() {
  type CrmTab = "pipeline" | "dashboard" | "whatsapp"
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

  // --- Data fetching ---
  async function fetchLeads() {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (filterTemp) params.set("temperature", filterTemp)
      const res = await fetch(`/api/nutri/crm?${params}`)
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
      const res = await fetch("/api/nutri/crm/dashboard")
      if (res.ok) setDashboard(await res.json())
    } catch { showToast("Erro ao processar. Tente novamente.") }
  }

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])
  useEffect(() => { fetchLeads() }, [debouncedSearch, filterTemp])
  useEffect(() => { if (tab === "dashboard") fetchDashboard() }, [tab])

  // --- Actions ---
  async function createLead() {
    if (!form.name.trim()) { showToast("Nome e obrigatorio"); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast("Email invalido"); return }
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) { showToast("Telefone deve ter pelo menos 10 digitos"); return }
    if (form.value && (isNaN(Number(form.value)) || Number(form.value) < 0)) { showToast("Valor deve ser um numero positivo"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/nutri/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone ? form.phone.replace(/\D/g, "") : "",
          value: form.value ? String(form.value) : "",
        }),
      })
      if (res.ok) {
        showToast("Paciente potencial criado!", "success")
        setShowForm(false)
        setForm({ name: "", phone: "", email: "", source: "OTHER", notes: "", value: "", temperature: "COLD" })
        fetchLeads()
      } else {
        showToast("Erro ao criar paciente")
      }
    } catch { showToast("Erro ao processar. Tente novamente.") }
    setSaving(false)
  }

  async function updateLead(id: string, data: Record<string, unknown>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } as Lead : l))
    await fetch(`/api/nutri/crm?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    fetchLeads()
  }

  async function deleteLead(id: string) {
    await fetch(`/api/nutri/crm?id=${id}`, { method: "DELETE" })
    setSelectedLead(null)
    fetchLeads()
  }

  async function addFollowUp(leadId: string) {
    if (!followUpText.trim()) return
    await fetch(`/api/nutri/crm?id=${leadId}`, {
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

  // --- Drag & Drop (mouse + touch) ---
  const touchStartRef = React.useRef<{ id: string; x: number; y: number } | null>(null)

  function handleDragStart(leadId: string) { setDraggedLead(leadId) }
  function handleDragOver(e: React.DragEvent, status: string) { e.preventDefault(); setDragOverCol(status) }
  function handleDrop(status: string) {
    if (draggedLead) {
      updateLead(draggedLead, { status })
      showToast(`Paciente movido para ${COLUMNS.find(c => c.status === status)?.label || status}`, "success")
    }
    setDraggedLead(null)
    setDragOverCol(null)
  }
  function handleDragEnd() { setDraggedLead(null); setDragOverCol(null) }

  function handleTouchStart(leadId: string, e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStartRef.current = { id: leadId, x: touch.clientX, y: touch.clientY }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    if (dx > 20 && !draggedLead) {
      setDraggedLead(touchStartRef.current.id)
    }
    if (draggedLead) {
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

  // --- Helpers ---
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = leads.filter(l => l.status === col.status)
    return acc
  }, {} as Record<string, Lead[]>)

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "hoje"
    if (days === 1) return "ontem"
    return `${days}d atras`
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
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ToastUI toast={toast} />

      {/* === HEADER === */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            CRM — Pacientes Potenciais
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {pipeline ? `${pipeline.total} pacientes · R$ ${leads.reduce((s, l) => s + (l.value || 0), 0).toLocaleString("pt-BR")} em pipeline` : ""}
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancelar" : "Novo Paciente"}
          </button>
        </div>
      </div>

      {/* === TABS === */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl overflow-x-auto scrollbar-hide">
          {[
            { key: "pipeline" as const, label: "Pipeline", icon: Target },
            { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
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

      {/* === TEMPERATURE PILLS === */}
      {/* Bot status inline */}
      {tab === "pipeline" && <NutriBotControl />}

      {tab === "pipeline" && temperatures && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
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

      {/* === NEW LEAD FORM === */}
      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30" />
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30" />
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-emerald-500/30 [color-scheme:dark]">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-emerald-500/30 [color-scheme:dark]">
              <option value="HOT">Quente</option>
              <option value="WARM">Morno</option>
              <option value="COLD">Frio</option>
            </select>
            <input type="text" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Valor mensal R$"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observacoes..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30 resize-none" rows={2} />
          <button onClick={createLead} disabled={!form.name || saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold disabled:opacity-40">
            {saving ? "Salvando..." : "Adicionar Paciente"}
          </button>
        </div>
      )}

      {/* === PIPELINE TAB === */}
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
                              <p className="text-[10px] font-semibold text-emerald-400 mt-1">R$ {lead.value}/mes</p>
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
                        {isDragOver ? "Solte aqui" : "Arraste pacientes aqui"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* === DASHBOARD TAB === */}
      {tab === "dashboard" && (
        <NutriCrmDashboard data={dashboard} onRefresh={fetchDashboard} />
      )}

      {/* === WHATSAPP TAB === */}
      {tab === "whatsapp" && (
        <NutriBotControl />
      )}

      {/* === LEAD DETAIL MODAL === */}
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

// ===================================
// Dashboard Component
// ===================================

function NutriCrmDashboard({ data, onRefresh }: { data: DashboardData | null; onRefresh: () => void }) {
  if (!data) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
    </div>
  )

  const { overview, temperatures, leadsBySource, topLeads, recentActivities } = data

  return (
    <div className="space-y-4 animate-slide-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Pacientes", value: overview.totalLeads, color: "text-white" },
          { label: "Ativos", value: overview.activeLeads, color: "text-blue-400" },
          { label: "Convertidos", value: overview.convertedLeads, color: "text-emerald-400" },
          { label: "Perdidos", value: overview.lostLeads, color: "text-red-400" },
          { label: "Conversao", value: `${overview.conversionRate}%`, color: "text-amber-400" },
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
                <span className="text-emerald-400 font-semibold">R$ {overview.pipelineValue.toLocaleString("pt-BR")}/mes</span>
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
                <span className="text-white font-semibold">R$ {overview.convertedValue.toLocaleString("pt-BR")}/mes</span>
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
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Temperatura dos Pacientes</p>
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
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Pacientes por Fonte</p>
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
                    <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${pct}%` }} />
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
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Top Pacientes (Score)</p>
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
            {topLeads.length === 0 && <p className="text-xs text-neutral-700">Nenhum paciente pontuado ainda</p>}
          </div>
        </div>
      </div>

      {/* Funil de Conversao */}
      {data.funnel && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Funil de Conversao</p>
          <div className="space-y-2">
            {(data.funnel as { stage: string; count: number; reached: number; rate: number }[]).map((step, i) => {
              const labels: Record<string, string> = { NEW: "Novos", CONTACTED: "Contactados", TRIAL: "Avaliacao", NEGOTIATING: "Negociando", CONVERTED: "Convertidos" }
              const colors = ["bg-blue-500", "bg-cyan-500", "bg-purple-500", "bg-amber-500", "bg-emerald-500"]
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
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Captura Semanal (ultimas 4 semanas)</p>
          <div className="flex items-end gap-2 h-24">
            {(data.weeklyCapture as number[]).map((count, i) => {
              const max = Math.max(...(data.weeklyCapture as number[]), 1)
              const height = Math.max((count / max) * 100, 4)
              const labels = ["4 sem", "3 sem", "2 sem", "Esta"]
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-neutral-500 font-bold">{count}</span>
                  <div className="w-full rounded-t-lg bg-emerald-500/60 transition-all" style={{ height: `${height}%` }} />
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
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0" />
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

// ===================================
// Lead Detail Modal
// ===================================

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
        className="relative w-full max-w-lg max-h-[85dvh] rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden overflow-y-auto overscroll-contain animate-slide-up"
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
                  <a href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-400 transition-colors">
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
              <p className="text-xs text-emerald-400 font-medium">{lead.value ? `R$ ${lead.value}` : "---"}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
              <p className="text-[9px] text-neutral-600 uppercase">Score</p>
              <p className={cn("text-xs font-bold", getScoreColor(lead.score))}>{lead.score || "---"}</p>
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
                  className="w-16 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04] text-[10px] text-white placeholder:text-neutral-700 outline-none focus:border-emerald-500/20"
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
              <p className="text-[10px] text-neutral-600 uppercase mb-1">Observacoes</p>
              <p className="text-xs text-neutral-400">{lead.notes}</p>
            </div>
          )}

          {/* Follow-ups */}
          <div>
            <p className="text-[10px] text-neutral-600 uppercase mb-2">Historico</p>
            {lead.followUps.length > 0 ? (
              <div className="space-y-1.5">
                {lead.followUps.map(f => (
                  <div key={f.id} className="text-xs text-neutral-400 bg-white/[0.02] rounded-lg px-3 py-2 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-neutral-600">{new Date(f.createdAt).toLocaleDateString("pt-BR")}</span>
                      {" --- "}{f.content}
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
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
              onKeyDown={e => e.key === "Enter" && onAddFollowUp(lead.id)}
            />
            <button onClick={() => onAddFollowUp(lead.id)} className="px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors">
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

// ===================================
// Bot Pause/Resume Control — Nutri
// ===================================

function NutriBotControl() {
  const [paused, setPaused] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/master/crm/whatsapp")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.bots) {
          const bot = data.bots.find((b: { type: string }) => b.type === "nutri")
          if (bot) setPaused(bot.paused)
        }
      })
      .catch(() => {})
  }, [])

  async function togglePause() {
    setLoading(true)
    try {
      const res = await fetch("/api/master/crm/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: "nutri", action: paused ? "resume" : "pause" }),
      })
      if (res.ok) setPaused(!paused)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              paused === false ? "bg-green-500/10" : paused === true ? "bg-amber-500/10" : "bg-neutral-500/10"
            )}>
              <Bot className={cn("w-5 h-5", paused === false ? "text-green-400" : paused === true ? "text-amber-400" : "text-neutral-500")} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Nutri Bot</p>
              <p className="text-[10px] text-neutral-600">Nutricionista — atende leads de nutrição via WhatsApp</p>
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

      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
        <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider mb-2 font-semibold">Como funciona</p>
        <div className="space-y-1.5">
          {[
            "Bot responde automaticamente leads novos via WhatsApp",
            "Após 3 mensagens, transfere para atendimento humano",
            "Quando pausado, mensagens são salvas mas sem resposta automática",
          ].map(item => (
            <div key={item} className="flex items-start gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <span className="text-[10px] text-neutral-400">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
