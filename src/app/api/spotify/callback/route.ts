import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
// Rota PÚBLICA — studentId vem no state param
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state") // = studentId
  const error = req.nextUrl.searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  const student = await prisma.student.findUnique({
    where: { id: state },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.redirect(new URL("/today?spotify=error", baseUrl))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const profile = await getSpotifyProfile(tokens.access_token)

    await prisma.student.update({
      where: { id: student.id },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        spotifyExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        spotifyName: profile.name,
      },
    })

    return NextResponse.redirect(new URL("/today?spotify=connected", baseUrl))
  } catch (err) {
    console.error("[Spotify Callback]", err)
    return NextResponse.redirect(new URL("/today?spotify=error", baseUrl))
  }
}
