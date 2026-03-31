'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export function PhoneDive({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const scale = useTransform(scrollYProgress, [0.05, 0.65], [0.55, 4])
  const borderRadius = useTransform(scrollYProgress, [0.05, 0.55], [44, 0])
  const frameOpacity = useTransform(scrollYProgress, [0.35, 0.6], [1, 0])
  const notchOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0])
  const textOpacity = useTransform(scrollYProgress, [0.02, 0.12, 0.3, 0.4], [0, 1, 1, 0])
  const glowScale = useTransform(scrollYProgress, [0.1, 0.6], [1, 2.5])

  const exercises = [
    { name: "Leg Press", sets: "4x10-12", done: true },
    { name: "Agachamento Hack", sets: "4x10-12", done: true },
    { name: "Cadeira Extensora", sets: "3x12-15", done: true },
    { name: "Mesa Flexora", sets: "3x12-15", done: false },
    { name: "Panturrilha", sets: "4x15-20", done: false },
  ]
  const navItems = ["TREINO", "POSTURA", "NUTRI", "SOCIAL", "PERFIL"]

  return (
    <div ref={containerRef} className={`relative h-[180vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Animated glow behind phone */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[500px] bg-red-600/[0.1] blur-[100px] rounded-full pointer-events-none"
          style={{ scale: glowScale }}
        />

        {/* Grid pattern background */}
        <div className="absolute inset-0 landing-grid landing-grid-fade pointer-events-none opacity-40" />

        {/* Phone that scales */}
        <motion.div className="relative z-10 origin-center" style={{ scale }}>
          <motion.div
            className="relative w-[260px] sm:w-[280px] md:w-[300px] aspect-[9/19.5] overflow-hidden bg-[#0c0c0c]"
            style={{
              borderRadius,
              boxShadow: '0 0 0 3px #222, 0 0 0 5px #333, 0 30px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Bezel glow ring (fades out) */}
            <motion.div
              className="absolute inset-0 z-30 pointer-events-none"
              style={{
                opacity: frameOpacity,
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.05), 0 0 0 3px #222',
                borderRadius,
              }}
            />

            {/* Dynamic Island */}
            <motion.div
              className="absolute top-[6px] left-1/2 -translate-x-1/2 z-40 w-[90px] h-[24px] bg-black rounded-full"
              style={{ opacity: notchOpacity }}
            >
              <div className="absolute top-[8px] right-[18px] w-[8px] h-[8px] rounded-full bg-neutral-800 border border-neutral-700" />
            </motion.div>

            {/* ── APP SCREEN UI ── */}
            <div className="relative z-10 w-full h-full flex flex-col text-white overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center justify-between px-5 pt-2 pb-0.5">
                <span className="text-[8px] text-white/40 font-semibold">9:41</span>
                <div className="flex gap-0.5 items-center">
                  <div className="w-[12px] h-[7px] rounded-[1px] border border-white/25 relative">
                    <div className="absolute inset-[1px] right-[2px] bg-green-400/70 rounded-[0.5px]" />
                  </div>
                </div>
              </div>

              {/* App header */}
              <div className="flex items-center gap-2.5 px-4 pt-1 pb-2">
                <div className="w-9 h-9 rounded-full border-2 border-red-600 bg-neutral-800 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/80">EM</span>
                </div>
                <div>
                  <p className="text-white text-[12px] font-semibold leading-tight">Boa tarde, Emmanuel</p>
                  <p className="text-neutral-500 text-[9px]">Quinta-feira, 26 Mar</p>
                </div>
              </div>

              {/* Day selector */}
              <div className="flex gap-1 px-3 py-1.5">
                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX"].map((d) => (
                  <div
                    key={d}
                    className={`flex-1 text-center py-1 rounded-md text-[7px] font-bold tracking-wide ${d === "QUI" ? "bg-red-600 text-white" : "bg-white/[0.04] text-neutral-600"}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Completed circle */}
              <div className="flex flex-col items-center py-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-1.5">
                  <CheckCircle2 className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-white text-[11px] font-bold">Treino Concluido</p>
                <p className="text-neutral-500 text-[8px] mt-0.5">Pernas / Gluteos — 45 min</p>
              </div>

              {/* Stat boxes */}
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
                {[
                  { val: "45", label: "MINUTOS" },
                  { val: "27", label: "SERIES" },
                  { val: "80kg", label: "MAXIMO" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.04] rounded-lg py-1.5 text-center">
                    <p className="text-white text-[13px] font-black">{s.val}</p>
                    <p className="text-neutral-600 text-[6px] font-bold tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Exercise list */}
              <div className="flex-1 px-3 space-y-1 overflow-hidden">
                {exercises.map((ex) => (
                  <div key={ex.name} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ex.done ? "bg-red-500/20" : "bg-white/[0.06]"}`}>
                      {ex.done && <CheckCircle2 className="w-2.5 h-2.5 text-red-400" />}
                    </div>
                    <span className={`text-[9px] font-medium flex-1 ${ex.done ? "text-white/50 line-through" : "text-white/80"}`}>{ex.name}</span>
                    <span className="text-neutral-600 text-[8px]">{ex.sets}</span>
                  </div>
                ))}
              </div>

              {/* Bottom nav */}
              <div className="flex items-center justify-around py-2.5 px-2 border-t border-white/[0.06] mt-auto">
                {navItems.map((item, i) => (
                  <div key={item} className="flex flex-col items-center gap-0.5">
                    <div className={`w-1 h-1 rounded-full ${i === 0 ? "bg-red-500" : "bg-transparent"}`} />
                    <span className={`text-[6px] font-bold tracking-wide ${i === 0 ? "text-red-500" : "text-neutral-600"}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Glass reflection */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ opacity: frameOpacity }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* "Role para entrar" text */}
        <motion.div
          className="absolute bottom-[10%] inset-x-0 text-center z-20 pointer-events-none"
          style={{ opacity: textOpacity }}
        >
          <p className="text-neutral-500 text-xs md:text-sm uppercase tracking-[0.25em] font-medium">
            Role para entrar no app
          </p>
          <div className="mt-3 mx-auto w-5 h-8 rounded-full border border-neutral-600 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-red-500 animate-bounce" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
