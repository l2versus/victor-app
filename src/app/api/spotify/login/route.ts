import { NextResponse } from "next/server"
import { getSpotifyAuthUrl } from "@/lib/spotify"

// GET /api/spotify/login — Redireciona para tela de login do Spotify
export async function GET() {
  const state = crypto.randomUUID()
  const authUrl = getSpotifyAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
