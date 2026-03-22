"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserPlus, Phone, Mail, ChevronRight, Plus, X, Trash2,
  MessageCircle, Instagram, Globe, Users, Filter,
  ArrowRight, Star, Send,
} from "lucide-react"

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "Novo", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  CONTACTED: { label: "Contactado", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  TRIAL: { label: "Experimental", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  NEGOTIATING: { label: "Negociando", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  CONVERTED: { label: "Convertido", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  LOST: { label: "Perdido", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
}

const SOURCE_ICONS: Record<string, typeof Phone> = {
  WALK_IN: Users, REFERRAL: Star, INSTAGRAM: Instagram,
  WHATSAPP: MessageCircle, WEBSITE: Globe, OTHER: UserPlus,
}

const STATUSES = ["NEW", "CONTACTED", "TRIAL", "NEGOTIATING", "CONVERTED", "LOST"]

export function CrmClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [followUpText, setFollowUpText] = useState("")
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "OTHER", notes: "", value: "",
  })

  async function fetchLeads() {
    setLoading(true)
    try {
      const url = filter ? `/api/admin/crm?status=${filter}` : "/api/admin/crm"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setPipeline(data.pipeline)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [filter])

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
    await fetch(`/api/admin/crm?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
    if (selectedLead?.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status } : null)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-400" />
            CRM — Gestão de Leads
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Pipeline de vendas e follow-up</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Novo Lead"}
        </button>
      </div>

      {/* Pipeline cards */}
      {pipeline && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STATUSES.map(s => {
            const config = STATUS_CONFIG[s]
            const count = pipeline[s as keyof Pipeline] as number
            const isActive = filter === s
            return (
              <button
                key={s}
                onClick={() => setFilter(isActive ? "" : s)}
                className={`rounded-xl p-3 text-center border transition-all ${isActive ? config.bg : "bg-white/[0.02] border-white/[0.06]"}`}
              >
                <p className={`text-lg font-bold ${isActive ? config.color : "text-white"}`}>{count}</p>
                <p className="text-[9px] text-neutral-500 uppercase">{config.label}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]">
                  <option value="WALK_IN">Visita</option>
                  <option value="REFERRAL">Indicação</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="WEBSITE">Site</option>
                  <option value="OTHER">Outro</option>
                </select>
                <input type="text" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Valor mensal R$"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              </div>
              <button onClick={createLead} disabled={!form.name || saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40 min-h-[44px]">
                {saving ? "Salvando..." : "Adicionar Lead"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <UserPlus className="w-10 h-10 text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">{filter ? "Nenhum lead com este status" : "Nenhum lead cadastrado"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => {
            const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW
            const SourceIcon = SOURCE_ICONS[lead.source] || UserPlus
            const isSelected = selectedLead?.id === lead.id

            return (
              <div key={lead.id}>
                <button
                  onClick={() => setSelectedLead(isSelected ? null : lead)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${isSelected ? config.bg : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${config.bg}`}>
                      <SourceIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                        {lead.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{lead.email}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${config.color}`}>{config.label}</span>
                      {lead.value && <p className="text-[10px] text-neutral-500">R$ {lead.value}</p>}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-600 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="rounded-b-xl border-x border-b border-white/[0.06] p-4 space-y-3 -mt-1">
                        {/* Status pipeline */}
                        <div className="flex items-center gap-1">
                          {STATUSES.filter(s => s !== "LOST").map((s, i) => {
                            const isAt = s === lead.status
                            const isPast = STATUSES.indexOf(s) < STATUSES.indexOf(lead.status)
                            return (
                              <button
                                key={s}
                                onClick={() => updateLeadStatus(lead.id, s)}
                                className={`flex-1 py-1.5 rounded-lg text-[8px] uppercase font-bold transition-all ${isAt ? STATUS_CONFIG[s].bg + " " + STATUS_CONFIG[s].color : isPast ? "bg-green-500/5 text-green-500/60" : "bg-white/[0.03] text-neutral-600"}`}
                              >
                                {STATUS_CONFIG[s].label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Notes */}
                        {lead.notes && <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-lg px-3 py-2">{lead.notes}</p>}

                        {/* Follow-ups */}
                        {lead.followUps.length > 0 && (
                          <div className="space-y-1.5">
                            {lead.followUps.map(f => (
                              <div key={f.id} className="text-xs text-neutral-400 bg-white/[0.02] rounded-lg px-3 py-2">
                                <span className="text-neutral-600">{new Date(f.createdAt).toLocaleDateString("pt-BR")}</span>
                                {" — "}{f.content}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add follow-up */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={followUpText}
                            onChange={e => setFollowUpText(e.target.value)}
                            placeholder="Adicionar nota / follow-up..."
                            className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[40px]"
                            onKeyDown={e => e.key === "Enter" && addFollowUp(lead.id)}
                          />
                          <button onClick={() => addFollowUp(lead.id)} className="px-3 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 hover:bg-red-600/30 transition-colors min-h-[40px]">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-1">
                          <button
                            onClick={() => updateLeadStatus(lead.id, "LOST")}
                            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            Marcar como perdido
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
