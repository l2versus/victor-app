import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSpotifyProfile, refreshAccessToken } from "@/lib/spotify"

// GET /api/spotify/me — Perfil do usuário logado no Spotify
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ connected: false })

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyExpiresAt: true,
      spotifyName: true,
    },
  })

  if (!student?.spotifyRefreshToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    let accessToken = student.spotifyAccessToken
    const expired = !accessToken || !student.spotifyExpiresAt || student.spotifyExpiresAt < new Date()

    // Renova token se expirou
    if (expired && student.spotifyRefreshToken) {
      const newTokens = await refreshAccessToken(student.spotifyRefreshToken)
      accessToken = newTokens.access_token

      await prisma.student.update({
        where: { id: student.id },
        data: {
          spotifyAccessToken: newTokens.access_token,
          spotifyExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      })
    }

    const profile = await getSpotifyProfile(accessToken!)
    return NextResponse.json({
      connected: true,
      profile: {
        name: profile.name,
        image: profile.image,
        product: profile.product,
      },
    })
  } catch {
    // Token inválido — limpa tudo
    await prisma.student.update({
      where: { id: student.id },
      data: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyExpiresAt: null,
        spotifyName: null,
      },
    })
    return NextResponse.json({ connected: false })
  }
}

// DELETE /api/spotify/me — Desconectar Spotify
export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ disconnected: true })

  await prisma.student.updateMany({
    where: { userId: session.userId },
    data: {
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyExpiresAt: null,
      spotifyName: null,
    },
  })

  return NextResponse.json({ disconnected: true })
}
