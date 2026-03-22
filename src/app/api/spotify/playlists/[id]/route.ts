import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPlaylistTracks, refreshAccessToken } from "@/lib/spotify"

// GET /api/spotify/playlists/[id] — Tracks de uma playlist específica
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  let accessToken = cookieStore.get("spotify_access_token")?.value
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Não conectado" }, { status: 401 })
  }

  if (!accessToken && refreshToken) {
    try {
      const newTokens = await refreshAccessToken(refreshToken)
      accessToken = newTokens.access_token
      cookieStore.set("spotify_access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: newTokens.expires_in,
        path: "/",
        sameSite: "lax",
      })
    } catch {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 })
    }
  }

  try {
    const tracks = await getPlaylistTracks(accessToken!, id)
    return NextResponse.json({ tracks })
  } catch (err) {
    if (err instanceof Error && err.message === "SPOTIFY_TOKEN_EXPIRED" && refreshToken) {
      try {
        const newTokens = await refreshAccessToken(refreshToken)
        cookieStore.set("spotify_access_token", newTokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: newTokens.expires_in,
          path: "/",
          sameSite: "lax",
        })
        const tracks = await getPlaylistTracks(newTokens.access_token, id)
        return NextResponse.json({ tracks })
      } catch {
        return NextResponse.json({ error: "Token expirado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Erro ao buscar tracks" }, { status: 500 })
  }
}
