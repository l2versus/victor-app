import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSpotifyAuthUrl } from "@/lib/spotify"

// GET /api/spotify/login — Redireciona para tela de login do Spotify
// Codifica o studentId no state pra o callback saber quem é
export async function GET() {
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

  // state = studentId (o callback usa pra vincular tokens ao aluno)
  const authUrl = getSpotifyAuthUrl(student.id)
  return NextResponse.redirect(authUrl)
}
