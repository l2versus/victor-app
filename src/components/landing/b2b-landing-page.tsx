"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown, MessageCircle, ArrowRight,
  Menu, X as XIcon,
  Dumbbell, Utensils, Camera, Users,
  BarChart3, Palette, Smartphone, BotMessageSquare,
  CheckCircle2, Star, Play, Zap, Shield, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ===================================================================
   CONSTANTS
   =================================================================== */
const EMMANUEL_WHATSAPP = "5585996985823"
const EMMANUEL_EMAIL = "contato@emmanuelbezerra.dev"

function waLink(msg: string) {
  return `https://wa.me/${EMMANUEL_WHATSAPP}?text=${encodeURIComponent(msg)}`
}

/* ===================================================================
   UNSPLASH IMAGES
   =================================================================== */
const IMAGES = {
  heroGym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80",
  trainerClient: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  womanTraining: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  groupFitness: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80",
  nutrition: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  testimonial1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  testimonial2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  testimonial3: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
}

/* ===================================================================
   HOOKS
   =================================================================== */
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
    up: visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
    left: visible ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
    right: visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
    scale: visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
  }
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", transforms[direction], className)} style={{ transitionDelay: `${delay}ms` }}>
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

/* ===================================================================
   PRICING
   =================================================================== */
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
    cta: "Comecar agora",
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

/* ===================================================================
   FAQ
   =================================================================== */
const faqs = [
  {
    q: "Preciso saber programar?",
    a: "Nao! A plataforma e 100% visual. Voce configura tudo pelo painel admin — exercicios, treinos, planos nutricionais, marca — sem tocar em codigo.",
  },
  {
    q: "Posso usar meu proprio dominio?",
    a: "Sim, no plano Business. Voce aponta seu dominio (ex: app.suaacademia.com) e seus alunos acessam o app com sua marca completa.",
  },
  {
    q: "Tem contrato de fidelidade?",
    a: "Nao. Todos os planos sao sem fidelidade. Voce pode cancelar a qualquer momento. No plano anual, o desconto e aplicado mas voce pode cancelar e o acesso permanece ate o final do periodo pago.",
  },
  {
    q: "Como funciona a IA?",
    a: "A IA analisa a anamnese do aluno, sugere treinos, responde duvidas pos-treino e pode ate criar planos nutricionais. Funciona como um assistente virtual do profissional.",
  },
  {
    q: "Meus alunos precisam baixar algum app?",
    a: "Nao! O app e PWA — funciona direto no navegador e pode ser instalado na tela inicial do celular como um app nativo. Sem App Store, sem Play Store.",
  },
  {
    q: "E se eu ja uso outra plataforma?",
    a: "Fazemos a migracao gratuita dos seus dados. Treinos, alunos, exercicios — tudo e importado para a nova plataforma sem custo adicional.",
  },
]

/* ===================================================================
   COMPARISON TABLE
   =================================================================== */
const comparisonRows = [
  { feature: "Preco mensal", ours: "A partir de R$97", mfit: "R$149+", treineme: "R$99+", personalapp: "R$129+" },
  { feature: "IA integrada", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "White-label", ours: true, mfit: false, treineme: "Parcial", personalapp: false },
  { feature: "Nutricao", ours: true, mfit: "Add-on", treineme: false, personalapp: false },
  { feature: "Comunidade", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "Correcao postural", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "CRM de vendas", ours: true, mfit: false, treineme: false, personalapp: false },
  { feature: "PWA (sem app store)", ours: true, mfit: false, treineme: true, personalapp: false },
]

/* ===================================================================
   FEATURES DATA
   =================================================================== */
const features = [
  {
    title: "Treinos Personalizados",
    desc: "Templates prontos, carga progressiva, periodizacao inteligente. Crie treinos profissionais em minutos.",
    icon: Dumbbell,
    image: IMAGES.trainerClient,
  },
  {
    title: "Inteligencia Artificial",
    desc: "Chat com IA, analise de anamnese, sugestoes automaticas e bot pos-treino. Seu assistente virtual 24/7.",
    icon: BotMessageSquare,
    image: IMAGES.groupFitness,
  },
  {
    title: "Correcao Postural",
    desc: "Camera em tempo real com inteligencia artificial. Feedback visual instantaneo durante a execucao dos exercicios.",
    icon: Camera,
    image: IMAGES.womanTraining,
  },
  {
    title: "Nutricao Completa",
    desc: "Planos alimentares personalizados, macros automaticos, lista de compras inteligente. Tudo integrado.",
    icon: Utensils,
    image: IMAGES.nutrition,
  },
]

