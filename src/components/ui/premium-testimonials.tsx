"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Quote, Star, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { TextEffect } from "@/components/ui/text-effect"

const testimonials = [
  {
    name: "Lucas Mendes",
    role: "Empresário, 28 anos",
    company: "Fortaleza - CE",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Perdi 12kg em 4 meses com o acompanhamento do Victor. O app é absurdo — timer, registro de carga, tudo automático. A IA me cobra quando falto e ajusta o treino quando durmo mal.",
    results: ["-12kg em 4 meses", "Treino adaptativo por IA", "Acompanhamento 24/7"],
  },
  {
    name: "Camila Rocha",
    role: "Advogada, 34 anos",
    company: "São Paulo - SP",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Tenho hérnia de disco e sempre tive medo de treinar pesado. Victor adaptou tudo respeitando minhas restrições — a IA analisa minha ficha e bloqueia exercícios contraindicados. Me sinto segura pela primeira vez.",
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
    text: "Como profissional de saúde, sou exigente com método. O Victor combina ciência com tecnologia de um jeito que nunca vi. A correção de postura por câmera é genial — meus pacientes amam.",
    results: ["Método científico", "Postura corrigida por IA", "Resultados comprovados"],
  },
  {
    name: "Thiago Santos",
    role: "Designer, 25 anos",
    company: "Curitiba - PR",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Eu era sedentário total. Em 3 meses, já estava levantando carga que achava impossível. O chat com IA pós-treino pergunta como me senti e ajusta tudo automaticamente. Viciei.",
    results: ["Sedentário → ativo", "3 meses de evolução", "Chat IA personalizado"],
  },
  {
    name: "Ana Beatriz Costa",
    role: "Médica, 37 anos",
    company: "Brasília - DF",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Com plantões de 24h, preciso de um treino que se adapte à minha rotina caótica. A IA do Victor entende quando estou cansada e ajusta a intensidade. Perdi 7kg mesmo com a rotina pesada.",
    results: ["-7kg com rotina pesada", "Treino adaptativo", "Respeita seu ritmo"],
  },
]

export function PremiumTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 800 : -800,
      opacity: 0,
      scale: 0.85,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 800 : -800,
      opacity: 0,
      scale: 0.85,
    }),
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  }

  const nextTestimonial = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-600/[0.06] via-red-900/[0.03] to-red-600/[0.06]"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "400% 400%" }}
        />
        <motion.div
          className="absolute top-1/3 left-[10%] w-72 h-72 bg-red-600/[0.08] rounded-full blur-[120px]"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[10%] w-80 h-80 bg-red-900/[0.06] rounded-full blur-[120px]"
          animate={{ x: [0, -80, 0], y: [0, -40, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-400/20 rounded-full"
            style={{ left: `${15 + i * 10}%`, top: `${20 + i * 8}%` }}
            animate={{ y: [0, -40, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}
      </div>

      <motion.div
        ref={containerRef}
        className="relative z-10"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Header */}
        <motion.div className="text-center mb-16" variants={fadeInUp}>
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
            Quem treina com Victor,{" "}
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
        </motion.div>

        {/* Main Testimonial Carousel */}
        <div className="relative max-w-5xl mx-auto mb-12">
          <div className="relative h-[520px] sm:h-[420px] md:h-[360px]" style={{ perspective: "1200px" }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 },
                }}
                className="absolute inset-0"
              >
                <div className="relative h-full bg-white/[0.03] backdrop-blur-sm rounded-3xl border border-white/[0.06] p-7 sm:p-10 overflow-hidden group hover:border-white/[0.12] transition-colors duration-700">
                  {/* Card glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-24 bg-red-600/[0.06] blur-3xl rounded-full -translate-y-1/2" />

                  {/* Quote icon */}
                  <div className="absolute top-6 right-8 opacity-[0.06]">
                    <Quote className="w-20 h-20 text-white" />
                  </div>

                  <div className="relative z-10 h-full flex flex-col sm:flex-row items-center gap-7">
                    {/* Avatar & Info */}
                    <div className="shrink-0 text-center sm:text-left">
                      <motion.div
                        className="relative mb-4"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="w-20 h-20 mx-auto sm:mx-0 rounded-full overflow-hidden border-2 border-red-500/20 relative">
                          <img
                            src={testimonials[currentIndex].avatar}
                            alt={testimonials[currentIndex].name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <motion.div
                          className="absolute inset-0 border-2 border-red-500/20 rounded-full mx-auto sm:mx-0 w-20 h-20"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                        />
                      </motion.div>

                      <h3 className="text-lg font-bold text-white mb-0.5">
                        {testimonials[currentIndex].name}
                      </h3>
                      <p className="text-red-400 text-xs font-medium mb-0.5">
                        {testimonials[currentIndex].role}
                      </p>
                      <p className="text-neutral-600 text-xs mb-3">
                        {testimonials[currentIndex].company}
                      </p>

                      {/* Stars */}
                      <div className="flex justify-center sm:justify-start gap-0.5 mb-2">
                        {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <motion.blockquote
                        className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      >
                        &ldquo;{testimonials[currentIndex].text}&rdquo;
                      </motion.blockquote>

                      {/* Results chips */}
                      <div className="flex flex-wrap gap-2">
                        {testimonials[currentIndex].results.map((result, i) => (
                          <motion.div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/[0.08] border border-red-500/[0.12] text-xs text-red-300/80 font-medium"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                            whileHover={{ backgroundColor: "rgba(220, 38, 38, 0.15)", borderColor: "rgba(220, 38, 38, 0.25)" }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {result}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-5 mt-8">
            <motion.button
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className="relative w-2.5 h-2.5 rounded-full transition-all"
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className={`w-full h-full rounded-full transition-all duration-500 ${
                    index === currentIndex
                      ? "bg-red-500 shadow-lg shadow-red-500/30"
                      : "bg-white/15 hover:bg-white/30"
                  }`} />
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-red-500/40"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto" variants={staggerContainer}>
          {[
            { number: "200+", label: "Alunos ativos" },
            { number: "98%", label: "Satisfação" },
            { number: "5 anos", label: "Experiência" },
            { number: "4.9/5", label: "Avaliação Google" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center group"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
                {stat.number}
              </div>
              <div className="text-neutral-600 text-[11px] uppercase tracking-[0.15em] font-medium group-hover:text-neutral-400 transition-colors">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
