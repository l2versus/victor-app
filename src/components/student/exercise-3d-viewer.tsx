"use client"

import { useState } from "react"
import { X, Maximize2, Minimize2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { find3DModel, getSketchfabEmbedUrl, type Exercise3DModel } from "@/lib/exercise-3d-models"

/* ═══════════════════════════════════════════
   EXERCISE 3D VIEWER — Inline embed
   Shows in exercise preview cards
   ═══════════════════════════════════════════ */
export function Exercise3DViewer({
  exerciseName,
  className,
}: {
  exerciseName: string
  className?: string
}) {
  const model = find3DModel(exerciseName)
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!model) return null

  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden", className)}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">3D</span>
          <span className="text-[10px] text-neutral-400 font-medium truncate">{model.title}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-neutral-500 hover:text-white transition-all"
        >
          {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {/* 3D Viewer — with overlays to hide Sketchfab branding */}
      <div className={cn("relative w-full transition-all duration-500 overflow-hidden", expanded ? "h-[350px]" : "h-[200px]")}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-neutral-600 animate-spin" />
              <span className="text-[10px] text-neutral-600">Carregando 3D...</span>
            </div>
          </div>
        )}
        <iframe
          title={model.title}
          src={getSketchfabEmbedUrl(model.sketchfabId)}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
        {/* Cover Sketchfab bottom bar (author, $, share) */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pointer-events-none" />
        {/* Cover Sketchfab top-right controls */}
        <div className="absolute top-0 right-0 w-12 h-10 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-white/[0.04] flex items-center justify-between">
        <p className="text-[8px] text-neutral-600">
          ↻ Arraste para girar · Pinch para zoom
        </p>
        <div className="flex gap-1">
          {model.muscles.slice(0, 3).map(m => (
            <span key={m} className="text-[7px] px-1.5 py-0.5 rounded bg-red-600/10 text-red-400/70">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   EXERCISE 3D BUTTON — "Ver em 3D" badge
   Opens fullscreen 3D viewer
   ═══════════════════════════════════════════ */
export function Exercise3DButton({
  exerciseName,
  className,
}: {
  exerciseName: string
  className?: string
}) {
  const model = find3DModel(exerciseName)
  const [showViewer, setShowViewer] = useState(false)

  if (!model) return null

  return (
    <>
      <button
        onClick={() => setShowViewer(true)}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-lg",
          "bg-red-600/10 border border-red-500/15 text-[9px] font-bold text-red-400",
          "hover:bg-red-600/20 active:scale-95 transition-all",
          className
        )}
      >
        <span className="text-[8px] uppercase tracking-wider">3D</span>
        Musculos
      </button>

      {/* Fullscreen overlay */}
      {showViewer && (
        <Exercise3DFullscreen model={model} onClose={() => setShowViewer(false)} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════
   FULLSCREEN 3D VIEWER
   ═══════════════════════════════════════════ */
function Exercise3DFullscreen({ model, onClose }: { model: Exercise3DModel; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 safe-top" onClick={e => e.stopPropagation()}>
        <div>
          <p className="text-sm font-semibold text-white">{model.title}</p>
          <p className="text-[10px] text-neutral-500">Rotacione para ver os musculos trabalhados</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/[0.1] flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3D viewer — full remaining space */}
      <div className="flex-1 relative" onClick={e => e.stopPropagation()}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <RotateCcw className="w-8 h-8 text-red-400/50 mx-auto animate-spin" />
              <p className="text-xs text-neutral-500">Carregando modelo 3D...</p>
            </div>
          </div>
        )}
        <iframe
          title={model.title}
          src={getSketchfabEmbedUrl(model.sketchfabId)}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          onLoad={() => setLoaded(true)}
        />
        {/* Cover Sketchfab bottom bar (author, $, share) */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-14 h-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>

      {/* Muscle badges */}
      <div className="px-4 py-3 flex items-center justify-center gap-2 safe-bottom" onClick={e => e.stopPropagation()}>
        {model.muscles.map(m => (
          <span key={m} className="px-3 py-1 rounded-full bg-red-600/15 border border-red-500/20 text-[10px] text-red-400 font-medium">
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
