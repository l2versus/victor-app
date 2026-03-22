import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSpotifyAuthUrl } from "@/lib/spotify"

// GET /api/spotify/login — Redireciona para tela de login do Spotify
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
  }

  // Detect real origin — behind reverse proxy (Coolify/Traefik), nextUrl.origin returns localhost
  const proto = req.headers.get("x-forwarded-proto") || "http"
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host
  const origin = `${proto}://${host}`

  console.log("[Spotify Login] origin detected:", origin, "| student:", student.id)

  // Encode origin in state: base64("studentId::origin")
  const statePayload = `${student.id}::${origin}`
  const state = Buffer.from(statePayload).toString("base64url")

  const authUrl = getSpotifyAuthUrl(state, origin)
  return NextResponse.redirect(authUrl)
}
