import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getTopTracks, refreshAccessToken } from "@/lib/spotify"

// GET /api/spotify/top-tracks — Top tracks do usuário
export async function GET() {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get("spotify_access_token")?.value
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Não conectado" }, { status: 401 })
  }

  // Tenta renovar se não tem access token
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
    const tracks = await getTopTracks(accessToken!)
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
        const tracks = await getTopTracks(newTokens.access_token)
        return NextResponse.json({ tracks })
      } catch {
        return NextResponse.json({ error: "Token expirado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Erro ao buscar tracks" }, { status: 500 })
  }
}
