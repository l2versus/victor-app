// ═══════════════════════════════════════════════════════════════
// Spotify OAuth Integration
// Authorization Code Flow — o aluno loga com a conta dele
// Funciona com conta FREE e Premium
// ═══════════════════════════════════════════════════════════════

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_URL = "https://api.spotify.com/v1"

function getClientId() {
  return process.env.SPOTIFY_CLIENT_ID || ""
}

function getClientSecret() {
  return process.env.SPOTIFY_CLIENT_SECRET || ""
}

function getRedirectUri(origin?: string) {
  const base = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/spotify/callback`
}

// Scopes necessários para ler playlists e top tracks do usuário
const SCOPES = [
  "user-read-private",
  "user-top-read",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ")

/** Gera URL de login do Spotify */
export function getSpotifyAuthUrl(state: string, origin?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    scope: SCOPES,
    redirect_uri: getRedirectUri(origin),
    state,
    show_dialog: "true",
  })
  return `${SPOTIFY_AUTH_URL}?${params}`
}

/** Troca authorization code por access + refresh tokens */
export async function exchangeCodeForTokens(code: string, origin?: string) {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(origin),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }>
}

/** Renova access token usando refresh token */
export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error("Token refresh failed")

  return res.json() as Promise<{
    access_token: string
    expires_in: number
  }>
}

/** Fetch helper com token do usuário */
async function spotifyFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 401) {
    throw new Error("SPOTIFY_TOKEN_EXPIRED")
  }

  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status}`)
  }

  return res.json()
}

/** Perfil do usuário */
export async function getSpotifyProfile(accessToken: string) {
  const data = await spotifyFetch("/me", accessToken)
  return {
    id: data.id as string,
    name: data.display_name as string,
    image: data.images?.[0]?.url as string | null,
    product: data.product as string, // "free" ou "premium"
  }
}

/** Top tracks do usuário */
export async function getTopTracks(accessToken: string, limit = 20) {
  const data = await spotifyFetch(
    `/me/top/tracks?time_range=short_term&limit=${limit}`,
    accessToken
  )
  return formatTracks(data.items)
}

/** Playlists do usuário */
export async function getUserPlaylists(accessToken: string, limit = 20) {
  const data = await spotifyFetch(`/me/playlists?limit=${limit}`, accessToken)
  return (data.items || []).map((pl: Record<string, unknown>) => ({
    id: pl.id as string,
    name: pl.name as string,
    image: (pl.images as { url: string }[])?.[0]?.url || null,
    trackCount: (pl.tracks as { total: number })?.total || 0,
    uri: pl.uri as string,
  }))
}

/** Tracks de uma playlist */
export async function getPlaylistTracks(accessToken: string, playlistId: string, limit = 30) {
  const data = await spotifyFetch(
    `/playlists/${playlistId}/tracks?limit=${limit}&fields=items(track(id,name,artists,album(images),duration_ms,uri,external_urls))`,
    accessToken
  )
  const items = data.items || []
  return formatTracks(
    items
      .map((i: Record<string, unknown>) => i.track)
      .filter((t: unknown) => t != null)
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTracks(items: any[]) {
  return items.map((track) => ({
    id: track.id as string,
    name: track.name as string,
    artist: (track.artists || []).map((a: { name: string }) => a.name).join(", "),
    albumArt: track.album?.images?.[0]?.url || "",
    durationMs: track.duration_ms || 0,
    uri: track.uri as string,
    spotifyUrl: track.external_urls?.spotify || "",
  }))
}

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  albumArt: string
  durationMs: number
  uri: string
  spotifyUrl: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  image: string | null
  trackCount: number
  uri: string
}
