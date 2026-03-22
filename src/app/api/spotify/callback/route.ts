import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/spotify"

function setCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

// GET /api/spotify/callback — Spotify redireciona aqui após login
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (error || !code) {
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const redirectUrl = new URL("/today?spotify=connected", baseUrl)
    const res = new NextResponse(null, {
      status: 307,
      headers: { Location: redirectUrl.toString() },
    })

    res.headers.append("Set-Cookie", setCookie("spotify_access_token", tokens.access_token, tokens.expires_in))
    res.headers.append("Set-Cookie", setCookie("spotify_refresh_token", tokens.refresh_token, 60 * 60 * 24 * 30))

    return res
  } catch (err) {
    console.error("[Spotify Callback] Token exchange failed:", err)
    return NextResponse.redirect(new URL("/today?spotify=error&reason=token", baseUrl))
  }
}
