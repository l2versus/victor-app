import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlaylistTracks, refreshAccessToken } from "@/lib/spotify"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: { id: true, spotifyAccessToken: true, spotifyRefreshToken: true, spotifyExpiresAt: true },
  })

  if (!student?.spotifyRefreshToken) {
    return NextResponse.json({ error: "Spotify não conectado" }, { status: 401 })
  }

  let accessToken = student.spotifyAccessToken
  const expired = !accessToken || !student.spotifyExpiresAt || student.spotifyExpiresAt < new Date()

  if (expired) {
    try {
      const newTokens = await refreshAccessToken(student.spotifyRefreshToken)
      accessToken = newTokens.access_token
      await prisma.student.update({
        where: { id: student.id },
        data: {
          spotifyAccessToken: newTokens.access_token,
          spotifyExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      })
    } catch {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 })
    }
  }

  try {
    const tracks = await getPlaylistTracks(accessToken!, id)
    return NextResponse.json({ tracks })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar tracks" }, { status: 500 })
  }
}
