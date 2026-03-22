import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (error || !code) {
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const res = NextResponse.redirect(new URL("/today?spotify=connected", baseUrl))

    res.cookies.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: tokens.expires_in,
      path: "/",
      sameSite: "lax",
    })

    res.cookies.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
      sameSite: "lax",
    })

    return res
  } catch (err) {
    console.error("[Spotify Callback] Token exchange failed:", err)
    return NextResponse.redirect(new URL("/today?spotify=error", baseUrl))
  }
}
