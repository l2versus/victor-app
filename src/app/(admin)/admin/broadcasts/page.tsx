"use client"

import { useState, useEffect } from "react"
import {
  Send, Sparkles, Users, Filter, MessageSquare, Bell, Smartphone,
  Loader2, Check, RefreshCw, Heart, Gift, Star, Zap, Calendar,
  UserCheck, Baby, ChevronDown, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

const OCCASIONS = [
  { value: "motivacional", label: "Motivacional", icon: Zap, color: "text-red-400" },
  { value: "aniversario", label: "Aniversário", icon: Gift, color: "text-pink-400" },
  { value: "retorno", label: "Retorno ao Treino", icon: RefreshCw, color: "text-blue-400" },
  { value: "lembrete", label: "Lembrete de Treino", icon: Calendar, color: "text-amber-400" },
  { value: "natal", label: "Natal", icon: Star, color: "text-green-400" },
  { value: "ano_novo", label: "Ano Novo", icon: Star, color: "text-amber-400" },
  { value: "dia_mulher", label: "Dia da Mulher", icon: Heart, color: "text-pink-400" },
  { value: "dia_maes", label: "Dia das Mães", icon: Heart, color: "text-rose-400" },
  { value: "dia_pais", label: "Dia dos Pais", icon: UserCheck, color: "text-blue-400" },
  { value: "pascoa", label: "Páscoa", icon: Gift, color: "text-purple-400" },
  { value: "promocao", label: "Promoção", icon: Star, color: "text-emerald-400" },
  { value: "custom", label: "Personalizado", icon: Sparkles, color: "text-neutral-400" },
]

const AUDIENCES = [
  { value: "todos", label: "Todos os Alunos", icon: Users },
  { value: "mulheres", label: "Mulheres", icon: Heart },
  { value: "homens", label: "Homens", icon: UserCheck },
  { value: "idosos", label: "Idosos (60+)", icon: Baby },
  { value: "inativos", label: "Inativos", icon: RefreshCw },
]

const TONES = [
  { value: "casual", label: "Casual" },
  { value: "motivacional", label: "Motivacional" },
  { value: "carinhoso", label: "Carinhoso" },
  { value: "formal", label: "Formal" },
]

type Stats = { total: number; active: number; male: number; female: number; seniors: number; withPhone: number }
type StudentItem = { id: string; name: string; status: string; phone: string | null }

export default function BroadcastsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [allStudents, setAllStudents] = useState<StudentItem[]>([])
  const [occasion, setOccasion] = useState("motivacional")
  const [audience, setAudience] = useState("todos")
  const [tone, setTone] = useState("casual")
  const [customPrompt, setCustomPrompt] = useState("")
  const [message, setMessage] = useState("")
  const [title, setTitle] = useState("")
  const [channels, setChannels] = useState<Set<string>>(new Set(["app", "push"]))
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ app: number; push: number; whatsapp: number; total: number } | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showStudentPicker, setShowStudentPicker] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/broadcasts").then(r => r.json()).then(d => {
      setStats(d.stats)
      if (d.students) setAllStudents(d.students)
    }).catch(() => {})
  }, [])

  const toggleChannel = (ch: string) => {
    setChannels(prev => {
      const next = new Set(prev)
      if (next.has(ch)) next.delete(ch); else next.add(ch)
      return next
    })
  }

  const audienceCount = stats ? (
    audience === "todos" ? stats.active
    : audience === "mulheres" ? stats.female
    : audience === "homens" ? stats.male
    : audience === "idosos" ? stats.seniors
    : audience === "inativos" ? stats.total - stats.active
    : stats.total
  ) : 0

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/broadcasts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, audience, tone, customPrompt: occasion === "custom" ? customPrompt : undefined }),
      })
      const data = await res.json()
      if (data.text) {
        setMessage(data.text)
        // Auto-generate title from occasion
        const occ = OCCASIONS.find(o => o.value === occasion)
        if (!title) setTitle(occ?.label || "Mensagem")
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  async function handleSend() {
    if (!message.trim() || !title.trim() || channels.size === 0) return
    setSending(true)
    setResult(null)
    try {
      const filters: Record<string, string | number | null> = {}
      if (audience === "mulheres") filters.gender = "FEMALE"
      if (audience === "homens") filters.gender = "MALE"
      if (audience === "idosos") { filters.ageMin = 60 }
      if (audience === "inativos") filters.status = "INACTIVE"
      if (audience !== "inativos") filters.status = "ACTIVE"

      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          channels: Array.from(channels),
          filters,
          ...(selectedStudents.size > 0 ? { studentIds: Array.from(selectedStudents) } : {}),
        }),
      })
      const data = await res.json()
      if (data.results) setResult(data.results)
    } catch { /* ignore */ }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group mb-3"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mensagens em Massa</h1>
            <p className="text-neutral-500 text-sm">
              {stats ? `${stats.active} alunos ativos · ${stats.withPhone} com WhatsApp` : "Carregando..."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "Ativos", value: stats.active, color: "text-emerald-400" },
            { label: "Mulheres", value: stats.female, color: "text-pink-400" },
            { label: "Homens", value: stats.male, color: "text-blue-400" },
            { label: "Idosos", value: stats.seniors, color: "text-amber-400" },
            { label: "WhatsApp", value: stats.withPhone, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-center">
              <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
              <p className="text-[9px] text-neutral-600 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-5">
          {/* Occasion */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Ocasião
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {OCCASIONS.map(o => {
                const Icon = o.icon
                return (
                  <button
                    key={o.value}
                    onClick={() => setOccasion(o.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-medium transition-all",
                      occasion === o.value
                        ? "bg-purple-600/15 border border-purple-500/25 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", occasion === o.value ? o.color : "")} />
                    {o.label}
                  </button>
                )
              })}
            </div>
            {occasion === "custom" && (
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Descreva o que quer comunicar..."
                className="w-full mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/30 resize-none"
                rows={2}
              />
            )}
          </div>

          {/* Audience */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              Público-alvo
            </h3>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map(a => {
                const Icon = a.icon
                return (
                  <button
                    key={a.value}
                    onClick={() => { setAudience(a.value); setSelectedStudents(new Set()); setShowStudentPicker(false) }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      audience === a.value && selectedStudents.size === 0
                        ? "bg-blue-600/15 border border-blue-500/25 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {a.label}
                  </button>
                )
              })}

              {/* Individual student selection toggle */}
              <button
                onClick={() => { setShowStudentPicker(!showStudentPicker); if (!showStudentPicker) setAudience("custom") }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  showStudentPicker || selectedStudents.size > 0
                    ? "bg-purple-600/15 border border-purple-500/25 text-purple-400"
                    : "bg-white/[0.02] border border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Selecionar Alunos
                {selectedStudents.size > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-[9px] font-bold">{selectedStudents.size}</span>
                )}
              </button>
            </div>

            {/* Student Picker */}
            {showStudentPicker && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                  <input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Buscar aluno..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/30"
                  />
                </div>
                <div className="flex gap-2 mb-1">
                  <button
                    onClick={() => setSelectedStudents(new Set(allStudents.map(s => s.id)))}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Selecionar todos
                  </button>
                  <span className="text-neutral-700">·</span>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Limpar seleção
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5">
                  {allStudents
                    .filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map(s => {
                      const isSelected = selectedStudents.has(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            const next = new Set(selectedStudents)
                            if (isSelected) next.delete(s.id); else next.add(s.id)
                            setSelectedStudents(next)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all",
                            isSelected ? "bg-purple-600/10 text-white" : "text-neutral-400 hover:bg-white/[0.04]"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                            isSelected ? "bg-purple-600 border-purple-500" : "border-neutral-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="flex-1 truncate">{s.name}</span>
                          {s.status !== "ACTIVE" && (
                            <span className="text-[9px] text-neutral-600 uppercase">{s.status === "INACTIVE" ? "Inativo" : s.status}</span>
                          )}
                          {s.phone && <MessageSquare className="w-3 h-3 text-green-500/50" />}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            <p className="text-[10px] text-neutral-600 mt-2">
              {selectedStudents.size > 0
                ? `${selectedStudents.size} aluno${selectedStudents.size !== 1 ? "s" : ""} selecionado${selectedStudents.size !== 1 ? "s" : ""}`
                : `${audienceCount} aluno${audienceCount !== 1 ? "s" : ""} serão notificados`
              }
            </p>
          </div>

          {/* Tone + Channels */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Tom da mensagem</h3>
              <div className="flex gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      tone === t.value
                        ? "bg-amber-600/15 border border-amber-500/25 text-amber-400"
                        : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Canais de envio</h3>
              <div className="flex gap-2">
                {[
                  { key: "app", label: "Notificação", icon: Bell, color: "text-blue-400" },
                  { key: "push", label: "Push", icon: Smartphone, color: "text-green-400" },
                  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-400" },
                ].map(ch => (
                  <button
                    key={ch.key}
                    onClick={() => toggleChannel(ch.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      channels.has(ch.key)
                        ? "bg-emerald-600/15 border border-emerald-500/25 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-neutral-500"
                    )}
                  >
                    <ch.icon className={cn("w-3.5 h-3.5", channels.has(ch.key) ? ch.color : "")} />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Message editor + preview */}
        <div className="space-y-4">
          {/* AI Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Gerando com IA..." : "Gerar Mensagem com IA"}
          </button>

          {/* Title */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Título da notificação</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Feliz Aniversário!"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/30"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Mensagem <span className="text-neutral-700">({message.length}/300)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Use {nome} para personalizar com o nome do aluno..."
              rows={5}
              maxLength={500}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/30 resize-none leading-relaxed"
            />
            <p className="text-[9px] text-neutral-600 mt-1">
              Dica: Use <span className="text-purple-400 font-mono">{"{nome}"}</span> para inserir o nome de cada aluno automaticamente
            </p>
          </div>

          {/* Preview */}
          {message && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2">Preview</p>
              <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/10 p-3">
                <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                  {message.replace(/\{nome\}/g, "João")}
                </p>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || !title.trim() || channels.size === 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-base shadow-xl shadow-red-600/25 hover:from-red-500 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? "Enviando..." : `Enviar para ${selectedStudents.size > 0 ? selectedStudents.size : audienceCount} aluno${(selectedStudents.size > 0 ? selectedStudents.size : audienceCount) !== 1 ? "s" : ""}`}
          </button>

          {/* Result */}
          {result && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 animate-slide-up">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">Broadcast enviado!</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{result.app}</p>
                  <p className="text-[9px] text-neutral-500">Notificações</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{result.push}</p>
                  <p className="text-[9px] text-neutral-500">Push</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{result.whatsapp}</p>
                  <p className="text-[9px] text-neutral-500">WhatsApp</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
