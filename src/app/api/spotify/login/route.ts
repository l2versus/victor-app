import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSpotifyAuthUrl } from "@/lib/spotify"

// GET /api/spotify/login — Redireciona para tela de login do Spotify
export async function GET() {
  const state = crypto.randomUUID()

  const cookieStore = await cookies()
  cookieStore.set("spotify_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 min
    path: "/",
    sameSite: "lax",
  })

  const authUrl = getSpotifyAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
