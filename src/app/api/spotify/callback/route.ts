import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
// Rota PÚBLICA — studentId vem no state param (formato: "studentId|origin")
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state") // "studentId|origin"
  const error = req.nextUrl.searchParams.get("error")

  // Parse state: "studentId|origin" or just "studentId" (legacy)
  let studentId = state || ""
  let origin = req.nextUrl.origin
  if (state?.includes("|")) {
    const parts = state.split("|")
    studentId = parts[0]
    origin = parts.slice(1).join("|") // rejoin in case origin has |
  }

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (error || !code || !studentId) {
    console.error("[Spotify Callback] denied or missing params:", { error, hasCode: !!code, studentId })
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  })

  if (!student) {
    console.error("[Spotify Callback] student not found:", studentId)
    return NextResponse.redirect(new URL("/today?spotify=error", baseUrl))
  }

  try {
    // Use the same origin for redirect_uri so it matches what was sent during login
    const tokens = await exchangeCodeForTokens(code, origin)
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
    console.error("[Spotify Callback] token exchange error:", err)
    return NextResponse.redirect(new URL("/today?spotify=error", baseUrl))
  }
}