/* ===================================================================
   TESTIMONIALS DATA
   =================================================================== */
const testimonials = [
  {
    name: "Rafael Santos",
    role: "Personal Trainer — SP",
    text: "Migrei do MFIT e economizo R$150/mes. Meus alunos amam o app e o engajamento triplicou. A IA e um diferencial absurdo.",
    avatar: IMAGES.testimonial1,
    stars: 5,
  },
  {
    name: "Ana Martins",
    role: "Nutricionista — RJ",
    text: "Finalmente consigo entregar planos de treino e nutricao no mesmo app. Meus pacientes se sentem num programa premium.",
    avatar: IMAGES.testimonial2,
    stars: 5,
  },
  {
    name: "Carlos Torres",
    role: "Dono de academia — MG",
    text: "O white-label mudou o jogo. Meus alunos usam o app com a marca da academia. Profissionalismo de outro nivel.",
    avatar: IMAGES.testimonial3,
    stars: 5,
  },
]

/* ===================================================================
   FAQ ITEM
   =================================================================== */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-slate-800 font-semibold text-[15px] pr-8 group-hover:text-blue-600 transition-colors duration-200">{q}</span>
        <ChevronDown className={cn(
          "w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300",
          open && "rotate-180",
        )} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-500", open ? "max-h-48 pb-6" : "max-h-0")}>
        <p className="text-slate-500 text-[15px] leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

/* ===================================================================
   COMPARISON CELL
   =================================================================== */
function ComparisonCell({ value, isOurs = false }: { value: boolean | string; isOurs?: boolean }) {
  if (typeof value === "boolean") {
    return value
      ? <CheckCircle2 className={cn("w-5 h-5 mx-auto", isOurs ? "text-emerald-500" : "text-slate-400")} />
      : <span className="text-slate-300 text-lg">&mdash;</span>
  }
  return <span className={cn("text-sm font-medium", isOurs ? "text-blue-600" : "text-slate-500")}>{value}</span>
}

/* ===================================================================
   PHONE MOCKUP -- CSS-only real app UI
   =================================================================== */
