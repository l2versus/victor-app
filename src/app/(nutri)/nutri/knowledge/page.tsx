"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, Search, Plus, X, Trash2, ExternalLink,
  FlaskConical, Salad, FileText, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────── types */

interface KnowledgeDoc {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  sourceUrl: string | null
  createdAt: string
}

const CATEGORIES = [
  { value: "",          label: "Todos" },
  { value: "NUTRITION", label: "Nutricao",   icon: Salad },
  { value: "SCIENCE",   label: "Ciencia",    icon: FlaskConical },
  { value: "PROTOCOL",  label: "Protocolos", icon: FileText },
  { value: "GENERAL",   label: "Geral",      icon: Layers },
] as const

const CATEGORY_BADGES: Record<string, { label: string; classes: string }> = {
  NUTRITION: { label: "Nutricao",   classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  SCIENCE:   { label: "Ciencia",    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  PROTOCOL:  { label: "Protocolos", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  EXERCISE:  { label: "Exercicio",  classes: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  MACHINE:   { label: "Maquinas",   classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  POSTURE:   { label: "Postura",    classes: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  INJURY:    { label: "Lesoes",     classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  GENERAL:   { label: "Geral",      classes: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20" },
}

const ALL_CATEGORY_OPTIONS = [
  { value: "NUTRITION", label: "Nutricao" },
  { value: "SCIENCE",   label: "Ciencia" },
  { value: "PROTOCOL",  label: "Protocolos" },
  { value: "EXERCISE",  label: "Exercicio" },
  { value: "MACHINE",   label: "Maquinas" },
  { value: "POSTURE",   label: "Postura" },
  { value: "INJURY",    label: "Lesoes" },
  { value: "GENERAL",   label: "Geral" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

/* ──────────────────────────────────────── page */

export default function NutriKnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  /* form state */
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formCategory, setFormCategory] = useState("NUTRITION")
  const [formTags, setFormTags] = useState("")
  const [formSourceUrl, setFormSourceUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  /* ── fetch ── */
  const fetchDocs = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (search) params.set("search", search)
    fetch(`/api/nutri/knowledge?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, search])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  /* ── create ── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError("Titulo e conteudo sao obrigatorios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/nutri/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          category: formCategory,
          tags: formTags,
          sourceUrl: formSourceUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || "Erro ao salvar")
        return
      }
      setModalOpen(false)
      resetForm()
      fetchDocs()
    } catch {
      setFormError("Erro de conexao")
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFormTitle("")
    setFormContent("")
    setFormCategory("NUTRITION")
    setFormTags("")
    setFormSourceUrl("")
    setFormError("")
  }

  /* ── delete ── */
  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/nutri/knowledge?id=${id}`, { method: "DELETE" })
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch {
      /* silently ignore */
    } finally {
      setDeleting(null)
    }
  }

  /* ── format date ── */
  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Base de Conhecimento
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                {documents.length} documento{documents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ SEARCH + FILTERS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300",
                category === cat.value
                  ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/25"
                  : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:text-neutral-300 hover:border-white/[0.12]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ DOCUMENTS GRID ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-emerald-900/5 border border-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-emerald-500/50" />
            </div>
            <p className="text-neutral-400 text-sm mb-1">Nenhum documento encontrado</p>
            <p className="text-neutral-600 text-xs">
              Adicione documentos para melhorar as respostas da IA
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, i) => {
              const badge = CATEGORY_BADGES[doc.category] ?? CATEGORY_BADGES.GENERAL
              return (
                <motion.div
                  key={doc.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 hover:border-white/[0.1] transition-all duration-500 flex flex-col"
                >
                  {/* header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90 truncate">{doc.title}</h3>
                      <span className={cn("inline-block mt-1.5 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border", badge.classes)}>
                        {badge.label}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="shrink-0 p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Excluir documento"
                    >
                      <Trash2 className={cn("w-3.5 h-3.5", deleting === doc.id && "animate-pulse")} />
                    </button>
                  </div>

                  {/* content preview */}
                  <p className="text-neutral-500 text-xs leading-relaxed line-clamp-3 flex-1 mb-3">
                    {doc.content}
                  </p>

                  {/* tags */}
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[9px] text-neutral-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 4 && (
                        <span className="text-[9px] text-neutral-700">+{doc.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <span className="text-[10px] text-neutral-700">{formatDate(doc.createdAt)}</span>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-emerald-400 transition-colors"
                        title="Fonte original"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ CREATE MODAL ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            {/* panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-70 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl max-h-[85dvh] flex flex-col overscroll-contain">
                {/* modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                  <h2 className="text-base font-semibold text-white/90">Novo Documento</h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* modal body */}
                <form onSubmit={handleCreate} className="overflow-y-auto flex-1 overscroll-contain">
                  <div className="px-6 py-5 space-y-4">
                    {/* title */}
                    <div>
                      <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                        Titulo *
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Ex: Protocolo de dieta low-carb"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    {/* content */}
                    <div>
                      <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                        Conteudo *
                      </label>
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Descreva o conhecimento em detalhes..."
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                      />
                    </div>

                    {/* category */}
                    <div>
                      <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                        Categoria
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#0a0a0a] text-white text-sm focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all appearance-none"
                      >
                        {ALL_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* tags */}
                    <div>
                      <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                        Tags (separadas por virgula)
                      </label>
                      <input
                        type="text"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        placeholder="Ex: low-carb, emagrecimento, diabetes"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    {/* source url */}
                    <div>
                      <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                        URL da Fonte (opcional)
                      </label>
                      <input
                        type="url"
                        value={formSourceUrl}
                        onChange={(e) => setFormSourceUrl(e.target.value)}
                        placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    {/* error */}
                    {formError && (
                      <p className="text-red-400 text-xs">{formError}</p>
                    )}
                  </div>

                  {/* modal footer */}
                  <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
