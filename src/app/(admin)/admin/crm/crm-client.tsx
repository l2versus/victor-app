"use client"

import { useState, useEffect, useRef } from "react"
import {
  UserPlus, Phone, Mail, Plus, X, Trash2,
  MessageCircle, Instagram, Globe, Users,
  Star, Send, GripVertical, Clock,
  ChevronDown, Loader2, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  status: string
  notes: string | null
  value: number | null
  createdAt: string
  updatedAt: string
  followUps: { id: string; type: string; content: string; createdAt: string }[]
  _count: { followUps: number }
}

type Pipeline = {
  NEW: number; CONTACTED: number; TRIAL: number
  NEGOTIATING: number; CONVERTED: number; LOST: number; total: number
}

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
  WHATSAPP: MessageCircle, WEBSITE: Globe, MANYCHAT: MessageCircle, OTHER: UserPlus,
}

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Visita", REFERRAL: "Indicação", INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp", WEBSITE: "Site", MANYCHAT: "ManyChat", OTHER: "Outro",
}

export function CrmClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [followUpText, setFollowUpText] = useState("")
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "OTHER", notes: "", value: "",
  })

  async function fetchLeads() {
    try {
      const res = await fetch("/api/admin/crm")
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setPipeline(data.pipeline)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  async function createLead() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: "", phone: "", email: "", source: "OTHER", notes: "", value: "" })
        fetchLeads()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function updateLeadStatus(id: string, status: string) {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    await fetch(`/api/admin/crm?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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

  // ─── Drag & Drop ───
  function handleDragStart(leadId: string) {
    setDraggedLead(leadId)
  }

  function handleDragOver(e: React.DragEvent, status: string) {
    e.preventDefault()
    setDragOverCol(status)
  }

  function handleDrop(status: string) {
    if (draggedLead) {
      updateLeadStatus(draggedLead, status)
    }
    setDraggedLead(null)
    setDragOverCol(null)
  }

  function handleDragEnd() {
    setDraggedLead(null)
    setDragOverCol(null)
  }

  // ─── Grouped leads by status ───
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
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
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold shadow-lg shadow-red-600/20"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Lead"}
        </button>
      </div>

      {/* New lead form */}
      {showForm && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white outline-none focus:border-red-500/30 [color-scheme:dark]">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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

      {/* ═══ KANBAN BOARD ═══ */}
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

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        "rounded-xl bg-[#111] border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing transition-all hover:border-white/[0.12] group",
                        isDragging && "opacity-40 scale-95"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-neutral-700 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{lead.name}</p>
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

      {/* ═══ LEAD DETAIL MODAL ═══ */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLead(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedLead.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    {selectedLead.phone && (
                      <a href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, "")}`} target="_blank" className="flex items-center gap-1 hover:text-green-400 transition-colors">
                        <Phone className="w-3 h-3" /> {selectedLead.phone}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {selectedLead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedLead.email}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pipeline progress */}
              <div className="flex items-center gap-1 mt-4">
                {COLUMNS.filter(c => c.status !== "LOST").map(col => {
                  const isAt = col.status === selectedLead.status
                  const isPast = COLUMNS.findIndex(c => c.status === col.status) < COLUMNS.findIndex(c => c.status === selectedLead.status)
                  return (
                    <button
                      key={col.status}
                      onClick={() => {
                        updateLeadStatus(selectedLead.id, col.status)
                        setSelectedLead({ ...selectedLead, status: col.status })
                      }}
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
              {/* Info */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                  <p className="text-[9px] text-neutral-600 uppercase">Fonte</p>
                  <p className="text-xs text-white font-medium">{SOURCE_LABELS[selectedLead.source]}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                  <p className="text-[9px] text-neutral-600 uppercase">Valor</p>
                  <p className="text-xs text-emerald-400 font-medium">{selectedLead.value ? `R$ ${selectedLead.value}` : "—"}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                  <p className="text-[9px] text-neutral-600 uppercase">Criado</p>
                  <p className="text-xs text-white font-medium">{new Date(selectedLead.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="bg-white/[0.02] rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-neutral-600 uppercase mb-1">Observações</p>
                  <p className="text-xs text-neutral-400">{selectedLead.notes}</p>
                </div>
              )}

              {/* Follow-ups */}
              <div>
                <p className="text-[10px] text-neutral-600 uppercase mb-2">Histórico</p>
                {selectedLead.followUps.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedLead.followUps.map(f => (
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
                  onKeyDown={e => e.key === "Enter" && addFollowUp(selectedLead.id)}
                />
                <button onClick={() => addFollowUp(selectedLead.id)} className="px-3 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 hover:bg-red-600/30 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.06] flex justify-between">
              <button
                onClick={() => { updateLeadStatus(selectedLead.id, "LOST"); setSelectedLead(null) }}
                className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                Marcar como perdido
              </button>
              <button
                onClick={() => deleteLead(selectedLead.id)}
                className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
