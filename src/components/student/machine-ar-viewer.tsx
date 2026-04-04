"use client"

import { useEffect, useRef, useState } from "react"
import { X, View, Smartphone } from "lucide-react"

// Import model-viewer as side effect (web component)
let modelViewerLoaded = false

interface Props {
  modelUrl: string
  machineName: string
  onClose: () => void
}

export default function MachineARViewer({ modelUrl, machineName, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [arSupported, setArSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // Dynamically import model-viewer (only runs in browser)
    if (!modelViewerLoaded) {
      import("@google/model-viewer").then(() => {
        modelViewerLoaded = true
        setReady(true)
      })
    } else {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const mv = containerRef.current?.querySelector("model-viewer") as any
    if (!mv) return

    const onLoad = () => setArSupported(mv.canActivateAR ?? false)
    mv.addEventListener("load", onLoad)

    // Fallback: models can be 2-12MB, give enough time on slow connections
    const timer = setTimeout(() => {
      if (arSupported === null) setArSupported(mv.canActivateAR ?? false)
    }, 8000)

    return () => {
      mv.removeEventListener("load", onLoad)
      clearTimeout(timer)
    }
  }, [ready, arSupported])

  return (
    <div className="fixed inset-0 z-80 bg-black flex flex-col overscroll-contain">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2">
          <View className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-white">REALIDADE AUMENTADA</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Model Viewer */}
      <div ref={containerRef} className="flex-1 relative">
        {ready && (
          <model-viewer
            src={modelUrl}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            auto-rotate-delay={0}
            rotation-per-second="30deg"
            shadow-intensity="1"
            environment-image="neutral"
            exposure="1.0"
            loading="eager"
            alt={`Modelo 3D: ${machineName}`}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#080808",
            }}
          >
            {/* Loading progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5" slot="progress-bar">
              <div className="h-full bg-red-500 origin-left transition-transform" />
            </div>

            {/* AR prompt */}
            <button
              slot="ar-button"
              className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
            >
              <Smartphone className="w-4 h-4" />
              Ver na Academia
            </button>
          </model-viewer>
        )}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 py-4 bg-black/80 backdrop-blur-sm border-t border-white/5 space-y-2">
        <p className="text-white text-sm font-medium text-center">{machineName}</p>

        {arSupported === false && (
          <div className="flex items-center gap-2 justify-center px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] text-yellow-400">
              AR indisponivel neste dispositivo — use o modelo 3D interativo acima
            </span>
          </div>
        )}

        {arSupported === true && (
          <p className="text-[10px] text-neutral-500 text-center">
            Toque em &quot;Ver na Academia&quot; para posicionar a maquina no ambiente real
          </p>
        )}

        {arSupported === null && (
          <p className="text-[10px] text-neutral-500 text-center">
            Verificando suporte a AR...
          </p>
        )}

        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-lg bg-red-600/20 text-[10px] text-red-400 font-bold border border-red-500/20">
            3D VICTOR PERSONAL
          </span>
        </div>
      </div>
    </div>
  )
}