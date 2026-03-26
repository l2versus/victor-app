"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Dumbbell, Sparkles, Camera, Users, Star,
  Zap, Target, TrendingUp, CheckCircle2, ArrowRight,
  ChevronDown, MessageCircle, Mail, Phone,
  BarChart3, Palette, Smartphone, BotMessageSquare,
  Utensils, ShieldCheck, Clock, Globe, X,
  ChevronRight, Menu, XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const EMMANUEL_WHATSAPP = "5585996985823"
const EMMANUEL_EMAIL = "contato@emmanuelbezerra.dev"

function waLink(msg: string) {
  return `https://wa.me/${EMMANUEL_WHATSAPP}?text=${encodeURIComponent(msg)}`
}

/* ═══════════════════════════════════════════
   HOOKS — Scroll reveal (same pattern as B2C)
   ═══════════════════════════════════════════ */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children, className, delay = 0, direction = "up" }: {
  children: React.ReactNode; className?: string; delay?: number
  direction?: "up" | "left" | "right" | "scale"
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
   SECTION WRAPPER
   ═══════════════════════════════════════════ */
function Section({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("relative py-24 md:py-32 px-5 md:px-8", className)}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-6">
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </div>
  )
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-3xl md:text-5xl font-extrabold tracking-tight text-white", className)}>
      {children}
    </h2>
  )
}

/* ═══════════════════════════════════════════
   GLASS CARD
   ═══════════════════════════════════════════ */
