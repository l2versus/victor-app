"use client"

import { useState } from "react"
import { X, Target, Zap, Shield, Lightbulb, ChevronDown, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMuscleInfo, type MuscleInfo } from "@/lib/muscle-data"

/* ═══════════════════════════════════════════
   MUSCLE BADGE — Tap to expand info
   ═══════════════════════════════════════════ */
export function MuscleBadge({
  muscle,
  showInfoOnTap = true,
  className,
}: {
  muscle: string
  showInfoOnTap?: boolean
  className?: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  const info = getMuscleInfo(muscle)

  return (
    <>
      <button
        onClick={() => showInfoOnTap && info && setShowInfo(true)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 active:scale-95",
          "bg-red-600/10 border border-red-500/15 text-red-400",
          showInfoOnTap && info && "hover:bg-red-600/20 hover:border-red-500/25 cursor-pointer",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {muscle}
        {showInfoOnTap && info && <Info className="w-3 h-3 text-red-500/50" />}
      </button>

      {/* Expanded info sheet */}
      {showInfo && info && (
        <MuscleInfoSheet info={info} onClose={() => setShowInfo(false)} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════
   MUSCLE INFO SHEET — Full educational card
   ═══════════════════════════════════════════ */
function MuscleInfoSheet({ info, onClose }: { info: MuscleInfo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet — slides up on mobile */}
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${info.color}15`, border: `1px solid ${info.color}30` }}
            >
              {info.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{info.name}</h3>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{info.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* ─── Músculos alvos ─── */}
          <InfoSection
            icon={Target}
            title="Musculos alvos"
            description="O que esse grupo muscular treina"
            color="#ef4444"
          >
            <div className="flex flex-wrap gap-1.5">
              {info.targets.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-red-600/10 border border-red-500/15 text-[10px] text-red-300 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </InfoSection>

          {/* ─── Sinergistas ─── */}
          <InfoSection
            icon={Zap}
            title="Sinergistas"
            description="Musculos que ajudam no movimento — tambem sao treinados"
            color="#f59e0b"
          >
            <div className="flex flex-wrap gap-1.5">
              {info.synergists.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-600/10 border border-amber-500/15 text-[10px] text-amber-300 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </InfoSection>

          {/* ─── Antagonistas ─── */}
          <InfoSection
            icon={Shield}
            title="Antagonistas"
            description="Musculos opostos — evite treinar no mesmo dia para melhor recuperacao"
            color="#3b82f6"
          >
            <div className="flex flex-wrap gap-1.5">
              {info.antagonists.map((a) => (
                <span key={a} className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/15 text-[10px] text-blue-300 font-medium">
                  {a}
                </span>
              ))}
            </div>
          </InfoSection>

          {/* ─── Pico de contração ─── */}
          <InfoSection
            icon={Zap}
            title="Pico de contracao"
            description="O momento em que o musculo trabalha mais — segure nessa posicao"
            color="#22c55e"
          >
            <p className="text-sm text-neutral-300 leading-relaxed">{info.peakContraction}</p>
          </InfoSection>

          {/* ─── Dica do Victor ─── */}
          <div className="rounded-2xl bg-gradient-to-br from-red-600/[0.08] to-red-900/[0.03] border border-red-500/15 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-1">Dica do Victor</p>
                <p className="text-sm text-neutral-300 leading-relaxed">{info.tip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   INFO SECTION — Reusable collapsible section
   ═══════════════════════════════════════════ */
function InfoSection({
  icon: Icon, title, description, color, children,
}: {
  icon: typeof Target; title: string; description: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-semibold text-white">{title}</span>
        </div>
        <p className="text-[10px] text-neutral-600 leading-relaxed">{description}</p>
      </div>
      <div className="px-4 pb-3 pt-2">
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MUSCLE BADGE GROUP — Body Focus Area
   with educational info on tap
   ═══════════════════════════════════════════ */
export function BodyFocusBadges({
  muscles,
  className,
}: {
  muscles: string[]
  className?: string
}) {
  if (muscles.length === 0) return null

  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4", className)}>
      <div className="flex items-center gap-2 mb-2.5">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Foco de hoje</p>
        <span className="text-[8px] text-neutral-600 px-1.5 py-0.5 rounded bg-white/[0.04]">toque para saber mais</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {muscles.map((m) => (
          <MuscleBadge key={m} muscle={m} />
        ))}
      </div>
    </div>
  )
}
