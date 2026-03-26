"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  ChevronDown, MessageCircle, ArrowRight,
  Menu, X as XIcon,
  Dumbbell, Utensils, Camera, Users,
  BarChart3, Palette, Smartphone, BotMessageSquare,
  CheckCircle2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ParticleTextEffect } from "@/components/ui/particle-text-effect"

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
   FEATURES DATA (for radar + detail cards)
   ═══════════════════════════════════════════ */
const features = [
  {
    num: "01",
    title: "Treinos & Nutricao",
    desc: "Templates personalizados, carga progressiva, planos alimentares, macros e lista de compras. Tudo integrado.",
    icon: Dumbbell,
    shortLabel: "Treinos",
  },
  {
    num: "02",
    title: "Inteligencia Artificial",
    desc: "Chat com IA, analise de anamnese, sugestoes automaticas e bot pos-treino. Seu assistente virtual 24/7.",
    icon: BotMessageSquare,
    shortLabel: "IA",
  },
  {
    num: "03",
    title: "Correcao Postural",
    desc: "Camera em tempo real com MediaPipe. Feedback visual instantaneo durante a execucao dos exercicios.",
    icon: Camera,
    shortLabel: "Postura",
  },
  {
    num: "04",
    title: "Comunidade & Ranking",
    desc: "Feed social, desafios, leaderboard gamificado. Engajamento real entre seus alunos.",
    icon: Users,
    shortLabel: "Social",
  },
  {
    num: "05",
    title: "CRM de Vendas",
    desc: "Pipeline visual, lead scoring, automacoes. Transforme curiosos em alunos pagantes.",
    icon: BarChart3,
    shortLabel: "CRM",
  },
  {
    num: "06",
    title: "Nutricao Completa",
    desc: "Planos alimentares personalizados, macros automaticos, lista de compras inteligente.",
    icon: Utensils,
    shortLabel: "Nutri",
  },
  {
    num: "07",
    title: "White-label Completo",
    desc: "Sua marca, suas cores, seu dominio. Seus alunos nunca sabem que nao foi voce quem construiu o app.",
    icon: Palette,
    shortLabel: "Marca",
  },
  {
    num: "08",
    title: "PWA Nativo",
    desc: "Funciona como app nativo sem App Store. Instalavel, offline-ready, notificacoes push.",
    icon: Smartphone,
    shortLabel: "PWA",
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
   RADAR FEATURE DISPLAY — Dark theme, blue sweep
   Customized radar with fitness feature icons
   ═══════════════════════════════════════════ */
function FeatureRadar({ onSelectFeature }: { onSelectFeature: (idx: number) => void }) {
  /* Icon positions around radar in clock positions */
  const positions: React.CSSProperties[] = [
    { top: "4%",  left: "44%"  },
    { top: "12%", right: "14%" },
    { top: "38%", right: "2%"  },
    { bottom: "22%", right: "12%" },
    { bottom: "6%", left: "44%" },
    { bottom: "22%", left: "12%" },
    { top: "38%", left: "2%"  },
    { top: "12%", left: "14%" },
  ]

  return (
    <div className="relative w-[360px] h-[360px] md:w-[440px] md:h-[440px]">
      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-slate-700/40"
            style={{
              width: `${i * 25}%`,
              height: `${i * 25}%`,
            }}
          />
        ))}
      </div>

      {/* Cross-hair lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-full h-[1px] bg-slate-700/20" />
        <div className="absolute h-full w-[1px] bg-slate-700/20" />
      </div>

      {/* Sweep line — blue themed */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-1/2 h-0.5 origin-left"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.7) 50%, rgba(59,130,246,0) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        {/* Sweep trail / cone */}
        <motion.div
          className="absolute w-1/2 origin-left"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.08) 25deg, transparent 50deg)",
            height: "50%",
            clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Center pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
        <div className="absolute w-6 h-6 rounded-full border border-blue-500/30 animate-ping" />
      </div>

      {/* Feature icons */}
      {features.map((f, i) => {
        const Icon = f.icon
        return (
          <RadarIcon
            key={f.num}
            icon={Icon}
            label={f.shortLabel}
            delay={i * 0.6}
            style={positions[i]}
            onClick={() => onSelectFeature(i)}
          />
        )
      })}
    </div>
  )
}

