"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Bot,
  Users,
  TrendingUp,
  Zap,
  DollarSign,
  RefreshCw,
  Trophy,
  ArrowUpRight,
  Cpu,
  Clock,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface BotAnalytics {
  totalMessages: number
  botReplies: number
  humanReplies: number
  totalLeads: number
  newLeadsLast30: number
  convertedLeads: number
  handoffs: number
  totalTokens: number
  avgLatencyMs: number
  totalInteractions: number
  estimatedCostBRL: number
  conversionRate: number
}

interface AnalyticsResponse {
  bots: {
    victor: BotAnalytics
    nutri: BotAnalytics
    b2b: BotAnalytics
  }
  topBot: "victor" | "nutri" | "b2b"
  totalCostBRL: number
  totalMessages: number
}

const BOT_LABELS: Record<string, string> = {
  victor: "Victor Bot",
  nutri: "Nutri Bot",
  b2b: "B2B Bot",
}

const BOT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  victor: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
  nutri: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  b2b: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
}

// ═══════════════════════════════════════════════════════════════
// HOOK — shared data fetcher
// ═══════════════════════════════════════════════════════════════

function useBotAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/master/bots/analytics")
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { data, loading, error, refresh: fetchAnalytics }
}

// ═══════════════════════════════════════════════════════════════
// CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accentColor = "text-violet-400",
  bgColor = "bg-violet-500/10",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
  bgColor?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/80 p-4 hover:border-white/[0.1] transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-4 h-4", accentColor)} />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white/90 tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-neutral-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function BarIndicator({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOT ANALYTICS CARDS — Single bot view
// ═══════════════════════════════════════════════════════════════

