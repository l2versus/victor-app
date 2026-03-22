import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
// Rota PÚBLICA — studentId + origin vêm no state param (base64url encoded)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const stateRaw = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  // Decode state: base64url("studentId::origin") or legacy plain "studentId"
  let studentId = ""
  let origin = ""
  if (stateRaw) {
    try {
      const decoded = Buffer.from(stateRaw, "base64url").toString("utf-8")
      if (decoded.includes("::")) {
        const idx = decoded.indexOf("::")
        studentId = decoded.slice(0, idx)
        origin = decoded.slice(idx + 2)
      } else {
        if (decoded.includes("|")) {
          studentId = decoded.split("|")[0]
          origin = decoded.split("|").slice(1).join("|")
        } else {
          studentId = decoded
        }
      }
    } catch {
      if (stateRaw.includes("|")) {
        studentId = stateRaw.split("|")[0]
        origin = stateRaw.split("|").slice(1).join("|")
      } else {
        studentId = stateRaw
      }
    }
  }

  // Fallback origin — always use NEXT_PUBLIC_APP_URL for consistency
  if (!origin) {
    origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  }

  const baseUrl = origin

  if (error || !code || !studentId) {
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.redirect(new URL("/today?spotify=error&reason=student", baseUrl))
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
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[Spotify Callback] exchange failed:", msg)
    const detail = encodeURIComponent(msg.slice(0, 120))
    return NextResponse.redirect(new URL(`/today?spotify=error&reason=token&detail=${detail}`, baseUrl))
  }
}