/* ── Radar icon container with blip animation ── */
function RadarIcon({
  icon: Icon,
  label,
  delay,
  style,
  onClick,
}: {
  icon: typeof Dumbbell
  label: string
  delay: number
  style: React.CSSProperties
  onClick: () => void
}) {
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true)
      intervalRef.current = setInterval(() => {
        setVisible(false)
        setTimeout(() => setVisible(true), 400)
      }, 5000)
    }, delay * 1000)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [delay])

  return (
    <div className="absolute z-10 cursor-pointer" style={style} onClick={onClick}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="relative p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.12)] group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all duration-300">
              <Icon className="w-5 h-5 text-blue-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap group-hover:text-blue-400 transition-colors duration-200">
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ELECTRIC BACKGROUND — CSS-only shader effect
   Used as decorative background in CTA section
   ═══════════════════════════════════════════ */
function ElectricBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs that create an electric feel */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px]"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          top: "-20%",
          right: "-10%",
          animation: "electricFloat1 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]"
        style={{
          background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
          bottom: "-10%",
          left: "-5%",
          animation: "electricFloat2 10s ease-in-out infinite",
        }}
      />
      {/* Horizontal electric lines */}
      <div
        className="absolute top-1/3 left-0 right-0 h-[1px] opacity-[0.06]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #3b82f6 20%, transparent 40%, #3b82f6 60%, transparent 80%, #3b82f6 100%)",
          animation: "electricSlide 3s linear infinite",
        }}
      />
      <div
        className="absolute top-2/3 left-0 right-0 h-[1px] opacity-[0.04]"
        style={{
          background: "linear-gradient(90deg, #3b82f6 0%, transparent 20%, #3b82f6 40%, transparent 60%, #3b82f6 80%, transparent 100%)",
          animation: "electricSlide 4s linear infinite reverse",
        }}
      />
      {/* Vertical pulse lines */}
      <div
        className="absolute top-0 bottom-0 left-1/4 w-[1px] opacity-[0.04]"
        style={{
          background: "linear-gradient(180deg, transparent 0%, #3b82f6 30%, transparent 50%, #3b82f6 70%, transparent 100%)",
          animation: "electricPulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-1/3 w-[1px] opacity-[0.03]"
        style={{
          background: "linear-gradient(180deg, #3b82f6 0%, transparent 30%, #3b82f6 50%, transparent 70%, #3b82f6 100%)",
          animation: "electricPulse 6s ease-in-out infinite reverse",
        }}
      />
      {/* Inject keyframes */}
      <style>{`
        @keyframes electricFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.1); }
          66% { transform: translate(20px, -15px) scale(0.95); }
        }
        @keyframes electricFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -25px) scale(1.15); }
        }
        @keyframes electricSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes electricPulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.08; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function B2BLandingPage() {
  const [annual, setAnnual] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null)

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

      {/* ══════════════════════════════════════
           PARTICLE TEXT — Visual wow-moment
           Between hero and numbers
         ══════════════════════════════════════ */}
      <section className="relative h-[280px] md:h-[340px] overflow-hidden border-y border-white/[0.04]">
        <div className="absolute inset-0">
          <ParticleTextEffect
            words={["SUA MARCA", "NOSSA TECH", "SEU APP", "SEUS ALUNOS"]}
            particleColor="#3b82f6"
            fontSize={48}
            particleDensity={3}
            className="opacity-60"
          />
        </div>
        {/* Gradient fade edges for seamless blend */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#08080a] via-transparent to-[#08080a]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#08080a]/60 via-transparent to-[#08080a]/60" />
      </section>

      {/* ──── NUMBERS BAR ──── */}
      <div className="border-b border-white/[0.06]">
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
           FEATURES — Radar + Detail Card
         ══════════════════════════════════════ */}
      <section id="features" className="py-28 md:py-36 px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-4">RECURSOS</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] text-white max-w-xl mb-6">
              Tudo que voce precisa. Numa so plataforma.
            </h2>
            <p className="text-[15px] text-neutral-500 leading-relaxed max-w-lg mb-16">
              Clique nos icones do radar para explorar cada recurso. 8 modulos integrados numa unica solucao.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Radar */}
            <Reveal delay={100} className="flex items-center justify-center">
              <FeatureRadar onSelectFeature={setSelectedFeature} />
            </Reveal>

            {/* Right — Feature detail card */}
            <Reveal delay={200}>
              <div className="space-y-6">
                {selectedFeature !== null ? (
                  <motion.div
                    key={selectedFeature}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] flex items-center justify-center">
                        {(() => {
                          const Icon = features[selectedFeature].icon
                          return <Icon className="w-5 h-5 text-blue-400" />
                        })()}
                      </div>
                      <div>
                        <span className="text-[11px] text-blue-500 font-mono uppercase tracking-wider">{features[selectedFeature].num}</span>
                        <h3 className="text-white font-bold text-xl tracking-[-0.02em]">{features[selectedFeature].title}</h3>
                      </div>
                    </div>
                    <p className="text-[15px] text-neutral-400 leading-relaxed">{features[selectedFeature].desc}</p>
                  </motion.div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                    <p className="text-neutral-600 text-[15px] text-center">
                      Selecione um recurso no radar para ver detalhes
                    </p>
                  </div>
                )}

                {/* Feature grid summary — always visible */}
                <div className="grid grid-cols-2 gap-3">
                  {features.map((f, i) => {
                    const Icon = f.icon
                    const isActive = selectedFeature === i
                    return (
                      <button
                        key={f.num}
                        onClick={() => setSelectedFeature(i)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                          isActive
                            ? "border-blue-500/30 bg-blue-500/[0.06]"
                            : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.03]",
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-400" : "text-neutral-600")} />
                        <span className={cn("text-[13px] font-medium", isActive ? "text-white" : "text-neutral-500")}>
                          {f.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Reveal>
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
           CTA FOOTER — with electric background
         ══════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-6 border-t border-white/[0.06] overflow-hidden">
        {/* Electric shader background */}
        <ElectricBackground />

        <div className="relative z-10 max-w-[1200px] mx-auto">
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