export function BotAnalyticsCards({ botType }: { botType: "victor" | "nutri" | "b2b" }) {
  const { data, loading, error, refresh } = useBotAnalytics()

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/80 p-4 animate-pulse">
            <div className="h-4 w-20 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-16 bg-white/[0.06] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
        <p className="text-sm text-red-400">{error || "Dados indisponiveis"}</p>
        <button
          onClick={refresh}
          className="mt-2 text-xs text-red-400/70 hover:text-red-300 underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const bot = data.bots[botType]
  const colors = BOT_COLORS[botType]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className={cn("w-4 h-4", colors.text)} />
          <span className="text-sm font-medium text-white/80">{BOT_LABELS[botType]} Analytics</span>
          <span className="text-[10px] text-neutral-600 tracking-wide">Ultimos 30 dias</span>
        </div>
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={MessageSquare}
          label="Mensagens"
          value={bot.totalMessages.toLocaleString("pt-BR")}
          subtitle={`${bot.botReplies} bot / ${bot.humanReplies} humano`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
        <StatCard
          icon={Bot}
          label="Respostas Bot"
          value={bot.botReplies.toLocaleString("pt-BR")}
          subtitle={`${bot.handoffs} handoffs`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
        <StatCard
          icon={Users}
          label="Leads"
          value={bot.totalLeads.toLocaleString("pt-BR")}
          subtitle={`+${bot.newLeadsLast30} novos`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversao"
          value={`${bot.conversionRate}%`}
          subtitle={`${bot.convertedLeads} convertidos`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
        <StatCard
          icon={Zap}
          label="Tokens IA"
          value={bot.totalTokens > 1000 ? `${(bot.totalTokens / 1000).toFixed(1)}K` : bot.totalTokens.toString()}
          subtitle={`${bot.avgLatencyMs}ms media`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
        <StatCard
          icon={DollarSign}
          label="Custo Est."
          value={`R$ ${bot.estimatedCostBRL.toFixed(2)}`}
          subtitle={`${bot.totalInteractions} interacoes`}
          accentColor={colors.text}
          bgColor={colors.bg}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOT ANALYTICS COMPARATIVE — All 3 bots side by side
// ═══════════════════════════════════════════════════════════════

export function BotAnalyticsComparative() {
  const { data, loading, error, refresh } = useBotAnalytics()

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/80 p-6 animate-pulse">
        <div className="h-5 w-48 bg-white/[0.06] rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.04] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-400">{error || "Dados indisponiveis"}</p>
        <button
          onClick={refresh}
          className="mt-2 text-xs text-red-400/70 hover:text-red-300 underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const botTypes = ["victor", "nutri", "b2b"] as const
  const maxMessages = Math.max(...botTypes.map((b) => data.bots[b].totalMessages), 1)
  const maxLeads = Math.max(...botTypes.map((b) => data.bots[b].totalLeads), 1)
  const maxConversion = Math.max(...botTypes.map((b) => data.bots[b].conversionRate), 1)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Comparativo de Bots</h3>
            <p className="text-[10px] text-neutral-600 tracking-wide">Ultimos 30 dias</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-lg font-bold text-white/90">{data.totalMessages.toLocaleString("pt-BR")}</p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Mensagens totais</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-lg font-bold text-white/90">R$ {data.totalCostBRL.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Custo total</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className={cn("w-3.5 h-3.5", BOT_COLORS[data.topBot].text)} />
            <p className={cn("text-lg font-bold", BOT_COLORS[data.topBot].text)}>
              {BOT_LABELS[data.topBot]}
            </p>
          </div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Top conversao</p>
        </div>
      </div>

      {/* Per-bot comparison */}
      <div className="space-y-4">
        {botTypes.map((botType) => {
          const bot = data.bots[botType]
          const colors = BOT_COLORS[botType]
          const isTop = data.topBot === botType

          return (
            <div
              key={botType}
              className={cn(
                "rounded-xl border p-4 transition-all duration-300",
                isTop
                  ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow}`
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              )}
            >
              {/* Bot header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className={cn("w-4 h-4", colors.text)} />
                  <span className="text-sm font-medium text-white/90">{BOT_LABELS[botType]}</span>
                  {isTop && (
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider", colors.bg, colors.text)}>
                      Top
                    </span>
                  )}
                </div>
                <span className={cn("text-xl font-bold", colors.text)}>{bot.conversionRate}%</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <MessageSquare className="w-3 h-3 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500">Msgs</span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">{bot.totalMessages.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users className="w-3 h-3 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500">Leads</span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">{bot.totalLeads.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Cpu className="w-3 h-3 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500">Tokens</span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">
                    {bot.totalTokens > 1000 ? `${(bot.totalTokens / 1000).toFixed(1)}K` : bot.totalTokens}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <DollarSign className="w-3 h-3 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500">Custo</span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">R$ {bot.estimatedCostBRL.toFixed(2)}</p>
                </div>
              </div>

              {/* Comparison bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-500">Mensagens</span>
                    <span className="text-[10px] text-neutral-500">{bot.totalMessages}</span>
                  </div>
                  <BarIndicator value={bot.totalMessages} max={maxMessages} color={`${colors.bg.replace("/10", "/40")}`} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-500">Leads</span>
                    <span className="text-[10px] text-neutral-500">{bot.totalLeads}</span>
                  </div>
                  <BarIndicator value={bot.totalLeads} max={maxLeads} color={`${colors.bg.replace("/10", "/40")}`} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-500">Conversao</span>
                    <span className="text-[10px] text-neutral-500">{bot.conversionRate}%</span>
                  </div>
                  <BarIndicator value={bot.conversionRate} max={maxConversion} color={`${colors.bg.replace("/10", "/40")}`} />
                </div>
              </div>

              {/* Extra details */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                  <span className="text-[10px] text-neutral-500">
                    +{bot.newLeadsLast30} novos
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-neutral-500" />
                  <span className="text-[10px] text-neutral-500">
                    {bot.handoffs} handoffs
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-[10px] text-neutral-500">
                    {bot.avgLatencyMs}ms avg
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
