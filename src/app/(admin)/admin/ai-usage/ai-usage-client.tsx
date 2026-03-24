"use client"

import { useState, useEffect } from "react"
import { Brain, Zap, Clock, AlertTriangle, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type UsageData = {
  today: { calls: number; tokens: number; limit: number; usagePercent: number; remaining: number }
  totals: { calls: number; promptTokens: number; completionTokens: number; totalTokens: number; avgLatencyMs: number }
  byFeature: { feature: string; calls: number; totalTokens: number; promptTokens: number; completionTokens: number; avgLatencyMs: number }[]
  byModel: { model: string; calls: number; totalTokens: number }[]
  daily: { date: string; tokens: number; calls: number }[]
  errors: { feature: string; model: string; error: string | null; createdAt: string }[]
}

const FEATURE_LABELS: Record<string, { label: string; color: string }> = {
  chat_aluno: { label: "Chat Aluno (WhatsApp)", color: "text-blue-400" },
  lead_bot: { label: "Bot de Vendas (Leads)", color: "text-orange-400" },
  post_workout: { label: "Pós-Treino", color: "text-green-400" },
  workout_gen: { label: "Geração de Treino", color: "text-purple-400" },
  anamnesis: { label: "Análise Anamnese", color: "text-pink-400" },
  engagement: { label: "Engajamento", color: "text-cyan-400" },
  body_scan: { label: "Body Scan", color: "text-amber-400" },
  chat: { label: "Chat Site", color: "text-emerald-400" },
  scoring: { label: "Lead Scoring", color: "text-red-400" },
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function AiUsageClient() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai-usage?days=${days}`)
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [days])

  if (loading && !data) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
    </div>
  )

  if (!data) return <p className="text-neutral-500 text-sm p-6">Erro ao carregar dados</p>

  const { today, totals, byFeature, byModel, daily, errors } = data

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Consumo IA — Groq
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Tokens reais consumidos por feature</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all",
                days === d ? "bg-white/[0.08] border-white/[0.12] text-white" : "border-white/[0.04] text-neutral-600"
              )}>
              {d}d
            </button>
          ))}
          <button onClick={fetchData} className="p-1.5 rounded-lg text-neutral-600 hover:text-white transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Gauge — uso de hoje */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Uso Hoje (Groq Free Tier)</p>
          <span className={cn("text-xs font-bold", today.usagePercent > 80 ? "text-red-400" : today.usagePercent > 50 ? "text-yellow-400" : "text-emerald-400")}>
            {today.usagePercent}%
          </span>
        </div>
        <div className="h-4 bg-white/[0.04] rounded-full overflow-hidden mb-2">
          <div
            className={cn("h-full rounded-full transition-all duration-500",
              today.usagePercent > 80 ? "bg-red-500" : today.usagePercent > 50 ? "bg-yellow-500" : "bg-emerald-500"
            )}
            style={{ width: `${Math.min(today.usagePercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-neutral-600">
          <span>{today.calls.toLocaleString()} chamadas · {formatTokens(today.tokens)} tokens</span>
          <span>{today.remaining.toLocaleString()} chamadas restantes de {today.limit.toLocaleString()}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Chamadas", value: totals.calls.toLocaleString(), icon: Zap, color: "text-blue-400" },
          { label: "Total Tokens", value: formatTokens(totals.totalTokens), icon: Brain, color: "text-purple-400" },
          { label: "Latência Média", value: `${totals.avgLatencyMs}ms`, icon: Clock, color: "text-cyan-400" },
          { label: "Erros", value: errors.length, icon: AlertTriangle, color: errors.length > 0 ? "text-red-400" : "text-emerald-400" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className={cn("w-3 h-3", kpi.color)} />
              <p className="text-[9px] text-neutral-600 uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className={cn("text-lg font-bold", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Por feature */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Consumo por Feature</p>
        <div className="space-y-3">
          {byFeature.map(f => {
            const cfg = FEATURE_LABELS[f.feature] || { label: f.feature, color: "text-neutral-400" }
            const maxTokens = byFeature[0]?.totalTokens || 1
            const pct = Math.round((f.totalTokens / maxTokens) * 100)
            return (
              <div key={f.feature}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                  <div className="flex items-center gap-3 text-neutral-500">
                    <span>{f.calls} calls</span>
                    <span>{formatTokens(f.totalTokens)} tokens</span>
                    <span>{f.avgLatencyMs}ms</span>
                  </div>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {byFeature.length === 0 && <p className="text-xs text-neutral-700">Nenhum uso registrado no período</p>}
        </div>
      </div>

      {/* Por modelo */}
      {byModel.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Por Modelo</p>
          <div className="space-y-2">
            {byModel.map(m => (
              <div key={m.model} className="flex items-center justify-between text-xs">
                <code className="text-neutral-400 font-mono text-[10px]">{m.model}</code>
                <div className="flex items-center gap-3 text-neutral-500">
                  <span>{m.calls} calls</span>
                  <span className="text-purple-400 font-semibold">{formatTokens(m.totalTokens)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico diário */}
      {daily.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-3">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Uso Diário ({days} dias)
          </p>
          <div className="flex items-end gap-[2px] h-28">
            {daily.slice().reverse().slice(-30).map((d, i) => {
              const max = Math.max(...daily.map(x => x.tokens), 1)
              const height = Math.max((d.tokens / max) * 100, 2)
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.date}: ${d.tokens} tokens, ${d.calls} calls`}>
                  <div className="w-full rounded-t bg-purple-500/50 hover:bg-purple-400/70 transition-colors cursor-default" style={{ height: `${height}%` }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[8px] text-neutral-700 mt-1">
            <span>{daily[daily.length - 1]?.date?.slice(5)}</span>
            <span>{daily[0]?.date?.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Erros recentes */}
      {errors.length > 0 && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
          <p className="text-[10px] text-red-400/80 uppercase tracking-wider mb-3">Erros Recentes</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-red-300 font-medium">{FEATURE_LABELS[e.feature]?.label || e.feature}</span>
                  <span className="text-neutral-600 mx-1">·</span>
                  <span className="text-neutral-600">{new Date(e.createdAt).toLocaleString("pt-BR")}</span>
                  {e.error && <p className="text-neutral-700 mt-0.5 truncate max-w-md">{e.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-[10px] text-neutral-600">
        <p className="font-semibold text-neutral-500 mb-1">Sobre o Groq Free Tier</p>
        <p>Llama 3.3 70B: 14.400 req/dia · ~500K tokens/dia · Latência ~200-500ms</p>
        <p className="mt-1">Cada resposta do bot usa ~200-400 tokens. Com 14.400 req/dia, dá pra ~7.200 conversas/dia.</p>
      </div>
    </div>
  )
}
