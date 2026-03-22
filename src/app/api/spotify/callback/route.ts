import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (error || !code) {
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  // Pega o aluno logado via cookie de sessão
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL("/today?spotify=error&reason=nosession", baseUrl))
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.redirect(new URL("/today?spotify=error&reason=nostudent", baseUrl))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const profile = await getSpotifyProfile(tokens.access_token)

    // Salva no banco — 100% confiável, sem cookies frágeis
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
    return NextResponse.redirect(new URL("/today?spotify=error&reason=token", baseUrl))
  }
}
