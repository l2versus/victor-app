"use client"

import { useState } from "react"
import { Music, ChevronUp, ChevronDown, X } from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// Spotify Interno — Embed player real do Spotify dentro do app
// O aluno loga no próprio Spotify e toca músicas INTEIRAS
// Funciona com conta FREE (com ads) e Premium (sem ads)
// ═══════════════════════════════════════════════════════════════

// Playlists públicas curadas para treino (Spotify IDs)
const WORKOUT_PLAYLISTS = [
  {
    id: "37i9dQZF1DX76Wlfdnj7AP",  // Beast Mode
    name: "Beast Mode",
    emoji: "🔥",
    desc: "Treino pesado, sem piedade",
  },
  {
    id: "37i9dQZF1DX70RN3TfnE9m",  // Cardio
    name: "Cardio",
    emoji: "🏃",
    desc: "Energia pura pra correr",
  },
  {
    id: "37i9dQZF1DX0HRj9P7NxeE",  // Workout Twerkout
    name: "Hip Hop Gym",
    emoji: "🎤",
    desc: "Trap e rap pro shape",
  },
  {
    id: "37i9dQZF1DX5gQonLbZD9s",  // Power Workout
    name: "Power Workout",
    emoji: "⚡",
    desc: "Eletrônica e energia",
  },
  {
    id: "37i9dQZF1DWTl4y3SSa0vZ",  // Rock Workout
    name: "Rock & Metal",
    emoji: "🤘",
    desc: "Porrada sonora",
  },
  {
    id: "37i9dQZF1DWWOaP4H0w48x",  // Funk Hits
    name: "Funk & Br",
    emoji: "🇧🇷",
    desc: "Funk e hits brasileiros",
  },
  {
    id: "37i9dQZF1DX4eRPd9frC1m",  // Motivação
    name: "Motivação",
    emoji: "💪",
    desc: "Foco e determinação",
  },
  {
    id: "37i9dQZF1DX32NsLKyzScr",  // EDM Workout
    name: "EDM",
    emoji: "🎧",
    desc: "Drops e bass pesado",
  },
] as const

type PlayerSize = "compact" | "expanded" | "full"

export function SpotifyMiniPlayer() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<typeof WORKOUT_PLAYLISTS[number] | null>(null)
  const [size, setSize] = useState<PlayerSize>("compact")
  const [showPicker, setShowPicker] = useState(false)

  // ═══ COLLAPSED — Just the Spotify bar ═══
  if (!selectedPlaylist && !showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-[#1DB954]/20 hover:bg-[#1DB954]/[0.03] transition-all active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center shrink-0">
          <SpotifyIcon />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">Spotify</p>
          <p className="text-[11px] text-neutral-500">Tocar música durante o treino</p>
        </div>
        <Music className="w-4 h-4 text-neutral-600" />
      </button>
    )
  }

  // ═══ GENRE PICKER ═══
  if (!selectedPlaylist && showPicker) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <SpotifyIcon />
            <span className="text-sm font-medium text-white">Escolha o som</span>
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist Grid */}
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          {WORKOUT_PLAYLISTS.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                setSelectedPlaylist(pl)
                setShowPicker(false)
                setSize("compact")
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-[#1DB954]/[0.05] hover:border-[#1DB954]/20 transition-all active:scale-[0.97] text-left"
            >
              <span className="text-xl shrink-0">{pl.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{pl.name}</p>
                <p className="text-[10px] text-neutral-600 truncate">{pl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ═══ PLAYING — Spotify Embed ═══
  if (!selectedPlaylist) return null
  const embedHeight = size === "full" ? 352 : size === "expanded" ? 152 : 80

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden animate-slide-up">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <SpotifyIcon />
          <span className="text-xs text-neutral-400 truncate">{selectedPlaylist.emoji} {selectedPlaylist.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Size toggle */}
          <button
            onClick={() => {
              const sizes: PlayerSize[] = ["compact", "expanded", "full"]
              const curr = sizes.indexOf(size)
              setSize(sizes[(curr + 1) % sizes.length])
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-[#1DB954] transition-colors"
            title={size === "full" ? "Compactar" : "Expandir"}
          >
            {size === "full" ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Change playlist */}
          <button
            onClick={() => {
              setSelectedPlaylist(null)
              setShowPicker(true)
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white transition-colors"
            title="Trocar playlist"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spotify Embed iframe — the REAL Spotify */}
      <div
        className="transition-all duration-300 ease-out overflow-hidden"
        style={{ height: embedHeight }}
      >
        <iframe
          src={`https://open.spotify.com/embed/playlist/${selectedPlaylist.id}?utm_source=generator&theme=0`}
          width="100%"
          height={352}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-b-xl"
          style={{
            colorScheme: "normal",
            borderRadius: "0 0 12px 12px",
          }}
        />
      </div>
    </div>
  )
}

// Spotify green icon
function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}
