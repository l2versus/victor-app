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
    const tick = () => {
      const p = Math.min((Date.now() - start) / 2000, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
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
      { t: "Chat IA pós-treino", ok: false },
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
      { t: "Chat IA pós-treino", ok: true },
      { t: "Geração de treino por IA", ok: true },
      { t: "Análise de anamnese IA", ok: true },
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
          <p className="text-red-400 text-xs font-medium tracking-wider uppercase">CREF 123456-G/CE</p>
        </div>
      )}
    </div>
  )
}

function Logo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/img/logo.png"
      alt="VO Personal"
      width={size}
      height={size}
      className="rounded-xl"
    />
  )
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
export function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [duration, setDuration] = useState<Duration>("SEMIANNUAL")
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-x-hidden relative">

      {/* ═══ NAV ═══ */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-700",
        scrollY > 80 ? "bg-[#030303]/95 backdrop-blur-2xl border-b border-white/[0.04] py-3" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={44} />
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
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.05] transition-colors">
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

      {/* ═══ HERO — Cinematic split ═══ */}
      <section className="relative min-h-screen flex items-center px-5 sm:px-8 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/3 w-[600px] h-[600px] rounded-full bg-red-600/[0.06] blur-[150px]" style={{ transform: `translateY(${scrollY * -0.15}px)` }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-red-900/[0.04] blur-[120px]" style={{ transform: `translateY(${scrollY * -0.1}px)` }} />
          {/* Diagonal line */}
          <div className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-red-600/10 to-transparent hidden lg:block" />
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
                Consultoria fitness com <span className="text-white font-semibold">inteligência artificial integrada</span>,
                treinos 100% individualizados e acompanhamento de evolução em tempo real.
                <span className="text-neutral-500 block mt-2 text-sm">
                  Por Victor Oliveira — CREF 123456-G/SP
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

          {/* Right — Photo */}
          <Reveal delay={400} direction="scale">
            <div className="relative">
              <TrainerPhoto className="w-full aspect-[4/5] max-w-md mx-auto lg:ml-auto" hero />
              {/* Floating badge */}
              <div className="absolute -left-4 top-1/3 px-4 py-3 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.06] shadow-2xl animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">IA Integrada</p>
                    <p className="text-[10px] text-neutral-500">Treinos inteligentes</p>
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
              <span className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-purple-500/60" /> Inteligência Artificial</span>
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
      <section id="sobre" className="py-24 sm:py-36 px-5 sm:px-8">
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
                Cada aluno recebe um tratamento 100% individualizado — desde a análise de restrições médicas por IA
                até a correção de postura em tempo real por câmera. Sem planilhas genéricas. Sem achismo.
              </p>
            </Reveal>
            <Reveal direction="right" delay={200}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Dumbbell, label: "Especialista em\nhipertrofia", color: "text-red-400 bg-red-600/10 border-red-500/10" },
                  { icon: Brain, label: "IA aplicada\nao treino", color: "text-purple-400 bg-purple-600/10 border-purple-500/10" },
                  { icon: Shield, label: "CREF ativo\n123456-G/SP", color: "text-emerald-400 bg-emerald-600/10 border-emerald-500/10" },
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
              { icon: Brain, title: "IA que entende seu corpo", desc: "Treinos gerados considerando histórico, restrições, objetivos e feedback. Análise de anamnese automática com classificação de riscos.", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/25" },
              { icon: Camera, title: "Correção em tempo real", desc: "A câmera do celular analisa seus movimentos durante o exercício e corrige postura instantaneamente. Exclusivo.", color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/25" },
              { icon: Target, title: "Treino sob medida", desc: "Cada série, carga e descanso calculados para o SEU corpo. Nada genérico, nada copiado. 100% individual.", color: "from-red-500 to-red-600", bg: "bg-red-500/5 border-red-500/10 hover:border-red-500/25" },
              { icon: TrendingUp, title: "Evolução visível", desc: "Dashboard pessoal com gráficos de carga, frequência, streaks e histórico. Você VÊ o progresso acontecendo.", color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/25" },
              { icon: MessageCircle, title: "Feedback inteligente", desc: "Após cada treino, a IA coleta feedback (energia, dor, sono) e ajusta automaticamente a próxima sessão.", color: "from-amber-500 to-orange-500", bg: "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/25" },
              { icon: Shield, title: "Segurança clínica", desc: "Lesões, medicamentos e restrições analisados pela IA antes de qualquer prescrição. Seu treino respeita seu corpo.", color: "from-teal-400 to-cyan-500", bg: "bg-teal-500/5 border-teal-500/10 hover:border-teal-500/25" },
            ].map((feat, i) => (
              <Reveal key={feat.title} delay={i * 80}>
                <div className={cn("group relative rounded-2xl border p-7 transition-all duration-700 hover:bg-white/[0.02]", feat.bg)}>
                  <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg", feat.color)}>
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2 tracking-tight">{feat.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="py-24 sm:py-36 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">4 passos simples</p>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center mb-16">Como funciona?</h2>
          </Reveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-red-600/20 via-red-600/10 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {[
                { n: "01", t: "Escolha seu plano", d: "Selecione o plano e duração ideais. Pague por Pix, cartão ou boleto com segurança total.", icon: Crown, accent: "bg-gradient-to-br from-amber-500 to-orange-600" },
                { n: "02", t: "Preencha sua ficha", d: "Anamnese guiada em 5 minutos. A IA analisa restrições e monta seu perfil de segurança automaticamente.", icon: Shield, accent: "bg-gradient-to-br from-emerald-500 to-green-600" },
                { n: "03", t: "Receba seu treino", d: "Treino na medida certa direto no app com timer de descanso, instruções e vídeos de execução.", icon: Dumbbell, accent: "bg-gradient-to-br from-red-500 to-red-700" },
                { n: "04", t: "Evolua e acompanhe", d: "Registre séries, receba feedback da IA e acompanhe sua evolução em gráficos detalhados.", icon: TrendingUp, accent: "bg-gradient-to-br from-blue-500 to-indigo-600" },
              ].map((step, i) => (
                <Reveal key={step.n} delay={i * 120}>
                  <div className="group flex items-start gap-6 sm:gap-8">
                    <div className={cn("shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500", step.accent)}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="pt-1">
                      <span className="text-[11px] font-mono text-red-500/40 tracking-widest">{step.n}</span>
                      <h3 className="text-xl font-bold text-white mt-0.5 mb-2 tracking-tight">{step.t}</h3>
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/[0.03] to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Reveal>
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">Depoimentos reais</p>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center mb-4">
              Quem treina com Victor,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">transforma.</span>
            </h2>
            <p className="text-neutral-500 text-center text-sm mb-16">Resultados reais de alunos reais.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Lucas M.", age: "28 anos", result: "-12kg em 4 meses", text: "Nunca pensei que ia conseguir. O treino é na medida certa e o acompanhamento pelo app é absurdo. A IA me cobra quando eu falto!", avatar: "L" },
              { name: "Camila R.", age: "34 anos", result: "Ganho de massa sem dor", text: "Tenho hérnia e sempre tive medo de treinar pesado. Victor adaptou tudo respeitando minhas restrições. Me sinto segura pela primeira vez.", avatar: "C" },
              { name: "Roberto S.", age: "41 anos", result: "+8kg de massa magra", text: "O app é outro nível. Vejo minha evolução de carga, timer de descanso, tudo organizado. Parece que tenho um personal do lado 24h.", avatar: "R" },
            ].map((r, i) => (
              <Reveal key={r.name} delay={i * 150}>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-7 hover:border-white/[0.1] transition-all duration-700 group">
                  <div className="flex items-center gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/[0.04]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/20 flex items-center justify-center text-red-300 text-sm font-bold border border-red-500/15">
                      {r.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{r.name} <span className="text-neutral-600 font-normal">· {r.age}</span></p>
                      <p className="text-red-400 text-xs font-semibold">{r.result}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/40" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
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
                  <div className={cn(
                    "relative rounded-3xl border p-7 transition-all duration-700 flex flex-col",
                    isPro ? "border-red-500/25 bg-gradient-to-b from-red-600/[0.05] to-transparent md:scale-[1.04] shadow-2xl shadow-red-600/10 z-10" :
                    isElite ? "border-amber-500/15 bg-white/[0.015] hover:border-amber-500/25" :
                    "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1]"
                  )}>
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

                    <p className="text-[11px] text-neutral-600 mb-6 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.03] text-center">
                      <span className="text-neutral-400 font-medium">R$ {p.perDay.toFixed(2)}</span> por dia — menos que um café
                    </p>

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

                    <a href="#contato" className={cn(
                      "w-full py-4 rounded-xl text-[13px] font-bold text-center transition-all duration-500 block",
                      isPro ? "bg-red-600 text-white hover:bg-red-500 shadow-xl shadow-red-600/20 hover:shadow-red-600/40" :
                      isElite ? "border border-amber-500/20 text-amber-300 hover:bg-amber-500/10" :
                      "border border-white/[0.06] text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                    )}>
                      {tier.cta}
                    </a>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <Reveal delay={400}>
            <div className="text-center mt-10 space-y-2">
              <p className="text-neutral-600 text-xs">Pix, cartão (até 12x) ou boleto · Cancele quando quiser</p>
              <p className="text-neutral-700 text-[11px] flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" /> Pagamento seguro · Garantia de 7 dias
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal><h2 className="text-2xl font-black text-center mb-12 tracking-tight">Dúvidas frequentes</h2></Reveal>
          {[
            { q: "Preciso ter experiência com treino?", a: "Não! O treino é montado de acordo com seu nível — do iniciante ao avançado. A IA adapta tudo automaticamente." },
            { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem multa, sem burocracia. Mas quando você vir os resultados, não vai querer parar." },
            { q: "Como funciona a correção de postura?", a: "No plano Elite, a câmera do seu celular analisa seus movimentos em tempo real com IA e te corrige durante o exercício." },
            { q: "Tenho lesão/restrição. Posso treinar?", a: "Com certeza. A IA analisa sua anamnese e todas as restrições são respeitadas na prescrição. Segurança é prioridade #1." },
            { q: "Preciso ir à academia?", a: "Não necessariamente. Victor monta treinos para academia, home workout ou ao ar livre. Você escolhe." },
          ].map((faq, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="border-b border-white/[0.03] py-6 group">
                <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-red-300 transition-colors">{faq.q}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-24 sm:py-36 px-5 sm:px-8 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-600/[0.05] blur-[150px]" />
        </div>
        <Reveal>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="mx-auto mb-8 w-20 h-20 shadow-2xl shadow-red-600/30 rounded-3xl overflow-hidden">
              <Logo size={80} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight mb-5 leading-tight">
              Sua transformação
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">começa agora.</span>
            </h2>
            <p className="text-neutral-500 text-base max-w-md mx-auto mb-10 leading-relaxed">
              Não espere a segunda-feira perfeita. Cada dia conta. A partir de{" "}
              <span className="text-white font-bold">R$ 119,94/mês</span>.
            </p>
            <a href="#planos" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-red-600 text-white font-bold text-base shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:bg-red-500 transition-all duration-500 hover:scale-105 active:scale-100">
              Escolher meu plano
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer id="contato" className="py-16 px-5 sm:px-8 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <Logo size={44} />
                <div>
                  <p className="font-bold text-[15px] text-white">Victor Oliveira</p>
                  <p className="text-[9px] text-red-400/60 uppercase tracking-[0.25em] font-semibold">CREF 123456-G/SP</p>
                </div>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
                Personal Trainer especializado em hipertrofia e emagrecimento. Tecnologia de ponta + ciência aplicada ao treino.
              </p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-5">Navegação</h4>
              <div className="space-y-3">
                {[["Método", "#metodo"], ["Sobre", "#sobre"], ["Resultados", "#resultados"], ["Planos", "#planos"]].map(([l, h]) => (
                  <a key={l} href={h} className="block text-neutral-500 text-sm hover:text-white transition-colors">{l}</a>
                ))}
                <Link href="/login" className="block text-neutral-500 text-sm hover:text-white transition-colors">Área do Aluno</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-5">Contato</h4>
              <div className="space-y-3">
                <a href="https://wa.me/5585996985823" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-neutral-500 text-sm hover:text-emerald-400 transition-colors">
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
                <a href="https://instagram.com/victoroliveiraapersonal_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-neutral-500 text-sm hover:text-pink-400 transition-colors">
                  <Instagram className="w-4 h-4" /> @victoroliveiraapersonal_
                </a>
                <a href="mailto:contato@victoroliveiraapersonal_.com" className="flex items-center gap-2.5 text-neutral-500 text-sm hover:text-white transition-colors">
                  <Mail className="w-4 h-4" /> contato@victoroliveiraapersonal_.com
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.03] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-neutral-700 text-xs">© 2026 Victor Oliveira. Todos os direitos reservados.</p>
            <p className="text-neutral-800 text-[10px] tracking-wider uppercase">Next.js · AI SDK · Prisma</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
