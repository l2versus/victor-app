"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Dumbbell,
  Zap,
  Crown,
  Rocket,
  Check,
  X,
  ChevronDown,
  Loader2,
  Sparkles,
  Brain,
  Camera,
  MessageCircle,
  Users,
  Music,
  ShoppingBag,
  BarChart3,
  Shield,
  HelpCircle,
} from "lucide-react"

// ═══════════════════════════════════════
// B2C Pricing Data (static — matches seed)
// ═══════════════════════════════════════

type Interval = "MONTHLY" | "QUARTERLY" | "ANNUAL"

interface PlanTier {
  name: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgGlow: string
  popular?: boolean
  prices: Record<Interval, { slug: string; price: number }>
  features: string[]
  cta: string
  isFree?: boolean
}

const INTERVALS: { key: Interval; label: string; discount: string | null }[] = [
  { key: "MONTHLY", label: "Mensal", discount: null },
  { key: "QUARTERLY", label: "Trimestral", discount: "-15%" },
  { key: "ANNUAL", label: "Anual", discount: "-40%" },
]

const TIERS: PlanTier[] = [
  {
    name: "Free",
    icon: <Dumbbell className="h-6 w-6" />,
    color: "text-neutral-400",
    borderColor: "border-neutral-700",
    bgGlow: "",
    isFree: true,
    prices: {
      MONTHLY: { slug: "b2c-free-trial", price: 0 },
      QUARTERLY: { slug: "b2c-free-trial", price: 0 },
      ANNUAL: { slug: "b2c-free-trial", price: 0 },
    },
    features: [
      "3 treinos basicos",
      "Historico de 7 dias",
      "Comunidade (somente leitura)",
      "3 dias de acesso completo",
    ],
    cta: "Comecar Gratis",
  },
  {
    name: "Premium",
    icon: <Zap className="h-6 w-6" />,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgGlow: "hover:shadow-blue-500/10",
    prices: {
      MONTHLY: { slug: "b2c-premium-monthly", price: 19.90 },
      QUARTERLY: { slug: "b2c-premium-quarterly", price: 50.92 },
      ANNUAL: { slug: "b2c-premium-annual", price: 143.28 },
    },
    features: [
      "Treinos ilimitados",
      "Comunidade completa",
      "Integracao Spotify",
      "Acesso ao marketplace",
      "Historico completo",
    ],
    cta: "Assinar Premium",
  },
  {
    name: "Pro",
    icon: <Crown className="h-6 w-6" />,
    color: "text-red-500",
    borderColor: "border-red-500/40",
    bgGlow: "hover:shadow-red-500/10",
    popular: true,
    prices: {
      MONTHLY: { slug: "b2c-pro-monthly", price: 34.90 },
      QUARTERLY: { slug: "b2c-pro-quarterly", price: 89.00 },
      ANNUAL: { slug: "b2c-pro-annual", price: 251.28 },
    },
    features: [
      "Tudo do Premium",
      "Chat IA ilimitado",
      "Gerador de treinos IA",
      "Body Scan",
      "Suporte prioritario",
    ],
    cta: "Assinar Pro",
  },
  {
    name: "Full",
    icon: <Rocket className="h-6 w-6" />,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgGlow: "hover:shadow-amber-500/10",
    prices: {
      MONTHLY: { slug: "b2c-full-monthly", price: 59.90 },
      QUARTERLY: { slug: "b2c-full-quarterly", price: 152.75 },
      ANNUAL: { slug: "b2c-full-annual", price: 431.28 },
    },
    features: [
      "Tudo do Pro",
      "Camera Postural IA",
      "Nutricao IA",
      "Bot WhatsApp",
      "Acesso antecipado a novidades",
    ],
    cta: "Assinar Full",
  },
]

// Feature comparison table rows
const COMPARISON_FEATURES: {
  label: string
  icon: React.ReactNode
  free: boolean | string
  premium: boolean | string
  pro: boolean | string
  full: boolean | string
}[] = [
  {
    label: "Treinos",
    icon: <Dumbbell className="h-4 w-4" />,
    free: "3 basicos",
    premium: "Ilimitados",
    pro: "Ilimitados",
    full: "Ilimitados",
  },
  {
    label: "Historico",
    icon: <BarChart3 className="h-4 w-4" />,
    free: "7 dias",
    premium: "Completo",
    pro: "Completo",
    full: "Completo",
  },
  {
    label: "Comunidade",
    icon: <Users className="h-4 w-4" />,
    free: "Leitura",
    premium: true,
    pro: true,
    full: true,
  },
  {
    label: "Spotify",
    icon: <Music className="h-4 w-4" />,
    free: false,
    premium: true,
    pro: true,
    full: true,
  },
  {
    label: "Marketplace",
    icon: <ShoppingBag className="h-4 w-4" />,
    free: false,
    premium: true,
    pro: true,
    full: true,
  },
  {
    label: "Chat IA",
    icon: <Brain className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: true,
    full: true,
  },
  {
    label: "Gerador de Treinos IA",
    icon: <Sparkles className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: true,
    full: true,
  },
  {
    label: "Body Scan",
    icon: <BarChart3 className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: true,
    full: true,
  },
  {
    label: "Suporte Prioritario",
    icon: <Shield className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: true,
    full: true,
  },
  {
    label: "Camera Postural IA",
    icon: <Camera className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: false,
    full: true,
  },
  {
    label: "Nutricao IA",
    icon: <Sparkles className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: false,
    full: true,
  },
  {
    label: "Bot WhatsApp",
    icon: <MessageCircle className="h-4 w-4" />,
    free: false,
    premium: false,
    pro: false,
    full: true,
  },
]

