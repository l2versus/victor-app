"use client"

import { useRef, useState } from "react"
import { Share2, X, Dumbbell, Clock, Flame, Trophy, Send, Loader2, AlertCircle } from "lucide-react"

interface ShareWorkoutCardProps {
  templateName: string
  exerciseCount: number
  totalVolume: number // kg
  durationMin: number
  streak: number
  onClose: () => void
}

export function ShareWorkoutCard({ templateName, exerciseCount, totalVolume, durationMin, streak, onClose }: ShareWorkoutCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Capture the card as a PNG blob using html2canvas */
  async function captureCard(): Promise<Blob> {
    if (!cardRef.current) throw new Error("Card ref not available")
    const { default: html2canvas } = await import("html2canvas")
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0a0a0a",
      scale: 2,
      useCORS: true,
      // Ignore oklch/modern CSS colors that html2canvas can't parse
      ignoreElements: (el) => el.tagName === "STYLE" && el.textContent?.includes("oklch") || false,
      onclone: (doc) => {
        // Force all elements to use rgb colors (html2canvas doesn't support oklch)
        doc.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement
          const computed = window.getComputedStyle(htmlEl)
          if (computed.color) htmlEl.style.color = computed.color
          if (computed.backgroundColor && computed.backgroundColor !== "rgba(0, 0, 0, 0)") {
            htmlEl.style.backgroundColor = computed.backgroundColor
          }
          if (computed.borderColor) htmlEl.style.borderColor = computed.borderColor
        })
      },
    })
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    )
    if (!blob) throw new Error("Falha ao gerar imagem")
    return blob
  }

  async function handlePostToFeed() {
    if (!cardRef.current || posting) return
    setPosting(true)
    setError(null)
    try {
      const blob = await captureCard()

      // Upload image via Vercel Blob
      const { upload } = await import("@vercel/blob/client")
      const blobResult = await upload(
        `workouts/${Date.now()}-treino.png`,
        blob,
        { access: "public", handleUploadUrl: "/api/upload" }
      )

      // Create community post
      const content = `Treino concluído: ${templateName} 💪\n${exerciseCount} exercícios · ${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`} volume · ${durationMin}min`
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
      console.error("Failed to post to feed:", msg)
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
      const file = new File([blob], "treino.png", { type: "image/png" })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: templateName })
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "treino.png"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      // AbortError = user cancelled the share dialog — not a real error
      if (e instanceof Error && e.name === "AbortError") return
      const msg = e instanceof Error ? e.message : "Erro ao compartilhar"
      setError(msg)
      console.error("Failed to share:", msg)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4">
        {/* The card that gets captured */}
        <div ref={cardRef} className="rounded-2xl overflow-hidden bg-[#0a0a0a] p-6 space-y-5 border border-white/[0.08]">
          {/* Header */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">Treino Concluído</p>
            <h2 className="text-xl font-bold text-white">{templateName}</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <Dumbbell className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{exerciseCount}</p>
              <p className="text-[10px] text-neutral-500">Exercícios</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}</p>
              <p className="text-[10px] text-neutral-500">Volume Total</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{durationMin}min</p>
              <p className="text-[10px] text-neutral-500">Duração</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{streak}</p>
              <p className="text-[10px] text-neutral-500">Sem Streak</p>
            </div>
          </div>

          {/* Branding footer */}
          <div className="text-center pt-2 border-t border-white/[0.06]">
            <p className="text-[10px] text-neutral-600">Powered by Victor Personal</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs animate-slide-up">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action buttons — outside the captured area */}
        <div className="space-y-2">
          {/* Post to community feed */}
          <button
            onClick={handlePostToFeed}
            disabled={posting || posted}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
              posted
                ? "bg-emerald-600/20 border border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]"
            }`}
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : posted ? "✓ Publicado no Feed" : <><Send className="w-4 h-4" /> Postar na Comunidade</>}
          </button>

          {/* Share externally + close */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neutral-400 text-sm font-medium flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Fechar
            </button>
            <button onClick={handleShare} disabled={sharing} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform">
              <Share2 className="w-4 h-4" /> {sharing ? "..." : "Compartilhar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
