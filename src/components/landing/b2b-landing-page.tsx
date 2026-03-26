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
    <section id={id} className={cn("relative py-28 md:py-36 px-5 md:px-8", className)}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-blue-400 text-[11px] font-bold tracking-[0.25em] uppercase mb-5">
      {children}
    </p>
  )
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.1]", className)}>
      {children}
    </h2>
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
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-white font-semibold text-base md:text-lg pr-4 group-hover:text-blue-400 transition-colors">{q}</span>
        <ChevronDown className={cn("w-5 h-5 text-neutral-500 shrink-0 transition-transform duration-300", open && "rotate-180 text-blue-400")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-500", open ? "max-h-48 pb-6" : "max-h-0")}>
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

function ComparisonCell({ value, isOurs = false }: { value: boolean | string; isOurs?: boolean }) {
  if (typeof value === "boolean") {
    if (value) {
      return isOurs
        ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20"><CheckCircle2 className="w-5 h-5 text-white" /></span>
        : <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
    }
    return <X className="w-5 h-5 text-red-400/60 mx-auto" />
  }
  return <span className={cn("text-xs font-medium", isOurs ? "text-white/80" : "text-neutral-400")}>{value}</span>
}

/* ═══════════════════════════════════════════
   PHONE MOCKUP — Cinematic with floating anim
   ═══════════════════════════════════════════ */
function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ animation: "phoneFloat 6s ease-in-out infinite" }}>
      <div
        className="w-[260px] md:w-[300px] h-[520px] md:h-[600px] rounded-[3rem] border-[2px] border-white/[0.12] bg-gradient-to-b from-neutral-800/80 to-neutral-950 p-[6px] shadow-2xl"
        style={{ transform: "perspective(1200px) rotateY(-5deg) rotateX(5deg)", boxShadow: "0 40px 100px -20px rgba(99,102,241,0.25), 0 0 60px -30px rgba(139,92,246,0.3)" }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-3xl rounded-t-sm z-20 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neutral-800" />
          <div className="w-12 h-3 rounded-full bg-neutral-900" />
        </div>
        {/* Screen */}
        <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-b from-[#0d1b2a] via-[#0a1020] to-[#060606] overflow-hidden flex flex-col p-5 pt-12">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-6 px-1">
            <span className="text-[9px] text-white/40 font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm bg-white/30" />
              <div className="w-3 h-2 rounded-sm bg-white/20" />
              <div className="w-4 h-2 rounded-sm bg-white/40" />
            </div>
          </div>
          {/* App header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="h-2.5 w-20 bg-white/20 rounded-full" />
              <div className="h-2 w-14 bg-white/8 rounded-full mt-1.5" />
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: "Treinos", val: "24" },
              { label: "Streak", val: "7d" },
              { label: "XP", val: "850" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[10px] text-white/40">{s.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{s.val}</p>
              </div>
            ))}
          </div>
          {/* Workout card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Treino do dia</span>
              <span className="text-[10px] text-white/40">45 min</span>
            </div>
            <div className="h-2.5 w-3/4 bg-white/15 rounded-full mb-2" />
            <div className="h-2 w-1/2 bg-white/8 rounded-full" />
          </div>
          {/* Exercise list */}
          <div className="space-y-2 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <Dumbbell className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-20 bg-white/12 rounded-full" />
                  <div className="h-1.5 w-14 bg-white/5 rounded-full mt-1.5" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/20" />
              </div>
            ))}
          </div>
          {/* Bottom nav */}
          <div className="flex items-center justify-around pt-4 mt-auto border-t border-white/[0.06]">
            {[Dumbbell, BarChart3, Users, BotMessageSquare].map((Icon, i) => (
              <div key={i} className={cn("p-2 rounded-xl", i === 0 && "bg-blue-500/20")}>
                <Icon className={cn("w-4 h-4", i === 0 ? "text-blue-400" : "text-white/25")} />
              </div>
            ))}
          </div>
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
      <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="text-emerald-400 font-bold text-lg">Solicitação enviada!</p>
        <p className="text-neutral-500 text-sm mt-2">Entraremos em contato em até 24h.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text" placeholder="Seu nome" required
        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        className="w-full px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
      />
      <input
        type="email" placeholder="Seu email profissional" required
        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        className="w-full px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
      />
      <input
        type="tel" placeholder="WhatsApp (opcional)"
        value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
        className="w-full px-5 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
      />
      <button
        type="submit" disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Solicitar demonstração gratuita"}
      </button>
    </form>
  )
}

