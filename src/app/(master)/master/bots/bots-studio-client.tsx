"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Bot,
  X,
  Save,
  RotateCcw,
  Send,
  Trash2,
  Plus,
  Play,
  Pause,
  Wifi,
  WifiOff,
  MessageSquare,
  Users,
  BookOpen,
  TestTube,
  FileText,
  ChevronRight,
  Loader2,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

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

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: "FAQ" | "Objecoes" | "Precos" | "Regras" | "Scripts"
}

interface TestMessage {
  role: "user" | "bot"
  content: string
  tokens?: { prompt: number; completion: number; total: number } | null
  latencyMs?: number
  model?: string
}

type TabKey = "instructions" | "knowledge" | "test" | "preview"

const BOT_META: Record<string, { emoji: string; description: string; gradient: string }> = {
  victor: {
    emoji: "\uD83D\uDCAA",
    description: "Personal trainer que responde alunos e leads de treino",
    gradient: "from-violet-600 to-indigo-700",
  },
  nutri: {
    emoji: "\uD83E\uDD57",
    description: "Nutricionista que responde pacientes e leads de nutricao",
    gradient: "from-emerald-600 to-teal-700",
  },
  b2b: {
    emoji: "\uD83D\uDCBC",
    description: "Emmanuel B2B que vende a plataforma ONEFIT para profissionais",
    gradient: "from-amber-600 to-orange-700",
  },
}

