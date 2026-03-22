import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const savedState = cookieStore.get("spotify_state")?.value

  // Limpa state cookie
  cookieStore.delete("spotify_state")

  if (error) {
    return NextResponse.redirect(new URL("/today?spotify=denied", req.url))
  }

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/today?spotify=error", req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    // Salva tokens em cookies httpOnly
    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
      sameSite: "lax",
    })

    cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.redirect(new URL("/today?spotify=connected", req.url))
  } catch (err) {
    console.error("[Spotify Callback]", err)
    return NextResponse.redirect(new URL("/today?spotify=error", req.url))
  }
}
