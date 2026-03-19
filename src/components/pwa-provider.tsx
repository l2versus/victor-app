"use client"

import { useEffect, useState, useCallback } from "react"
import { Zap, Bell, Dumbbell, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem("vo_install_dismissed")
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000)
      }
    }
    window.addEventListener("beforeinstallprompt", handler)

    if (ios && !standalone) {
      const dismissed = localStorage.getItem("vo_install_dismissed")
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000)
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

  if (isStandalone || !showBanner) return null

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
                    <item.icon className="w-4.5 h-4.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {isIOS ? (
              <div className="text-center">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-3">
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Toque em{" "}
                    <span className="inline-flex items-center align-middle mx-1 px-2 py-0.5 bg-white/10 rounded text-[11px] font-medium text-white">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Compartilhar
                    </span>{" "}
                    e depois em <strong className="text-white">&ldquo;Tela de Início&rdquo;</strong>
                  </p>
                </div>
                <button onClick={handleDismiss} className="w-full py-3 rounded-xl text-neutral-500 text-sm font-medium hover:bg-white/[0.03] transition-colors">
                  Agora não
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Instalar App Grátis
                </button>
                <button onClick={handleDismiss} className="w-full py-3 rounded-xl text-neutral-500 text-sm font-medium hover:bg-white/[0.03] transition-colors">
                  Agora não
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
