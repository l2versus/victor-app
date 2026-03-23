"use client"

import { useState } from "react"
import {
  GraduationCap, Instagram, Calendar, Youtube, FileText,
  Sparkles, Loader2, Copy, Check, RefreshCw, Hash,
  Target, Users, TrendingUp, MessageCircle, Lightbulb,
  Clock, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "calendar", label: "Calendário", icon: Calendar, color: "text-blue-400" },
  { id: "youtube", label: "YouTube → IA", icon: Youtube, color: "text-red-400" },
  { id: "strategies", label: "Estratégias", icon: TrendingUp, color: "text-emerald-400" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function AcademyPage() {
  const [tab, setTab] = useState<TabId>("instagram")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Academia do Personal</h1>
          <p className="text-neutral-500 text-sm">Marketing, conteúdo e crescimento profissional</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                tab === t.id
                  ? "bg-white/[0.08] border border-white/[0.12] text-white"
                  : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.1]"
              )}
            >
              <Icon className={cn("w-4 h-4", tab === t.id ? t.color : "")} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === "instagram" && <InstagramTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "youtube" && <YoutubeTab />}
      {tab === "strategies" && <StrategiesTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTAGRAM TAB — Generate posts, captions, bio, stories
// ═══════════════════════════════════════════════════════════════════════════════

const POST_TYPES = [
  { value: "carrossel", label: "Carrossel", icon: FileText },
  { value: "legenda", label: "Legenda", icon: MessageCircle },
  { value: "reels", label: "Roteiro Reels", icon: Instagram },
  { value: "stories", label: "Script Stories", icon: Clock },
  { value: "bio", label: "Bio Profissional", icon: Target },
  { value: "hashtags", label: "Hashtags", icon: Hash },
]

const NICHES = [
  "Hipertrofia", "Emagrecimento", "Funcional", "Idosos",
  "Gestantes", "Atletas", "Reabilitação", "Online",
]

function InstagramTab() {
  const [postType, setPostType] = useState("legenda")
  const [niche, setNiche] = useState("Hipertrofia")
  const [topic, setTopic] = useState("")
  const [result, setResult] = useState("")
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setResult("")
    try {
      const res = await fetch("/api/admin/academy/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType, niche, topic }),
      })
      const data = await res.json()
      if (data.text) setResult(data.text)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Config */}
      <div className="space-y-5">
        {/* Post type */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-400" />
            Tipo de Conteúdo
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {POST_TYPES.map(p => {
              const Icon = p.icon
              return (
                <button
                  key={p.value}
                  onClick={() => setPostType(p.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-medium transition-all",
                    postType === p.value
                      ? "bg-pink-600/15 border border-pink-500/25 text-white"
                      : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                  )}
                >
                  <Icon className={cn("w-4 h-4", postType === p.value ? "text-pink-400" : "")} />
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Niche */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Seu Nicho
          </h3>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(n => (
              <button
                key={n}
                onClick={() => setNiche(n)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  niche === n
                    ? "bg-amber-600/15 border border-amber-500/25 text-amber-400"
                    : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-400" />
            Tema (opcional)
          </h3>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Ex: importância do treino de pernas, como ganhar massa magra..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-pink-500/30"
          />
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-purple-500 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Gerando com IA..." : "Gerar Conteúdo"}
        </button>
      </div>

      {/* Result */}
      <div className="space-y-4">
        {result ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                Resultado
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs text-neutral-400 hover:text-white transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs text-neutral-400 hover:text-white transition-all disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
                  Regerar
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] max-h-[500px] overflow-y-auto">
              {result}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-12 text-center">
            <Instagram className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Selecione o tipo e clique em Gerar</p>
            <p className="text-neutral-700 text-xs mt-1">A IA vai criar conteúdo profissional para seu Instagram</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR TAB — 30-day content calendar
// ═══════════════════════════════════════════════════════════════════════════════

function CalendarTab() {
  const [niche, setNiche] = useState("Hipertrofia")
  const [postsPerWeek, setPostsPerWeek] = useState(5)
  const [calendar, setCalendar] = useState<{ day: number; weekday: string; type: string; topic: string; caption: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setCalendar([])
    try {
      const res = await fetch("/api/admin/academy/content-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, postsPerWeek }),
      })
      const data = await res.json()
      if (data.calendar) setCalendar(data.calendar)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  function copyCaption(idx: number, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Configuração do Calendário
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Nicho</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.slice(0, 4).map(n => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    niche === n
                      ? "bg-blue-600/15 border border-blue-500/25 text-blue-400"
                      : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Posts por semana</label>
            <div className="flex gap-2">
              {[3, 5, 7].map(n => (
                <button
                  key={n}
                  onClick={() => setPostsPerWeek(n)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                    postsPerWeek === n
                      ? "bg-blue-600/15 border border-blue-500/25 text-blue-400"
                      : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          {generating ? "Gerando 30 dias..." : "Gerar Calendário de 30 Dias"}
        </button>
      </div>

      {/* Calendar results */}
      {calendar.length > 0 && (
        <div className="space-y-2">
          {calendar.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#111] p-4 flex items-start gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] text-blue-400 font-medium uppercase">{item.weekday}</span>
                <span className="text-sm font-bold text-white leading-none">{item.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider",
                    item.type === "Carrossel" ? "bg-purple-500/15 text-purple-400" :
                    item.type === "Reels" ? "bg-pink-500/15 text-pink-400" :
                    item.type === "Stories" ? "bg-amber-500/15 text-amber-400" :
                    "bg-blue-500/15 text-blue-400"
                  )}>
                    {item.type}
                  </span>
                  <span className="text-xs text-white font-medium truncate">{item.topic}</span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2">{item.caption}</p>
              </div>
              <button
                onClick={() => copyCaption(i, `${item.topic}\n\n${item.caption}`)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/[0.05]"
              >
                {copied === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-600" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// YOUTUBE TAB — Extract and summarize videos
// ═══════════════════════════════════════════════════════════════════════════════

function YoutubeTab() {
  const [url, setUrl] = useState("")
  const [summary, setSummary] = useState("")
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSummarize() {
    if (!url.trim()) return
    setGenerating(true)
    setSummary("")
    try {
      const res = await fetch("/api/admin/academy/youtube-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.summary) setSummary(data.summary)
      if (data.error) setSummary(`Erro: ${data.error}`)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-400" />
          Extrair Conhecimento de Vídeo
        </h3>
        <p className="text-xs text-neutral-500">
          Cole o link de um vídeo do YouTube sobre treino, fisiologia, marketing ou qualquer tema.
          A IA vai extrair os pontos-chave e gerar um resumo profissional.
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
          />
          <button
            onClick={handleSummarize}
            disabled={generating || !url.trim()}
            className="px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm shadow-lg shadow-red-600/20 hover:from-red-500 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {summary && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              Resumo Extraído
            </h3>
            <button
              onClick={() => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs text-neutral-400 hover:text-white transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] max-h-[500px] overflow-y-auto">
            {summary}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIES TAB — Growth strategies and tips
// ═══════════════════════════════════════════════════════════════════════════════

const STRATEGIES = [
  {
    title: "Funil Instagram → Aluno",
    icon: Instagram,
    color: "from-pink-600/15 to-purple-600/15",
    borderColor: "border-pink-500/15",
    steps: [
      "Post/Reel com dica de treino (valor gratuito)",
      "CTA: 'Quer um treino personalizado? Link na bio'",
      "Landing page com formulário ou WhatsApp",
      "Aula experimental gratuita (presencial ou online)",
      "Proposta com 3 planos (Essencial, Pro, Elite)",
      "Follow-up em 24h pelo WhatsApp",
    ],
  },
  {
    title: "Conteúdo que Converte",
    icon: TrendingUp,
    color: "from-emerald-600/15 to-green-600/15",
    borderColor: "border-emerald-500/15",
    steps: [
      "80% educação (dicas, exercícios, mitos) → autoridade",
      "10% social proof (antes/depois, depoimentos)",
      "5% bastidores (dia a dia, preparação, treino próprio)",
      "5% oferta direta (promoção, planos, vagas limitadas)",
    ],
  },
  {
    title: "Retenção de Alunos",
    icon: Users,
    color: "from-blue-600/15 to-cyan-600/15",
    borderColor: "border-blue-500/15",
    steps: [
      "Mensagem de aniversário automática (já implementado!)",
      "Check-in semanal: 'Como está se sentindo nos treinos?'",
      "Relatório mensal de evolução (gráficos de carga)",
      "Grupo VIP no WhatsApp (exclusivo plano Elite)",
      "Desafios mensais com ranking entre alunos",
      "Renovação antecipada com desconto progressivo",
    ],
  },
  {
    title: "Posicionamento no Instagram",
    icon: Target,
    color: "from-amber-600/15 to-orange-600/15",
    borderColor: "border-amber-500/15",
    steps: [
      "Nicho definido na bio (ex: 'Especialista em Hipertrofia')",
      "Foto profissional na academia (não selfie)",
      "Highlights organizados: Resultados, Dicas, Planos, FAQ",
      "Postar mínimo 4x/semana (mix de formatos)",
      "Responder TODOS os DMs e comentários em <2h",
      "Usar localização da cidade em todos os posts",
    ],
  },
]

function StrategiesTab() {
  const [askTopic, setAskTopic] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAsk() {
    if (!askTopic.trim()) return
    setLoading(true)
    setAiAnswer("")
    try {
      const res = await fetch("/api/admin/academy/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType: "estrategia", niche: "marketing", topic: askTopic }),
      })
      const data = await res.json()
      if (data.text) setAiAnswer(data.text)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* AI Advisor */}
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Consultor de Marketing IA
        </h3>
        <p className="text-xs text-neutral-500">Pergunte qualquer coisa sobre marketing, vendas, posicionamento ou crescimento.</p>
        <div className="flex gap-2">
          <input
            value={askTopic}
            onChange={e => setAskTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAsk()}
            placeholder="Ex: como conseguir 10 alunos novos em 30 dias?"
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-amber-500/30"
          />
          <button
            onClick={handleAsk}
            disabled={loading || !askTopic.trim()}
            className="px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm hover:from-amber-500 hover:to-orange-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
        {aiAnswer && (
          <div className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] max-h-[400px] overflow-y-auto mt-3">
            {aiAnswer}
          </div>
        )}
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STRATEGIES.map(s => {
          const Icon = s.icon
          return (
            <div key={s.title} className={cn("rounded-2xl border bg-gradient-to-br p-5", s.borderColor, s.color)}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {s.title}
              </h3>
              <ol className="space-y-2">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                    <span className="w-5 h-5 rounded-md bg-white/[0.08] flex items-center justify-center text-[9px] font-bold text-neutral-400 shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>
    </div>
  )
}
