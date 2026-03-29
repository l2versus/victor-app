"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  Search,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react"

// ═══ Types ═══

interface Objection {
  objection: string
  frequency: string
  suggestedResponse: string
}

interface Suggestion {
  title: string
  description: string
  priority: "high" | "medium" | "low"
}

interface Script {
  situation: string
  opening: string
  development: string
  closing: string
}

type ActionType = "analyze_objections" | "suggest_improvements" | "generate_scripts"

interface ActionConfig {
  action: ActionType
  label: string
  icon: typeof Search
  description: string
}

const ACTIONS: ActionConfig[] = [
  {
    action: "analyze_objections",
    label: "Analisar Objecoes",
    icon: Search,
    description: "Identifica as objecoes mais comuns e sugere respostas",
  },
  {
    action: "suggest_improvements",
    label: "Sugerir Melhorias",
    icon: Lightbulb,
    description: "Analisa conversas e sugere otimizacoes no prompt",
  },
  {
    action: "generate_scripts",
    label: "Gerar Scripts",
    icon: FileText,
    description: "Cria scripts de vendas prontos para WhatsApp",
  },
]

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
}

// ═══ Component ═══

export function BotAiSuggestions({ botType }: { botType: "victor" | "nutri" | "b2b" }) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [objections, setObjections] = useState<Objection[] | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [scripts, setScripts] = useState<Script[] | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const toggleCard = useCallback((index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const runAction = useCallback(
    async (action: ActionType) => {
      setActiveAction(action)
      setLoading(true)
      setObjections(null)
      setSuggestions(null)
      setScripts(null)
      setExpandedCards(new Set())

      try {
        const res = await fetch("/api/master/bots/ai-improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botType, action }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro desconhecido" }))
          toast.error("Erro", err.error || `Falha (${res.status})`)
          setActiveAction(null)
          setLoading(false)
          return
        }

        const data = await res.json()

        if (action === "analyze_objections" && data.objections) {
          setObjections(data.objections)
        } else if (action === "suggest_improvements" && data.suggestions) {
          setSuggestions(data.suggestions)
        } else if (action === "generate_scripts" && data.scripts) {
          setScripts(data.scripts)
        }
      } catch {
        toast.error("Erro de conexao", "Nao foi possivel conectar ao servidor")
        setActiveAction(null)
      } finally {
        setLoading(false)
      }
    },
    [botType]
  )

  const applyToBot = useCallback(
    async (text: string, label: string) => {
      setApplying(label)
      try {
        // First get current instructions
        const getRes = await fetch(`/api/master/crm/whatsapp/instructions?botType=${botType}`)
        const getData = await getRes.json()
        const currentInstructions = getData.instructions || ""

        // Append the suggestion
        const separator = currentInstructions ? "\n\n---\n\n" : ""
        const newInstructions = `${currentInstructions}${separator}${text}`

        const res = await fetch("/api/master/crm/whatsapp/instructions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botType, instructions: newInstructions }),
        })

        if (res.ok) {
          toast.success("Aplicado!", `"${label}" adicionado as instrucoes do bot`)
        } else {
          toast.error("Erro", "Nao foi possivel salvar as instrucoes")
        }
      } catch {
        toast.error("Erro de conexao", "Nao foi possivel conectar ao servidor")
      } finally {
        setApplying(null)
      }
    },
    [botType]
  )

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map((cfg) => {
          const Icon = cfg.icon
          const isActive = activeAction === cfg.action && !loading
          return (
            <button
              key={cfg.action}
              onClick={() => runAction(cfg.action)}
              disabled={loading}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                "hover:border-violet-500/40 hover:bg-violet-500/5",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isActive
                  ? "border-violet-500/50 bg-violet-500/10"
                  : "border-neutral-800 bg-[#111]"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isActive ? "bg-violet-500/20" : "bg-white/5"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive ? "text-violet-400" : "text-neutral-400")}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{cfg.label}</p>
                <p className="text-xs text-neutral-500 truncate">{cfg.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-[#111]/50 p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Objections results */}
      {!loading && objections && activeAction === "analyze_objections" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {objections.length} objecao(oes) identificada(s)
          </h3>
          {objections.map((obj, idx) => {
            const expanded = expandedCards.has(idx)
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => toggleCard(idx)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{obj.objection}</p>
                      <p className="text-xs text-neutral-500">
                        Frequencia: {obj.frequency}
                      </p>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
                  )}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                    <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3">
                      <p className="text-xs font-medium text-violet-400 mb-1">Resposta sugerida:</p>
                      <p className="text-sm text-neutral-300">{obj.suggestedResponse}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={applying === obj.objection}
                      onClick={() =>
                        applyToBot(
                          `OBJECAO: "${obj.objection}"\nRESPONDA COM: ${obj.suggestedResponse}`,
                          obj.objection
                        )
                      }
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Aplicar ao bot
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Suggestions results */}
      {!loading && suggestions && activeAction === "suggest_improvements" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {suggestions.length} sugestao(oes) de melhoria
          </h3>
          {suggestions.map((sug, idx) => {
            const expanded = expandedCards.has(idx)
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => toggleCard(idx)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        PRIORITY_STYLES[sug.priority] || PRIORITY_STYLES.medium
                      )}
                    >
                      {PRIORITY_LABELS[sug.priority] || sug.priority}
                    </span>
                    <p className="text-sm font-medium text-white truncate">{sug.title}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
                  )}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                    <p className="text-sm text-neutral-300">{sug.description}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={applying === sug.title}
                      onClick={() =>
                        applyToBot(
                          `MELHORIA: ${sug.title}\n${sug.description}`,
                          sug.title
                        )
                      }
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Aplicar ao bot
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Scripts results */}
      {!loading && scripts && activeAction === "generate_scripts" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {scripts.length} script(s) gerado(s)
          </h3>
          {scripts.map((scr, idx) => {
            const expanded = expandedCards.has(idx)
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => toggleCard(idx)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-bold text-violet-400">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{scr.situation}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
                  )}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                    <div className="space-y-2">
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                        <p className="text-xs font-medium text-emerald-400 mb-1">Abertura</p>
                        <p className="text-sm text-neutral-300">{scr.opening}</p>
                      </div>
                      <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                        <p className="text-xs font-medium text-blue-400 mb-1">Desenvolvimento</p>
                        <p className="text-sm text-neutral-300">{scr.development}</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                        <p className="text-xs font-medium text-amber-400 mb-1">Fechamento</p>
                        <p className="text-sm text-neutral-300">{scr.closing}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={applying === scr.situation}
                      onClick={() =>
                        applyToBot(
                          `SCRIPT - ${scr.situation}:\nAbertura: ${scr.opening}\nDesenvolvimento: ${scr.development}\nFechamento: ${scr.closing}`,
                          scr.situation
                        )
                      }
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Aplicar ao bot
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state when no action selected */}
      {!loading && !activeAction && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 mb-3">
            <Zap className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm text-neutral-400">
            Selecione uma acao acima para a IA analisar e sugerir melhorias
          </p>
        </div>
      )}
    </div>
  )
}