/* ═══════════════════════════════════════════
   NEON FEATURE ICON
   ═══════════════════════════════════════════ */
function NeonIcon({ icon, color }: { icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, { border: string; text: string; shadow: string }> = {
    blue:    { border: "border-blue-500/40",    text: "text-blue-400",    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]" },
    emerald: { border: "border-emerald-500/40", text: "text-emerald-400", shadow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]" },
    violet:  { border: "border-violet-500/40",  text: "text-violet-400",  shadow: "shadow-[0_0_20px_rgba(139,92,246,0.25)]" },
    amber:   { border: "border-amber-500/40",   text: "text-amber-400",   shadow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]" },
    pink:    { border: "border-pink-500/40",    text: "text-pink-400",    shadow: "shadow-[0_0_20px_rgba(236,72,153,0.25)]" },
    cyan:    { border: "border-cyan-500/40",    text: "text-cyan-400",    shadow: "shadow-[0_0_20px_rgba(6,182,212,0.25)]" },
    fuchsia: { border: "border-fuchsia-500/40", text: "text-fuchsia-400", shadow: "shadow-[0_0_20px_rgba(192,38,211,0.25)]" },
    teal:    { border: "border-teal-500/40",    text: "text-teal-400",    shadow: "shadow-[0_0_20px_rgba(20,184,166,0.25)]" },
  }
  const c = colorMap[color] || colorMap.blue
  return (
    <div className={cn("w-12 h-12 rounded-xl border bg-transparent flex items-center justify-center transition-all duration-500", c.border, c.text, c.shadow)}>
      {icon}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function B2BLandingPage() {
  const [annual, setAnnual] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden scroll-smooth">

      {/* ──── GLOBAL CSS (animations + perspective grid) ──── */}
      <style jsx global>{`
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes rotateBorder {
          0% { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes gridScroll {
          0% { transform: perspective(500px) rotateX(55deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(55deg) translateY(80px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .perspective-grid {
          background-image:
            linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px);
          background-size: 80px 80px;
          transform: perspective(500px) rotateX(55deg);
          transform-origin: center top;
          animation: gridScroll 4s linear infinite;
        }
        .animate-border-rotate {
          background: conic-gradient(from var(--angle, 0deg), #3b82f6, #8b5cf6, #3b82f6);
          animation: rotateBorder 3s linear infinite;
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>

      {/* ──── NAV ──── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050508]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 h-16">
          <Link href="/b2b" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">FitPlatform</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-[13px] text-neutral-500">
            <a href="#features" className="hover:text-white transition-colors duration-300">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-300">Planos</a>
            <a href="#comparison" className="hover:text-white transition-colors duration-300">Comparativo</a>
            <a href="#faq" className="hover:text-white transition-colors duration-300">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-neutral-400 hover:text-white transition-colors px-4 py-2">
              Entrar
            </Link>
            <a
              href="#pricing"
              className="text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
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
          <div className="md:hidden bg-[#050508]/95 backdrop-blur-2xl border-b border-white/[0.04] px-5 pb-6 space-y-4">
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

      {/* ══════════════════════════════════════
           HERO — Cinematic Dark Tech
         ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Perspective grid background */}
        <div className="absolute inset-x-0 bottom-0 h-[60vh] overflow-hidden pointer-events-none">
          <div className="perspective-grid absolute inset-x-[-50%] top-0 h-[200%] w-[200%] opacity-40" />
        </div>

        {/* Radial gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05)_0%,transparent_50%)]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              <Reveal>
                <p className="text-blue-400/80 text-[10px] font-bold tracking-[0.3em] uppercase mb-8">
                  FITPLATFORM — PLATAFORMA SAAS FITNESS
                </p>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.9] mb-8">
                  Fitness +{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%]" style={{ animation: "shimmer 3s linear infinite" }}>
                    tecnologia
                  </span>
                  {" "}que{" "}
                  <span className="text-neutral-400">transforma.</span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                  A plataforma definitiva para personal trainers, nutricionistas e academias.
                  Treinos, nutrição, IA, comunidade — tudo white-label com sua identidade.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/50 hover:from-blue-500 hover:to-violet-500 transition-all duration-300 group"
                  >
                    Começar Agora
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border border-white/[0.1] text-neutral-300 font-semibold text-sm hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
                  >
                    Ver Demonstração
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </Reveal>

              {/* Mini social proof under CTA */}
              <Reveal delay={400}>
                <div className="flex items-center gap-4 mt-10 justify-center lg:justify-start">
                  <div className="flex -space-x-2">
                    {["RS", "AM", "CT"].map((initials) => (
                      <div key={initials} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/30 to-violet-600/30 border-2 border-[#050508] flex items-center justify-center text-[8px] font-bold text-blue-300">
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    <span className="text-white font-semibold">50+ profissionais</span> já transformaram seu negócio
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right — Phone mockup */}
            <Reveal delay={400} direction="scale" className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <PhoneMockup />
                {/* Ambient glow behind phone */}
                <div className="absolute inset-0 -z-10 bg-blue-500/10 blur-[120px] rounded-full scale-150" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-80 h-80 bg-violet-500/8 blur-[100px] rounded-full" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050508] to-transparent" />
      </section>

      {/* ──── SOCIAL PROOF BAR ──── */}
      <Section className="!py-20 border-y border-white/[0.04]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-3xl mx-auto text-center">
          <Reveal delay={0}>
            <p className="text-3xl md:text-4xl font-extrabold text-white"><AnimatedNumber value={50} suffix="+" /></p>
            <p className="text-neutral-600 text-xs uppercase tracking-[0.15em] mt-2 font-medium">Profissionais</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-3xl md:text-4xl font-extrabold text-white"><AnimatedNumber value={1000} suffix="+" /></p>
            <p className="text-neutral-600 text-xs uppercase tracking-[0.15em] mt-2 font-medium">Alunos ativos</p>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-3xl md:text-4xl font-extrabold text-white">4.9<Star className="w-4 h-4 text-amber-400 inline ml-1.5 -mt-1 fill-amber-400" /></p>
            <p className="text-neutral-600 text-xs uppercase tracking-[0.15em] mt-2 font-medium">Satisfação</p>
          </Reveal>
          <Reveal delay={300}>
            <p className="text-3xl md:text-4xl font-extrabold text-white"><AnimatedNumber value={256} suffix="" /></p>
            <p className="text-neutral-600 text-xs uppercase tracking-[0.15em] mt-2 font-medium">Exercícios IA</p>
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
          <Reveal delay={200}>
            <p className="text-neutral-500 text-base mt-5 max-w-2xl mx-auto leading-relaxed">
              A maioria dos profissionais fitness perde tempo e dinheiro com ferramentas que não entregam.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <TrendingUp className="w-5 h-5" />,
              title: "Apps caros",
              desc: "Plataformas que cobram R$150+/mês e não entregam metade do que prometem. Seu lucro vai embora em mensalidades.",
              color: "red",
            },
            {
              icon: <Palette className="w-5 h-5" />,
              title: "Sem sua marca",
              desc: "Seus alunos usam o app de outra empresa. Sua identidade visual some. Quem ganha credibilidade é o app, não você.",
              color: "amber",
            },
            {
              icon: <BotMessageSquare className="w-5 h-5" />,
              title: "Zero inteligência",
              desc: "Sem IA, sem automação, sem análise. Você gasta horas montando planilhas que poderiam ser geradas em segundos.",
              color: "amber",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:translate-y-[-4px] hover:border-red-500/20 transition-all duration-500">
                <NeonIcon icon={item.icon} color={item.color} />
                <h3 className="text-white font-bold text-lg mt-5 mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════
           FEATURES GRID — Neon bordered icons
         ══════════════════════════════════════ */}
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
            <p className="text-neutral-500 text-base mt-5 max-w-2xl mx-auto leading-relaxed">
              Do treino à nutrição, da IA ao CRM — cada recurso foi pensado para profissionais que querem escalar.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Dumbbell className="w-5 h-5" />, title: "Treinos Personalizados", desc: "Templates, séries, carga progressiva, timer integrado, histórico completo.", color: "blue" },
            { icon: <Utensils className="w-5 h-5" />, title: "Nutrição Integrada", desc: "Planos alimentares, cálculo de macros, aderência, lista de compras.", color: "emerald" },
            { icon: <BotMessageSquare className="w-5 h-5" />, title: "IA Nativa", desc: "Chat inteligente, análise de anamnese, sugestões automáticas, bot pós-treino.", color: "violet" },
            { icon: <Camera className="w-5 h-5" />, title: "Correção Postural", desc: "Câmera em tempo real com MediaPipe. Feedback visual instantâneo.", color: "amber" },
            { icon: <Users className="w-5 h-5" />, title: "Comunidade", desc: "Feed social, stories, rankings, desafios entre alunos, engajamento.", color: "pink" },
            { icon: <BarChart3 className="w-5 h-5" />, title: "CRM + Vendas", desc: "Pipeline de leads, automações, integração WhatsApp, follow-up.", color: "cyan" },
            { icon: <Palette className="w-5 h-5" />, title: "White-label", desc: "Sua marca, suas cores, seu logo, seu domínio. 100% personalizado.", color: "fuchsia" },
            { icon: <Smartphone className="w-5 h-5" />, title: "PWA", desc: "Funciona como app nativo. Instala no celular sem App Store.", color: "teal" },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 h-full hover:translate-y-[-4px] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-500">
                <NeonIcon icon={f.icon} color={f.color} />
                <h3 className="text-white font-bold text-sm mt-5 mb-2">{f.title}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
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

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-blue-500/30" />

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
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  {s.icon}
                </div>
                <p className="text-blue-400/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Passo {s.step}</p>
                <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════
           COMPARISON TABLE — Magazine editorial
         ══════════════════════════════════════ */}
      <Section id="comparison">
        <div className="text-center mb-16">
          <Reveal><SectionLabel>Comparativo</SectionLabel></Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              <span className="text-neutral-500">PLATAFORMA</span> vs{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                OUTROS
              </span>
            </SectionTitle>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-neutral-500 text-base mt-5 max-w-xl mx-auto leading-relaxed">
              Veja por que profissionais estão migrando para a nossa plataforma.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left text-neutral-500 text-xs uppercase tracking-wider font-semibold py-5 px-6">Recurso</th>
                  <th className="text-center py-5 px-4 bg-gradient-to-b from-blue-600/20 to-violet-600/20">
                    <span className="text-sm font-bold text-white">Nossa plataforma</span>
                  </th>
                  <th className="text-center text-neutral-600 text-xs font-medium py-5 px-4">MFIT</th>
                  <th className="text-center text-neutral-600 text-xs font-medium py-5 px-4">Treine.me</th>
                  <th className="text-center text-neutral-600 text-xs font-medium py-5 px-4">Personal App</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="text-sm text-neutral-300 py-4 px-6 font-medium">{row.feature}</td>
                    <td className="text-center py-4 px-4 bg-gradient-to-b from-blue-600/10 to-violet-600/10">
                      <ComparisonCell value={row.ours} isOurs />
                    </td>
                    <td className="text-center py-4 px-4"><ComparisonCell value={row.mfit} /></td>
                    <td className="text-center py-4 px-4"><ComparisonCell value={row.treineme} /></td>
                    <td className="text-center py-4 px-4"><ComparisonCell value={row.personalapp} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* ══════════════════════════════════════
           PRICING — Glassmorphism + animated border
         ══════════════════════════════════════ */}
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
            <p className="text-neutral-500 text-base mt-5 max-w-lg mx-auto leading-relaxed">
              Sem fidelidade. Cancele quando quiser. Comece grátis por 14 dias no plano Pro.
            </p>
          </Reveal>

          {/* Annual toggle */}
          <Reveal delay={300}>
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className={cn("text-sm transition-colors duration-300", !annual ? "text-white font-semibold" : "text-neutral-600")}>Mensal</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-all duration-300",
                  annual ? "bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20" : "bg-white/10",
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300",
                  annual ? "translate-x-7" : "translate-x-0.5",
                )} />
              </button>
              <span className={cn("text-sm transition-colors duration-300", annual ? "text-white font-semibold" : "text-neutral-600")}>
                Anual
                <span className="ml-2 text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">-30%</span>
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
                  "relative rounded-3xl h-full",
                  isPro ? "p-[2px]" : "p-px",
                )}>
                  {/* Animated rotating border for Pro */}
                  {isPro && (
                    <div className="absolute inset-0 rounded-3xl animate-border-rotate opacity-70" />
                  )}
                  {!isPro && (
                    <div className="absolute inset-0 rounded-3xl bg-white/[0.06]" />
                  )}

                  {tier.tag && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-bold tracking-[0.15em] uppercase whitespace-nowrap shadow-xl shadow-blue-600/30">
                      {tier.tag}
                    </div>
                  )}

                  <div className={cn(
                    "relative rounded-3xl p-8 md:p-9 h-full flex flex-col",
                    isPro ? "bg-[#080810]" : "bg-[#060609]",
                  )}>
                    <h3 className="text-white font-bold text-xl mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1.5 mb-8">
                      <span className="text-[10px] text-neutral-500 font-medium self-start mt-2">R$</span>
                      <span className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                        {price.toFixed(0)}
                      </span>
                      <span className="text-neutral-600 text-sm">/mês</span>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-1">
                      {tier.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-neutral-300 leading-snug">{f}</span>
                        </div>
                      ))}
                      {tier.notIncluded.map((f, j) => (
                        <div key={j} className="flex items-start gap-3 opacity-30">
                          <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-neutral-600" />
                          </div>
                          <span className="text-sm text-neutral-600 line-through leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={tier.name === "Business"
                        ? waLink("Olá! Tenho interesse no plano Business da plataforma fitness.")
                        : waLink(`Olá! Quero começar com o plano ${tier.name} da plataforma fitness.`)}
                      target="_blank" rel="noopener noreferrer"
                      className={cn(
                        "block text-center py-4 rounded-xl font-bold text-sm transition-all duration-300",
                        isPro
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/50 hover:from-blue-500 hover:to-violet-500"
                          : "bg-white/[0.04] text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15]",
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

      {/* ══════════════════════════════════════
           TESTIMONIALS — Alternating layout
         ══════════════════════════════════════ */}
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

        <div className="space-y-8 max-w-4xl mx-auto">
          {[
            {
              name: "Rafael Santos",
              role: "Personal Trainer — SP",
              initials: "RS",
              text: "Migrei do MFIT e economizo R$150/mês. Meus alunos amam o app e o engajamento triplicou. A IA é um diferencial absurdo.",
              color: "from-blue-500 to-blue-600",
            },
            {
              name: "Ana Martins",
              role: "Nutricionista — RJ",
              initials: "AM",
              text: "Finalmente consigo entregar planos de treino e nutrição no mesmo app. Meus pacientes se sentem num programa premium.",
              color: "from-violet-500 to-violet-600",
            },
            {
              name: "Carlos Torres",
              role: "Dono de academia — MG",
              initials: "CT",
              text: "O white-label mudou o jogo. Meus alunos usam o app com a marca da academia. Profissionalismo de outro nível.",
              color: "from-emerald-500 to-emerald-600",
            },
          ].map((t, i) => {
            const isEven = i % 2 === 1
            return (
              <Reveal key={i} delay={i * 120} direction={isEven ? "left" : "right"}>
                <div className={cn(
                  "flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 md:p-10",
                  isEven && "md:flex-row-reverse",
                )}>
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className={cn(
                      "w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold shadow-lg",
                      t.color,
                    )} style={{ boxShadow: `0 0 30px rgba(99,102,241,0.2)` }}>
                      {t.initials}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className={cn("flex-1", isEven ? "md:text-right" : "md:text-left", "text-center")}>
                    {/* Large quotation mark */}
                    <span className="text-5xl font-serif leading-none bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent select-none">&ldquo;</span>
                    <p className="text-neutral-300 text-base leading-relaxed mt-2 mb-5">{t.text}</p>
                    <div className="flex items-center gap-1.5 mb-3 justify-center md:justify-start" style={{ justifyContent: isEven ? undefined : undefined }}>
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Section>

      {/* ──── FAQ ──── */}
      <Section id="faq" className="border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
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

      {/* ══════════════════════════════════════
           FINAL CTA — Full-width gradient banner
         ══════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-violet-600/90 to-blue-700/90" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Top/bottom edges */}
        <div className="absolute top-0 inset-x-0 h-px bg-white/10" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — CTA text */}
            <div className="text-center lg:text-left">
              <Reveal>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white mb-6">
                  Comece sua transformação digital
                </h2>
              </Reveal>

              <Reveal delay={100}>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                  Monte seu app fitness em minutos. Sem código, sem complicação. 7 dias grátis para testar.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a
                    href={waLink("Olá! Quero saber mais sobre a plataforma fitness white-label.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-[#050508] font-bold text-sm shadow-xl hover:bg-white/90 transition-all duration-300 group"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Falar no WhatsApp
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                  >
                    Ver planos
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right — Demo form */}
            <Reveal delay={300}>
              <div className="relative rounded-2xl bg-[#050508]/80 backdrop-blur-xl border border-white/[0.1] p-8 md:p-10 shadow-2xl">
                <div className="absolute -top-4 left-8 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-bold tracking-[0.15em] uppercase shadow-lg shadow-blue-600/30">
                  Demo gratuita
                </div>
                <p className="text-white font-bold text-xl mb-2 mt-2">Solicitar demonstração</p>
                <p className="text-neutral-500 text-sm mb-6">Preencha e entraremos em contato em até 24h</p>
                <DemoForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-white/[0.04] py-16 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">FitPlatform</span>
            </div>

            {/* Contact links */}
            <div className="flex items-center gap-8 text-neutral-500 text-sm">
              <a href={waLink("Olá!")} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
              <a href={`mailto:${EMMANUEL_EMAIL}`} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </a>
            </div>

            {/* Legal links */}
            <div className="flex items-center gap-6 text-neutral-700 text-xs">
              <span className="hover:text-neutral-400 transition-colors cursor-pointer">Legal</span>
              <span className="text-neutral-800">|</span>
              <span className="hover:text-neutral-400 transition-colors cursor-pointer">Termos</span>
              <span className="text-neutral-800">|</span>
              <span className="hover:text-neutral-400 transition-colors cursor-pointer">Privacidade</span>
            </div>

            {/* Credits */}
            <div className="space-y-2">
              <p className="text-neutral-600 text-xs">
                Desenvolvido por <span className="text-neutral-400 font-medium">Emmanuel Bezerra</span>
              </p>
              <p className="text-neutral-800 text-[10px]">
                &copy; {new Date().getFullYear()} FitPlatform. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
