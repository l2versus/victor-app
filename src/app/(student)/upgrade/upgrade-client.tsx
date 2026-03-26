"use client"

import { useState } from "react"
import {
  Crown, Check, X, Camera, Sparkles, MessageCircle, Salad,
  Dumbbell, ArrowRight, Shield, Zap, Eye, Activity,
  Phone, ChevronDown, Lock, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND, whatsappLink } from "@/lib/branding"
import Link from "next/link"

type Duration = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL"

const durations: { key: Duration; label: string; short: string; discount: number; months: number }[] = [
  { key: "MONTHLY", label: "Mensal", short: "mês", discount: 0, months: 1 },
  { key: "QUARTERLY", label: "Trimestral", short: "tri", discount: 15, months: 3 },
  { key: "SEMIANNUAL", label: "Semestral", short: "sem", discount: 25, months: 6 },
  { key: "ANNUAL", label: "Anual", short: "ano", discount: 40, months: 12 },
]

const tiers = [
  {
    name: "Essencial",
    tier: 0,
    monthly: 199.90,
    features: [
      { key: "treino", label: "Treino 100% personalizado", included: true },
      { key: "app", label: "App com timer e registro", included: true },
      { key: "historico", label: "Histórico de evolução", included: true },
      { key: "sessoes", label: "3 treinos por semana", included: true },
      { key: "hasAI", label: "Assistente virtual pós-treino", included: false },
      { key: "hasPostureCamera", label: "Correção de postura por IA", included: false },
      { key: "hasVipGroup", label: "Rede Social Ironberg", included: false },
      { key: "hasNutrition", label: "Orientação nutricional", included: false },
    ],
  },
  {
    name: "Pro",
    tier: 1,
    monthly: 299.90,
    features: [
      { key: "tudo_essencial", label: "Tudo do Essencial", included: true },
      { key: "ilimitado", label: "Treinos ilimitados", included: true },
      { key: "hasAI", label: "Assistente virtual pós-treino", included: true },
      { key: "tech", label: `${BRAND.trainerFirstName} + tecnologia no treino`, included: true },
      { key: "analise", label: "Análise inteligente da ficha", included: true },
      { key: "suporte", label: "Suporte prioritário", included: true },
      { key: "hasPostureCamera", label: "Correção de postura por IA", included: false },
      { key: "hasNutrition", label: "Orientação nutricional", included: false },
    ],
  },
  {
    name: "Elite",
    tier: 2,
    monthly: 499.90,
    features: [
      { key: "tudo_pro", label: "Tudo do Pro", included: true },
      { key: "hasPostureCamera", label: "Correção postura por câmera IA", included: true },
      { key: "hasVipGroup", label: "Rede Social Ironberg", included: true },
      { key: "hasNutrition", label: "Orientação nutricional", included: true },
      { key: "whatsapp", label: `WhatsApp direto com ${BRAND.trainerFirstName}`, included: true },
      { key: "prioridade", label: "Prioridade total", included: true },
      { key: "dieta", label: "Bonus: planilha de dieta", included: true },
    ],
  },
]

function getPrice(monthly: number, d: Duration) {
  const dur = durations.find(x => x.key === d)!
  const m = monthly * (1 - dur.discount / 100)
  return { monthly: m, total: m * dur.months, savings: (monthly * dur.months) - (m * dur.months), perDay: m / 30 }
}

function getTierIndex(planName: string | null): number {
  if (!planName) return -1
  const lower = planName.toLowerCase()
  if (lower.includes("elite")) return 2
  if (lower.includes("pro")) return 1
  if (lower.includes("essencial")) return 0
  return -1
}

interface UpgradeClientProps {
  currentPlan: string | null
  currentFeatures: {
    hasAI: boolean
    hasPostureCamera: boolean
    hasVipGroup: boolean
    hasNutrition: boolean
  }
}

