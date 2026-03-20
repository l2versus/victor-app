"use client"

import { useEffect, useState, useCallback } from "react"
import { Trophy, Flame, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════
   CONFETTI PARTICLES — Pure CSS, no deps
   ═══════════════════════════════════════════ */
function ConfettiParticles() {
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    color: colors[i % colors.length],
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 2.5),
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════
   CELEBRATION MODAL — Shows on PR / milestone
   ═══════════════════════════════════════════ */
export type CelebrationType = "pr" | "streak" | "milestone" | "level_up"

interface CelebrationProps {
  type: CelebrationType
  title: string
  subtitle: string
  detail?: string
  onClose: () => void
}

const celebrationConfig: Record<CelebrationType, {
  icon: typeof Trophy
  gradient: string
  glow: string
  badge: string
}> = {
  pr: {
    icon: Trophy,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/30",
    badge: "NOVO RECORD",
  },
  streak: {
    icon: Flame,
    gradient: "from-orange-500 to-red-600",
    glow: "shadow-orange-500/30",
    badge: "STREAK",
  },
  milestone: {
    icon: Star,
    gradient: "from-purple-500 to-blue-600",
    glow: "shadow-purple-500/30",
    badge: "CONQUISTA",
  },
  level_up: {
    icon: Star,
    gradient: "from-emerald-500 to-cyan-600",
    glow: "shadow-emerald-500/30",
    badge: "LEVEL UP",
  },
}

export function CelebrationModal({ type, title, subtitle, detail, onClose }: CelebrationProps) {
  const [visible, setVisible] = useState(false)
  const config = celebrationConfig[type]
  const Icon = config.icon

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setVisible(true))
    // Haptic
    if ("vibrate" in navigator) navigator.vibrate([50, 50, 100])
    // Auto-close after 5s
    const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <>
      <ConfettiParticles />
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-6"
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className={cn(
            "relative w-full max-w-sm rounded-3xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden transition-all duration-500",
            visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glow */}
          <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 rounded-b-full blur-sm bg-gradient-to-r", config.gradient)} />
          <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 rounded-full blur-3xl -translate-y-1/2 bg-gradient-to-r opacity-20", config.gradient)} />

          {/* Close */}
          <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white z-10">
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-8 text-center">
            {/* Badge */}
            <span className={cn("inline-block text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-5 bg-gradient-to-r text-white", config.gradient)}>
              {config.badge}
            </span>

            {/* Icon with pulse */}
            <div className="relative mx-auto mb-5">
              <div className={cn("w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mx-auto shadow-2xl", config.gradient, config.glow)}>
                <Icon className="w-9 h-9 text-white" />
              </div>
              {/* Pulse rings */}
              <div className={cn("absolute inset-0 w-20 h-20 rounded-3xl mx-auto bg-gradient-to-br opacity-30 animate-ping", config.gradient)} style={{ animationDuration: "1.5s" }} />
            </div>

            {/* Text */}
            <h2 className="text-xl font-black text-white mb-1">{title}</h2>
            <p className="text-sm text-neutral-400 mb-2">{subtitle}</p>
            {detail && (
              <p className="text-xs text-neutral-600 bg-white/[0.03] rounded-lg px-3 py-2 inline-block">{detail}</p>
            )}

            {/* Action */}
            <button
              onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
              className={cn("w-full mt-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r transition-all hover:scale-[1.02] active:scale-[0.98]", config.gradient)}
            >
              Continuar 💪
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   HOOK — useCelebration
   ═══════════════════════════════════════════ */
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType
    title: string
    subtitle: string
    detail?: string
  } | null>(null)

  const celebrate = useCallback((type: CelebrationType, title: string, subtitle: string, detail?: string) => {
    setCelebration({ type, title, subtitle, detail })
  }, [])

  const dismiss = useCallback(() => setCelebration(null), [])

  const CelebrationUI = celebration ? (
    <CelebrationModal
      type={celebration.type}
      title={celebration.title}
      subtitle={celebration.subtitle}
      detail={celebration.detail}
      onClose={dismiss}
    />
  ) : null

  return { celebrate, CelebrationUI }
}
