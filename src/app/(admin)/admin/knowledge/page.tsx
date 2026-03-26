"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  BookOpen, Plus, Search, Trash2, X, Loader2,
  Dumbbell, Cpu, Camera, Salad, FlaskConical, ListChecks,
  ShieldAlert, HelpCircle, ArrowLeft, Tag, Link2, Image,
  Sparkles, FileText, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

type KnowledgeDoc = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  imageUrl: string | null
  sourceUrl: string | null
  createdAt: string
}

type Stats = { total: number; byCategory: Record<string, number> }

const CATEGORIES = [
  { value: "EXERCISE", label: "Exercícios", icon: Dumbbell, color: "text-red-400 bg-red-500/15" },
  { value: "MACHINE", label: "Máquinas", icon: Cpu, color: "text-blue-400 bg-blue-500/15" },
  { value: "POSTURE", label: "Postura", icon: Camera, color: "text-purple-400 bg-purple-500/15" },
  { value: "NUTRITION", label: "Nutrição", icon: Salad, color: "text-green-400 bg-green-500/15" },
  { value: "SCIENCE", label: "Ciência", icon: FlaskConical, color: "text-amber-400 bg-amber-500/15" },
  { value: "PROTOCOL", label: "Protocolos", icon: ListChecks, color: "text-cyan-400 bg-cyan-500/15" },
  { value: "INJURY", label: "Lesões", icon: ShieldAlert, color: "text-orange-400 bg-orange-500/15" },
  { value: "GENERAL", label: "Geral", icon: HelpCircle, color: "text-neutral-400 bg-neutral-500/15" },
]

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDoc | null>(null)

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "EXERCISE",
    tags: "",
    imageUrl: "",
    sourceUrl: "",
  })

  const fetchDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.set("category", filter)
      if (search) params.set("q", search)
      const res = await fetch(`/api/admin/knowledge?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents)
        setStats(data.stats)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter, search])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ title: "", content: "", category: "EXERCISE", tags: "", imageUrl: "", sourceUrl: "" })
        fetchDocs()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch("/api/admin/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      fetchDocs()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  const getCat = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[7]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Base de Conhecimento
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {stats ? `${stats.total} documentos · A IA usa estes dados para responder com precisão` : "Carregando..."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.97] transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Adicionar"}
        </button>
      </div>

      {/* Stats by category */}
      {stats && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {CATEGORIES.map(cat => {
            const count = stats.byCategory[cat.value] || 0
            const Icon = cat.icon
            const isActive = filter === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setFilter(isActive ? "" : cat.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[9px] font-medium transition-all",
                  isActive
                    ? "bg-emerald-600/15 border border-emerald-500/25 text-white"
                    : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate w-full text-center">{cat.label}</span>
                <span className="text-[8px] text-neutral-600">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar documentos..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
        />
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Novo Documento de Conhecimento
          </h3>

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título (ex: Supino Inclinado — Execução Correta)"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
          />

          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Conteúdo completo — artigo científico, manual da máquina, protocolo de treino, instruções de execução..."
            rows={6}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30 resize-none leading-relaxed"
          />

          {/* Category */}
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                      form.category === cat.value
                        ? "bg-emerald-600/15 border border-emerald-500/25 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags (separadas por vírgula)
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="supino, peitoral, victor-personal, hipertrofia"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
            />
          </div>

          {/* Image URL + Source URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block flex items-center gap-1">
                <Image className="w-3 h-3" /> URL da Foto (opcional)
              </label>
              <input
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block flex items-center gap-1">
                <Link2 className="w-3 h-3" /> URL da Fonte (opcional)
              </label>
              <input
                value={form.sourceUrl}
                onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.content.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {saving ? "Salvando e gerando embedding..." : "Salvar Documento"}
          </button>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhum documento na base</p>
          <p className="text-neutral-600 text-xs mt-1">
            Adicione artigos, manuais de máquinas, protocolos de treino e fotos de execução
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => {
            const cat = getCat(doc.category)
            const Icon = cat.icon
            return (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cat.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">{doc.title}</h4>
                      {doc.imageUrl && <Image className="w-3 h-3 text-neutral-500 shrink-0" />}
                      {doc.sourceUrl && <Link2 className="w-3 h-3 text-neutral-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{doc.content}</p>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[9px] text-neutral-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                    disabled={deleting === doc.id}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Article Viewer Modal */}
      {viewingDoc && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80" onClick={() => setViewingDoc(null)}>
          <div
            className="absolute inset-x-0 bottom-0 top-8 max-w-2xl mx-auto bg-[#0a0a0a] border border-white/[0.08] rounded-t-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const cat = getCat(viewingDoc.category)
                  const Icon = cat.icon
                  return (
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", cat.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )
                })()}
                <div>
                  <h3 className="text-sm font-bold text-white">{viewingDoc.title}</h3>
                  <p className="text-[10px] text-neutral-500">
                    {getCat(viewingDoc.category).label} · {new Date(viewingDoc.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-neutral-400 hover:text-white p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* Image */}
              {viewingDoc.imageUrl && (
                <img src={viewingDoc.imageUrl} alt={viewingDoc.title} className="w-full rounded-xl border border-white/[0.06] max-h-[300px] object-cover" />
              )}

              {/* Article content */}
              <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                {viewingDoc.content}
              </div>

              {/* Tags */}
              {viewingDoc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                  {viewingDoc.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Source link */}
              {viewingDoc.sourceUrl && (
                <a
                  href={viewingDoc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-400 hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {viewingDoc.sourceUrl.replace(/^https?:\/\//, "").slice(0, 50)}
                </a>
              )}
            </div>

            {/* Footer actions */}
            <div className="shrink-0 px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={() => {
                  handleDelete(viewingDoc.id)
                  setViewingDoc(null)
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-neutral-300 hover:bg-white/[0.08] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}
    </div>
  )
}
