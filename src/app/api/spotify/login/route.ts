import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSpotifyAuthUrl } from "@/lib/spotify"

// GET /api/spotify/login — Redireciona para tela de login do Spotify
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    // Mobile: session cookie pode sumir após redirect cross-site.
    // Redireciona pro login do app ao invés de retornar JSON 401.
    console.warn("[Spotify Login] No session — redirecting to app login")
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("redirect", "/today")
    return NextResponse.redirect(loginUrl)
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.redirect(new URL("/today?spotify=error&reason=student", req.nextUrl.origin))
  }

  // Detect real origin for final redirect back (after Spotify callback)
  const proto = req.headers.get("x-forwarded-proto") || "https"
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host
  const origin = `${proto}://${host}`

  // State encodes studentId + origin (for callback redirect), but
  // redirect_uri always uses NEXT_PUBLIC_APP_URL (must match Spotify Dashboard)
  const statePayload = `${student.id}::${origin}`
  const state = Buffer.from(statePayload).toString("base64url")

  const authUrl = getSpotifyAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
