"use client"

import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { useState, useEffect, useCallback, useRef } from "react"
import { Quote, Star, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { TextEffect } from "@/components/ui/text-effect"
import { BRAND } from "@/lib/branding"

const testimonials = [
  {
    name: "Lucas Mendes",
    role: "Empresário, 28 anos",
    company: "Fortaleza - CE",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: `Perdi 12kg em 4 meses com o acompanhamento do ${BRAND.trainerFirstName}. O app é absurdo — timer, registro de carga, tudo automático. O sistema me cobra quando falto e ${BRAND.trainerFirstName} ajusta o treino conforme meu progresso.`,
    results: ["-12kg em 4 meses", "Treino adaptativo", "Acompanhamento 24/7"],
  },
  {
    name: "Camila Rocha",
    role: "Advogada, 34 anos",
    company: "São Paulo - SP",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: `Tenho hérnia de disco e sempre tive medo de treinar pesado. ${BRAND.trainerFirstName} adaptou tudo respeitando minhas restrições — o sistema analisa minha ficha e bloqueia exercícios contraindicados. Me sinto segura pela primeira vez.`,
    results: ["Treino sem dor", "Restrições respeitadas", "Ganho de massa seguro"],
  },
  {
    name: "Roberto Silva",
    role: "Engenheiro, 41 anos",
    company: "Recife - PE",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Ganhei 8kg de massa magra em 6 meses. O app é outro nível — vejo minha evolução de carga semana a semana, timer de descanso, tudo organizado. Parece que tenho um personal do lado 24h.",
    results: ["+8kg massa magra", "Evolução em gráficos", "Periodização inteligente"],
  },
  {
    name: "Fernanda Oliveira",
    role: "Nutricionista, 29 anos",
    company: "Belo Horizonte - MG",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: `Como profissional de saúde, sou exigente com método. O ${BRAND.trainerFirstName} combina ciência com tecnologia de um jeito que nunca vi. A correção de postura por câmera é genial — meus pacientes amam.`,
    results: ["Método científico", "Postura corrigida por câmera", "Resultados comprovados"],
  },
  {
    name: "Thiago Santos",
    role: "Designer, 25 anos",
    company: "Curitiba - PR",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: `Eu era sedentário total. Em 3 meses, já estava levantando carga que achava impossível. O assistente pós-treino pergunta como me senti e o ${BRAND.trainerFirstName} ajusta tudo. Viciei.`,
    results: ["Sedentário → ativo", "3 meses de evolução", "Acompanhamento personalizado"],
  },
  {
    name: "Ana Beatriz Costa",
    role: "Médica, 37 anos",
    company: "Brasília - DF",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: `Com plantões de 24h, preciso de um treino que se adapte à minha rotina caótica. O método do ${BRAND.trainerFirstName} entende quando estou cansada e ajusta a intensidade. Perdi 7kg mesmo com a rotina pesada.`,
    results: ["-7kg com rotina pesada", "Treino adaptativo", "Respeita seu ritmo"],
  },
]

const SWIPE_THRESHOLD = 50

export function PremiumTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const next = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Auto-play — only when visible
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!isVisible) return
    const timer = setInterval(next, 7000)
    return () => clearInterval(timer)
  }, [next, isVisible])

  // Swipe handler
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) next()
    else if (info.offset.x > SWIPE_THRESHOLD) prev()
  }

  // Lightweight slide variants — tween instead of spring for mobile smoothness
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const t = testimonials[currentIndex]

  return (
    <div ref={sectionRef} className="relative">
      {/* Lightweight background — static gradients, no animated orbs on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/[0.05] via-transparent to-red-900/[0.04]" />
        <div className="absolute top-1/3 left-[10%] w-72 h-72 bg-red-600/[0.06] rounded-full blur-[120px] hidden sm:block" />
        <div className="absolute bottom-1/4 right-[10%] w-80 h-80 bg-red-900/[0.04] rounded-full blur-[120px] hidden sm:block" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <TextEffect per="char" preset="blur" delay={0.1} as="p" className="text-red-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">
            Depoimentos reais
          </TextEffect>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-[3.5rem] font-black tracking-tight text-center mb-4"
            initial={{ y: 30, filter: "blur(8px)" }}
            whileInView={{ y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Quem treina com {BRAND.trainerFirstName},{" "}
            <motion.span
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400"
              initial={{ y: 20, filter: "blur(8px)" }}
              whileInView={{ y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              transforma.
            </motion.span>
          </motion.h2>
          <TextEffect per="word" preset="fade" delay={0.6} as="p" className="text-neutral-500 text-center text-sm">
            Resultados reais de alunos reais.
          </TextEffect>
        </div>

        {/* Carousel with swipe */}
        <div className="relative max-w-5xl mx-auto mb-10">
          <div
            className="relative overflow-hidden"
            style={{ minHeight: "340px" }}
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                className="w-full touch-pan-y cursor-grab active:cursor-grabbing"
              >
                <div className="relative bg-white/[0.03] rounded-3xl border border-white/[0.06] p-6 sm:p-10 overflow-hidden">
                  {/* Card glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

                  {/* Quote icon */}
                  <div className="absolute top-5 right-6 opacity-[0.05]">
                    <Quote className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar & Info */}
                    <div className="shrink-0 text-center sm:text-left">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto sm:mx-0 rounded-full overflow-hidden border-2 border-red-500/20 mb-3" style={{ width: 72, height: 72 }}>
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          width={72}
                          height={72}
                        />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">{t.name}</h3>
                      <p className="text-red-400 text-xs font-medium mb-0.5">{t.role}</p>
                      <p className="text-neutral-600 text-xs mb-2">{t.company}</p>
                      <div className="flex justify-center sm:justify-start gap-0.5">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <blockquote className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-5">
                        &ldquo;{t.text}&rdquo;
                      </blockquote>
                      <div className="flex flex-wrap gap-2">
                        {t.results.map((result, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/[0.08] border border-red-500/[0.12] text-xs text-red-300/80 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-5 mt-6">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-red-500 scale-125 shadow-lg shadow-red-500/30"
                      : "bg-white/15 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Swipe hint — mobile only */}
          <p className="text-center text-neutral-700 text-[10px] mt-3 sm:hidden">
            Arraste para o lado para ver mais
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { number: "200+", label: "Alunos ativos" },
            { number: "98%", label: "Satisfação" },
            { number: "5 anos", label: "Experiência" },
            { number: "4.9/5", label: "Avaliação Google" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
                {stat.number}
              </div>
              <div className="text-neutral-600 text-[11px] uppercase tracking-[0.15em] font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
