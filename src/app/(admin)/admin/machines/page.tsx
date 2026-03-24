"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Pencil, Check, X, Loader2, Maximize2, Minimize2, RotateCcw, Box, Play, Dumbbell, Save, Video, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const Machine3DCanvas = dynamic(() => import("./machine-3d-canvas"), { ssr: false })

type Machine = { slug: string; file: string; name: string; addedAt: string; videoUrl?: string; exercises?: string[] }

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState<string | null>(null)

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/machines")
      if (res.ok) {
        const data = await res.json()
        setMachines(data.machines)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMachines() }, [fetchMachines])

  async function handleSave(slug: string) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/machines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: editName }),
      })
      if (res.ok) {
        setMachines(prev => prev.map(m => m.slug === slug ? { ...m, name: editName.trim() } : m))
        setEditing(null)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const isUUID = (s: string) => /^[0-9a-f]{8}-/.test(s)
  const fullscreenMachine = fullscreen ? machines.find(m => m.slug === fullscreen) : null

  return (
    <div className="space-y-6">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>

      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20 text-white font-bold text-sm">
            3D
          </div>
          Equipamentos Ironberg
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {machines.length} modelos 3D interativos · Clique para expandir · Edite o nome clicando no lápis
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RotateCcw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Carregando modelos 3D...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => {
            const needsRename = isUUID(m.name)
            const isEditing = editing === m.slug

            return (
              <div
                key={m.slug}
                className={`rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] ${
                  needsRename
                    ? "border-amber-500/20 bg-[#0c0a00]"
                    : "border-white/[0.08] bg-[#0a0a0a]"
                }`}
              >
                {/* 3D Preview */}
                <div className="relative w-full h-[220px] bg-[#050505] group cursor-pointer" onClick={() => setFullscreen(m.slug)}>
                  <Machine3DCanvas modelUrl={m.file} />

                  {/* Expand button */}
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Ironberg badge */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Ironberg</span>
                  </div>

                  {needsRename && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Renomear</span>
                    </div>
                  )}
                </div>

                {/* Info + Edit */}
                <div className="p-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSave(m.slug)}
                        autoFocus
                        className="flex-1 rounded-lg border border-red-500/30 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
                        placeholder="Nome do equipamento (ex: Leg Press 45°)"
                      />
                      <button
                        onClick={() => handleSave(m.slug)}
                        disabled={saving}
                        className="w-9 h-9 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center hover:bg-red-600/30 transition-colors shrink-0"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="w-9 h-9 rounded-lg bg-white/[0.05] text-neutral-500 flex items-center justify-center hover:text-white transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${needsRename ? "text-amber-300" : "text-white"}`}>
                          {m.name}
                        </p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">{m.addedAt}</p>
                      </div>
                      <button
                        onClick={() => { setEditing(m.slug); setEditName(needsRename ? "" : m.name) }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fullscreen Modal — Premium Showcase */}
      {fullscreenMachine && (
        <MachineShowcase
          machine={fullscreenMachine}
          onClose={() => setFullscreen(null)}
          onSaveVideo={async (slug, videoUrl) => {
            try {
              await fetch("/api/admin/machines", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, videoUrl }),
              })
              setMachines(prev => prev.map(m => m.slug === slug ? { ...m, videoUrl } : m))
            } catch { /* ignore */ }
          }}
        />
      )}
    </div>
  )
}

/* ═══ MACHINE SHOWCASE — Premium fullscreen with tabs ═══ */
function MachineShowcase({
  machine,
  onClose,
  onSaveVideo,
}: {
  machine: Machine
  onClose: () => void
  onSaveVideo: (slug: string, videoUrl: string) => Promise<void>
}) {
  const [tab, setTab] = useState<"3d" | "video" | "exercises">("3d")
  const [videoUrl, setVideoUrl] = useState(machine.videoUrl || "")
  const [savingVideo, setSavingVideo] = useState(false)

  const tabs = [
    { key: "3d" as const, label: "Modelo 3D", icon: Box },
    { key: "video" as const, label: "Vídeo Demo", icon: Play },
    { key: "exercises" as const, label: "Exercícios", icon: Dumbbell },
  ]

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header — Premium */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-600/30">
              3D
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{machine.name}</h2>
              <p className="text-xs text-neutral-500 flex items-center gap-2">
                <span className="text-red-400 font-semibold uppercase tracking-wider text-[10px]">Ironberg</span>
                <span>·</span>
                <span>Modelo interativo</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pb-3">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                  tab === t.key
                    ? "bg-red-600/15 text-red-400 border border-red-500/20"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* TAB: 3D Model */}
        {tab === "3d" && (
          <div className="absolute inset-0">
            <Machine3DCanvas modelUrl={machine.file} fullscreen />
            {/* Controls hint */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.08]">
                <p className="text-[11px] text-neutral-400">
                  🖱️ Arraste para girar · 🤏 Pinch para zoom · Auto-rotação ativa
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Video Demo */}
        {tab === "video" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            {videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be")) ? (
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : videoUrl && videoUrl.includes("instagram") ? (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/20 text-pink-400 hover:from-pink-600/30 transition-all">
                <ExternalLink className="w-5 h-5" />
                <span className="text-sm font-semibold">Ver vídeo no Instagram</span>
              </a>
            ) : videoUrl ? (
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
                <video src={videoUrl} controls playsInline className="w-full h-full" preload="metadata" />
              </div>
            ) : (
              <div className="text-center">
                <Video className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400 text-sm mb-1">Nenhum vídeo adicionado</p>
                <p className="text-neutral-600 text-xs mb-6">Grave um vídeo demonstrativo na Ironberg</p>
              </div>
            )}

            {/* Video URL input */}
            <div className="w-full max-w-xl mt-6">
              <label className="text-xs text-neutral-500 mb-1.5 block">Link do vídeo (YouTube, Instagram ou upload)</label>
              <div className="flex gap-2">
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... ou Instagram"
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                />
                <button
                  onClick={async () => {
                    setSavingVideo(true)
                    await onSaveVideo(machine.slug, videoUrl)
                    setSavingVideo(false)
                  }}
                  disabled={savingVideo || !videoUrl.trim()}
                  className="px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {savingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Exercises */}
        {tab === "exercises" && (
          <div className="absolute inset-0 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <p className="text-neutral-500 text-sm mb-4">
                Exercícios que podem ser feitos neste equipamento. Vincule na página de Exercícios.
              </p>
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">Vincule exercícios a este equipamento</p>
                <p className="text-neutral-600 text-xs mt-1">Vá em Exercícios → edite um exercício → campo "Modelo 3D" → use o slug: <span className="text-red-400 font-mono">{machine.slug}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return url
}
