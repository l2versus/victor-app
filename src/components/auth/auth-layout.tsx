"use client"

import { Dumbbell } from "lucide-react"
import { useState, useEffect } from "react"
import { BRAND } from "@/lib/branding"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col lg:flex-row">

      {/* ═══ MOBILE: Top hero section ═══ */}
      <div className="lg:hidden relative overflow-hidden min-h-[340px]">
        {/* Black base */}
        <div className="absolute inset-0 bg-black" />

        {/* Victor's photo — bg-[center_15%] focuses on his face */}
        <div className="absolute inset-0 bg-cover bg-no-repeat opacity-60"
          style={{
            backgroundImage: `url('/victor-profile.jpg')`,
            backgroundPosition: 'center 15%',
          }} />

        {/* Gradient: dark top for logo readability, dark bottom for content */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />

        {/* Subtle red ambient glow */}
        <div className={`absolute top-[10%] right-[-10%] w-[200px] h-[200px] bg-red-600/20 rounded-full blur-[80px] transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: 'pulse 4s ease-in-out infinite' }} />

        {/* Content */}
        <div className={`relative z-10 px-6 pt-14 pb-8 h-full flex flex-col justify-end transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight">{BRAND.trainerName}</p>
              <p className="text-red-400 text-[10px] font-semibold uppercase tracking-[0.2em]">{BRAND.trainerTitle}</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-white text-2xl font-extrabold leading-tight mb-3">
            Treine com quem entende de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">resultado.</span>
          </h2>

          {/* Stats row — glass cards */}
          <div className={`flex gap-3 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-xl px-3 py-2.5 border border-white/10 active:scale-95 transition-transform">
              <p className="text-white text-lg font-bold">500+</p>
              <p className="text-neutral-500 text-[9px] uppercase tracking-wider">Exercícios</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-xl px-3 py-2.5 border border-white/10 active:scale-95 transition-transform">
              <p className="text-white text-lg font-bold">100%</p>
              <p className="text-neutral-500 text-[9px] uppercase tracking-wider">Modo Offline</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-xl px-3 py-2.5 border border-white/10 active:scale-95 transition-transform">
              <p className="text-red-500 text-lg font-bold">Live</p>
              <p className="text-neutral-500 text-[9px] uppercase tracking-wider">Feedback IA</p>
            </div>
          </div>
        </div>

        {/* Red accent line */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
      </div>

      {/* ═══ DESKTOP: Left side panel ═══ */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-black items-end justify-start group cursor-default"
        onMouseMove={handleMouseMove}
      >
        {/* Victor's photo — bg-[center_10%] focuses on his face, hover zoom */}
        <div className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-[800ms] ease-out group-hover:scale-[1.03]"
          style={{
            backgroundImage: `url('/victor-profile.jpg')`,
            backgroundPosition: 'center 10%',
          }} />

        {/* Gradient from bottom only — keeps face visible at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        {/* Subtle side vignette */}
        <div className="absolute inset-0" style={{
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.4)'
        }} />

        {/* Animated red orbs — subtle, behind content */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-red-600/40 rounded-full blur-[120px]"
            style={{ animation: 'pulse 5s ease-in-out infinite' }} />
          <div className="absolute bottom-[5%] right-[10%] w-[300px] h-[300px] bg-red-800/30 rounded-full blur-[100px]"
            style={{ animation: 'pulse 6s ease-in-out infinite 2s' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />

        {/* Mouse glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen"
          style={{
            background: `radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 60%)`,
            left: `${mousePos.x}%`, top: `${mousePos.y}%`,
            transform: 'translate(-50%, -50%)',
          }} />

        {/* Desktop content — positioned at bottom */}
        <div className="relative z-10 p-10 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-600/40">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">{BRAND.trainerName}</p>
              <p className="text-red-400 text-xs font-semibold uppercase tracking-[0.2em]">{BRAND.trainerTitle}</p>
            </div>
          </div>

          <h2 className="text-white text-4xl font-extrabold leading-[1.1] mb-4">
            Treine com quem<br />entende de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">resultado.</span>
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-sm">
            Treinos personalizados, acompanhamento inteligente e IA que te conhece. Tudo no seu app exclusivo.
          </p>

          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 hover:border-red-500/30 hover:bg-white/10 transition-all duration-300">
              <p className="text-white text-2xl font-bold">500+</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-[0.15em] mt-0.5">Exercícios</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 hover:border-red-500/30 hover:bg-white/10 transition-all duration-300">
              <p className="text-white text-2xl font-bold">100%</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-[0.15em] mt-0.5">Modo Offline</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 hover:border-red-500/30 hover:bg-white/10 transition-all duration-300">
              <p className="text-red-500 text-2xl font-bold">Live</p>
              <p className="text-neutral-500 text-[10px] uppercase tracking-[0.15em] mt-0.5">Feedback IA</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
        <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-red-600/30 to-transparent" />
      </div>

      {/* ═══ FORM SIDE (both mobile and desktop) ═══ */}
      <div className="flex-1 relative flex items-center justify-center px-5 py-8 lg:py-0">
        <div className="absolute inset-0 bg-[#080808]">
          <div className="absolute top-1/3 left-1/2 w-[400px] h-[400px] bg-red-600/[0.03] rounded-full blur-[100px] -translate-x-1/2" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }} />
        </div>

        <div className={`relative z-10 w-full max-w-sm transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {children}
        </div>

        <p className="absolute bottom-3 text-[10px] text-neutral-700">
          @victoroliveirapersonal_
        </p>
      </div>
    </div>
  )
}
