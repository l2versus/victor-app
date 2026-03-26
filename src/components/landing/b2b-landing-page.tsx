"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronDown, MessageCircle, ArrowRight,
  Menu, X as XIcon,
  Dumbbell, Utensils, Camera, Users,
  BarChart3, Palette, Smartphone, BotMessageSquare,
  CheckCircle2,
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
   HOOKS
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

/* ═══════════════════════════════════════════
   COMPARISON TABLE
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   FAQ ITEM
   ═══════════════════════════════════════════ */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-7 text-left group"
      >
        <span className="text-white font-medium text-[15px] pr-8 group-hover:text-blue-500 transition-colors duration-200">{q}</span>
        <span className={cn(
          "text-neutral-600 text-xl font-light shrink-0 transition-transform duration-300 select-none",
          open && "rotate-45",
        )}>+</span>
      </button>
      <div className={cn("overflow-hidden transition-all duration-500", open ? "max-h-48 pb-7" : "max-h-0")}>
        <p className="text-neutral-400 text-[15px] leading-relaxed max-w-lg">{a}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPARISON CELL
   ═══════════════════════════════════════════ */
function ComparisonCell({ value, isOurs = false }: { value: boolean | string; isOurs?: boolean }) {
  if (typeof value === "boolean") {
    return value
      ? <span className={cn("text-sm", isOurs ? "text-blue-500" : "text-neutral-400")}>&#10003;</span>
      : <span className="text-neutral-700">&mdash;</span>
  }
  return <span className={cn("text-sm", isOurs ? "text-white" : "text-neutral-500")}>{value}</span>
}

