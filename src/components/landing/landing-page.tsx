"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Dumbbell, Sparkles, Camera, Users,
  Star, Shield, Zap, Target, TrendingUp,
  CheckCircle2, ArrowRight, Play, Heart, Brain,
  Crown, MessageCircle, Phone, Instagram, Mail,
  X, ChevronRight, Menu, XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TextEffect } from "@/components/ui/text-effect"
import { PremiumTestimonials } from "@/components/ui/premium-testimonials"
import { TypingEffect } from "@/components/ui/typing-effect"
import { GradientDots } from "@/components/ui/gradient-dots"
import { CardSpotlight } from "@/components/ui/card-spotlight"
import { ChatWidget } from "@/components/landing/chat-widget"

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, className, delay = 0, direction = "up" }: {
  children: React.ReactNode; className?: string; delay?: number; direction?: "up" | "left" | "right" | "scale"
}) {
  const { ref, visible } = useReveal()
  const transforms = {
    up: visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
    left: visible ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0",
    right: visible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0",
    scale: visible ? "scale-100 opacity-100" : "scale-90 opacity-0",
  }
  return (
    <div ref={ref} className={cn("transition-all duration-[1200ms] ease-out", transforms[direction], className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useReveal()
  useEffect(() => {
    if (!visible) return
    const start = Date.now()
    let rafId: number
    const tick = () => {
      const p = Math.min((Date.now() - start) / 2000, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value))
      if (p < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [visible, value])
  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{count}{suffix}</span>
}

/* ═══════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════ */
type Duration = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL"

const durations: { key: Duration; label: string; discount: number; months: number }[] = [
  { key: "MONTHLY", label: "Mensal", discount: 0, months: 1 },
  { key: "QUARTERLY", label: "Trimestral", discount: 15, months: 3 },
  { key: "SEMIANNUAL", label: "Semestral", discount: 25, months: 6 },
  { key: "ANNUAL", label: "Anual", discount: 40, months: 12 },
]

const tiers = [
  {
    name: "Essencial", tag: null, monthly: 199.90,
    features: [
      { t: "Treino 100% personalizado", ok: true },
      { t: "App com timer e registro", ok: true },
      { t: "Histórico de evolução", ok: true },
      { t: "3 treinos por semana", ok: true },
      { t: "Assistente virtual pós-treino", ok: false },
      { t: "Correção de postura", ok: false },
      { t: "Grupo VIP", ok: false },
    ],
    cta: "Começar agora",
  },
  {
    name: "Pro", tag: "Mais escolhido", monthly: 299.90,
    features: [
      { t: "Tudo do Essencial", ok: true },
      { t: "Treinos ilimitados", ok: true },
      { t: "Assistente virtual pós-treino", ok: true },
      { t: "Victor + tecnologia no seu treino", ok: true },
      { t: "Análise inteligente da sua ficha", ok: true },
      { t: "Suporte prioritário", ok: true },
      { t: "Correção de postura", ok: false },
    ],
    cta: "Quero o Pro",
  },
  {
    name: "Elite", tag: "Experiência total", monthly: 499.90,
    features: [
      { t: "Tudo do Pro", ok: true },
      { t: "Correção postura por câmera", ok: true },
      { t: "Grupo VIP exclusivo", ok: true },
      { t: "Orientação nutricional", ok: true },
      { t: "WhatsApp direto com Victor", ok: true },
      { t: "Prioridade total", ok: true },
      { t: "Bônus: planilha de dieta", ok: true },
    ],
    cta: "Quero ser Elite",
  },
]

function getPrice(m: number, d: Duration) {
  const dur = durations.find(x => x.key === d)!
  const monthly = m * (1 - dur.discount / 100)
  return { monthly, total: monthly * dur.months, savings: (m * dur.months) - (monthly * dur.months), perDay: monthly / 30 }
}

/* ═══════════════════════════════════════════
   PHOTO PLACEHOLDER (silhouette composition)
   ═══════════════════════════════════════════ */
function TrainerPhoto({ className, hero = false }: { className?: string; hero?: boolean }) {
  return (
    <div className={cn("relative rounded-3xl overflow-hidden", className)}>
      {/* Photo */}
      <Image
        src="/img/victor-profile.png"
        alt="Victor Oliveira — Personal Trainer"
        width={500}
        height={625}
        className={cn("w-full h-full object-cover object-top", hero && "scale-110")}
        priority={hero}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/40 to-transparent" />
      {/* Red accent glow behind */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-red-600/10 blur-[80px] rounded-full" />
      {/* Bottom info */}
      {!hero && (
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-white font-bold text-lg">Victor Oliveira</p>
          <p className="text-red-400 text-xs font-medium tracking-wider uppercase">CREF 016254-G/CE</p>
        </div>
      )}
    </div>
  )
}

function Logo({ size = 44, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div className={cn("relative shrink-0", glow && "drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]")}>
      <Image
        src="/img/logo-icon-sm.png"
        alt="VO Personal"
        width={size}
        height={size}
        className={cn("rounded-xl relative z-10", glow && "ring-1 ring-red-500/20")}
      />
      {glow && (
        <>
          <div className="absolute inset-0 bg-red-600/25 blur-xl rounded-full scale-150 -z-0" />
          <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full scale-[2] -z-0 animate-pulse" />
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   LEAD CAPTURE FORM — captura visitantes que não compraram
   ═══════════════════════════════════════════ */
function LeadCaptureForm() {
  const [form, setForm] = useState({ name: "", phone: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setLoading(true)
    try {
      await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          source: "WEBSITE",
          temperature: "WARM",
          notes: "Formulário 'Quero experimentar' na landing page",
          tags: ["landing_page", "experimental"],
        }),
      })
      setSent(true)
    } catch { /* silent */ }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="mt-8 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 max-w-md mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-400 font-semibold text-sm">Recebemos seu contato!</p>
        <p className="text-neutral-500 text-xs mt-1">Victor vai te chamar no WhatsApp em breve.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 max-w-md mx-auto">
      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="text-neutral-400 text-xs mb-1 uppercase tracking-widest font-semibold">Sem compromisso</p>
        <p className="text-white text-base font-bold mb-4">Quero experimentar uma aula grátis</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Seu nome"
            required
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
          />
          <input
            type="tel"
            placeholder="Seu WhatsApp (DDD + número)"
            required
            value={form.phone}
            onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Victor vai me chamar no WhatsApp"}
          </button>
        </form>
        <p className="text-neutral-700 text-[10px] mt-3 text-center">Resposta em até 2 horas · Sem spam</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
function PlanModal({ tier, duration, onClose }: { tier: typeof tiers[0]; duration: Duration; onClose: () => void }) {
  const p = getPrice(tier.monthly, duration)
  const isPro = tier.name === "Pro"
  const isElite = tier.name === "Elite"
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "", phone: "" })
  const didCheckoutRef = useRef(false)

  // Abandono de checkout — captura lead HOT se preencheu dados mas não completou
  useEffect(() => {
    return () => {
      if (didCheckoutRef.current) return // completou checkout, não é abandono
      const { name, email, phone } = checkoutForm
      if (!name && !phone && !email) return // não preencheu nada

      // Fire-and-forget: captura como lead HOT
      fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `Abandono ${email || phone || "checkout"}`,
          phone: phone || undefined,
          email: email || undefined,
          source: "WEBSITE",
          temperature: "HOT",
          value: p.monthly,
          notes: `Abandono checkout: plano ${tier.name} ${duration} — R$ ${p.monthly.toFixed(2)}/mês`,
          tags: ["abandono_checkout", tier.name.toLowerCase()],
          planInterest: `${tier.name} ${duration}`,
        }),
      }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!checkoutForm.name || !checkoutForm.email) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: `${tier.name.toLowerCase()}_${duration.toLowerCase()}`,
          buyerName: checkoutForm.name,
          buyerEmail: checkoutForm.email,
          buyerPhone: checkoutForm.phone || undefined,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        didCheckoutRef.current = true
        window.location.href = data.checkoutUrl
      } else if (data.sandboxUrl) {
        didCheckoutRef.current = true
        window.location.href = data.sandboxUrl
      } else {
        const detail = data.detail || data.error || "Erro desconhecido"
        console.error("Checkout failed:", data)
        alert(`Erro ao gerar link de pagamento: ${detail}\n\nTente novamente ou fale com Victor no WhatsApp.`)
      }
    } catch {
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow top */}
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 rounded-b-full blur-sm",
          isPro ? "bg-red-500" : isElite ? "bg-amber-500" : "bg-white/20"
        )} />
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 rounded-full blur-3xl -translate-y-1/2",
          isPro ? "bg-red-600/20" : isElite ? "bg-amber-600/20" : "bg-white/5"
        )} />

        <div className="relative p-8">
          <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all">
            <X className="w-4 h-4" />
          </button>

          <p className={cn("text-[11px] font-bold uppercase tracking-[0.25em] mb-2", isPro ? "text-red-400" : isElite ? "text-amber-400" : "text-neutral-500")}>
            Plano {tier.name}
          </p>

          <div className="flex items-baseline gap-2 mb-2">
            {duration !== "MONTHLY" && <span className="text-neutral-600 text-lg line-through">R$ {tier.monthly.toFixed(2)}</span>}
            <span className="text-5xl font-black text-white">R$ {p.monthly.toFixed(2).split(".")[0]}</span>
            <span className="text-xl text-neutral-500">,{p.monthly.toFixed(2).split(".")[1]}/mês</span>
          </div>

          {duration !== "MONTHLY" && (
            <p className="text-emerald-400 text-sm font-semibold mb-1">Você economiza R$ {p.savings.toFixed(2)}</p>
          )}
          <p className="text-neutral-600 text-xs mb-6">R$ {p.perDay.toFixed(2)} por dia · {durations.find(d => d.key === duration)?.label}</p>

          <div className="space-y-3 mb-6">
            {tier.features.map(f => (
              <div key={f.t} className={cn("flex items-center gap-3", !f.ok && "opacity-25")}>
                {f.ok ? (
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isPro ? "bg-red-600/20" : isElite ? "bg-amber-600/20" : "bg-emerald-600/20")}>
                    <CheckCircle2 className={cn("w-3.5 h-3.5", isPro ? "text-red-400" : isElite ? "text-amber-400" : "text-emerald-400")} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center">
                    <X className="w-3 h-3 text-neutral-600" />
                  </div>
                )}
                <span className={cn("text-sm", f.ok ? "text-neutral-200" : "text-neutral-700 line-through")}>{f.t}</span>
              </div>
            ))}
          </div>

          {/* Checkout form */}
          <form onSubmit={handleCheckout} className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Seu nome completo"
              required
              value={checkoutForm.name}
              onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
            />
            <input
              type="email"
              placeholder="Seu email"
              required
              value={checkoutForm.email}
              onChange={e => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
            />
            <input
              type="tel"
              placeholder="WhatsApp (opcional)"
              value={checkoutForm.phone}
              onChange={e => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
            />

            <button
              type="submit"
              disabled={checkoutLoading}
              className={cn(
                "w-full py-4 rounded-2xl text-sm font-bold text-center transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed",
                isPro ? "bg-red-600 text-white hover:bg-red-500 shadow-xl shadow-red-600/25" :
                isElite ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xl shadow-amber-600/25 hover:from-amber-500 hover:to-orange-500" :
                "bg-white/[0.08] text-white hover:bg-white/[0.12]"
              )}
            >
              {checkoutLoading ? "Gerando link..." : `Pagar R$ ${p.total.toFixed(2)} — ${durations.find(d => d.key === duration)?.label}`}
            </button>
          </form>

          {/* WhatsApp fallback */}
          <a
            href={`https://wa.me/5585996985823?text=${encodeURIComponent(`Olá Victor! Quero assinar o plano ${tier.name} ${durations.find(d => d.key === duration)?.label} por R$ ${p.monthly.toFixed(2)}/mês`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl border border-white/[0.06] text-neutral-400 text-xs font-medium text-center block hover:bg-white/[0.03] hover:text-white transition-all"
          >
            Ou assine presencialmente via WhatsApp
          </a>

          <p className="text-center text-neutral-700 text-[10px] mt-3 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" /> Pagamento seguro via Mercado Pago · Garantia de 7 dias
          </p>
        </div>
      </div>
    </div>
  )
}

type FeatureDetail = { title: string; icon: typeof Brain; desc: string; long: string; color: string } | null

function FeatureModal({ feature, onClose }: { feature: NonNullable<FeatureDetail>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Top glow */}
        <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 rounded-full blur-3xl -translate-y-1/2", feature.color.includes("purple") ? "bg-purple-600/20" : feature.color.includes("blue") ? "bg-blue-600/20" : feature.color.includes("red") ? "bg-red-600/20" : feature.color.includes("emerald") ? "bg-emerald-600/20" : feature.color.includes("amber") ? "bg-amber-600/20" : "bg-cyan-600/20")} />
        <div className="relative p-8">
          <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg", feature.color)}>
            <feature.icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
          <p className="text-neutral-300 text-sm leading-relaxed mb-4">{feature.desc}</p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.long}</p>
          </div>
          <a href="#planos" onClick={onClose} className="mt-6 w-full py-3.5 rounded-xl bg-red-600 text-white text-sm font-bold text-center block hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">
            Ver planos com essa feature
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FAQ with floating 3D logos + premium accordion
   ═══════════════════════════════════════════ */
const faqData = [
  { q: "Preciso ter experiência com treino?", a: "Não! Victor monta o treino de acordo com seu nível — do iniciante ao avançado. A tecnologia adapta tudo conforme seu progresso.", icon: Dumbbell },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem multa, sem burocracia. Mas quando você vir os resultados, não vai querer parar.", icon: Shield },
  { q: "Como funciona a correção de postura?", a: "No plano Elite, a câmera do seu celular analisa seus movimentos em tempo real e te corrige durante o exercício — como ter o Victor do seu lado a cada repetição.", icon: Camera },
  { q: "Tenho lesão/restrição. Posso treinar?", a: "Com certeza. Victor analisa sua ficha médica com apoio de tecnologia inteligente. Todas as restrições são respeitadas na prescrição. Sua segurança é prioridade #1.", icon: Heart },
  { q: "Preciso ir à academia?", a: "Não necessariamente. Victor monta treinos para academia, home workout ou ao ar livre. Você escolhe.", icon: Target },
]

function FloatingLogo({ size, className, delay, variant = 1 }: {
  size: number; className?: string; delay: number; variant?: number
}) {
  return (
    <div
      className={cn("absolute pointer-events-none", className)}
      style={{
        animation: `faq-drift-${variant} ${12 + variant * 3}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <Image src="/img/logo-icon-sm.png" alt="" width={size} height={size}
          className="rounded-2xl drop-shadow-[0_0_20px_rgba(220,38,38,0.2)]"
          style={{ opacity: 0.25 }}
        />
        <div className="absolute inset-0 bg-red-600/15 blur-xl rounded-full scale-150 animate-pulse" />
      </div>
    </div>
  )
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <section className="py-24 sm:py-36 px-5 sm:px-8 relative overflow-hidden">
      {/* Floating logos — desktop: large, mobile: smaller & fewer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Desktop only */}
        <FloatingLogo size={100} delay={0} variant={1} className="left-[2%] top-[10%] hidden sm:block" />
        <FloatingLogo size={80} delay={0.8} variant={3} className="right-[6%] bottom-[12%] hidden sm:block" />
        {/* Mobile: 2 small logos only */}
        <FloatingLogo size={45} delay={0.3} variant={1} className="left-[-3%] top-[5%] sm:left-[10%] sm:bottom-[18%]" />
        <FloatingLogo size={35} delay={1} variant={2} className="right-[-2%] top-[30%] sm:right-[20%] sm:top-[5%]" />
      </div>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/[0.03] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-600/[0.03] blur-[150px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Logo + Title */}
        <Reveal>
          <div className="text-center mb-14">
            <div className="mx-auto mb-6 relative inline-block">
              <Image src="/img/logo-icon-sm.png" alt="VO Personal" width={80} height={80} className="rounded-2xl relative z-10 shadow-2xl shadow-red-600/20" />
              <div className="absolute inset-0 bg-red-600/25 blur-2xl rounded-full scale-[2] -z-0" />
              <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full scale-[3] -z-0 animate-pulse" />
            </div>
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-3">Tire suas dúvidas</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Dúvidas frequentes</h2>
          </div>
        </Reveal>

        {/* Premium Accordion */}
        <div className="space-y-3">
          {faqData.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <Reveal key={i} delay={i * 60}>
                <div className={cn(
                  "group rounded-2xl border backdrop-blur-sm transition-all duration-500",
                  isOpen
                    ? "border-red-500/25 bg-gradient-to-r from-red-600/[0.06] to-red-900/[0.03] shadow-lg shadow-red-600/[0.05]"
                    : "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.025]"
                )}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 text-left cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                      isOpen
                        ? "bg-red-600/20 shadow-lg shadow-red-600/10"
                        : "bg-white/[0.04] group-hover:bg-white/[0.06]"
                    )}>
                      <faq.icon className={cn("w-4.5 h-4.5 transition-colors duration-300", isOpen ? "text-red-400" : "text-neutral-500 group-hover:text-neutral-400")} />
                    </div>

                    <span className={cn(
                      "flex-1 text-[15px] font-semibold transition-colors duration-300",
                      isOpen ? "text-white" : "text-neutral-200 group-hover:text-white"
                    )}>
                      {faq.q}
                    </span>

                    {/* Chevron */}
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                      isOpen ? "bg-red-600/20 rotate-180" : "bg-white/[0.04]"
                    )}>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all duration-500",
                        isOpen ? "text-red-400 rotate-[-90deg]" : "text-neutral-600 rotate-90"
                      )} />
                    </div>
                  </button>

                  {/* Answer panel */}
                  <div
                    className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
                    style={{
                      maxHeight: isOpen ? "200px" : "0px",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-5 sm:px-6 pb-5 pl-[4.25rem] sm:pl-[4.5rem]">
                      <div className="h-px bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent mb-4" />
                      <p className="text-neutral-400 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [duration, setDuration] = useState<Duration>("SEMIANNUAL")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof tiers[0] | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail>(null)

  useEffect(() => {
    let ticking = false
    const h = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-x-hidden relative">
      {/* ═══ GLOBAL AMBIENT BACKGROUND — Animated gradient dots ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <GradientDots duration={35} dotSize={6} spacing={12} />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-700",
        scrollY > 80 ? "bg-[#030303]/95 backdrop-blur-md border-b border-white/[0.04] py-3" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={48} glow />
            <div className="hidden sm:block">
              <p className="font-bold text-[15px] text-white tracking-tight">Victor Oliveira</p>
              <p className="text-[9px] text-red-400/70 uppercase tracking-[0.25em] font-semibold">Personal Trainer</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[13px] font-medium text-neutral-500">
            <a href="#metodo" className="hover:text-white transition-colors duration-300 relative group">
              Método
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#sobre" className="hover:text-white transition-colors duration-300 relative group">
              Sobre
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#resultados" className="hover:text-white transition-colors duration-300 relative group">
              Resultados
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#planos" className="hover:text-white transition-colors duration-300 relative group">
              Planos
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block px-5 py-2.5 rounded-xl text-[13px] font-medium text-neutral-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <a href="#planos" className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-[13px] font-semibold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40">
              Começar
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? "Fechar menu" : "Abrir menu"} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.05] transition-colors">
              {mobileMenu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#030303]/98 backdrop-blur-2xl border-b border-white/[0.04] p-6 space-y-4">
            {["Método", "Sobre", "Resultados", "Planos"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="block text-lg font-medium text-neutral-300 hover:text-white transition-colors">
                {item}
              </a>
            ))}
            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
              <Link href="/login" className="flex-1 py-3 rounded-xl border border-white/[0.08] text-center text-sm text-neutral-300">Entrar</Link>
              <a href="#planos" onClick={() => setMobileMenu(false)} className="flex-1 py-3 rounded-xl bg-red-600 text-center text-sm font-semibold text-white">Começar</a>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO — Cinematic with ambient video ═══ */}
      <section className="relative min-h-screen flex items-center px-5 sm:px-8 pt-24 pb-16">
        {/* ═══ AMBIENT VIDEO BACKGROUND ═══ */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Video — local gym ambient */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/video/hero-bg.mp4" type="video/mp4" />
          </video>

          {/* Heavy cinematic darkening + red glow */}
          <div className="absolute inset-0 bg-[#030303]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/60 via-transparent to-[#030303]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_30%,rgba(220,38,38,0.12),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_30%_50%,rgba(220,38,38,0.06),transparent_60%)]" />

          {/* Ember orbs — slow breathing */}
          <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-red-600/[0.08] blur-[150px]" style={{ transform: `translateY(${scrollY * -0.25}px)`, animation: "admin-orb-float-1 15s ease-in-out infinite" }} />
          <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] rounded-full bg-red-900/[0.06] blur-[120px]" style={{ transform: `translateY(${scrollY * -0.15}px)`, animation: "admin-orb-float-2 20s ease-in-out infinite" }} />

          {/* Cinematic light spill */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[50%] bg-gradient-to-b from-red-500/25 via-red-500/5 to-transparent" />

          {/* Floating particles */}
          <div className="absolute top-[15%] right-[20%] w-1 h-1 rounded-full bg-red-500/40 animate-pulse" />
          <div className="absolute top-[45%] left-[8%] w-1.5 h-1.5 rounded-full bg-red-400/25 animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-[30%] right-[30%] w-1 h-1 rounded-full bg-orange-400/30 animate-pulse" style={{ animationDelay: "2.5s" }} />
          <div className="absolute top-[25%] left-[55%] w-1 h-1 rounded-full bg-white/15 animate-pulse" style={{ animationDelay: "3.5s" }} />

          {/* Deep vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_20%,rgba(3,3,3,0.8)_100%)]" />
          <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-[#030303] to-transparent" />
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#030303]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Copy */}
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/8 border border-red-500/15 text-red-400 text-[11px] font-semibold mb-8 tracking-[0.1em] uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Vagas limitadas — Março 2026
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-6">
                <span className="block">Transforme</span>
                <span className="block">seu corpo</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-400">
                  com ciência.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
                Consultoria fitness com <span className="text-white font-semibold">acompanhamento inteligente</span>,
                treinos 100% individualizados e evolução monitorada em tempo real pelo Victor e sua equipe tecnológica.
                <span className="text-neutral-500 block mt-2 text-sm">
                  Por Victor Oliveira — CREF 016254-G/CE
                </span>
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <a href="#planos" className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 text-white font-bold text-[15px] shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-500 hover:bg-red-500 active:scale-[0.98]">
                  Ver planos a partir de R$ 119,94/mês
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#metodo" className="inline-flex items-center gap-2 px-6 py-4 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                  <div className="w-10 h-10 rounded-full border border-white/[0.1] flex items-center justify-center group-hover:border-white/[0.2]">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  Conhecer o método
                </a>
              </div>
            </Reveal>

            {/* Stats inline */}
            <Reveal delay={500}>
              <div className="mt-14 flex items-center gap-8 sm:gap-12">
                {[
                  { v: 200, s: "+", l: "Alunos" },
                  { v: 5, s: " anos", l: "Experiência" },
                  { v: 98, s: "%", l: "Satisfação" },
                ].map(stat => (
                  <div key={stat.l}>
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={stat.v} suffix={stat.s} />
                    </p>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] mt-0.5">{stat.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right — Photo with parallax */}
          <Reveal delay={400} direction="scale">
            <div className="relative" style={{ transform: `translateY(${scrollY * -0.08}px)` }}>
              <TrainerPhoto className="w-full aspect-[4/5] max-w-md mx-auto lg:ml-auto" hero />
              {/* Floating badge */}
              <div className="absolute -left-4 top-1/3 px-4 py-3 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.06] shadow-2xl animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Tech + Método</p>
                    <p className="text-[10px] text-neutral-500">Treinos sob medida</p>
                  </div>
                </div>
              </div>
              {/* Floating badge 2 */}
              <div className="absolute -right-2 bottom-1/4 px-4 py-3 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.06] shadow-2xl animate-float-slow" style={{ animationDelay: "3s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">CREF Ativo</p>
                    <p className="text-[10px] text-neutral-500">Certificado</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-bounce">
          <div className="w-5 h-9 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-white/60 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR — Marquee ═══ */}
      <section className="py-5 border-y border-white/[0.03] bg-white/[0.01] overflow-hidden">
        <div className="animate-marquee flex items-center gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 text-neutral-600 text-xs font-medium tracking-wider uppercase">
              <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-emerald-500/60" /> CREF Verificado</span>
              <span className="text-red-900/40">◆</span>
              <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-amber-500/60 fill-amber-500/60" /> 4.9/5 Google</span>
              <span className="text-red-900/40">◆</span>
              <span className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-purple-500/60" /> Tecnologia Exclusiva</span>
              <span className="text-red-900/40">◆</span>
              <span className="flex items-center gap-2"><Camera className="w-3.5 h-3.5 text-blue-500/60" /> Correção de Postura</span>
              <span className="text-red-900/40">◆</span>
              <span className="flex items-center gap-2"><Dumbbell className="w-3.5 h-3.5 text-red-500/60" /> 200+ Exercícios</span>
              <span className="text-red-900/40">◆</span>
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-orange-500/60" /> App Exclusivo</span>
              <span className="text-red-900/40">◆</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SOBRE — Trainer section ═══ */}
      <section id="sobre" className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-red-600/[0.04] blur-[150px] -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/[0.03] blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <TrainerPhoto className="w-full aspect-square max-w-lg rounded-3xl" />
          </Reveal>
          <div>
            <Reveal direction="right">
              <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4">Quem é Victor</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-6">
                Seu personal.
                <br />
                <span className="text-neutral-500">Sua tecnologia.</span>
              </h2>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <p className="text-neutral-400 text-base leading-relaxed mb-6">
                Victor Oliveira é especialista em <span className="text-white font-medium">hipertrofia e emagrecimento</span> com
                mais de 5 anos de experiência e centenas de vidas transformadas. Formado em Educação Física, combina
                conhecimento científico com tecnologia de ponta para entregar resultados reais.
              </p>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                Cada aluno recebe um tratamento 100% individualizado — Victor analisa suas restrições médicas,
                prescreve com ciência e usa tecnologia de ponta para corrigir sua postura em tempo real. Sem planilhas genéricas. Sem achismo.
              </p>
            </Reveal>
            <Reveal direction="right" delay={200}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Dumbbell, label: "Especialista em\nhipertrofia", color: "text-red-400 bg-red-600/10 border-red-500/10" },
                  { icon: Brain, label: "Método +\ntecnologia", color: "text-purple-400 bg-purple-600/10 border-purple-500/10" },
                  { icon: Shield, label: "CREF ativo\n016254-G/CE", color: "text-emerald-400 bg-emerald-600/10 border-emerald-500/10" },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-center hover:bg-white/[0.03] transition-all duration-500">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border", item.color)}>
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight whitespace-pre-line">{item.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ MÉTODO ═══ */}
      <section id="metodo" className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/[0.03] to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Reveal>
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">Diferenciais exclusivos</p>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center leading-tight mb-4">
              Não é só treino.
            </h2>
            <p className="text-neutral-500 text-center text-base max-w-lg mx-auto mb-16">
              É um ecossistema completo de tecnologia, ciência e acompanhamento humano.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Brain, title: "Victor entende seu corpo", desc: "Treinos montados considerando seu histórico, restrições, objetivos e feedback — com apoio de tecnologia para não deixar nada passar.", long: "Victor analisa mais de 15 variáveis do seu perfil: histórico de lesões, nível de condicionamento, objetivos, equipamentos disponíveis, feedback das sessões anteriores e padrões de sono/nutrição. Com apoio de tecnologia inteligente, o resultado é um treino que evolui junto com você — cada semana mais preciso.", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/25" },
              { icon: Camera, title: "Correção em tempo real", desc: "A câmera do celular analisa seus movimentos durante o exercício e corrige postura instantaneamente — como ter Victor do seu lado.", long: "A câmera do seu celular analisa seu corpo em tempo real usando inteligência artificial exclusiva do Victor App. O sistema compara os ângulos das suas articulações com o padrão correto que Victor definiu para cada exercício e dá feedback visual instantâneo: 'Desça mais o quadril', 'Cotovelos mais próximos'. Disponível no plano Elite.", color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/25" },
              { icon: Target, title: "Treino sob medida", desc: "Cada série, carga e descanso calculados para o SEU corpo. Nada genérico, nada copiado. 100% do Victor para você.", long: "Victor utiliza periodização inteligente baseada nos seus objetivos. Cada exercício, número de séries, repetições, tempo de descanso e progressão de carga são pensados para maximizar seus resultados. O app registra tudo e ajusta conforme sua evolução.", color: "from-red-500 to-red-600", bg: "bg-red-500/5 border-red-500/10 hover:border-red-500/25" },
              { icon: TrendingUp, title: "Evolução visível", desc: "Dashboard pessoal com gráficos de carga, frequência, streaks e histórico. Você VÊ o progresso acontecendo.", long: "Acompanhe sua evolução em tempo real: gráficos de carga por exercício, frequência semanal, streaks de treino consecutivos, calendar heatmap e comparativo mensal. Você treina, Victor acompanha e o app organiza tudo.", color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/25" },
              { icon: MessageCircle, title: "Acompanhamento pós-treino", desc: "Após cada treino, Victor acompanha seu feedback (energia, dor, sono) e ajusta a próxima sessão para você.", long: "Ao finalizar o treino, o assistente coleta informações sobre como você se sentiu: nível de energia, dores, qualidade do sono, alimentação. Esses dados ajudam Victor a ajustar seu próximo treino — mais carga se dormiu bem, exercícios alternativos se reportou dor.", color: "from-amber-500 to-orange-500", bg: "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/25" },
              { icon: Shield, title: "Segurança clínica", desc: "Lesões, medicamentos e restrições analisados por Victor antes de qualquer prescrição. Seu treino respeita seu corpo.", long: "Antes de prescrever qualquer exercício, Victor analisa sua ficha completa com apoio de tecnologia: lesões ativas, cirurgias anteriores, medicamentos em uso (ex: anti-hipertensivos que contraindicam isométricos), restrições ortopédicas e cardiológicas. Exercícios contraindicados são automaticamente removidos.", color: "from-teal-400 to-cyan-500", bg: "bg-teal-500/5 border-teal-500/10 hover:border-teal-500/25" },
            ].map((feat, i) => (
              <Reveal key={feat.title} delay={i * 80}>
                <button
                  onClick={() => setSelectedFeature(feat)}
                  className={cn("group relative rounded-2xl border p-6 sm:p-8 transition-all duration-700 hover:bg-white/[0.02] text-left w-full cursor-pointer hover:translate-y-[-2px] h-full", feat.bg)}
                >
                  {/* Number + Icon row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg", feat.color)}>
                      <feat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[40px] font-black text-white/[0.04] leading-none select-none">0{i + 1}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight leading-tight">{feat.title}</h3>

                  <div className="h-px w-12 bg-gradient-to-r from-red-500/30 to-transparent mb-3" />

                  <p className="text-neutral-400 text-[13px] sm:text-sm leading-relaxed mb-4">{feat.desc}</p>

                  <p className="text-red-400/60 text-xs font-semibold flex items-center gap-1.5 group-hover:text-red-400 group-hover:gap-2.5 transition-all">
                    Saiba mais <ChevronRight className="w-3.5 h-3.5" />
                  </p>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="py-24 sm:py-36 px-5 sm:px-8 relative overflow-hidden">
        {/* CSS animated background (replaces WebGL shader) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(220,38,38,0.08),transparent_70%)]" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(220,38,38,0.04) 40px, rgba(220,38,38,0.04) 41px)", animation: "admin-grid-shift 4s ease-in-out infinite" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <TextEffect per="char" preset="blur" delay={0.1} as="p" className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">
              4 passos simples
            </TextEffect>
            <TextEffect per="word" preset="slide" as="h2" className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center mb-16">
              Como funciona?
            </TextEffect>
          </Reveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-red-600/20 via-red-600/10 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {[
                { n: "01", t: "Escolha seu plano", d: "Selecione o plano e duração ideais. Pague por Pix, cartão ou boleto com segurança total.", icon: Crown, accent: "bg-gradient-to-br from-amber-500 to-orange-600" },
                { n: "02", t: "Preencha sua ficha", d: "Anamnese guiada em 5 minutos. Victor analisa suas restrições com apoio tecnológico e monta seu perfil de segurança.", icon: Shield, accent: "bg-gradient-to-br from-emerald-500 to-green-600" },
                { n: "03", t: "Receba seu treino", d: "Treino na medida certa direto no app com timer de descanso, instruções e vídeos de execução.", icon: Dumbbell, accent: "bg-gradient-to-br from-red-500 to-red-700" },
                { n: "04", t: "Evolua e acompanhe", d: "Registre séries, receba feedback de Victor e acompanhe sua evolução em gráficos detalhados.", icon: TrendingUp, accent: "bg-gradient-to-br from-blue-500 to-indigo-600" },
              ].map((step, i) => (
                <Reveal key={step.n} delay={i * 120}>
                  <div className="group flex items-start gap-6 sm:gap-8">
                    <div className={cn("shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500", step.accent)}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="pt-1">
                      <span className="text-[11px] font-mono text-red-500/40 tracking-widest">{step.n}</span>
                      <TextEffect per="word" preset="blur" delay={0.3 + i * 0.15} as="h3" className="text-xl font-bold text-white mt-0.5 mb-2 tracking-tight">
                        {step.t}
                      </TextEffect>
                      <p className="text-neutral-500 text-sm leading-relaxed max-w-md">{step.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RESULTADOS ═══ */}
      <section id="resultados" className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <PremiumTestimonials />
        </div>
      </section>

      {/* ═══ PLANOS ═══ */}
      <section id="planos" className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">Invista em você</p>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center mb-3">
              Escolha seu plano
            </h2>
            <p className="text-neutral-500 text-center text-sm max-w-md mx-auto mb-10">
              Quanto maior seu compromisso, maior seu desconto. Cancele quando quiser.
            </p>
          </Reveal>

          {/* Duration toggle */}
          <Reveal delay={100}>
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                {durations.map(d => (
                  <button key={d.key} onClick={() => setDuration(d.key)} className={cn(
                    "relative px-5 sm:px-7 py-3 rounded-xl text-[13px] font-semibold transition-all duration-500",
                    duration === d.key ? "bg-red-600 text-white shadow-xl shadow-red-600/30" : "text-neutral-500 hover:text-white hover:bg-white/[0.03]"
                  )}>
                    {d.label}
                    {d.discount > 0 && (
                      <span className={cn(
                        "absolute -top-2.5 -right-1 text-[9px] font-black px-2 py-0.5 rounded-full",
                        duration === d.key ? "bg-white text-red-600" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      )}>
                        -{d.discount}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier, i) => {
              const p = getPrice(tier.monthly, duration)
              const isPro = tier.name === "Pro"
              const isElite = tier.name === "Elite"
              return (
                <Reveal key={tier.name} delay={i * 120}>
                  <CardSpotlight
                    color={isPro ? "rgba(220, 38, 38, 0.2)" : isElite ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.08)"}
                    radius={isPro ? 400 : 300}
                    className={cn(
                      "border p-7 transition-all duration-700 flex flex-col hover:translate-y-[-4px]",
                      isPro ? "border-red-500/30 bg-gradient-to-b from-red-600/[0.08] to-red-900/[0.02] md:scale-[1.04] shadow-2xl shadow-red-600/15 z-10" :
                      isElite ? "border-amber-500/15 bg-gradient-to-b from-amber-900/[0.03] to-transparent hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-600/5" :
                      "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.12] hover:shadow-xl hover:shadow-white/[0.02]"
                    )}
                  >
                    {tier.tag && (
                      <div className={cn(
                        "absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xl whitespace-nowrap",
                        isPro ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-red-600/25" : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25"
                      )}>
                        {tier.tag}
                      </div>
                    )}

                    <p className={cn("text-[11px] font-bold uppercase tracking-[0.2em] mb-4", isPro ? "text-red-400" : isElite ? "text-amber-400" : "text-neutral-600")}>
                      {tier.name}
                    </p>

                    {/* Price */}
                    <div className="mb-1">
                      {duration !== "MONTHLY" && (
                        <span className="text-neutral-700 text-sm line-through mr-2">R$ {tier.monthly.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-[11px] text-neutral-600">R$</span>
                      <span className="text-4xl font-black text-white tracking-tight">{p.monthly.toFixed(2).split(".")[0]}</span>
                      <span className="text-lg text-neutral-500 font-medium">,{p.monthly.toFixed(2).split(".")[1]}</span>
                      <span className="text-sm text-neutral-600 ml-0.5">/mês</span>
                    </div>

                    {duration !== "MONTHLY" ? (
                      <div className="mb-5 space-y-1">
                        <p className="text-neutral-600 text-[11px]">Total: R$ {p.total.toFixed(2)}</p>
                        <p className="text-emerald-400 text-xs font-semibold">Economia de R$ {p.savings.toFixed(2)}</p>
                      </div>
                    ) : <div className="mb-5" />}

                    <div className="mb-6 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                      <p className="text-sm font-bold text-white mb-0.5">R$ {p.perDay.toFixed(2)}<span className="text-neutral-500 font-normal text-[11px]">/dia</span></p>
                      <p className="text-[10px] text-neutral-500">Menos que um cafezinho por dia</p>
                    </div>

                    <div className="space-y-2.5 flex-1 mb-7">
                      {tier.features.map(f => (
                        <div key={f.t} className={cn("flex items-center gap-2.5", !f.ok && "opacity-30")}>
                          {f.ok ? (
                            <CheckCircle2 className={cn("w-4 h-4 shrink-0", isPro ? "text-red-400" : isElite ? "text-amber-400" : "text-emerald-500/80")} />
                          ) : (
                            <X className="w-4 h-4 text-neutral-700 shrink-0" />
                          )}
                          <span className={cn("text-[13px]", f.ok ? "text-neutral-300" : "text-neutral-700 line-through")}>{f.t}</span>
                        </div>
                      ))}
                    </div>

                    {/* Urgency */}
                    {isPro && (
                      <div className="flex items-center justify-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-600/[0.08] border border-red-500/[0.12]">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] text-red-300 font-semibold">Restam poucas vagas este mês</span>
                      </div>
                    )}

                    <button onClick={() => setSelectedPlan(tier)} className={cn(
                      "w-full py-4 rounded-xl text-[13px] font-bold text-center transition-all duration-500 cursor-pointer",
                      isPro ? "bg-red-600 text-white hover:bg-red-500 shadow-xl shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02]" :
                      isElite ? "border border-amber-500/20 text-amber-300 hover:bg-amber-500/10 hover:scale-[1.02]" :
                      "border border-white/[0.06] text-neutral-400 hover:bg-white/[0.04] hover:text-white hover:scale-[1.02]"
                    )}>
                      {tier.cta}
                    </button>

                    {/* Social proof micro */}
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <div className="flex -space-x-1.5">
                        {["L", "C", "R"].map((l) => (
                          <div key={l} className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600/40 to-red-900/30 border border-red-500/20 flex items-center justify-center text-[8px] text-red-200 font-bold">{l}</div>
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-500">200+ alunos ativos</span>
                    </div>
                  </CardSpotlight>
                </Reveal>
              )
            })}
          </div>

          {/* Guarantee banner — high visibility */}
          <Reveal delay={400}>
            <div className="mt-12 rounded-2xl border border-emerald-500/15 bg-emerald-600/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">Garantia incondicional de 7 dias</p>
                <p className="text-neutral-400 text-xs leading-relaxed">Se não gostar por qualquer motivo, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia. O risco é zero.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <div className="text-center mt-6">
              <p className="text-neutral-600 text-xs">Pix, cartão (até 12x) ou boleto · Cancele quando quiser</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <FaqSection />

      {/* ═══ CTA FINAL + CAPTURA DE LEAD ═══ */}
      <section className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-600/[0.05] blur-[150px]" />
        </div>
        <Reveal>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="mx-auto mb-8">
              <Logo size={80} glow />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight mb-5 leading-tight">
              Sua transformação
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">começa agora.</span>
            </h2>
            <p className="text-neutral-500 text-base max-w-md mx-auto mb-6 leading-relaxed">
              Não espere a segunda-feira perfeita. Cada dia conta. A partir de{" "}
              <span className="text-white font-bold">R$ 119,94/mês</span>.
            </p>
            <a href="#planos" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-red-600 text-white font-bold text-base shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:bg-red-500 transition-all duration-500 hover:scale-105 active:scale-100 mb-12">
              Escolher meu plano
              <ArrowRight className="w-5 h-5" />
            </a>

            {/* Mini lead capture form */}
            <LeadCaptureForm />
          </div>
        </Reveal>
      </section>

      {/* ═══ FEATURE MODAL ═══ */}
      {selectedFeature && (
        <FeatureModal feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
      )}

      {/* ═══ PLAN MODAL ═══ */}
      {selectedPlan && (
        <PlanModal tier={selectedPlan} duration={duration} onClose={() => setSelectedPlan(null)} />
      )}

      {/* ═══ FOOTER ═══ */}
      <footer id="contato" className="relative pt-20 pb-10 px-5 sm:px-8 overflow-hidden">
        {/* Rich footer background */}
        <div className="absolute inset-0">
          {/* Elevated base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0505] to-[#080303]" />
          {/* Grid with red tint */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" style={{ animation: "admin-grid-shift 8s ease-in-out infinite" }} />
          {/* Ambient glows */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-red-600/[0.06] blur-[180px]" />
          <div className="absolute top-1/3 left-[10%] w-[400px] h-[400px] rounded-full bg-red-900/[0.04] blur-[120px]" />
          {/* Top border glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/25 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-red-600/[0.06] blur-3xl rounded-full -translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Typing animation */}
          <div className="text-center mb-12">
            <p className="text-neutral-700 text-[10px] uppercase tracking-[0.3em] mb-4 font-medium">VO Personal</p>
            <div className="h-16 sm:h-20 flex items-center justify-center">
              <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white/90">
                <TypingEffect />
              </p>
            </div>
          </div>

          {/* Top CTA band */}
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12 mb-16 overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-red-600/[0.06] blur-3xl rounded-full -translate-y-1/2 group-hover:bg-red-600/[0.1] transition-all duration-700" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                  Pronto para transformar seu corpo?
                </h3>
                <p className="text-neutral-500 text-sm">Entre em contato e comece sua jornada hoje mesmo.</p>
              </div>
              <a
                href={`https://wa.me/5585996985823?text=${encodeURIComponent("Olá Victor! Quero começar minha transformação!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-xl shadow-red-600/20 hover:bg-red-500 hover:shadow-red-600/40 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                Falar com Victor
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <Logo size={44} glow />
                <div>
                  <p className="font-bold text-[15px] text-white tracking-tight">Victor Oliveira</p>
                  <p className="text-[9px] text-red-400/60 uppercase tracking-[0.25em] font-semibold">Personal Trainer</p>
                </div>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mb-6">
                Especialista em hipertrofia e emagrecimento. Treinos 100% individualizados com tecnologia de ponta.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/victoroliveiraapersonal_" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-pink-400 hover:border-pink-500/20 hover:bg-pink-500/[0.08] transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://wa.me/5585996985823" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/[0.08] transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </a>
                <a href="mailto:contato@victoroliveiraapersonal_.com" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Navegação */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-5">Navegação</h4>
              <div className="space-y-3">
                {[["Método", "#metodo"], ["Sobre", "#sobre"], ["Resultados", "#resultados"], ["Planos", "#planos"]].map(([l, h]) => (
                  <a key={l} href={h} className="group flex items-center gap-2 text-neutral-500 text-sm hover:text-white transition-colors">
                    <span className="w-0 group-hover:w-3 h-px bg-red-500 transition-all duration-300" />
                    {l}
                  </a>
                ))}
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-5">Plataforma</h4>
              <div className="space-y-3">
                <Link href="/login" className="group flex items-center gap-2 text-neutral-500 text-sm hover:text-white transition-colors">
                  <span className="w-0 group-hover:w-3 h-px bg-red-500 transition-all duration-300" />
                  Área do Aluno
                </Link>
                <Link href="/register" className="group flex items-center gap-2 text-neutral-500 text-sm hover:text-white transition-colors">
                  <span className="w-0 group-hover:w-3 h-px bg-red-500 transition-all duration-300" />
                  Criar conta
                </Link>
                <a href="#planos" className="group flex items-center gap-2 text-neutral-500 text-sm hover:text-white transition-colors">
                  <span className="w-0 group-hover:w-3 h-px bg-red-500 transition-all duration-300" />
                  Ver planos
                </a>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-5">Contato</h4>
              <div className="space-y-4">
                <a href="https://wa.me/5585996985823" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-neutral-500 text-sm hover:text-emerald-400 transition-colors group">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="group-hover:text-emerald-400 transition-colors">(85) 99698-5823</p>
                    <p className="text-neutral-700 text-xs mt-0.5">WhatsApp</p>
                  </div>
                </a>
                <a href="https://instagram.com/victoroliveiraapersonal_" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-neutral-500 text-sm hover:text-pink-400 transition-colors group">
                  <Instagram className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="group-hover:text-pink-400 transition-colors">@victoroliveiraapersonal_</p>
                    <p className="text-neutral-700 text-xs mt-0.5">Instagram</p>
                  </div>
                </a>
                <a href="mailto:contato@victoroliveiraapersonal_.com" className="flex items-start gap-3 text-neutral-500 text-sm hover:text-white transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="group-hover:text-white transition-colors">contato@victor...</p>
                    <p className="text-neutral-700 text-xs mt-0.5">E-mail</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.04] pt-6 flex flex-col items-center gap-4">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-neutral-600 text-xs">© 2026 Victor Oliveira · CREF 016254-G/CE</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-neutral-800 text-[10px] tracking-wider uppercase flex items-center gap-2">
                  <Shield className="w-3 h-3 text-emerald-500/40" />
                  Pagamento seguro
                </p>
                <span className="text-neutral-800">·</span>
                <p className="text-neutral-800 text-[10px] tracking-wider uppercase">Garantia 7 dias</p>
              </div>
            </div>

            {/* Developer credit */}
            <div className="border-t border-white/[0.03] pt-4 w-full flex items-center justify-center">
              <a
                href="https://instagram.com/emmanuelbezerra_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-white/[0.03] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/80 to-blue-800/80 flex items-center justify-center text-white text-[9px] font-bold tracking-tight shadow-md shadow-blue-600/10 group-hover:shadow-blue-500/20 transition-shadow">
                  {"</>"}
                </div>
                <div>
                  <p className="text-neutral-600 text-[10px] leading-tight">Desenvolvido por</p>
                  <p className="text-neutral-400 text-xs font-semibold tracking-tight group-hover:text-blue-400 transition-colors">Emmanuel Bezerra</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ VICTOR VIRTUAL CHAT ═══ */}
      <ChatWidget />

      {/* ═══ STICKY CTA — Mobile only ═══ */}
      <div className={cn(
        "fixed bottom-0 inset-x-0 z-50 sm:hidden transition-all duration-500 safe-bottom",
        scrollY > 600 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">A partir de R$ 3,99<span className="text-neutral-500 font-normal text-xs">/dia</span></p>
              <p className="text-neutral-500 text-[10px]">Garantia 7 dias · Cancele quando quiser</p>
            </div>
            <a
              href="#planos"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/25 active:scale-95 transition-transform"
            >
              Ver planos
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
