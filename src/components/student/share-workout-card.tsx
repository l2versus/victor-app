"use client"

import { useRef, useState } from "react"
import {
  Share2, X, Dumbbell, Clock, Flame, Trophy,
  Send, Loader2, AlertCircle, Download, Zap,
} from "lucide-react"

interface ShareWorkoutCardProps {
  templateName: string
  exerciseCount: number
  totalVolume: number // kg
  durationMin: number
  streak: number
  userName: string
  userAvatar?: string | null
  onClose: () => void
}

export function ShareWorkoutCard({
  templateName, exerciseCount, totalVolume, durationMin,
  streak, userName, userAvatar, onClose,
}: ShareWorkoutCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = userName.split(" ")[0]
  const volumeLabel = totalVolume >= 1000
    ? `${(totalVolume / 1000).toFixed(1)}t`
    : `${totalVolume}kg`

  /** Capture the card as a PNG blob using modern-screenshot (supports oklab/oklch) */
  async function captureCard(): Promise<Blob> {
    if (!cardRef.current) throw new Error("Card ref not available")
    const { domToBlob } = await import("modern-screenshot")
    const blob = await domToBlob(cardRef.current, {
      backgroundColor: "#0a0a0a",
      scale: 2,
      type: "image/png",
    })
    if (!blob) throw new Error("Falha ao gerar imagem")
    return blob
  }

  async function handlePostToFeed() {
    if (!cardRef.current || posting) return
    setPosting(true)
    setError(null)
    try {
      const blob = await captureCard()

      const { upload } = await import("@vercel/blob/client")
      const blobResult = await upload(
        `workouts/${Date.now()}-treino.png`,
        blob,
        { access: "public", handleUploadUrl: "/api/upload" },
      )

      const content = `Treino concluído: ${templateName} 💪\n${exerciseCount} exercícios · ${volumeLabel} volume · ${durationMin}min`
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl: blobResult.url }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      setPosted(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao postar no feed"
      setError(msg)
    } finally {
      setPosting(false)
    }
  }

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    setError(null)
    try {
      const blob = await captureCard()
      const file = new File(
        [blob],
        `treino-${templateName.replace(/\s+/g, "-").toLowerCase()}.png`,
        { type: "image/png" },
      )

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Treino Concluído: ${templateName}`,
          text: `💪 ${templateName} — ${exerciseCount} exercícios · ${volumeLabel} volume · ${durationMin}min`,
        })
      } else {
        downloadBlob(blob)
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      const msg = e instanceof Error ? e.message : "Erro ao compartilhar"
      setError(msg)
    } finally {
      setSharing(false)
    }
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `treino-${templateName.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleDownload() {
    setSharing(true)
    setError(null)
    try {
      const blob = await captureCard()
      downloadBlob(blob)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao baixar imagem"
      setError(msg)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 animate-in fade-in zoom-in-95 duration-300">

        {/* ═══ THE CARD (gets captured as image) ═══ */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden border border-white/10"
          style={{ background: "linear-gradient(165deg, #0f0f0f 0%, #0a0a0a 40%, #1a0a0a 100%)" }}
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl" />

          <div className="relative p-5 space-y-4">

            {/* ── Top: User profile + App logo ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* User avatar */}
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={firstName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-red-500/40"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center ring-2 ring-red-500/40">
                    <span className="text-white font-bold text-sm">{firstName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{firstName}</p>
                  <p className="text-neutral-500 text-[10px]">concluiu o treino</p>
                </div>
              </div>
              {/* App logo */}
              <img
                src="/img/logo-icon-sm.png"
                alt="Victor App"
                className="w-9 h-9 rounded-lg opacity-80"
              />
            </div>

            {/* ── Workout name with accent line ── */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-600/30" />
                <Zap className="w-3.5 h-3.5 text-red-500" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-600/30" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{templateName}</h2>
              <p className="text-[10px] uppercase tracking-[0.15em] text-red-500/70 mt-0.5 font-medium">
                Treino Concluído
              </p>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 gap-2.5">
              <StatBox
                icon={<Dumbbell className="w-4 h-4 text-red-400" />}
                value={String(exerciseCount)}
                label="Exercícios"
              />
              <StatBox
                icon={<Trophy className="w-4 h-4 text-amber-400" />}
                value={volumeLabel}
                label="Volume Total"
              />
              <StatBox
                icon={<Clock className="w-4 h-4 text-blue-400" />}
                value={`${durationMin}min`}
                label="Duração"
              />
              <StatBox
                icon={<Flame className="w-4 h-4 text-orange-400" />}
                value={streak > 0 ? String(streak) : "—"}
                label={streak > 0 ? `Dia${streak > 1 ? "s" : ""} seguido${streak > 1 ? "s" : ""}` : "Sem Streak"}
                highlight={streak >= 3}
              />
            </div>

            {/* ── Footer branding ── */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/[0.06]">
              <div className="w-1 h-1 rounded-full bg-red-500" />
              <p className="text-[9px] text-neutral-600 font-medium tracking-wide uppercase">
                Victor App — Treino Inteligente
              </p>
              <div className="w-1 h-1 rounded-full bg-red-500" />
            </div>
          </div>
        </div>

        {/* ═══ ERROR ═══ */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* ═══ ACTION BUTTONS ═══ */}
        <div className="space-y-2">
          {/* Post to community */}
          <button
            onClick={handlePostToFeed}
            disabled={posting || posted}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
              posted
                ? "bg-emerald-600/20 border border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]"
            }`}
          >
            {posting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : posted
                ? "✓ Publicado no Feed"
                : <><Send className="w-4 h-4" /> Postar na Comunidade</>
            }
          </button>

          {/* Share externally (WhatsApp, Instagram, etc.) */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {sharing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Share2 className="w-4 h-4" /> Compartilhar</>
            }
          </button>

          {/* Download + Close */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neutral-400 text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Fechar
            </button>
            <button
              onClick={handleDownload}
              disabled={sharing}
              className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Stat box inside the card */
function StatBox({
  icon, value, label, highlight,
}: {
  icon: React.ReactNode
  value: string
  label: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-3 text-center border ${
      highlight
        ? "bg-orange-500/10 border-orange-500/20"
        : "bg-white/[0.03] border-white/[0.06]"
    }`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-[10px] text-neutral-500 mt-0.5">{label}</p>
    </div>
  )
}
