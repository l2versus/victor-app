import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserPlaylists, refreshAccessToken } from "@/lib/spotify"

// GET /api/spotify/playlists — Playlists do usuário
export async function GET() {
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
    const playlists = await getUserPlaylists(accessToken!)
    return NextResponse.json({ playlists })
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
        const playlists = await getUserPlaylists(newTokens.access_token)
        return NextResponse.json({ playlists })
      } catch {
        return NextResponse.json({ error: "Token expirado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Erro ao buscar playlists" }, { status: 500 })
  }
}