// FAQ items
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Preciso de cartao de credito para o trial?",
    a: "Nao! O trial de 3 dias e 100% gratuito, sem nenhum dado de pagamento. Basta criar sua conta com nome, email e senha.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, voce pode cancelar sua assinatura a qualquer momento direto pelo app. Sem multas, sem burocracia.",
  },
  {
    q: "O que acontece quando o trial acaba?",
    a: "Apos 3 dias, voce mantem acesso limitado (3 treinos basicos e historico de 7 dias). Para continuar com acesso completo, escolha um plano pago.",
  },
  {
    q: "Quais formas de pagamento sao aceitas?",
    a: "Aceitamos Pix, cartao de credito, debito e boleto via Mercado Pago. O Pix e o mais rapido — aprovacao instantanea.",
  },
  {
    q: "Consigo mudar de plano depois?",
    a: "Sim! Voce pode fazer upgrade ou downgrade a qualquer momento. A diferenca de valor e ajustada proporcionalmente.",
  },
  {
    q: "O app funciona offline?",
    a: "O Victor App e um PWA (Progressive Web App). Voce pode instalar no celular e acessar seus treinos mesmo sem internet.",
  },
]

function formatPrice(price: number): string {
  if (price === 0) return "Gratis"
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function monthlyEquivalent(price: number, interval: Interval): string {
  if (price === 0) return ""
  const months = interval === "QUARTERLY" ? 3 : interval === "ANNUAL" ? 12 : 1
  const monthly = price / months
  return `${monthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mes`
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export function PricingClient() {
  const router = useRouter()
  const [interval, setInterval] = useState<Interval>("MONTHLY")
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [showTrialForm, setShowTrialForm] = useState(false)
  const [trialForm, setTrialForm] = useState({ name: "", email: "", password: "" })
  const [trialError, setTrialError] = useState("")
  const [trialLoading, setTrialLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "", phone: "" })
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)

  const handleCheckout = useCallback(
    async (slug: string) => {
      // Free plan -> show trial form
      if (slug === "b2c-free-trial") {
        setShowTrialForm(true)
        return
      }

      // Paid plan -> show checkout form or proceed
      setCheckoutPlan(slug)
    },
    [],
  )

  const submitCheckout = useCallback(async () => {
    if (!checkoutPlan) return
    if (!checkoutForm.name || !checkoutForm.email) return

    setLoadingSlug(checkoutPlan)
    try {
      const res = await fetch("/api/b2c/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: checkoutPlan,
          buyerName: checkoutForm.name,
          buyerEmail: checkoutForm.email,
          buyerPhone: checkoutForm.phone || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao criar checkout")
        return
      }

      // Redirect to Mercado Pago
      const url = data.checkoutUrl || data.sandboxUrl
      if (url) {
        window.location.href = url
      }
    } catch {
      alert("Erro de conexao. Tente novamente.")
    } finally {
      setLoadingSlug(null)
    }
  }, [checkoutPlan, checkoutForm])

  const submitTrial = useCallback(async () => {
    setTrialError("")
    if (!trialForm.name || !trialForm.email || !trialForm.password) {
      setTrialError("Preencha todos os campos")
      return
    }
    if (trialForm.password.length < 6) {
      setTrialError("Senha deve ter no minimo 6 caracteres")
      return
    }

    setTrialLoading(true)
    try {
      const res = await fetch("/api/b2c/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trialForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setTrialError(data.error || "Erro ao criar conta")
        return
      }

      if (data.redirect) {
        router.push(data.redirect)
      }
    } catch {
      setTrialError("Erro de conexao. Tente novamente.")
    } finally {
      setTrialLoading(false)
    }
  }, [trialForm, router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <a
              href="/login"
              className="mb-8 inline-block text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Ja tem conta? Fazer login &rarr;
            </a>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Treine com{" "}
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                inteligencia
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
              Treinos personalizados com IA, camera postural, nutricao e comunidade.
              Comece gratis por 3 dias.
            </p>
          </div>

          {/* Interval selector */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 p-1 backdrop-blur-sm">
              {INTERVALS.map((intv) => (
                <button
                  key={intv.key}
                  onClick={() => setInterval(intv.key)}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-all",
                    interval === intv.key
                      ? "bg-red-600 text-white shadow-lg shadow-red-500/25"
                      : "text-neutral-400 hover:text-white",
                  )}
                >
                  {intv.label}
                  {intv.discount && (
                    <span
                      className={cn(
                        "ml-1.5 text-xs font-semibold",
                        interval === intv.key ? "text-red-200" : "text-green-400",
                      )}
                    >
                      {intv.discount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const priceData = tier.prices[interval]
            const isLoading = loadingSlug === priceData.slug

            return (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:shadow-2xl",
                  tier.borderColor,
                  tier.bgGlow,
                  tier.popular && "ring-2 ring-red-500/50 scale-[1.02] lg:scale-105",
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-red-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/30">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className={cn("rounded-lg bg-neutral-800 p-2", tier.color)}>
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>

                <div className="mb-6">
                  {tier.isFree ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">Gratis</span>
                      <span className="text-sm text-neutral-500">/ 3 dias</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {formatPrice(priceData.price)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          /{" "}
                          {interval === "MONTHLY"
                            ? "mes"
                            : interval === "QUARTERLY"
                              ? "trimestre"
                              : "ano"}
                        </span>
                      </div>
                      {interval !== "MONTHLY" && (
                        <p className="mt-1 text-xs text-neutral-500">
                          equivale a {monthlyEquivalent(priceData.price, interval)}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-neutral-300">
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", tier.color)} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(priceData.slug)}
                  disabled={isLoading}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                    tier.popular || tier.name === "Full"
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20"
                      : tier.isFree
                        ? "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
                        : "bg-neutral-800 text-white hover:bg-neutral-700",
                    isLoading && "opacity-70 cursor-not-allowed",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Checkout Modal */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckoutPlan(null)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl overscroll-contain max-h-[85dvh] overflow-y-auto">
            <h2 className="mb-1 text-xl font-bold">Finalizar Assinatura</h2>
            <p className="mb-6 text-sm text-neutral-400">
              Preencha seus dados para prosseguir ao pagamento seguro.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={checkoutForm.name}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  value={checkoutForm.email}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Telefone{" "}
                  <span className="text-neutral-600">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="(85) 99999-9999"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCheckoutPlan(null)}
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 py-3 text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitCheckout}
                disabled={
                  !checkoutForm.name ||
                  !checkoutForm.email ||
                  loadingSlug === checkoutPlan
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                {loadingSlug === checkoutPlan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Pagar com Mercado Pago
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-neutral-600">
              Pagamento seguro via Mercado Pago. Seus dados estao protegidos.
            </p>
          </div>
        </div>
      )}

      {/* Trial Modal */}
      {showTrialForm && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTrialForm(false)
              setTrialError("")
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl overscroll-contain max-h-[85dvh] overflow-y-auto">
            <h2 className="mb-1 text-xl font-bold">Comecar Trial Gratis</h2>
            <p className="mb-6 text-sm text-neutral-400">
              3 dias de acesso completo. Sem cartao de credito.
            </p>

            {trialError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {trialError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Nome
                </label>
                <input
                  type="text"
                  value={trialForm.name}
                  onChange={(e) =>
                    setTrialForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  value={trialForm.email}
                  onChange={(e) =>
                    setTrialForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Senha
                </label>
                <input
                  type="password"
                  value={trialForm.password}
                  onChange={(e) =>
                    setTrialForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Minimo 6 caracteres"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowTrialForm(false)
                  setTrialError("")
                }}
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 py-3 text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitTrial}
                disabled={trialLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                {trialLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Criar Conta Gratis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
          Compare os planos
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                <th className="px-4 py-4 text-left text-sm font-medium text-neutral-400">
                  Recurso
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-neutral-400">
                  Free
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-blue-400">
                  Premium
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-red-500">
                  Pro
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-amber-400">
                  Full
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feat, i) => (
                <tr
                  key={feat.label}
                  className={cn(
                    "border-b border-neutral-800/50",
                    i % 2 === 0 ? "bg-neutral-900/30" : "",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <span className="text-neutral-500">{feat.icon}</span>
                      {feat.label}
                    </div>
                  </td>
                  {(["free", "premium", "pro", "full"] as const).map((tier) => {
                    const val = feat[tier]
                    return (
                      <td key={tier} className="px-4 py-3 text-center">
                        {val === true ? (
                          <Check className="mx-auto h-5 w-5 text-green-500" />
                        ) : val === false ? (
                          <X className="mx-auto h-5 w-5 text-neutral-700" />
                        ) : (
                          <span className="text-sm text-neutral-400">{val}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-neutral-500" />
          <h2 className="text-2xl font-bold sm:text-3xl">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-neutral-200 pr-4">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-neutral-500 transition-transform",
                    expandedFaq === i && "rotate-180",
                  )}
                />
              </button>
              {expandedFaq === i && (
                <div className="border-t border-neutral-800 px-5 py-4">
                  <p className="text-sm leading-relaxed text-neutral-400">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-neutral-800 bg-neutral-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Pronto para transformar seus treinos?
          </h2>
          <p className="mt-3 text-neutral-400">
            Comece gratis hoje. Sem compromisso.
          </p>
          <button
            onClick={() => setShowTrialForm(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
          >
            <Rocket className="h-4 w-4" />
            Comecar Gratis — 3 Dias
          </button>
        </div>
      </section>
    </div>
  )
}