/* ═══════════════════════════════════════════
   PHONE MOCKUP — CSS-only real app UI
   ═══════════════════════════════════════════ */
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
      <div className="w-[280px] md:w-[300px] h-[560px] md:h-[600px] rounded-[2.5rem] border-[2px] border-[#1a1a1a] bg-[#0a0a0a] p-[3px] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]">
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
            {days.map((d, i) => (
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

      {/* Subtle glow behind phone */}
      <div className="absolute inset-0 -z-10 bg-blue-500/[0.07] blur-[100px] rounded-full scale-125" />
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
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-white font-medium text-[15px]">Solicitacao enviada!</p>
        <p className="text-neutral-500 text-sm mt-2">Entraremos em contato em ate 24h.</p>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-3 bg-transparent border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/40 transition-colors duration-200"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="text" placeholder="Seu nome" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
      <input type="email" placeholder="Seu email profissional" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
      <input type="tel" placeholder="WhatsApp (opcional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
      <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:brightness-110 transition-all duration-200 disabled:opacity-50">
        {loading ? "Enviando..." : "Solicitar demonstracao"}
      </button>
    </form>
  )
}

/* ═══════════════════════════════════════════
   FEATURES DATA
   ═══════════════════════════════════════════ */
const features = [
  {
    num: "01",
    title: "Treinos & Nutricao",
    desc: "Templates personalizados, carga progressiva, planos alimentares, macros e lista de compras. Tudo integrado.",
    icon: <Dumbbell className="w-5 h-5" />,
  },
  {
    num: "02",
    title: "Inteligencia Artificial",
    desc: "Chat com IA, analise de anamnese, sugestoes automaticas e bot pos-treino. Seu assistente virtual 24/7.",
    icon: <BotMessageSquare className="w-5 h-5" />,
  },
  {
    num: "03",
    title: "Correcao Postural",
    desc: "Camera em tempo real com MediaPipe. Feedback visual instantaneo durante a execucao dos exercicios.",
    icon: <Camera className="w-5 h-5" />,
  },
  {
    num: "04",
    title: "White-label Completo",
    desc: "Sua marca, suas cores, seu dominio. Seus alunos nunca sabem que nao foi voce quem construiu o app.",
    icon: <Palette className="w-5 h-5" />,
  },
]

/* ═══════════════════════════════════════════
   TESTIMONIALS DATA
   ═══════════════════════════════════════════ */
const testimonials = [
  {
    name: "Rafael Santos",
    role: "Personal Trainer — SP",
    text: "Migrei do MFIT e economizo R$150/mes. Meus alunos amam o app e o engajamento triplicou. A IA e um diferencial absurdo.",
  },
  {
    name: "Ana Martins",
    role: "Nutricionista — RJ",
    text: "Finalmente consigo entregar planos de treino e nutricao no mesmo app. Meus pacientes se sentem num programa premium.",
  },
  {
    name: "Carlos Torres",
    role: "Dono de academia — MG",
    text: "O white-label mudou o jogo. Meus alunos usam o app com a marca da academia. Profissionalismo de outro nivel.",
  },
]

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function B2BLandingPage() {
  const [annual, setAnnual] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  return (
    <div className="min-h-screen bg-[#08080a] text-white overflow-x-hidden scroll-smooth antialiased">

      {/* ──── NAV ──── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#08080a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/b2b" className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-white">CB</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] text-neutral-500 font-medium">
            <a href="#features" className="hover:text-white transition-colors duration-200">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Planos</a>
            <a href="#comparison" className="hover:text-white transition-colors duration-200">Comparativo</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </div>

          <div className="hidden md:block">
            <a href="#pricing" className="text-[13px] font-semibold px-5 py-2 rounded-lg bg-blue-500 text-white hover:brightness-110 transition-all duration-200">
              Comecar
            </a>
          </div>

          <button className="md:hidden text-neutral-400" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-[#08080a]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 pb-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Recursos</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Planos</a>
            <a href="#comparison" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">Comparativo</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} className="block text-sm text-neutral-300 py-2">FAQ</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-center text-sm font-semibold px-5 py-2.5 rounded-lg bg-blue-500 text-white">
              Comecar
            </a>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════
           HERO
         ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-14">
        <div className="max-w-[1200px] mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 lg:gap-8 items-center">
            {/* Left — Copy */}
            <div>
              <Reveal>
                <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-6">
                  PLATAFORMA FITNESS WHITE-LABEL
                </p>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
                  Sua marca,<br />
                  nossa <span className="text-blue-500">tecnologia.</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="text-[15px] text-neutral-400 leading-relaxed max-w-lg mb-8">
                  A plataforma definitiva para personal trainers, nutricionistas e academias.
                  Treinos, nutricao, IA e comunidade — tudo white-label com sua identidade.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:brightness-110 transition-all duration-200">
                    Comecar gratis
                  </a>
                  <a href="#features" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 font-medium hover:text-white transition-colors duration-200">
                    Ver demonstracao <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <p className="text-[13px] text-neutral-600">
                  14 dias gratis &middot; Sem cartao &middot; Cancele quando quiser
                </p>
              </Reveal>
            </div>

            {/* Right — Phone */}
            <Reveal delay={200} direction="scale" className="hidden lg:flex items-center justify-center">
              <PhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──── NUMBERS BAR ──── */}
      <div className="border-y border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-8 text-center">
            <Reveal>
              <p className="text-4xl md:text-5xl font-black text-white tabular-nums"><AnimatedNumber value={50} suffix="+" /></p>
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mt-3">Profissionais</p>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-4xl md:text-5xl font-black text-white tabular-nums"><AnimatedNumber value={1000} suffix="+" /></p>
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mt-3">Alunos</p>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-4xl md:text-5xl font-black text-white tabular-nums">4.9</p>
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mt-3">Avaliacao</p>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
           FEATURES — Editorial numbered rows
         ══════════════════════════════════════ */}
      <section id="features" className="py-28 md:py-36 px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">RECURSOS</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white max-w-xl mb-20">
              Tudo que voce precisa. Numa so plataforma.
            </h2>
          </Reveal>

          <div className="space-y-0">
            {features.map((f, i) => {
              const isEven = i % 2 === 1
              return (
                <Reveal key={f.num} delay={i * 80}>
                  <div className={cn(
                    "grid md:grid-cols-[1fr_2fr_auto] items-center gap-8 md:gap-12 py-12 border-t border-white/[0.06]",
                    isEven && "md:grid-cols-[auto_2fr_1fr]",
                  )}>
                    {/* Number */}
                    <div className={cn(isEven && "md:order-3")}>
                      <span className="text-7xl md:text-8xl font-black text-neutral-800 select-none">{f.num}</span>
                    </div>

                    {/* Text */}
                    <div className={cn(isEven && "md:order-2")}>
                      <h3 className="text-white font-bold text-xl md:text-2xl mb-3 tracking-[-0.02em]">{f.title}</h3>
                      <p className="text-[15px] text-neutral-400 leading-relaxed max-w-lg">{f.desc}</p>
                    </div>

                    {/* Icon */}
                    <div className={cn("flex", isEven ? "md:order-1 md:justify-start" : "md:justify-end")}>
                      <div className="w-14 h-14 rounded-full border border-white/[0.08] flex items-center justify-center text-neutral-400">
                        {f.icon}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
            {/* Bottom border for last item */}
            <div className="border-t border-white/[0.06]" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           COMPARISON — Clean horizontal table
         ══════════════════════════════════════ */}
      <section id="comparison" className="py-28 md:py-36 px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">COMPARATIVO</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white max-w-xl mb-16">
              Veja por que profissionais estao migrando.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 py-4 pr-6 w-[200px]">Recurso</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-blue-500 border-l border-blue-500/20">CB Platform</th>
                    <th className="text-center text-[11px] uppercase tracking-[0.15em] text-neutral-600 font-medium py-4 px-4">MFIT</th>
                    <th className="text-center text-[11px] uppercase tracking-[0.15em] text-neutral-600 font-medium py-4 px-4">Treine.me</th>
                    <th className="text-center text-[11px] uppercase tracking-[0.15em] text-neutral-600 font-medium py-4 px-4">Personal App</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td className="text-[15px] text-neutral-300 py-4 pr-6 font-medium">{row.feature}</td>
                      <td className="text-center py-4 px-4 border-l border-blue-500/20">
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

      {/* ══════════════════════════════════════
           PRICING — Editorial layout, Pro dominant
         ══════════════════════════════════════ */}
      <section id="pricing" className="py-28 md:py-36 px-6 border-y border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">PLANOS</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white mb-3">
              Invista no seu negocio.
            </h2>
            <p className="text-[15px] text-neutral-400 leading-relaxed max-w-lg mb-10">
              Sem fidelidade. Cancele quando quiser. Comece gratis por 14 dias.
            </p>
          </Reveal>

          {/* Toggle */}
          <Reveal delay={80}>
            <div className="flex items-center gap-4 mb-16">
              <span className={cn("text-sm transition-colors duration-200", !annual ? "text-white font-semibold" : "text-neutral-600")}>Mensal</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200",
                  annual ? "bg-blue-500" : "bg-white/10",
                )}
              >
                <div className={cn(
                  "absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200",
                  annual ? "translate-x-[27px]" : "translate-x-[3px]",
                )} />
              </button>
              <span className={cn("text-sm transition-colors duration-200", annual ? "text-white font-semibold" : "text-neutral-600")}>
                Anual <span className="text-blue-500 text-xs font-medium ml-1">-30%</span>
              </span>
            </div>
          </Reveal>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {b2bTiers.map((tier, i) => {
              const isPro = tier.name === "Pro"
              const price = annual ? tier.annual : tier.monthly
              return (
                <Reveal key={tier.name} delay={i * 80}>
                  <div className={cn(
                    "bg-[#08080a] p-8 md:p-10 h-full flex flex-col relative",
                    isPro && "bg-[#0a0a0e]",
                  )}>
                    {/* Pro left accent */}
                    {isPro && <div className="absolute left-0 top-8 bottom-8 w-[2px] bg-blue-500" />}

                    {tier.tag && (
                      <span className="text-[11px] uppercase tracking-[0.15em] font-medium text-blue-500 mb-4 block">{tier.tag}</span>
                    )}
                    {!tier.tag && <div className="mb-4 h-[17px]" />}

                    <h3 className="text-white font-bold text-lg mb-6">{tier.name}</h3>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-neutral-500 text-sm">R$</span>
                      <span className={cn(
                        "font-black tabular-nums tracking-tight text-white",
                        isPro ? "text-[4rem] leading-none" : "text-[3rem] leading-none",
                      )}>
                        {price.toFixed(0)}
                      </span>
                      <span className="text-neutral-600 text-sm">/mes</span>
                    </div>

                    <div className="space-y-3 mb-10 flex-1">
                      {tier.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <span className="text-blue-500 text-xs mt-0.5 shrink-0">&#10003;</span>
                          <span className="text-[14px] text-neutral-300 leading-snug">{f}</span>
                        </div>
                      ))}
                      {tier.notIncluded.map((f, j) => (
                        <div key={j} className="flex items-start gap-2.5 opacity-30">
                          <span className="text-neutral-600 text-xs mt-0.5 shrink-0">&mdash;</span>
                          <span className="text-[14px] text-neutral-600 leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={tier.name === "Business"
                        ? waLink("Ola! Tenho interesse no plano Business da plataforma fitness.")
                        : waLink(`Ola! Quero comecar com o plano ${tier.name} da plataforma fitness.`)}
                      target="_blank" rel="noopener noreferrer"
                      className={cn(
                        "block text-center py-3.5 rounded-lg font-semibold text-sm transition-all duration-200",
                        isPro
                          ? "bg-blue-500 text-white hover:brightness-110"
                          : "border border-white/[0.1] text-white hover:border-white/[0.2] hover:bg-white/[0.03]",
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

      {/* ══════════════════════════════════════
           TESTIMONIALS — Large single quote
         ══════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">DEPOIMENTOS</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white mb-20">
              Quem usa, recomenda.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative max-w-3xl">
              {/* Oversized decorative quote */}
              <span className="absolute -top-16 -left-4 text-[12rem] leading-none font-serif text-white/[0.04] select-none pointer-events-none">&ldquo;</span>

              <div className="relative">
                {testimonials.map((t, i) => (
                  <div key={i} className={cn(
                    "transition-all duration-500",
                    activeTestimonial === i ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none",
                  )}>
                    <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-snug tracking-[-0.02em] mb-10">
                      {t.text}
                    </blockquote>
                    <div>
                      <p className="text-white font-semibold text-[15px]">{t.name}</p>
                      <p className="text-neutral-500 text-sm mt-1">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex items-center gap-2 mt-12">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-200",
                      activeTestimonial === i ? "bg-blue-500" : "bg-white/[0.15] hover:bg-white/[0.3]",
                    )}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="py-28 md:py-36 px-6 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-2xl">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">FAQ</p>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white mb-12">
                Perguntas frequentes
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div>
                {faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
           CTA FOOTER
         ══════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
            {/* Left */}
            <div>
              <Reveal>
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold tracking-[-0.04em] leading-[0.95] text-white mb-6">
                  Pronto para<br />comecar?
                </h2>
              </Reveal>

              <Reveal delay={80}>
                <p className="text-[15px] text-neutral-400 leading-relaxed max-w-md mb-8">
                  Monte seu app fitness em minutos. Sem codigo, sem complicacao. 14 dias gratis.
                </p>
              </Reveal>

              <Reveal delay={160}>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:brightness-110 transition-all duration-200">
                    Comecar gratis
                  </a>
                  <a
                    href={waLink("Ola! Quero saber mais sobre a plataforma fitness white-label.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-neutral-400 font-medium hover:text-white transition-colors duration-200"
                  >
                    <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right — Demo form */}
            <Reveal delay={200}>
              <div>
                <p className="text-white font-bold text-lg mb-1">Solicitar demonstracao</p>
                <p className="text-neutral-500 text-sm mb-6">Preencha e entraremos em contato em ate 24h</p>
                <DemoForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-neutral-600 text-xs">
            &copy; 2026 Desenvolvido por Emmanuel Bezerra
          </p>
          <div className="flex items-center gap-6 text-neutral-600 text-xs">
            <span className="hover:text-neutral-400 transition-colors cursor-pointer">Termos</span>
            <span className="hover:text-neutral-400 transition-colors cursor-pointer">Privacidade</span>
            <a href={`mailto:${EMMANUEL_EMAIL}`} className="hover:text-neutral-400 transition-colors">{EMMANUEL_EMAIL}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
