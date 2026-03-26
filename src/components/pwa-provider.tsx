"use client"

import { useEffect, useState, useCallback } from "react"
import { Zap, Bell, Dumbbell, X, Share, Plus, MoreVertical, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "ios" | "android" | "desktop" | "unknown"

function detectPlatform(): Platform {
  const ua = navigator.userAgent || ""
  // iOS: iPhone, iPad, iPod, or Mac with touch (iPad with desktop UA)
  if (/iPhone|iPod/i.test(ua)) return "ios"
  if (/iPad/i.test(ua)) return "ios"
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios" // iPad with desktop UA
  if (/Android/i.test(ua)) return "android"
  if (/Windows|Macintosh|Linux/i.test(ua) && navigator.maxTouchPoints === 0) return "desktop"
  return "unknown"
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true
}

export default function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Already installed as PWA
    if (isStandaloneMode()) return

    const plat = detectPlatform()
    setPlatform(plat)

    // Already dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem("vo_install_dismissed")
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    // Listen for native install prompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener("beforeinstallprompt", handler)

    // For iOS and Android browsers without beforeinstallprompt:
    // Show manual instructions after 5 seconds
    if (plat === "ios" || plat === "android") {
      const timer = setTimeout(() => {
        // Only show if native prompt didn't fire
        setShowBanner(prev => {
          if (prev) return prev // already showing
          return true
        })
      }, 5000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", handler)
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === "accepted") setShowBanner(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setShowBanner(false)
      setClosing(false)
      localStorage.setItem("vo_install_dismissed", Date.now().toString())
    }, 300)
  }, [])

  if (isStandaloneMode() || !showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`fixed z-[10000] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[400px] transition-all duration-300 ${closing ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/[0.08] shadow-2xl shadow-red-600/10">
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-red-600/20 to-transparent">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm flex items-center justify-center mb-4 shadow-xl border border-white/[0.08]">
              <img src="/icon-192x192.png" alt="Victor App" className="w-14 h-14 rounded-xl" />
            </div>
            <h2 className="text-white text-xl font-black tracking-tight">Victor App</h2>
            <p className="text-red-400/80 text-xs font-medium mt-1 uppercase tracking-[0.15em]">Personal Trainer</p>
          </div>

          {/* Benefits */}
          <div className="px-6 py-5">
            <div className="space-y-3 mb-6">
              {[
                { icon: Zap, title: "Acesso instantâneo", desc: "Abra direto da tela inicial" },
                { icon: Bell, title: "Notificações", desc: "Lembretes de treino e evolução" },
                { icon: Dumbbell, title: "Seu treino sempre à mão", desc: "Timer, séries e carga na palma" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform-specific install instructions */}
            {platform === "ios" ? (
              <IOSInstructions onDismiss={handleDismiss} />
            ) : platform === "android" && !deferredPrompt ? (
              <AndroidInstructions onDismiss={handleDismiss} />
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Instalar App Gratis
                </button>
                <button onClick={handleDismiss} className="w-full py-3 rounded-xl text-neutral-500 text-sm font-medium hover:bg-white/[0.03] transition-colors">
                  Agora nao
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── iOS Step-by-step ─────────────────────────────────────────────────────────

function IOSInstructions({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3 text-center">
        Como instalar no iPhone/iPad
      </p>

      <div className="space-y-2.5 mb-4">
        {/* Step 1 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <Share className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">1. Toque em Compartilhar</p>
            <p className="text-[10px] text-neutral-500">O icone de compartilhar na barra do Safari (quadrado com seta pra cima)</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">2. &ldquo;Tela de Inicio&rdquo;</p>
            <p className="text-[10px] text-neutral-500">Role para baixo e toque em &ldquo;Adicionar a Tela de Inicio&rdquo;</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">3. Toque &ldquo;Adicionar&rdquo;</p>
            <p className="text-[10px] text-neutral-500">Pronto! O app aparece na sua tela inicial</p>
          </div>
        </div>
      </div>

      <button onClick={onDismiss} className="w-full py-3 rounded-xl text-neutral-500 text-sm font-medium hover:bg-white/[0.03] transition-colors">
        Entendi
      </button>
    </div>
  )
}

// ─── Android Step-by-step ─────────────────────────────────────────────────────

function AndroidInstructions({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3 text-center">
        Como instalar no Android
      </p>

      <div className="space-y-2.5 mb-4">
        {/* Step 1 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <MoreVertical className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">1. Toque nos 3 pontinhos</p>
            <p className="text-[10px] text-neutral-500">No canto superior direito do Chrome (menu)</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">2. &ldquo;Instalar aplicativo&rdquo;</p>
            <p className="text-[10px] text-neutral-500">Ou &ldquo;Adicionar a tela inicial&rdquo; dependendo do navegador</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">3. Confirme a instalacao</p>
            <p className="text-[10px] text-neutral-500">Pronto! O app aparece na sua tela inicial</p>
          </div>
        </div>
      </div>

      <button onClick={onDismiss} className="w-full py-3 rounded-xl text-neutral-500 text-sm font-medium hover:bg-white/[0.03] transition-colors">
        Entendi
      </button>
    </div>
  )
}