function GlassCard({ children, className, hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn(
      "relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8",
      hover && "hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-500",
      className,
    )}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════ */
const b2bTiers = [
  {
    name: "Starter",
    monthly: 97,
    annual: 67.90,
    tag: null,
    features: [
      "1 profissional (trainer ou nutri)",
      "Ate 30 alunos",
      "Treinos personalizados",
      "Planos nutricionais",
      "Comunidade basica",
      "Suporte por email",
    ],
    notIncluded: ["IA Chat & Bot", "CRM de vendas", "WhatsApp Bot", "White-label"],
    cta: "Comecar com Starter",
  },
  {
    name: "Pro",
    monthly: 197,
    annual: 137.90,
    tag: "Mais popular",
    features: [
      "Ate 3 profissionais",
      "Ate 100 alunos",
      "Tudo do Starter +",
      "IA Chat + Bot pos-treino",
      "CRM + Pipeline de vendas",
      "WhatsApp Bot integrado",
      "Comunidade completa (feed + ranking)",
      "Suporte prioritario",
    ],
    notIncluded: ["White-label completo", "Correcao postural IA"],
    cta: "Comecar trial gratis",
  },
  {
    name: "Business",
    monthly: 497,
    annual: 347.90,
    tag: "Experiencia total",
    features: [
      "Profissionais ilimitados",
      "Alunos ilimitados",
      "Tudo do Pro +",
      "White-label completo (dominio proprio)",
      "Correcao postural IA",
      "API personalizada",
      "Onboarding dedicado",
      "Suporte dedicado VIP",
    ],
    notIncluded: [],
    cta: "Falar com vendas",
  },
]

/* ═══════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════ */
const faqs = [
  {
    q: "Preciso saber programar?",
    a: "Não! A plataforma é 100% visual. Você configura tudo pelo painel admin — exercícios, treinos, planos nutricionais, marca — sem tocar em código.",
  },
  {
    q: "Posso usar meu próprio domínio?",
    a: "Sim, no plano Business. Você aponta seu domínio (ex: app.suaacademia.com) e seus alunos acessam o app com sua marca completa.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Não. Todos os planos são sem fidelidade. Você pode cancelar a qualquer momento. No plano anual, o desconto é aplicado mas você pode cancelar e o acesso permanece até o final do período pago.",
  },
  {
    q: "Como funciona a IA?",
    a: "A IA analisa a anamnese do aluno, sugere treinos, responde dúvidas pós-treino e pode até criar planos nutricionais. Funciona como um assistente virtual do profissional.",
  },
  {
    q: "Meus alunos precisam baixar algum app?",
    a: "Não! O app é PWA — funciona direto no navegador e pode ser instalado na tela inicial do celular como um app nativo. Sem App Store, sem Play Store.",
  },
  {
    q: "E se eu já uso outra plataforma?",
    a: "Fazemos a migração gratuita dos seus dados. Treinos, alunos, exercícios — tudo é importado para a nova plataforma sem custo adicional.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-white font-semibold text-sm md:text-base pr-4 group-hover:text-blue-400 transition-colors">{q}</span>
        <ChevronDown className={cn("w-5 h-5 text-neutral-500 shrink-0 transition-transform duration-300", open && "rotate-180 text-blue-400")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-500", open ? "max-h-48 pb-5" : "max-h-0")}>
        <p className="text-neutral-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPARISON TABLE
   ═══════════════════════════════════════════ */
const comparisonRows = [
  { feature: "Preço mensal", ours: "A partir de R$97", mfit: "R$149+", treineme: "R$99+", personalapp: "R$129+" },
  { feature: "IA integrada", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "White-label", ours: true, mfit: false, treineme: "Parcial", personalapp: false },
  { feature: "Nutrição", ours: true, mfit: "Add-on", treineme: false, personalapp: false },
  { feature: "Comunidade", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "Correção postural", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "CRM de vendas", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "PWA (sem app store)", ours: true, mfit: false, treineme: true, personalapp: false },
]

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value
      ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
      : <X className="w-5 h-5 text-neutral-600 mx-auto" />
  }
  return <span className="text-neutral-400 text-xs">{value}</span>
}

/* ═══════════════════════════════════════════
   PHONE MOCKUP
   ═══════════════════════════════════════════ */
function PhoneMockup({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="w-[200px] md:w-[240px] h-[400px] md:h-[480px] rounded-[2.5rem] border-2 border-white/10 bg-gradient-to-b from-neutral-900 to-neutral-950 p-2 shadow-2xl shadow-blue-500/5">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#060606] rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-[#0a1628] to-[#060606] overflow-hidden flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2 text-center">
            <div className="h-3 w-28 bg-white/10 rounded-full" />
            <div className="h-2 w-20 bg-white/5 rounded-full mx-auto" />
          </div>
          <div className="w-full space-y-2 mt-4">
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600" />
          </div>
          {label && (
            <p className="text-[10px] text-blue-400/60 font-medium mt-2">{label}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   DEMO FORM
   ═══════════════════════════════════════════ */
function DemoForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    // fire-and-forget (no backend endpoint yet — just open WhatsApp)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-400 font-semibold text-sm">Solicitação enviada!</p>
        <p className="text-neutral-500 text-xs mt-1">Entraremos em contato em até 24h.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text" placeholder="Seu nome" required
        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/40 transition-colors"
      />
      <input
        type="email" placeholder="Seu email profissional" required
        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/40 transition-colors"
      />
      <input
        type="tel" placeholder="WhatsApp (opcional)"
        value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/40 transition-colors"
      />
      <button
        type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Solicitar demonstração"}
      </button>
    </form>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function B2BLandingPage() {
  const [annual, setAnnual] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-[#060606] text-white overflow-x-hidden scroll-smooth">

      {/* ──── NAV ──── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#060606]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 h-16">
          <Link href="/b2b" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">FitPlatform</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparativo</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors px-4 py-2">
              Entrar
            </Link>
            <a
              href="#pricing"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20"
            >
              Começar agora
            </a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-neutral-400" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#060606]/95 backdrop-blur-xl border-b border-white/[0.04] px-5 pb-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Recursos</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Planos</a>
            <a href="#comparison" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Comparativo</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">FAQ</a>
            <Link href="/login" className="block text-sm text-neutral-400 py-2">Entrar</Link>
            <a
              href="#pricing" onClick={() => setMobileMenu(false)}
              className="block text-center text-sm font-semibold px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600"
            >
              Começar agora
            </a>
          </div>
        )}
      </nav>

      {/* ──── HERO ──── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/8 blur-[150px] rounded-full" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left */}
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-8">
                  <Zap className="w-3.5 h-3.5" />
                  Plataforma SaaS Fitness
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6">
                  Seu app fitness.{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                    Sua marca.
                  </span>{" "}
                  Seus alunos.
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Plataforma completa para personal trainers, nutricionistas e academias.
                  Treinos, nutrição, IA, comunidade — tudo white-label com sua identidade.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-500 hover:to-violet-500 transition-all group"
                  >
                    Começar agora
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-neutral-300 font-semibold text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all"
                  >
                    Ver demo
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Right — Phone mockups */}
            <Reveal delay={400} direction="scale" className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <PhoneMockup className="relative z-10" label="Sua marca aqui" />
                <PhoneMockup className="absolute -right-16 top-12 opacity-60 scale-90 -z-0" label="Treinos" />
                <PhoneMockup className="absolute -left-16 top-12 opacity-60 scale-90 -z-0" label="Nutrição" />
                {/* Glow */}
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──── SOCIAL PROOF BAR ──── */}
      <Section className="!py-16 border-y border-white/[0.04]">
        <Reveal>
          <p className="text-center text-neutral-500 text-xs uppercase tracking-[0.2em] font-semibold mb-10">
            Usado por profissionais em todo o Brasil
          </p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-10">
          {["VF", "RS", "AM", "CT", "JB"].map((initials, i) => (
            <Reveal key={initials} delay={i * 80}>
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 font-bold text-sm">
                {initials}
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          <Reveal delay={0}>
            <p className="text-2xl md:text-3xl font-extrabold text-white"><AnimatedNumber value={50} suffix="+" /></p>
            <p className="text-neutral-500 text-xs mt-1">Profissionais</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-2xl md:text-3xl font-extrabold text-white"><AnimatedNumber value={1000} suffix="+" /></p>
            <p className="text-neutral-500 text-xs mt-1">Alunos ativos</p>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-2xl md:text-3xl font-extrabold text-white">4.9<Star className="w-4 h-4 text-yellow-400 inline ml-1 -mt-1" /></p>
            <p className="text-neutral-500 text-xs mt-1">Satisfação</p>
          </Reveal>
        </div>
      </Section>

      {/* ──── PROBLEM SECTION ──── */}
      <Section>
        <div className="text-center mb-16">
          <Reveal>
            <SectionLabel>O problema</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              Cansado de planilhas e{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                apps genéricos?
              </span>
            </SectionTitle>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Apps caros",
              desc: "Plataformas que cobram R$150+/mês e não entregam metade do que prometem. Seu lucro vai embora em mensalidades.",
              color: "text-red-400 bg-red-500/10 border-red-500/20",
            },
            {
              icon: <Palette className="w-6 h-6" />,
              title: "Sem sua marca",
              desc: "Seus alunos usam o app de outra empresa. Sua identidade visual some. Quem ganha credibilidade é o app, não você.",
              color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
            },
            {
              icon: <BotMessageSquare className="w-6 h-6" />,
              title: "Zero inteligência",
              desc: "Sem IA, sem automação, sem análise. Você gasta horas montando planilhas que poderiam ser geradas em segundos.",
              color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 120}>
              <GlassCard className="text-center h-full">
                <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-5", item.color)}>
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{item.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ──── FEATURES GRID ──── */}
      <Section id="features">
        <div className="text-center mb-16">
          <Reveal>
            <SectionLabel>Recursos</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              Tudo que você precisa.{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Numa só plataforma.
              </span>
            </SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-neutral-400 text-sm md:text-base mt-4 max-w-2xl mx-auto">
              Do treino à nutrição, da IA ao CRM — cada recurso foi pensado para profissionais que querem escalar.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Dumbbell className="w-5 h-5" />, title: "Treinos Personalizados", desc: "Templates, séries, carga progressiva, timer integrado, histórico completo.", color: "from-blue-500 to-blue-600" },
            { icon: <Utensils className="w-5 h-5" />, title: "Nutrição Integrada", desc: "Planos alimentares, cálculo de macros, aderência, lista de compras.", color: "from-emerald-500 to-emerald-600" },
            { icon: <BotMessageSquare className="w-5 h-5" />, title: "IA Nativa", desc: "Chat inteligente, análise de anamnese, sugestões automáticas, bot pós-treino.", color: "from-violet-500 to-violet-600" },
            { icon: <Camera className="w-5 h-5" />, title: "Correção Postural", desc: "Câmera em tempo real com MediaPipe. Feedback visual instantâneo.", color: "from-amber-500 to-orange-500" },
            { icon: <Users className="w-5 h-5" />, title: "Comunidade", desc: "Feed social, stories, rankings, desafios entre alunos, engajamento.", color: "from-pink-500 to-rose-500" },
            { icon: <BarChart3 className="w-5 h-5" />, title: "CRM + Vendas", desc: "Pipeline de leads, automações, integração WhatsApp, follow-up.", color: "from-cyan-500 to-cyan-600" },
            { icon: <Palette className="w-5 h-5" />, title: "White-label", desc: "Sua marca, suas cores, seu logo, seu domínio. 100% personalizado.", color: "from-fuchsia-500 to-fuchsia-600" },
            { icon: <Smartphone className="w-5 h-5" />, title: "PWA", desc: "Funciona como app nativo. Instala no celular sem App Store.", color: "from-teal-500 to-teal-600" },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <GlassCard className="h-full group">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300", f.color)}>
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">{f.desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ──── HOW IT WORKS ──── */}
      <Section className="border-y border-white/[0.04]">
        <div className="text-center mb-16">
          <Reveal><SectionLabel>Como funciona</SectionLabel></Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              3 passos para{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                transformar seu negócio
              </span>
            </SectionTitle>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Cadastre-se",
              desc: "Crie sua conta em 2 minutos. Sem cartão de crédito, sem burocracia.",
              icon: <ShieldCheck className="w-6 h-6" />,
            },
            {
              step: "02",
              title: "Configure",
              desc: "Adicione sua marca, exercícios, planos de treino e nutrição. Tudo visual.",
              icon: <Target className="w-6 h-6" />,
            },
            {
              step: "03",
              title: "Venda",
              desc: "Compartilhe com seus alunos e comece a faturar. Suporte total.",
              icon: <TrendingUp className="w-6 h-6" />,
            },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 150}>
              <div className="relative text-center">
                {/* Connector line (desktop) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 text-blue-400">
                  {s.icon}
                </div>
                <p className="text-blue-400/50 text-xs font-bold tracking-widest uppercase mb-2">Passo {s.step}</p>
                <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ──── COMPARISON TABLE ──── */}
      <Section id="comparison">
        <div className="text-center mb-16">
          <Reveal><SectionLabel>Comparativo</SectionLabel></Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              Por que escolher{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                nossa plataforma?
              </span>
            </SectionTitle>
          </Reveal>
        </div>

        <Reveal>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-neutral-500 text-xs uppercase tracking-wider font-semibold py-4 pr-4">Recurso</th>
                  <th className="text-center py-4 px-3">
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Nossa plataforma</span>
                  </th>
                  <th className="text-center text-neutral-500 text-xs font-medium py-4 px-3">MFIT</th>
                  <th className="text-center text-neutral-500 text-xs font-medium py-4 px-3">Treine.me</th>
                  <th className="text-center text-neutral-500 text-xs font-medium py-4 px-3">Personal App</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="text-sm text-neutral-300 py-4 pr-4 font-medium">{row.feature}</td>
                    <td className="text-center py-4 px-3">
                      <ComparisonCell value={row.ours} />
                    </td>
                    <td className="text-center py-4 px-3"><ComparisonCell value={row.mfit} /></td>
                    <td className="text-center py-4 px-3"><ComparisonCell value={row.treineme} /></td>
                    <td className="text-center py-4 px-3"><ComparisonCell value={row.personalapp} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* ──── PRICING ──── */}
      <Section id="pricing" className="border-y border-white/[0.04]">
        <div className="text-center mb-16">
          <Reveal><SectionLabel>Planos</SectionLabel></Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              Invista no seu{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                negócio fitness
              </span>
            </SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-neutral-400 text-sm mt-4 max-w-lg mx-auto">
              Sem fidelidade. Cancele quando quiser. Comece gratis por 14 dias no plano Pro.
            </p>
          </Reveal>

          {/* Annual toggle */}
          <Reveal delay={300}>
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={cn("text-sm transition-colors", !annual ? "text-white font-semibold" : "text-neutral-500")}>Mensal</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors",
                  annual ? "bg-blue-600" : "bg-white/10",
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform",
                  annual ? "translate-x-7" : "translate-x-0.5",
                )} />
              </button>
              <span className={cn("text-sm transition-colors", annual ? "text-white font-semibold" : "text-neutral-500")}>
                Anual
                <span className="ml-1.5 text-xs text-emerald-400 font-bold">-30%</span>
              </span>
            </div>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {b2bTiers.map((tier, i) => {
            const isPro = tier.name === "Pro"
            const price = annual ? tier.annual : tier.monthly
            return (
              <Reveal key={tier.name} delay={i * 120}>
                <div className={cn(
                  "relative rounded-3xl p-px",
                  isPro ? "bg-gradient-to-b from-blue-500/50 to-violet-500/50" : "bg-white/[0.06]",
                )}>
                  {tier.tag && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shadow-lg shadow-blue-600/30">
                      {tier.tag}
                    </div>
                  )}
                  <div className={cn(
                    "rounded-3xl p-8 h-full",
                    isPro ? "bg-[#0a0a0a]" : "bg-[#060606]",
                  )}>
                    <h3 className="text-white font-bold text-xl mb-1">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl md:text-4xl font-extrabold text-white">
                        R${price.toFixed(0)}
                      </span>
                      <span className="text-neutral-500 text-sm">/mês</span>
                    </div>

                    <div className="space-y-3 mb-8">
                      {tier.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-300">{f}</span>
                        </div>
                      ))}
                      {tier.notIncluded.map((f, j) => (
                        <div key={j} className="flex items-start gap-3 opacity-40">
                          <X className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-600 line-through">{f}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={tier.name === "Business"
                        ? waLink("Olá! Tenho interesse no plano Business da plataforma fitness.")
                        : waLink(`Olá! Quero começar com o plano ${tier.name} da plataforma fitness.`)}
                      target="_blank" rel="noopener noreferrer"
                      className={cn(
                        "block text-center py-3.5 rounded-xl font-bold text-sm transition-all",
                        isPro
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
                          : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.06]",
                      )}
                    >
                      {tier.cta}
                    </a>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Section>

      {/* ──── TESTIMONIALS ──── */}
      <Section>
        <div className="text-center mb-16">
          <Reveal><SectionLabel>Depoimentos</SectionLabel></Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              Quem usa,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                recomenda.
              </span>
            </SectionTitle>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Rafael Santos",
              role: "Personal Trainer — SP",
              initials: "RS",
              text: "Migrei do MFIT e economizo R$150/mês. Meus alunos amam o app e o engajamento triplicou. A IA é um diferencial absurdo.",
            },
            {
              name: "Ana Martins",
              role: "Nutricionista — RJ",
              initials: "AM",
              text: "Finalmente consigo entregar planos de treino e nutrição no mesmo app. Meus pacientes se sentem num programa premium.",
            },
            {
              name: "Carlos Torres",
              role: "Dono de academia — MG",
              initials: "CT",
              text: "O white-label mudou o jogo. Meus alunos usam o app com a marca da academia. Profissionalismo de outro nível.",
            },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 120}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-neutral-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ──── FAQ ──── */}
      <Section id="faq" className="border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Reveal><SectionLabel>FAQ</SectionLabel></Reveal>
            <Reveal delay={100}>
              <SectionTitle className="text-2xl md:text-4xl">Perguntas frequentes</SectionTitle>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div>
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ──── FINAL CTA ──── */}
      <Section className="border-t border-white/[0.04]">
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full" />

          <div className="relative text-center max-w-2xl mx-auto">
            <Reveal>
              <SectionTitle>
                Comece sua{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  transformação digital
                </span>{" "}
                hoje
              </SectionTitle>
            </Reveal>

            <Reveal delay={100}>
              <p className="text-neutral-400 text-sm md:text-base mt-4 mb-8">
                Monte seu app fitness em minutos. Sem código, sem complicação. 7 dias grátis para testar.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <a
                  href={waLink("Olá! Quero saber mais sobre a plataforma fitness white-label.")}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 transition-all"
                >
                  Ver planos
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </Reveal>

            {/* Demo request form */}
            <Reveal delay={300}>
              <GlassCard className="max-w-md mx-auto" hover={false}>
                <p className="text-white font-bold text-base mb-1">Solicitar demonstração</p>
                <p className="text-neutral-500 text-xs mb-5">Preencha e entraremos em contato em até 24h</p>
                <DemoForm />
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-white/[0.04] py-12 px-5 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">FitPlatform</p>
              <p className="text-neutral-600 text-[10px]">Desenvolvido por Emmanuel Bezerra</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-neutral-500 text-xs">
            <a href={waLink("Olá!")} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href={`mailto:${EMMANUEL_EMAIL}`} className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          </div>

          <p className="text-neutral-700 text-[10px]">
            &copy; {new Date().getFullYear()} FitPlatform. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
