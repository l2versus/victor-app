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
        // Legacy: plain studentId or "studentId|origin"
        if (decoded.includes("|")) {
          studentId = decoded.split("|")[0]
          origin = decoded.split("|").slice(1).join("|")
        } else {
          studentId = decoded
        }
      }
    } catch {
      // Not base64 — try as plain text (legacy format "studentId|origin" or just "studentId")
      if (stateRaw.includes("|")) {
        studentId = stateRaw.split("|")[0]
        origin = stateRaw.split("|").slice(1).join("|")
      } else {
        studentId = stateRaw
      }
    }
  }

  // Fallback origin
  if (!origin) {
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host
    origin = `${proto}://${host}`
  }

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  console.log("[Spotify Callback] studentId:", studentId, "| origin:", origin, "| hasCode:", !!code, "| error:", error)

  if (error || !code || !studentId) {
    console.error("[Spotify Callback] denied or missing:", { error, hasCode: !!code, studentId })
    return NextResponse.redirect(new URL("/today?spotify=denied", baseUrl))
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  })

  if (!student) {
    console.error("[Spotify Callback] student not found:", studentId)
    return NextResponse.redirect(new URL("/today?spotify=error&reason=student", baseUrl))
  }

  try {
    const tokens = await exchangeCodeForTokens(code, origin)
    console.log("[Spotify Callback] tokens received, fetching profile...")

    const profile = await getSpotifyProfile(tokens.access_token)
    console.log("[Spotify Callback] profile:", profile.name)

    await prisma.student.update({
      where: { id: student.id },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        spotifyExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        spotifyName: profile.name,
      },
    })

    console.log("[Spotify Callback] SUCCESS — tokens saved for", student.id)
    return NextResponse.redirect(new URL("/today?spotify=connected", baseUrl))
  } catch (err) {
    console.error("[Spotify Callback] TOKEN EXCHANGE FAILED:", err)
    return NextResponse.redirect(new URL("/today?spotify=error&reason=token", baseUrl))
  }
}
