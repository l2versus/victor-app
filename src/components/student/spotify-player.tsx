"use client"

import { useState, useEffect } from "react"
import {
  Music, ChevronUp, ChevronDown, X, LogOut, Disc3,
  ListMusic, TrendingUp, ExternalLink, Loader2,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// Spotify Player — OAuth completo
// O aluno loga com a conta dele e ouve música DENTRO do app
// Top tracks pessoais + playlists + embed player real
// ═══════════════════════════════════════════════════════════════

interface Track {
  id: string
  name: string
  artist: string
  albumArt: string
  uri: string
  spotifyUrl: string
}

interface Playlist {
  id: string
  name: string
  image: string | null
  trackCount: number
}

interface Profile {
  name: string
  image: string | null
  product: string
}

type Tab = "top" | "playlists"
type PlayerSize = "compact" | "full"

export function SpotifyMiniPlayer() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<Tab>("top")
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null)
  const [size, setSize] = useState<PlayerSize>("compact")
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check connection on mount
  function checkConnection() {
    setLoading(true)
    fetch("/api/spotify/me")
      .then((r) => r.json())
      .then((d) => {
        setConnected(d.connected)
        if (d.connected) {
          setProfile(d.profile)
          setError(null)
        }
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const spotifyResult = params.get("spotify")
    const reason = params.get("reason")

    // Mostrar erro se voltou do OAuth com falha
    if (spotifyResult && spotifyResult !== "connected") {
      const detail = params.get("detail") || ""
      setError(
        spotifyResult === "denied"
          ? "Acesso negado no Spotify"
          : reason === "token"
            ? `Erro ao conectar — ${detail || "tente novamente"}`
            : reason === "student"
              ? "Conta não encontrada"
              : "Erro ao conectar"
      )
    }

    // Limpar query params do OAuth
    if (spotifyResult) {
      const url = new URL(window.location.href)
      url.searchParams.delete("spotify")
      url.searchParams.delete("reason")
      url.searchParams.delete("detail")
      window.history.replaceState({}, "", url.pathname)
    }

    checkConnection()

    // Mobile: retry após 1.5s — iOS Safari e Android Chrome podem
    // ter delay de propagação de cookie após redirect cross-site
    if (spotifyResult === "connected") {
      const retryTimer = setTimeout(() => checkConnection(), 1500)
      return () => clearTimeout(retryTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load data when connected
  useEffect(() => {
    if (!connected) return

    fetch("/api/spotify/top-tracks")
      .then((r) => r.json())
      .then((d) => { if (d.tracks) setTopTracks(d.tracks) })
      .catch(() => {})

    fetch("/api/spotify/playlists")
      .then((r) => r.json())
      .then((d) => { if (d.playlists) setPlaylists(d.playlists) })
      .catch(() => {})
  }, [connected])

  // Disconnect
  async function handleDisconnect() {
    await fetch("/api/spotify/me", { method: "DELETE" })
    setConnected(false)
    setProfile(null)
    setTopTracks([])
    setPlaylists([])
    setPlayingTrackId(null)
    setPlayingPlaylistId(null)
  }

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#1DB954] animate-spin" />
          </div>
          <span className="text-sm text-neutral-500">Verificando Spotify...</span>
        </div>
      </div>
    )
  }

  // ═══ NOT CONNECTED — Login Button ═══
  if (!connected) {
    return (
      <div>
        <a
          href="/api/spotify/login"
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-[#1DB954]/30 hover:bg-[#1DB954]/[0.04] transition-all active:scale-[0.98] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center shrink-0 group-hover:bg-[#1DB954]/20 transition-colors">
            <SpotifyIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Conectar Spotify</p>
            <p className="text-[11px] text-neutral-500">Suas músicas durante o treino</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#1DB954] text-black text-[11px] font-bold shrink-0">
            Login
          </div>
        </a>
        {error && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-[11px] text-red-400">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // ═══ CONNECTED — Collapsed bar ═══
  if (!expanded) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        {/* Mini bar */}
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
        >
          {/* Playing indicator or profile */}
          {playingTrackId || playingPlaylistId ? (
            <div className="w-10 h-10 rounded-xl bg-[#1DB954]/15 border border-[#1DB954]/20 flex items-center justify-center shrink-0 relative">
              <Disc3 className="w-5 h-5 text-[#1DB954] animate-spin" style={{ animationDuration: "3s" }} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center shrink-0">
              <SpotifyIcon />
            </div>
          )}

          <div className="flex-1 text-left min-w-0">
            {playingTrackId ? (
              <>
                <p className="text-sm font-medium text-[#1DB954] truncate">
                  {topTracks.find((t) => t.id === playingTrackId)?.name || "Tocando..."}
                </p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {topTracks.find((t) => t.id === playingTrackId)?.artist || ""}
                </p>
              </>
            ) : playingPlaylistId ? (
              <>
                <p className="text-sm font-medium text-[#1DB954] truncate">
                  {playlists.find((p) => p.id === playingPlaylistId)?.name || "Playlist"}
                </p>
                <p className="text-[11px] text-neutral-500">Tocando playlist</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-white">Spotify</p>
                <p className="text-[11px] text-neutral-500">
                  {profile?.name} · {topTracks.length} top tracks
                </p>
              </>
            )}
          </div>

          <ChevronUp className="w-4 h-4 text-neutral-600 shrink-0" />
        </button>

        {/* Embed player (if playing) */}
        {playingTrackId && (
          <div className="px-2 pb-2">
            <iframe
              src={`https://open.spotify.com/embed/track/${playingTrackId}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          </div>
        )}

        {playingPlaylistId && !playingTrackId && (
          <div className="px-2 pb-2">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playingPlaylistId}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          </div>
        )}
      </div>
    )
  }

  // ═══ CONNECTED — Expanded Panel ═══
  const embedHeight = size === "full" ? 352 : 152

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <SpotifyIcon />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name}</p>
            <p className="text-[10px] text-neutral-600">
              {profile?.product === "premium" ? "Premium" : "Free"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDisconnect}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors"
            title="Desconectar"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pb-2">
        <button
          onClick={() => setTab("top")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            tab === "top"
              ? "bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/25"
              : "bg-white/[0.03] text-neutral-500 border border-white/[0.06] hover:text-white"
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Mais Ouvidas
        </button>
        <button
          onClick={() => setTab("playlists")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            tab === "playlists"
              ? "bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/25"
              : "bg-white/[0.03] text-neutral-500 border border-white/[0.06] hover:text-white"
          }`}
        >
          <ListMusic className="w-3 h-3" />
          Playlists
        </button>
      </div>

      {/* ─── Top Tracks Tab ─── */}
      {tab === "top" && (
        <div className="px-3 pb-2">
          {topTracks.length === 0 ? (
            <p className="text-xs text-neutral-600 text-center py-4">
              Ouça mais músicas no Spotify para gerar seu ranking
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1 scrollbar-hide">
              {topTracks.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setPlayingTrackId(track.id)
                    setPlayingPlaylistId(null)
                    setSize("compact")
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2 rounded-lg transition-all ${
                    playingTrackId === track.id
                      ? "bg-[#1DB954]/10 border border-[#1DB954]/15"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Rank number */}
                  <span className={`text-[10px] font-bold w-4 text-right shrink-0 ${
                    idx < 3 ? "text-[#1DB954]" : "text-neutral-600"
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Album art */}
                  {track.albumArt ? (
                    <img src={track.albumArt} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-neutral-600" />
                    </div>
                  )}

                  {/* Track info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs truncate ${
                      playingTrackId === track.id ? "text-[#1DB954] font-medium" : "text-neutral-300"
                    }`}>
                      {track.name}
                    </p>
                    <p className="text-[10px] text-neutral-600 truncate">{track.artist}</p>
                  </div>

                  {/* Playing indicator */}
                  {playingTrackId === track.id && (
                    <div className="flex items-end gap-[2px] h-3 shrink-0">
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-1" />
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-2" />
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Playlists Tab ─── */}
      {tab === "playlists" && (
        <div className="px-3 pb-2">
          {playlists.length === 0 ? (
            <p className="text-xs text-neutral-600 text-center py-4">
              Nenhuma playlist encontrada
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1 scrollbar-hide">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    setPlayingPlaylistId(pl.id)
                    setPlayingTrackId(null)
                    setSize("compact")
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2 rounded-lg transition-all ${
                    playingPlaylistId === pl.id
                      ? "bg-[#1DB954]/10 border border-[#1DB954]/15"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {pl.image ? (
                    <img src={pl.image} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0">
                      <ListMusic className="w-4 h-4 text-neutral-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs truncate ${
                      playingPlaylistId === pl.id ? "text-[#1DB954] font-medium" : "text-neutral-300"
                    }`}>
                      {pl.name}
                    </p>
                    <p className="text-[10px] text-neutral-600">{pl.trackCount} músicas</p>
                  </div>

                  {playingPlaylistId === pl.id && (
                    <div className="flex items-end gap-[2px] h-3 shrink-0">
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-1" />
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-2" />
                      <div className="w-[2px] bg-[#1DB954] rounded-full animate-eq-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Embed Player ─── */}
      {(playingTrackId || playingPlaylistId) && (
        <div className="px-2 pb-2">
          {/* Size toggle */}
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Player</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSize(size === "full" ? "compact" : "full")}
                className="text-[10px] text-neutral-600 hover:text-[#1DB954] transition-colors px-1.5 py-0.5 rounded"
              >
                {size === "full" ? "Compactar" : "Expandir"}
              </button>
              {playingTrackId && (
                <a
                  href={topTracks.find((t) => t.id === playingTrackId)?.spotifyUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-[#1DB954] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* The real Spotify embed */}
          <div
            className="transition-all duration-300 ease-out overflow-hidden rounded-xl"
            style={{ height: embedHeight }}
          >
            <iframe
              key={playingTrackId || playingPlaylistId}
              src={
                playingTrackId
                  ? `https://open.spotify.com/embed/track/${playingTrackId}?utm_source=generator&theme=0`
                  : `https://open.spotify.com/embed/playlist/${playingPlaylistId}?utm_source=generator&theme=0`
              }
              width="100%"
              height={352}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Equalizer CSS */}
      <style jsx>{`
        @keyframes eq-1 { 0%, 100% { height: 4px; } 50% { height: 12px; } }
        @keyframes eq-2 { 0%, 100% { height: 8px; } 50% { height: 4px; } }
        @keyframes eq-3 { 0%, 100% { height: 6px; } 50% { height: 12px; } }
        .animate-eq-1 { animation: eq-1 0.8s ease-in-out infinite; }
        .animate-eq-2 { animation: eq-2 0.6s ease-in-out infinite 0.2s; }
        .animate-eq-3 { animation: eq-3 0.7s ease-in-out infinite 0.1s; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}