export function UpgradeClient({ currentPlan, currentFeatures }: UpgradeClientProps) {
  const [duration, setDuration] = useState<Duration>("SEMIANNUAL")
  const [showPostureDetail, setShowPostureDetail] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const currentTier = getTierIndex(currentPlan)

  async function handleCheckout(tierName: string) {
    setCheckoutLoading(tierName)
    try {
      const slug = `${tierName.toLowerCase()}-${duration.toLowerCase()}`
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.sandboxUrl) {
        window.location.href = data.sandboxUrl
      } else {
        // Fallback to WhatsApp if checkout fails
        const price = getPrice(tiers.find(t => t.name === tierName)!.monthly, duration)
        const msg = `Ola ${BRAND.trainerFirstName}! Quero assinar o plano ${tierName} ${durations.find(d => d.key === duration)!.label} por R$ ${price.monthly.toFixed(2)}/mes`
        window.open(whatsappLink(msg), "_blank")
      }
    } catch {
      // Fallback to WhatsApp on error
      window.open(whatsappLink(`Quero assinar o plano ${tierName}`), "_blank")
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          Planos
        </h1>
        <p className="text-neutral-500 text-xs mt-1">
          {currentPlan
            ? <>Seu plano atual: <span className="text-amber-400 font-semibold">{currentPlan}</span></>
            : "Voce ainda nao tem um plano ativo"
          }
        </p>
      </div>

      {/* ═══ POSTURE HIGHLIGHT — The differentiator ═══ */}
      {!currentFeatures.hasPostureCamera && (
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/[0.08] to-blue-900/[0.03] overflow-hidden">
          <button
            onClick={() => setShowPostureDetail(!showPostureDetail)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white">Correção de Postura por IA</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold uppercase tracking-wider">
                    Exclusivo
                  </span>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  O diferencial que nenhum outro personal oferece. Seu celular vira um personal 24h.
                </p>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-neutral-500 shrink-0 mt-1 transition-transform duration-300",
                showPostureDetail && "rotate-180"
              )} />
            </div>
          </button>

          {showPostureDetail && (
            <div className="px-4 pb-4 space-y-3">
              <div className="h-px bg-blue-500/10" />

              <div className="space-y-2.5">
                {[
                  { icon: Eye, text: "Análise corporal com IA em tempo real", color: "text-blue-400" },
                  { icon: Activity, text: "194 exercícios com correção biomecânica", color: "text-blue-400" },
                  { icon: Zap, text: "Feedback visual instantâneo — verde, amarelo, vermelho", color: "text-emerald-400" },
                  { icon: Shield, text: "Prevenção de lesões baseada em fisiologia do exercício", color: "text-amber-400" },
                  { icon: Camera, text: "100% offline — nenhuma imagem sai do seu celular", color: "text-purple-400" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                    </div>
                    <span className="text-neutral-300 text-xs leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-blue-600/[0.06] border border-blue-500/10 p-3">
                <p className="text-blue-200 text-xs leading-relaxed">
                  <strong>Como funciona:</strong> A câmera do celular detecta seus movimentos em tempo real.
                  O sistema compara os ângulos das articulações com o padrão correto de cada exercício e
                  dá feedback visual instantâneo: &quot;Desça mais o quadril&quot;, &quot;Cotovelos mais próximos&quot;.
                  É como ter o {BRAND.trainerFirstName} do seu lado em cada repetição.
                </p>
              </div>

              <p className="text-center text-[10px] text-blue-400/60 font-medium">
                Disponível nos planos Elite
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ DURATION SELECTOR ═══ */}
      <div>
        <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">Periodo</p>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          {durations.map(d => (
            <button
              key={d.key}
              onClick={() => setDuration(d.key)}
              className={cn(
                "relative py-2 rounded-lg text-[11px] font-semibold transition-all duration-300",
                duration === d.key
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "text-neutral-500 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {d.short}
              {d.discount > 0 && (
                <span className={cn(
                  "absolute -top-2 -right-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full",
                  duration === d.key
                    ? "bg-white text-red-600"
                    : "bg-emerald-500/15 text-emerald-400"
                )}>
                  -{d.discount}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PLAN CARDS ═══ */}
      <div className="space-y-3">
        {tiers.map((tier) => {
          const p = getPrice(tier.monthly, duration)
          const isCurrent = tier.tier === currentTier
          const isUpgrade = tier.tier > currentTier
          const isDowngrade = tier.tier < currentTier
          const isPro = tier.name === "Pro"
          const isElite = tier.name === "Elite"

          const whatsappMsg = `Ola ${BRAND.trainerFirstName}! Quero fazer upgrade para o plano ${tier.name} ${durations.find(d => d.key === duration)?.label} por R$ ${p.monthly.toFixed(2)}/mes`

          return (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-500 relative overflow-hidden",
                isCurrent
                  ? "border-emerald-500/25 bg-emerald-600/[0.04]"
                  : isElite
                  ? "border-amber-500/20 bg-gradient-to-br from-amber-600/[0.06] to-amber-900/[0.02]"
                  : isPro
                  ? "border-red-500/20 bg-gradient-to-br from-red-600/[0.06] to-red-900/[0.02]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute top-3 right-3 text-[9px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                  Seu plano
                </div>
              )}

              {/* Recommended badge */}
              {isPro && !isCurrent && isUpgrade && (
                <div className="absolute top-3 right-3 text-[9px] px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Recomendado
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn(
                  "text-base font-bold",
                  isElite ? "text-amber-300" : isPro ? "text-red-300" : "text-white"
                )}>
                  {tier.name}
                </h3>
                {isElite && <Crown className="w-4 h-4 text-amber-400" />}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-1">
                {duration !== "MONTHLY" && (
                  <span className="text-neutral-700 text-xs line-through mr-1">R$ {tier.monthly.toFixed(2)}</span>
                )}
                <span className="text-2xl font-black text-white">R$ {p.monthly.toFixed(2).split(".")[0]}</span>
                <span className="text-sm text-neutral-500">,{p.monthly.toFixed(2).split(".")[1]}/mes</span>
              </div>
              {duration !== "MONTHLY" && (
                <p className="text-emerald-400 text-[11px] font-semibold mb-3">
                  Economia de R$ {p.savings.toFixed(2)}
                </p>
              )}
              {duration === "MONTHLY" && <div className="mb-3" />}

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                {tier.features.map(f => {
                  const isPosture = f.key === "hasPostureCamera"
                  return (
                    <div key={f.key} className={cn(
                      "flex items-center gap-2",
                      !f.included && "opacity-40"
                    )}>
                      {f.included ? (
                        <Check className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isPosture ? "text-blue-400" : isElite ? "text-amber-400" : isPro ? "text-red-400" : "text-emerald-400"
                        )} />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                      )}
                      <span className={cn(
                        "text-xs",
                        f.included ? (isPosture ? "text-blue-300 font-medium" : "text-neutral-300") : "text-neutral-600 line-through"
                      )}>
                        {f.label}
                      </span>
                      {isPosture && f.included && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-bold uppercase tracking-wider">
                          IA
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center py-2 text-neutral-500 text-xs">
                  Voce esta neste plano
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleCheckout(tier.name)}
                  disabled={checkoutLoading === tier.name}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-60",
                    isElite
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500"
                      : isPro
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500"
                      : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                  )}
                >
                  {checkoutLoading === tier.name ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  {checkoutLoading === tier.name ? "Abrindo pagamento..." : `Fazer upgrade para ${tier.name}`}
                </button>
              ) : isDowngrade ? (
                <div className="text-center py-2 text-neutral-600 text-[10px]">
                  Plano abaixo do seu atual
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(tier.name)}
                  disabled={checkoutLoading === tier.name}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] text-white text-xs font-bold hover:bg-white/[0.1] transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  {checkoutLoading === tier.name ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {checkoutLoading === tier.name ? "Abrindo pagamento..." : `Assinar ${tier.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ═══ WHY POSTURE MATTERS — Extra sell ═══ */}
      {!currentFeatures.hasPostureCamera && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            Por que a Correção de Postura vale a pena?
          </h3>
          <div className="space-y-2">
            {[
              "Previne lesões que podem te afastar do treino por meses",
              "Maximiza a ativação muscular — mais resultado com o mesmo esforço",
              "Corrige vícios de postura que você nem sabe que tem",
              "Funciona offline — sua privacidade 100% protegida",
              `É como ter o ${BRAND.trainerFirstName} do seu lado em cada repetição, 24 horas`,
            ].map((text) => (
              <div key={text} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-neutral-400 text-xs leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guarantee */}
      <div className="rounded-xl border border-emerald-500/10 bg-emerald-600/[0.03] p-3 flex items-center gap-3">
        <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
        <div>
          <p className="text-white text-xs font-semibold">Garantia de 7 dias</p>
          <p className="text-neutral-500 text-[10px] leading-relaxed">
            Nao curtiu? Devolucao de 100% sem perguntas.
          </p>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={whatsappLink(`Ola ${BRAND.trainerFirstName}! Quero saber mais sobre os planos`)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-neutral-400 text-xs font-medium hover:bg-white/[0.04] hover:text-white transition-all"
      >
        <Phone className="w-3.5 h-3.5" />
        Duvidas? Fale com {BRAND.trainerFirstName} no WhatsApp
      </a>
    </div>
  )
}