function PhoneMockup({ className }: { className?: string }) {
  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX"]
  const exercises = [
    "Leg Press 4x10-12",
    "Agachamento Hack 4x10-12",
    "Cadeira Extensora 3x12-15",
    "Mesa Flexora 3x12-15",
  ]
  const navItems = ["TREINO", "POSTURA", "NUTRI", "SOCIAL", "PERFIL"]

  return (
    <div className={cn("relative", className)}>
      {/* Phone frame */}
      <div className="w-[280px] md:w-[300px] h-[560px] md:h-[600px] rounded-[2.5rem] border-[3px] border-slate-700/60 bg-[#0a0a0a] p-[3px] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_60px_-10px_rgba(37,99,235,0.15)]">
        {/* Notch */}
        <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#0a0a0a] rounded-b-2xl z-20 flex items-center justify-center">
          <div className="w-[60px] h-[4px] rounded-full bg-[#1a1a1a]" />
        </div>

        {/* Screen */}
        <div className="w-full h-full rounded-[2.25rem] bg-[#0c0c0c] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1">
            <span className="text-[9px] text-white/40 font-medium">9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-[14px] h-[8px] rounded-[1px] border border-white/30 relative">
                <div className="absolute inset-[1px] right-[2px] bg-white/40 rounded-[0.5px]" />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center gap-3 px-5 pt-2 pb-3">
            <div className="w-10 h-10 rounded-full border-2 border-red-700 bg-neutral-800 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white/70">EM</span>
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold">Boa tarde, Em...</p>
              <p className="text-neutral-500 text-[10px]">Quinta-feira, 26 Mar</p>
            </div>
          </div>

          {/* Day selector */}
          <div className="flex gap-1.5 px-4 py-2">
            {days.map((d) => (
              <div key={d} className={cn(
                "flex-1 text-center py-1.5 rounded-lg text-[8px] font-bold tracking-wide",
                d === "QUI" ? "bg-red-600 text-white" : "bg-white/[0.04] text-neutral-500",
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Completed state */}
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white text-[12px] font-bold">Treino Concluido</p>
            <p className="text-neutral-500 text-[9px] mt-0.5 text-center px-6">Victor Personal Maquinas — C (Pernas/Gluteos)</p>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            {[
              { val: "6", label: "MINUTOS" },
              { val: "27", label: "SERIES" },
              { val: "10", label: "MAXIMO" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] rounded-lg py-2 text-center">
                <p className="text-white text-[14px] font-black">{s.val}</p>
                <p className="text-neutral-600 text-[7px] font-bold tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Exercise list */}
          <div className="flex-1 px-4 space-y-1.5 overflow-hidden">
            {exercises.map((ex) => (
              <div key={ex} className="flex items-center gap-2.5 bg-white/[0.03] rounded-lg px-3 py-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-white/70 text-[10px] font-medium">{ex}</span>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around py-3 px-2 border-t border-white/[0.06] mt-auto">
            {navItems.map((item, i) => (
              <div key={item} className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i === 0 ? "bg-red-500" : "bg-transparent",
                )} />
                <span className={cn(
                  "text-[7px] font-bold tracking-wide",
                  i === 0 ? "text-red-500" : "text-neutral-600",
                )}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow behind phone */}
      <div className="absolute inset-0 -z-10 bg-blue-500/[0.12] blur-[100px] rounded-full scale-150" />
    </div>
  )
}

/* ===================================================================
   DEMO FORM
   =================================================================== */
function DemoForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-lg">Solicitacao enviada!</p>
        <p className="text-slate-400 text-sm mt-2">Entraremos em contato em ate 24h.</p>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Seu nome" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
      <input type="email" placeholder="Seu email profissional" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
      <input type="tel" placeholder="WhatsApp (opcional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
      <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
        {loading ? "Enviando..." : "Solicitar demonstracao gratuita"}
      </button>
    </form>
  )
}

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */
export function B2BLandingPage() {
  const [annual, setAnnual] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden scroll-smooth antialiased">

      {/* ---- NAV ---- */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100"
          : "bg-transparent",
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16 md:h-20">
          <Link href="/b2b" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className={cn(
              "text-lg font-extrabold tracking-tight transition-colors duration-300",
              scrolled ? "text-slate-900" : "text-white",
            )}>ONEFIT</span>
          </Link>

          <div className={cn(
            "hidden md:flex items-center gap-8 text-sm font-medium transition-colors duration-300",
            scrolled ? "text-slate-600" : "text-white/80",
          )}>
            <a href="#features" className="hover:text-blue-600 transition-colors duration-200">Recursos</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors duration-200">Como funciona</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors duration-200">Planos</a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors duration-200">Comparativo</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors duration-200">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="#demo" className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200",
              scrolled ? "text-slate-600 hover:text-blue-600" : "text-white/80 hover:text-white",
            )}>
              Login
            </a>
            <a href="#pricing" className="text-sm font-bold px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20">
              Comecar agora
            </a>
          </div>

          <button className={cn(
            "md:hidden transition-colors",
            scrolled ? "text-slate-600" : "text-white",
          )} onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-100 px-6 pb-6 space-y-3">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-700 py-2.5 font-medium">Recursos</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-700 py-2.5 font-medium">Como funciona</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-700 py-2.5 font-medium">Planos</a>
            <a href="#comparison" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-700 py-2.5 font-medium">Comparativo</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-700 py-2.5 font-medium">FAQ</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-center text-sm font-bold px-5 py-3 rounded-xl bg-blue-600 text-white mt-2">
              Comecar agora
            </a>
          </div>
        )}
      </nav>

      {/* ================================================================
           HERO — Full-width gradient with photo overlay + phone mockup
         ================================================================ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src={IMAGES.heroGym}
            alt="Academia moderna"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/85 to-[#0f172a]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-24 pb-20">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-8 items-center">
            {/* Left — Copy */}
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white/90">Plataforma #1 para profissionais fitness</span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] mb-8 text-white">
                  Sua marca.<br />
                  <span className="italic text-blue-400">Nossa tecnologia.</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl mb-10">
                  A plataforma completa para personal trainers, nutricionistas e academias.
                  Treinos, nutricao, IA, comunidade e CRM — tudo white-label com a <strong className="text-white">sua identidade visual</strong>.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white text-base font-bold hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-600/30">
                    Comecar agora <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#demo" className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-base font-semibold hover:bg-white/20 transition-all duration-200">
                    <Play className="w-5 h-5" /> Ver demo
                  </a>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem fidelidade</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem cartao</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancele quando quiser</span>
                </div>
              </Reveal>
            </div>

            {/* Right — Phone */}
            <Reveal delay={300} direction="scale" className="hidden lg:flex items-center justify-center">
              <PhoneMockup />
            </Reveal>
          </div>
        </div>

        {/* Wave decoration bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40L48 35C96 30 192 20 288 22C384 24 480 38 576 44C672 50 768 48 864 42C960 36 1056 26 1152 24C1248 22 1344 28 1392 31L1440 34V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0V40Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ================================================================
           STATS BAR — Trust numbers
         ================================================================ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: 50, suffix: "+", label: "Profissionais ativos", icon: Users },
              { value: 1000, suffix: "+", label: "Alunos na plataforma", icon: Smartphone },
              { value: 256, suffix: "", label: "Exercicios com IA", icon: Dumbbell },
              { value: 4.9, suffix: "", label: "Avaliacao media", icon: Star, isDecimal: true },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-4xl md:text-5xl font-extrabold text-slate-900 tabular-nums">
                    {stat.isDecimal ? "4.9" : <AnimatedNumber value={stat.value} suffix={stat.suffix} />}
                  </p>
                  <p className="text-sm text-slate-500 font-medium mt-2">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
           "O PROBLEMA" — Pain points with image cards
         ================================================================ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">O problema</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Voce ainda gerencia seus alunos pelo <span className="italic text-blue-600">WhatsApp?</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Profissionais fitness perdem horas com planilhas, mensagens repetidas e ferramentas desconectadas. Isso acaba agora.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                image: IMAGES.trainerClient,
                title: "Treinos no papel ou planilha",
                desc: "Sem padronizacao, sem historico, sem carga progressiva. Alunos perdidos e resultados inconsistentes.",
              },
              {
                image: IMAGES.womanTraining,
                title: "Zero acompanhamento nutricional",
                desc: "Seus alunos treinam mas comem errado. Sem integracao nutricao + treino, resultados sao limitados.",
              },
              {
                image: IMAGES.groupFitness,
                title: "Alunos desmotivados",
                desc: "Sem comunidade, sem ranking, sem gamificacao. Alunos cancelam por falta de engajamento.",
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="group relative rounded-2xl overflow-hidden h-[420px] cursor-pointer">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
           FEATURES — Alternating image + text rows
         ================================================================ */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Recursos</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Tudo que voce precisa. <span className="italic text-blue-600">Numa so plataforma.</span>
              </h2>
              <p className="text-lg text-slate-500">
                8 modulos integrados para transformar seu negocio fitness.
              </p>
            </div>
          </Reveal>

          <div className="space-y-24">
            {features.map((feat, i) => {
              const Icon = feat.icon
              const isEven = i % 2 === 0
              return (
                <div key={i} className={cn(
                  "grid lg:grid-cols-2 gap-12 lg:gap-20 items-center",
                  !isEven && "lg:[direction:rtl]",
                )}>
                  <Reveal delay={100} direction={isEven ? "left" : "right"}>
                    <div className="relative rounded-2xl overflow-hidden h-[360px] lg:h-[440px] shadow-2xl shadow-slate-200/50 lg:[direction:ltr]">
                      <Image
                        src={feat.image}
                        alt={feat.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent" />
                    </div>
                  </Reveal>
                  <Reveal delay={200} className="lg:[direction:ltr]">
                    <div>
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mb-6">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{feat.title}</h3>
                      <p className="text-lg text-slate-500 leading-relaxed mb-8">{feat.desc}</p>
                      <a href="#pricing" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all duration-200">
                        Saiba mais <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </Reveal>
                </div>
              )
            })}
          </div>

          {/* Additional feature grid -- compact */}
          <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Comunidade & Ranking", desc: "Feed social, desafios e leaderboard gamificado." },
              { icon: BarChart3, title: "CRM de Vendas", desc: "Pipeline visual, lead scoring e automacoes." },
              { icon: Palette, title: "White-label Completo", desc: "Sua marca, suas cores, seu dominio proprio." },
              { icon: Smartphone, title: "PWA Nativo", desc: "Funciona como app nativo, sem App Store." },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group p-6 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-300">
                    <f.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
           HOW IT WORKS — 3 steps with connector lines
         ================================================================ */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="inline-block text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Como funciona</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                3 passos para transformar <span className="italic text-blue-400">seu negocio</span>
              </h2>
              <p className="text-lg text-slate-400">
                Monte seu app fitness profissional em minutos, sem codigo.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-blue-500/20 via-blue-500/60 to-blue-500/20" />

            {[
              {
                step: "01",
                title: "Crie sua conta",
                desc: "Cadastre-se em 30 segundos. Configure sua marca, cores e logo no painel admin.",
                icon: Shield,
              },
              {
                step: "02",
                title: "Monte seus treinos",
                desc: "Use templates prontos ou crie do zero. Adicione planos nutricionais, configure a IA.",
                icon: Dumbbell,
              },
              {
                step: "03",
                title: "Convide seus alunos",
                desc: "Compartilhe o link do app. Seus alunos instalam como PWA e comecam a treinar.",
                icon: Users,
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-[120px] h-[120px] rounded-full bg-blue-600/10 border-2 border-blue-500/30 mb-8 relative">
                    <step.icon className="w-10 h-10 text-blue-400" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-blue-600/30">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
           COMPARISON — Clean horizontal table
         ================================================================ */}
      <section id="comparison" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Comparativo</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Veja por que profissionais estao <span className="italic text-blue-600">migrando.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-sm font-semibold text-slate-600 py-4 px-6 w-[200px]">Recurso</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-blue-600 bg-blue-50">ONEFIT</th>
                    <th className="text-center text-sm text-slate-500 font-medium py-4 px-4">MFIT</th>
                    <th className="text-center text-sm text-slate-500 font-medium py-4 px-4">Treine.me</th>
                    <th className="text-center text-sm text-slate-500 font-medium py-4 px-4">Personal App</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="text-sm text-slate-700 py-4 px-6 font-medium">{row.feature}</td>
                      <td className="text-center py-4 px-4 bg-blue-50/50">
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
        </div>
      </section>

      {/* ================================================================
           PRICING — Clean cards with feature lists
         ================================================================ */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Planos</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Invista no seu <span className="italic text-blue-600">negocio.</span>
              </h2>
              <p className="text-lg text-slate-500">
                Sem fidelidade. Cancele quando quiser. Comece gratis por 14 dias.
              </p>
            </div>
          </Reveal>

          {/* Toggle */}
          <Reveal delay={80}>
            <div className="flex items-center justify-center gap-4 mb-16">
              <span className={cn("text-sm font-semibold transition-colors duration-200", !annual ? "text-slate-900" : "text-slate-400")}>Mensal</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors duration-200",
                  annual ? "bg-blue-600" : "bg-slate-200",
                )}
              >
                <div className={cn(
                  "absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-200",
                  annual ? "translate-x-[29px]" : "translate-x-[3px]",
                )} />
              </button>
              <span className={cn("text-sm font-semibold transition-colors duration-200", annual ? "text-slate-900" : "text-slate-400")}>
                Anual <span className="text-emerald-500 text-xs font-bold ml-1 bg-emerald-50 px-2 py-0.5 rounded-full">-30%</span>
              </span>
            </div>
          </Reveal>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {b2bTiers.map((tier, i) => {
              const isPro = tier.name === "Pro"
              const price = annual ? tier.annual : tier.monthly
              return (
                <Reveal key={tier.name} delay={i * 100}>
                  <div className={cn(
                    "relative rounded-2xl p-8 lg:p-10 h-full flex flex-col transition-all duration-300",
                    isPro
                      ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/20 scale-[1.02] lg:scale-105 z-10"
                      : "bg-white border border-slate-200 shadow-sm hover:shadow-lg",
                  )}>
                    {tier.tag && (
                      <span className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full",
                        isPro ? "bg-emerald-400 text-emerald-900" : "bg-blue-100 text-blue-600",
                      )}>{tier.tag}</span>
                    )}

                    <h3 className={cn(
                      "font-bold text-xl mb-2",
                      isPro ? "text-white" : "text-slate-900",
                    )}>{tier.name}</h3>

                    <div className="flex items-baseline gap-1 mb-8 mt-4">
                      <span className={cn("text-sm", isPro ? "text-blue-200" : "text-slate-400")}>R$</span>
                      <span className={cn(
                        "font-extrabold tabular-nums tracking-tight",
                        isPro ? "text-6xl text-white" : "text-5xl text-slate-900",
                      )}>
                        {price.toFixed(0)}
                      </span>
                      <span className={cn("text-sm", isPro ? "text-blue-200" : "text-slate-400")}>/mes</span>
                    </div>

                    <div className="space-y-3 mb-10 flex-1">
                      {tier.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <CheckCircle2 className={cn("w-5 h-5 shrink-0 mt-0.5", isPro ? "text-emerald-300" : "text-emerald-500")} />
                          <span className={cn("text-[14px] leading-snug", isPro ? "text-blue-100" : "text-slate-600")}>{f}</span>
                        </div>
                      ))}
                      {tier.notIncluded.map((f, j) => (
                        <div key={j} className="flex items-start gap-3 opacity-40">
                          <span className={cn("text-xs mt-1 shrink-0 w-5 text-center", isPro ? "text-blue-300" : "text-slate-400")}>&mdash;</span>
                          <span className={cn("text-[14px] leading-snug", isPro ? "text-blue-200" : "text-slate-400")}>{f}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={tier.name === "Business"
                        ? waLink("Ola! Tenho interesse no plano Business da ONEFIT.")
                        : waLink(`Ola! Quero comecar com o plano ${tier.name} da ONEFIT.`)}
                      target="_blank" rel="noopener noreferrer"
                      className={cn(
                        "block text-center py-4 rounded-xl font-bold text-sm transition-all duration-200",
                        isPro
                          ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20",
                      )}
                    >
                      {tier.cta}
                    </a>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
           TESTIMONIALS — Cards with real photos
         ================================================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Depoimentos</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Quem usa, <span className="italic text-blue-600">recomenda.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <blockquote className="text-slate-700 leading-relaxed flex-1 mb-8 text-[15px]">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-500 text-sm">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
           FAQ — Accordion
         ================================================================ */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <span className="inline-block text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">FAQ</span>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  Perguntas <span className="italic text-blue-600">frequentes</span>
                </h2>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
           CTA BANNER — Full-width gradient with demo form
         ================================================================ */}
      <section id="demo" className="relative py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src={IMAGES.groupFitness}
            alt="Fitness background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/90 to-[#0f172a]/95" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left */}
            <div>
              <Reveal>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
                  Pronto para<br />
                  <span className="italic text-blue-400">comecar?</span>
                </h2>
              </Reveal>

              <Reveal delay={80}>
                <p className="text-lg text-slate-300 leading-relaxed max-w-md mb-8">
                  Monte seu app fitness em minutos. Sem codigo, sem complicacao. Sem fidelidade para testar tudo.
                </p>
              </Reveal>

              <Reveal delay={160}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-600/30">
                    Comecar agora <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href={waLink("Ola! Quero saber mais sobre a ONEFIT white-label.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right — Demo form */}
            <Reveal delay={200}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                <p className="text-white font-bold text-xl mb-2">Solicitar demonstracao</p>
                <p className="text-slate-400 text-sm mb-6">Preencha e entraremos em contato em ate 24h</p>
                <DemoForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
           FOOTER — Dark with organized links
         ================================================================ */}
      <footer className="bg-[#0f172a] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-extrabold tracking-tight">ONEFIT</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                A plataforma completa para profissionais fitness. Treinos, nutricao, IA, comunidade e CRM — tudo white-label.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href={waLink("Ola! Quero saber mais sobre a plataforma.")}
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Produto</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-sm text-slate-400 hover:text-white transition-colors">Recursos</a>
                <a href="#pricing" className="block text-sm text-slate-400 hover:text-white transition-colors">Planos</a>
                <a href="#comparison" className="block text-sm text-slate-400 hover:text-white transition-colors">Comparativo</a>
                <a href="#faq" className="block text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4 text-white">Contato</h4>
              <div className="space-y-3">
                <a href={`mailto:${EMMANUEL_EMAIL}`} className="block text-sm text-slate-400 hover:text-white transition-colors">{EMMANUEL_EMAIL}</a>
                <a
                  href={waLink("Ola!")}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs">
              &copy; 2026 Desenvolvido por Emmanuel Bezerra. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-slate-500 text-xs">
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Termos de uso</span>
              <span className="hover:text-slate-300 transition-colors cursor-pointer">Politica de privacidade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
