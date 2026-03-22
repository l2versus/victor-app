import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSpotifyProfile, refreshAccessToken } from "@/lib/spotify"

// GET /api/spotify/me — Perfil do usuário logado no Spotify
export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    // Tenta com access token atual
    if (accessToken) {
      const profile = await getSpotifyProfile(accessToken)
      return NextResponse.json({ connected: true, profile })
    }
    throw new Error("SPOTIFY_TOKEN_EXPIRED")
  } catch (err) {
    // Tenta renovar o token
    if (refreshToken && err instanceof Error && err.message === "SPOTIFY_TOKEN_EXPIRED") {
      try {
        const newTokens = await refreshAccessToken(refreshToken)
        cookieStore.set("spotify_access_token", newTokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: newTokens.expires_in,
          path: "/",
          sameSite: "lax",
        })

        const profile = await getSpotifyProfile(newTokens.access_token)
        return NextResponse.json({ connected: true, profile })
      } catch {
        // Refresh token expirou — precisa logar de novo
        cookieStore.delete("spotify_access_token")
        cookieStore.delete("spotify_refresh_token")
        return NextResponse.json({ connected: false })
      }
    }

    return NextResponse.json({ connected: false })
  }
}

// DELETE /api/spotify/me — Desconectar Spotify
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("spotify_access_token")
  cookieStore.delete("spotify_refresh_token")
  return NextResponse.json({ disconnected: true })
}