const CATEGORIES: KnowledgeItem["category"][] = ["FAQ", "Objecoes", "Precos", "Regras", "Scripts"]

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "instructions", label: "Instrucoes", icon: FileText },
  { key: "knowledge", label: "Conhecimento", icon: BookOpen },
  { key: "test", label: "Teste", icon: TestTube },
  { key: "preview", label: "Prompt Preview", icon: FileText },
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BotsStudioClient() {
  const [bots, setBots] = useState<BotStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBot, setSelectedBot] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("instructions")

  // Instructions state
  const [instructions, setInstructions] = useState<Record<string, string>>({})
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [instructionsSaved, setInstructionsSaved] = useState(false)

  // Knowledge state
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeItem[]>>({})
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [savingKnowledge, setSavingKnowledge] = useState(false)

  // Test state
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [testInput, setTestInput] = useState("")
  const [testingBot, setTestingBot] = useState(false)
  const [testContext, setTestContext] = useState<"lead" | "student">("lead")
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Preview state
  const [promptPreview, setPromptPreview] = useState("")
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Toggling pause
  const [togglingPause, setTogglingPause] = useState<string | null>(null)

  // ─── FETCH BOTS ───
  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch("/api/master/crm/whatsapp")
      if (!res.ok) return
      const data = await res.json()
      setBots(data.bots || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  // ─── FETCH INSTRUCTIONS ───
  const fetchInstructions = useCallback(async (botType: string) => {
    try {
      const res = await fetch(`/api/master/crm/whatsapp/instructions?botType=${botType}`)
      if (!res.ok) return
      const data = await res.json()
      setInstructions((prev) => ({ ...prev, [botType]: data.instructions || "" }))
    } catch {
      // silent
    }
  }, [])

  // ─── FETCH KNOWLEDGE ───
  const fetchKnowledge = useCallback(async (botType: string) => {
    try {
      const res = await fetch(`/api/master/crm/whatsapp/knowledge?botType=${botType}`)
      if (!res.ok) return
      const data = await res.json()
      setKnowledge((prev) => ({ ...prev, [botType]: data.items || [] }))
    } catch {
      // silent
    }
  }, [])

  // Load data when bot is selected
  useEffect(() => {
    if (!selectedBot) return
    fetchInstructions(selectedBot)
    fetchKnowledge(selectedBot)
  }, [selectedBot, fetchInstructions, fetchKnowledge])

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [testMessages])

  // ─── SAVE INSTRUCTIONS ───
  async function handleSaveInstructions() {
    if (!selectedBot) return
    setSavingInstructions(true)
    setInstructionsSaved(false)
    try {
      const res = await fetch("/api/master/crm/whatsapp/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, instructions: instructions[selectedBot] || "" }),
      })
      if (res.ok) {
        setInstructionsSaved(true)
        setTimeout(() => setInstructionsSaved(false), 3000)
      }
    } catch {
      // silent
    } finally {
      setSavingInstructions(false)
    }
  }

  // ─── RESET INSTRUCTIONS ───
  async function handleResetInstructions() {
    if (!selectedBot) return
    setInstructions((prev) => ({ ...prev, [selectedBot]: "" }))
    setSavingInstructions(true)
    try {
      await fetch("/api/master/crm/whatsapp/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, instructions: "" }),
      })
      setInstructionsSaved(true)
      setTimeout(() => setInstructionsSaved(false), 3000)
    } catch {
      // silent
    } finally {
      setSavingInstructions(false)
    }
  }

  // ─── SAVE KNOWLEDGE ───
  async function handleSaveKnowledge() {
    if (!selectedBot) return
    setSavingKnowledge(true)
    try {
      await fetch("/api/master/crm/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, items: knowledge[selectedBot] || [] }),
      })
    } catch {
      // silent
    } finally {
      setSavingKnowledge(false)
    }
  }

  // ─── ADD / EDIT / DELETE KNOWLEDGE ───
  function handleAddKnowledgeItem(item: Omit<KnowledgeItem, "id">) {
    if (!selectedBot) return
    const newItem: KnowledgeItem = { ...item, id: crypto.randomUUID() }
    const updated = [...(knowledge[selectedBot] || []), newItem]
    setKnowledge((prev) => ({ ...prev, [selectedBot]: updated }))
    setShowAddItem(false)
    // Auto-save
    setTimeout(() => {
      fetch("/api/master/crm/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, items: updated }),
      }).catch(() => {})
    }, 100)
  }

  function handleEditKnowledgeItem(item: KnowledgeItem) {
    if (!selectedBot) return
    const items = knowledge[selectedBot] || []
    const updated = items.map((i) => (i.id === item.id ? item : i))
    setKnowledge((prev) => ({ ...prev, [selectedBot]: updated }))
    setEditingItem(null)
    // Auto-save
    setTimeout(() => {
      fetch("/api/master/crm/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, items: updated }),
      }).catch(() => {})
    }, 100)
  }

  function handleDeleteKnowledgeItem(id: string) {
    if (!selectedBot) return
    const items = knowledge[selectedBot] || []
    const updated = items.filter((i) => i.id !== id)
    setKnowledge((prev) => ({ ...prev, [selectedBot]: updated }))
    // Auto-save
    setTimeout(() => {
      fetch("/api/master/crm/whatsapp/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, items: updated }),
      }).catch(() => {})
    }, 100)
  }

  // ─── TEST BOT ───
  async function handleTestBot() {
    if (!selectedBot || !testInput.trim()) return
    const userMsg = testInput.trim()
    setTestInput("")
    setTestMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setTestingBot(true)

    try {
      const res = await fetch("/api/master/crm/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType: selectedBot, message: userMsg, context: testContext }),
      })

      if (!res.ok) {
        setTestMessages((prev) => [...prev, { role: "bot", content: "(Erro ao testar bot)" }])
        return
      }

      const data = await res.json()
      setTestMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.response,
          tokens: data.tokens,
          latencyMs: data.latencyMs,
          model: data.model,
        },
      ])
    } catch {
      setTestMessages((prev) => [...prev, { role: "bot", content: "(Falha na requisicao)" }])
    } finally {
      setTestingBot(false)
    }
  }

  // ─── TOGGLE PAUSE ───
  async function handleTogglePause(botType: string, currentlyPaused: boolean) {
    setTogglingPause(botType)
    try {
      const res = await fetch("/api/master/crm/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botType, action: currentlyPaused ? "resume" : "pause" }),
      })
      if (res.ok) {
        setBots((prev) => prev.map((b) => (b.type === botType ? { ...b, paused: !currentlyPaused } : b)))
      }
    } catch {
      // silent
    } finally {
      setTogglingPause(null)
    }
  }

  // ─── BUILD PREVIEW ───
  useEffect(() => {
    if (activeTab !== "preview" || !selectedBot) return
    setLoadingPreview(true)

    const botInstr = instructions[selectedBot] || ""
    const botKnowledge = knowledge[selectedBot] || []

    let knowledgeBlock = ""
    if (botKnowledge.length > 0) {
      const grouped: Record<string, KnowledgeItem[]> = {}
      for (const item of botKnowledge) {
        const cat = item.category || "FAQ"
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(item)
      }
      knowledgeBlock = "\n\n══════ BASE DE CONHECIMENTO ══════\n"
      for (const [category, catItems] of Object.entries(grouped)) {
        knowledgeBlock += `\n${category}:\n`
        for (const item of catItems) {
          if (category === "Regras" || category === "Scripts") {
            knowledgeBlock += `- ${item.answer}\n`
          } else if (category === "Objecoes") {
            knowledgeBlock += `- "${item.question}" -> Responda: "${item.answer}"\n`
          } else {
            knowledgeBlock += `- P: ${item.question} R: ${item.answer}\n`
          }
        }
      }
    }

    const customSection = botInstr || knowledgeBlock
      ? `\n\n══════ INSTRUCOES ADICIONAIS DO DONO ══════\n\n${botInstr}${knowledgeBlock}\n`
      : ""

    let basePrompt = ""
    if (selectedBot === "victor") {
      basePrompt = `[Base Prompt: Victor - Personal Trainer]
Voce e o Victor Oliveira, personal trainer em Fortaleza/CE.
Voce esta respondendo pelo WhatsApp como se fosse o Victor em pessoa.

- Regras de ouro: nunca revelar que e IA, falar como cearense, respostas curtas
- Estilo: motivacional, direto, usa girias naturais
- Pode: tirar duvidas, motivar, dicas nutricionais basicas
- Nao pode: prescrever remedios, diagnosticar lesoes

[Dados do Aluno/Lead serao injetados em tempo real]`
    } else if (selectedBot === "nutri") {
      basePrompt = `[Base Prompt: Nutri - Nutricionista]
Voce e nutricionista esportivo(a) respondendo pelo WhatsApp.
Profissional, acolhedor(a) e direto(a).

- Regras de ouro: nunca revelar que e IA, respostas curtas, sem prescricao por WhatsApp
- Estilo: profissional mas acessivel, foco em educacao nutricional
- Pode: dicas gerais, orientar sobre hidratacao e macros
- Nao pode: prescrever dieta especifica, medicamentos

[Dados do Paciente/Lead serao injetados em tempo real]`
    } else {
      basePrompt = `[Base Prompt: B2B - Emmanuel Vendas]
Voce e Emmanuel Bezerra, CEO da Code Bezerra (CB).
Vendendo a plataforma ONEFIT — SaaS fitness completo.

- Produto: app white-label, IA nativa, correcao postural, CRM, comunidade
- Diferenciais: IA nativa, correcao postural exclusiva, sem mensalidade do app
- Planos: Personal R$197/mes, Clinica R$497/mes, Academia sob consulta
- Estilo: consultivo, nao agressivo, entender a dor antes de vender

[Historico do lead sera injetado em tempo real]`
    }

    setPromptPreview(basePrompt + customSection)
    setLoadingPreview(false)
  }, [activeTab, selectedBot, instructions, knowledge])

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const currentBot = bots.find((b) => b.type === selectedBot)

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Bot Training{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-300">
                Studio
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Configure e treine cada bot independentemente
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ BOT CARDS GRID ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05]" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-white/[0.05] rounded mb-1.5" />
                    <div className="h-3 w-32 bg-white/[0.03] rounded" />
                  </div>
                </div>
                <div className="h-8 w-full bg-white/[0.03] rounded-lg" />
              </div>
            ))
          : bots.map((bot, i) => {
              const meta = BOT_META[bot.type] || BOT_META.victor
              const isSelected = selectedBot === bot.type
              return (
                <motion.div
                  key={bot.type}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer",
                    isSelected
                      ? "border-violet-500/30 bg-violet-600/[0.06] ring-1 ring-violet-500/20"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  )}
                  onClick={() => {
                    setSelectedBot(bot.type)
                    setActiveTab("instructions")
                    setTestMessages([])
                  }}
                >
                  {/* Glow on hover */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-violet-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10">
                    {/* Top row: avatar + status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg",
                            meta.gradient
                          )}
                        >
                          {meta.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/90">{bot.name}</p>
                          <p className="text-[10px] text-neutral-500 leading-tight mt-0.5 max-w-[180px]">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* Active / Paused */}
                      <span
                        className={cn(
                          "text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border inline-flex items-center gap-1",
                          bot.paused
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", bot.paused ? "bg-amber-400" : "bg-emerald-400")} />
                        {bot.paused ? "Pausado" : "Ativo"}
                      </span>

                      {/* Connection */}
                      <span
                        className={cn(
                          "text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border inline-flex items-center gap-1",
                          bot.configured
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                        )}
                      >
                        {bot.configured ? (
                          <Wifi className="w-2.5 h-2.5" />
                        ) : (
                          <WifiOff className="w-2.5 h-2.5" />
                        )}
                        {bot.configured ? "Configurado" : "Nao configurado"}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>--</span>
                        <span className="text-neutral-600">msgs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                        <Users className="w-3 h-3" />
                        <span>--</span>
                        <span className="text-neutral-600">leads</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePause(bot.type, bot.paused)
                        }}
                        disabled={togglingPause === bot.type}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border",
                          bot.paused
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        )}
                      >
                        {togglingPause === bot.type ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : bot.paused ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          <Pause className="w-3 h-3" />
                        )}
                        {bot.paused ? "Retomar" : "Pausar"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBot(bot.type)
                          setActiveTab("instructions")
                          setTestMessages([])
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 transition-all duration-200"
                      >
                        Configurar
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
      </div>

      {/* ═══ DETAIL PANEL ═══ */}
      <AnimatePresence>
        {selectedBot && currentBot && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg",
                    BOT_META[selectedBot]?.gradient || "from-violet-600 to-indigo-700"
                  )}
                >
                  {BOT_META[selectedBot]?.emoji || "\uD83E\uDD16"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{currentBot.name}</p>
                  <p className="text-[10px] text-neutral-500">{currentBot.displayName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBot(null)}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 sm:px-5 py-3 text-[12px] font-medium transition-all duration-200 border-b-2 whitespace-nowrap",
                    activeTab === tab.key
                      ? "border-violet-500 text-violet-400 bg-violet-600/[0.04]"
                      : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 sm:p-7">
              {/* ─── TAB 1: INSTRUCTIONS ─── */}
              {activeTab === "instructions" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-2">
                      Instrucoes Customizadas
                    </label>
                    <textarea
                      value={instructions[selectedBot] || ""}
                      onChange={(e) =>
                        setInstructions((prev) => ({ ...prev, [selectedBot]: e.target.value }))
                      }
                      placeholder="Ex: Sempre mencione a promocao de marco. Nunca ofereca desconto acima de 15%. Use o nome do lead na primeira resposta..."
                      rows={8}
                      className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all resize-y min-h-[120px]"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-neutral-600">
                        {(instructions[selectedBot] || "").length} caracteres
                      </p>
                      {instructionsSaved && (
                        <motion.p
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] text-emerald-400"
                        >
                          Salvo com sucesso
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveInstructions}
                      disabled={savingInstructions}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-600/20"
                    >
                      {savingInstructions ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Salvar
                    </button>
                    <button
                      onClick={handleResetInstructions}
                      disabled={savingInstructions}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Resetar
                    </button>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: KNOWLEDGE ─── */}
              {activeTab === "knowledge" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                        Base de Conhecimento
                      </p>
                      <p className="text-[10px] text-neutral-600 mt-0.5">
                        {(knowledge[selectedBot] || []).length} itens configurados
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddItem(true)
                        setEditingItem(null)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>
                  </div>

                  {/* Category filter badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const count = (knowledge[selectedBot] || []).filter(
                        (i) => i.category === cat
                      ).length
                      return (
                        <span
                          key={cat}
                          className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-neutral-500"
                        >
                          {cat} ({count})
                        </span>
                      )
                    })}
                  </div>

                  {/* Add Item Form */}
                  <AnimatePresence>
                    {showAddItem && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <KnowledgeItemForm
                          onSave={handleAddKnowledgeItem}
                          onCancel={() => setShowAddItem(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Edit Item Form */}
                  <AnimatePresence>
                    {editingItem && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <KnowledgeItemForm
                          initial={editingItem}
                          onSave={(item) =>
                            handleEditKnowledgeItem({ ...item, id: editingItem.id })
                          }
                          onCancel={() => setEditingItem(null)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Knowledge Items List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto overscroll-contain">
                    {(knowledge[selectedBot] || []).length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="w-5 h-5 text-neutral-600" />
                        </div>
                        <p className="text-neutral-500 text-sm">Nenhum item de conhecimento</p>
                        <p className="text-neutral-600 text-[11px] mt-1">
                          Adicione FAQs, regras e objecoes para treinar o bot
                        </p>
                      </div>
                    ) : (
                      (knowledge[selectedBot] || []).map((item) => (
                        <div
                          key={item.id}
                          className="group/item flex items-start gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-600/10 text-violet-400 border border-violet-500/15">
                                {item.category}
                              </span>
                            </div>
                            {item.question && (
                              <p className="text-[12px] text-neutral-300 font-medium truncate">
                                {item.question}
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                              {item.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => {
                                setEditingItem(item)
                                setShowAddItem(false)
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteKnowledgeItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {(knowledge[selectedBot] || []).length > 0 && (
                    <button
                      onClick={handleSaveKnowledge}
                      disabled={savingKnowledge}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-600/20"
                    >
                      {savingKnowledge ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Salvar Base
                    </button>
                  )}
                </div>
              )}

              {/* ─── TAB 3: TEST ─── */}
              {activeTab === "test" && (
                <div className="space-y-4">
                  {/* Context selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Contexto:
                    </label>
                    <div className="flex gap-1.5">
                      {(selectedBot === "b2b"
                        ? [{ value: "lead" as const, label: "Lead B2B" }]
                        : [
                            { value: "lead" as const, label: "Lead" },
                            { value: "student" as const, label: "Aluno" },
                          ]
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTestContext(opt.value)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[11px] font-medium border transition-all",
                            testContext === opt.value
                              ? "bg-violet-600/15 text-violet-400 border-violet-500/25"
                              : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:text-neutral-300"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="h-[340px] overflow-y-auto overscroll-contain p-4 space-y-3">
                      {testMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-14 h-14 rounded-2xl bg-violet-600/[0.06] border border-violet-500/10 flex items-center justify-center mb-3">
                            <TestTube className="w-6 h-6 text-violet-500/50" />
                          </div>
                          <p className="text-neutral-500 text-sm">Teste o bot aqui</p>
                          <p className="text-neutral-600 text-[11px] mt-1">
                            Envie uma mensagem como se fosse um{" "}
                            {testContext === "student" ? "aluno" : "lead"}
                          </p>
                        </div>
                      )}

                      {testMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex",
                            msg.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2.5",
                              msg.role === "user"
                                ? "bg-violet-600/20 border border-violet-500/20 text-white/90"
                                : "bg-white/[0.04] border border-white/[0.06] text-white/80"
                            )}
                          >
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            {msg.role === "bot" && (msg.tokens || msg.latencyMs) && (
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/[0.06]">
                                {msg.tokens && (
                                  <span className="text-[9px] text-neutral-500 flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" />
                                    {msg.tokens.total} tokens
                                  </span>
                                )}
                                {msg.latencyMs && (
                                  <span className="text-[9px] text-neutral-500 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {msg.latencyMs}ms
                                  </span>
                                )}
                                {msg.model && (
                                  <span className="text-[9px] text-neutral-600">
                                    {msg.model}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {testingBot && (
                        <div className="flex justify-start">
                          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-white/[0.06] p-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleTestBot()
                          }
                        }}
                        placeholder="Digite uma mensagem de teste..."
                        disabled={testingBot}
                        className="flex-1 bg-transparent border-none text-sm text-white/90 placeholder:text-neutral-600 focus:outline-none"
                      />
                      <button
                        onClick={handleTestBot}
                        disabled={testingBot || !testInput.trim()}
                        className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clear button */}
                  {testMessages.length > 0 && (
                    <button
                      onClick={() => setTestMessages([])}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar
                    </button>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400/80 leading-relaxed">
                      O teste usa tokens reais do Groq. Cada mensagem consome tokens e e logada
                      no tracking de uso. Use com moderacao.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── TAB 4: PROMPT PREVIEW ─── */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                      Prompt Final (Read-only)
                    </p>
                    <p className="text-[10px] text-neutral-600 mb-3">
                      Este e o prompt completo que o bot usa, incluindo instrucoes customizadas e
                      base de conhecimento.
                    </p>
                  </div>

                  {loadingPreview ? (
                    <div className="h-[300px] rounded-xl bg-black/30 border border-white/[0.06] animate-pulse" />
                  ) : (
                    <div className="bg-black/40 border border-white/[0.06] rounded-xl overflow-hidden">
                      <div className="max-h-[500px] overflow-y-auto overscroll-contain">
                        <pre className="p-5 text-[12px] leading-relaxed text-neutral-300 whitespace-pre-wrap font-mono">
                          {promptPreview.split("\n").map((line, i) => {
                            // Highlight section headers
                            if (
                              line.includes("══════") ||
                              line.startsWith("[Base Prompt:") ||
                              line.startsWith("[")
                            ) {
                              return (
                                <span key={i} className="text-violet-400 font-semibold">
                                  {line}
                                  {"\n"}
                                </span>
                              )
                            }
                            if (line.startsWith("- ")) {
                              return (
                                <span key={i} className="text-emerald-400/70">
                                  {line}
                                  {"\n"}
                                </span>
                              )
                            }
                            if (line.endsWith(":") && line.length < 40) {
                              return (
                                <span key={i} className="text-amber-400/80 font-medium">
                                  {line}
                                  {"\n"}
                                </span>
                              )
                            }
                            return (
                              <span key={i}>
                                {line}
                                {"\n"}
                              </span>
                            )
                          })}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE ITEM FORM
// ═══════════════════════════════════════════════════════════════

function KnowledgeItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: KnowledgeItem
  onSave: (item: Omit<KnowledgeItem, "id"> & { id?: string }) => void
  onCancel: () => void
}) {
  const [question, setQuestion] = useState(initial?.question || "")
  const [answer, setAnswer] = useState(initial?.answer || "")
  const [category, setCategory] = useState<KnowledgeItem["category"]>(initial?.category || "FAQ")

  function handleSubmit() {
    if (!answer.trim()) return
    onSave({ question: question.trim(), answer: answer.trim(), category })
  }

  return (
    <div className="p-4 rounded-xl border border-violet-500/15 bg-violet-600/[0.04] space-y-3">
      <p className="text-[11px] font-medium text-violet-400 uppercase tracking-wider">
        {initial ? "Editar Item" : "Novo Item"}
      </p>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
              category === cat
                ? "bg-violet-600/15 text-violet-400 border-violet-500/25"
                : "bg-white/[0.02] text-neutral-500 border-white/[0.06] hover:text-neutral-300"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Question (optional for Regras/Scripts) */}
      {category !== "Regras" && category !== "Scripts" && (
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            category === "Objecoes"
              ? 'Objecao do lead (ex: "Esta muito caro")'
              : "Pergunta do lead/aluno"
          }
          className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-all"
        />
      )}

      {/* Answer */}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={
          category === "Regras"
            ? "Regra (ex: Nunca oferecer mais de 15% de desconto)"
            : category === "Scripts"
              ? "Script de resposta completo"
              : category === "Objecoes"
                ? 'Resposta para a objecao (ex: "Comparado com um personal presencial...")'
                : "Resposta"
        }
        rows={3}
        className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-all resize-y"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-all"
        >
          <Save className="w-3 h-3" />
          {initial ? "Atualizar" : "Adicionar"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
