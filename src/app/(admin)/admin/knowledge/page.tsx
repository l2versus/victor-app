"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  BookOpen, Plus, Search, Trash2, X, Loader2,
  Dumbbell, Cpu, Camera, Salad, FlaskConical, ListChecks,
  ShieldAlert, HelpCircle, ArrowLeft, Tag, Link2, Image,
  Sparkles, FileText, ChevronDown, Globe, Play, Eye, Youtube,
  Upload, FileUp, Languages, Lightbulb, Instagram,
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
  const [urlInput, setUrlInput] = useState("")
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ sourceType?: string; hasVisionAnalysis?: boolean } | null>(null)

  // PDF upload state
  const [pdfProcessing, setPdfProcessing] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfResult, setPdfResult] = useState<{
    wasTranslated?: boolean
    originalLanguage?: string
    studyType?: string
    authors?: string
    year?: string
    keyFindings?: string[]
    marketingInsights?: string[]
    fileName?: string
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handlePdfUpload(file: File) {
    if (!file || pdfProcessing) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("❌ Apenas arquivos PDF são aceitos")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setPdfError("❌ PDF muito grande. Máximo: 20MB")
      return
    }

    setPdfProcessing(true)
    setPdfError(null)
    setPdfResult(null)
    setProcessResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/knowledge/process-pdf", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setPdfError(data.error || "❌ Erro ao processar PDF. Tente novamente.")
        setPdfProcessing(false)
        return
      }

      setForm({
        title: data.title || "",
        content: data.content || "",
        category: data.category || "SCIENCE",
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        imageUrl: "",
        sourceUrl: "",
      })
      setPdfResult({
        wasTranslated: data.wasTranslated,
        originalLanguage: data.originalLanguage,
        studyType: data.studyType,
        authors: data.authors,
        year: data.year,
        keyFindings: data.keyFindings,
        marketingInsights: data.marketingInsights,
        fileName: data.fileName,
      })
    } catch {
      alert("Erro de conexão. Tente novamente.")
    }
    setPdfProcessing(false)
  }

  async function handleProcessUrl() {
    if (!urlInput.trim()) return
    setProcessing(true)
    setProcessResult(null)
    try {
      const res = await fetch("/api/admin/knowledge/process-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao processar URL")
        setProcessing(false)
        return
      }
      setForm({
        title: data.title || "",
        content: data.content || "",
        category: data.category || "GENERAL",
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        imageUrl: data.videoId ? `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg` : "",
        sourceUrl: data.sourceUrl || urlInput,
      })
      setProcessResult({ sourceType: data.sourceType, hasVisionAnalysis: data.hasVisionAnalysis })
    } catch {
      alert("Erro de conexão. Tente novamente.")
    }
    setProcessing(false)
  }

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
        setUrlInput("")
        setProcessResult(null)
        setPdfResult(null)
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

  // Generate marketing content from knowledge doc
  const [mktGenerating, setMktGenerating] = useState(false)
  const [mktResult, setMktResult] = useState<string | null>(null)
  const [mktPostType, setMktPostType] = useState("legenda")

  async function handleGenerateMarketing() {
    if (!viewingDoc || mktGenerating) return
    setMktGenerating(true)
    setMktResult(null)
    try {
      const res = await fetch("/api/admin/academy/generate-from-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: viewingDoc.title,
          content: viewingDoc.content,
          postType: mktPostType,
          niche: "hipertrofia",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMktResult(data.text)
      } else {
        alert(data.error || "Erro ao gerar conteúdo")
      }
    } catch {
      alert("Erro de conexão")
    }
    setMktGenerating(false)
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

          {/* ── URL Processor (YouTube + Sites) ────────────────────────── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <label className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Importar de YouTube ou Site
            </label>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://site.com/artigo"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/30"
                onKeyDown={e => e.key === "Enter" && !processing && handleProcessUrl()}
              />
              <button
                onClick={handleProcessUrl}
                disabled={!urlInput.trim() || processing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-600/25 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Processando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">Processar</span>
                  </>
                )}
              </button>
            </div>
            {processing && (
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-200" />
                </div>
                Extraindo transcrição + análise visual + gerando documento com IA...
              </div>
            )}
            {processResult && (
              <div className="flex items-center gap-2 text-[11px]">
                {processResult.sourceType === "youtube" ? (
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-emerald-400">
                  Documento gerado com sucesso!
                  {processResult.hasVisionAnalysis && (
                    <span className="text-purple-400 ml-1.5 inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> + análise visual
                    </span>
                  )}
                </span>
                <span className="text-neutral-600">— revise e salve abaixo</span>
              </div>
            )}
          </div>

          {/* ── PDF Upload ──────────────────────────────────────────── */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-4 space-y-3 transition-all",
              dragOver
                ? "border-emerald-400/50 bg-emerald-500/[0.06]"
                : "border-white/[0.08] bg-white/[0.02]"
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) {
                setPdfError(null)
                handlePdfUpload(file)
              }
            }}
          >
            <label className="text-xs text-neutral-400 flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-purple-400" />
              Importar de PDF (Artigo Científico / Estudo)
            </label>

            {pdfError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-300 whitespace-pre-line">{pdfError}</p>
                <div className="text-[10px] text-red-300/70 space-y-1">
                  {pdfError.includes("protegido") && (
                    <>
                      <p>💡 <strong>Solução:</strong> Remova a senha do PDF usando:</p>
                      <ul className="list-disc list-inside ml-1">
                        <li>Adobe Reader ou Preview do macOS</li>
                        <li>Ferramentas online como smallpdf.com ou pdffiller.com</li>
                        <li>Python: PyPDF2 ou pikepdf libraries</li>
                      </ul>
                    </>
                  )}
                  {pdfError.includes("escaneado") && (
                    <>
                      <p>💡 <strong>Solução:</strong> Use OCR (Optical Character Recognition):</p>
                      <ul className="list-disc list-inside ml-1">
                        <li>Google Drive (upload PDF → baixar como DOCX → converter para PDF)</li>
                        <li>Free Tools: ilovepdf.com, ocr.space, smallpdf.com</li>
                        <li>Paid: ABBYY FineReader, Adobe Acrobat Pro</li>
                      </ul>
                    </>
                  )}
                  {pdfError.includes("corrompido") && (
                    <>
                      <p>💡 <strong>Solução:</strong></p>
                      <ul className="list-disc list-inside ml-1">
                        <li>Tente baixar o PDF novamente (pode estar corrompido no download)</li>
                        <li>Abra em outro programa (Adobe Reader, Preview) para verificar</li>
                        <li>Procure por outra versão do documento</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            {pdfProcessing ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                <div className="text-center">
                  <p className="text-xs text-white font-medium">Processando PDF com IA...</p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Extraindo texto, detectando idioma, traduzindo e gerando documento
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
                    <Upload className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-purple-400 font-medium">
                      Clique para selecionar ou arraste o PDF aqui
                    </span>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      PDF até 20MB — artigos em inglês são traduzidos automaticamente
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setPdfError(null)
                        handlePdfUpload(file)
                      }
                      e.target.value = ""
                    }}
                  />
                </label>
              </div>
            )}

            {pdfResult && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-emerald-400 font-medium">
                    PDF processado com sucesso!
                  </span>
                  {pdfResult.wasTranslated && (
                    <span className="text-blue-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/15">
                      <Languages className="w-3 h-3" /> EN → PT traduzido
                    </span>
                  )}
                </div>

                {/* Study metadata */}
                <div className="flex flex-wrap gap-1.5">
                  {pdfResult.studyType && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/15 text-[10px] text-purple-300">
                      {pdfResult.studyType}
                    </span>
                  )}
                  {pdfResult.authors && (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400">
                      {pdfResult.authors}
                    </span>
                  )}
                  {pdfResult.year && (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400">
                      {pdfResult.year}
                    </span>
                  )}
                </div>

                {/* Key findings */}
                {pdfResult.keyFindings && pdfResult.keyFindings.length > 0 && (
                  <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/15 p-3">
                    <p className="text-[10px] text-amber-400 font-semibold mb-1.5 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Achados Principais
                    </p>
                    <ul className="space-y-1">
                      {pdfResult.keyFindings.map((finding, i) => (
                        <li key={i} className="text-[10px] text-neutral-400 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Marketing insights */}
                {pdfResult.marketingInsights && pdfResult.marketingInsights.length > 0 && (
                  <div className="rounded-lg bg-pink-500/[0.05] border border-pink-500/15 p-3">
                    <p className="text-[10px] text-pink-400 font-semibold mb-1.5 flex items-center gap-1">
                      <Instagram className="w-3 h-3" /> Insights para Marketing / Instagram
                    </p>
                    <ul className="space-y-1">
                      {pdfResult.marketingInsights.map((insight, i) => (
                        <li key={i} className="text-[10px] text-neutral-400 flex items-start gap-1.5">
                          <span className="text-pink-500 mt-0.5">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[10px] text-neutral-600">
                  {pdfResult.fileName} — revise o conteúdo abaixo e salve
                </p>
              </div>
            )}
          </div>

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
        <div className="fixed inset-0 z-[100] bg-black/80" onClick={() => { setViewingDoc(null); setMktResult(null) }}>
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
              <button onClick={() => { setViewingDoc(null); setMktResult(null) }} className="text-neutral-400 hover:text-white p-1.5 transition-colors">
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

              {/* ── Generate Marketing Content ─────────────────────────── */}
              <div className="rounded-xl border border-pink-500/15 bg-pink-500/[0.03] p-4 space-y-3">
                <p className="text-xs font-semibold text-white flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  Gerar Conteúdo para Instagram
                </p>
                <p className="text-[10px] text-neutral-500">
                  Transforme este estudo/documento em conteúdo pronto para postar
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "legenda", label: "Legenda" },
                    { value: "carrossel", label: "Carrossel" },
                    { value: "reels", label: "Roteiro Reels" },
                    { value: "stories", label: "Stories" },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setMktPostType(t.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                        mktPostType === t.value
                          ? "bg-pink-600/15 border border-pink-500/25 text-pink-300"
                          : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateMarketing}
                  disabled={mktGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-pink-600/15 hover:from-pink-500 hover:to-purple-500 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {mktGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Gerando conteúdo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Gerar {mktPostType === "legenda" ? "Legenda" : mktPostType === "carrossel" ? "Carrossel" : mktPostType === "reels" ? "Roteiro Reels" : "Stories"}
                    </>
                  )}
                </button>

                {mktResult && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-emerald-400 font-semibold">Conteúdo Gerado</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mktResult)
                          alert("Copiado!")
                        }}
                        className="text-[10px] text-neutral-500 hover:text-white px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto overscroll-contain">
                      {mktResult}
                    </div>
                  </div>
                )}
              </div>
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
                onClick={() => { setViewingDoc(null); setMktResult(null) }}
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
