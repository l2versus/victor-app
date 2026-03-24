import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/community/stories/view — mark story as viewed
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { storyId } = await req.json()

    if (!storyId) return NextResponse.json({ error: "storyId obrigatório" }, { status: 400 })

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    await prisma.storyView.upsert({
      where: { storyId_studentId: { storyId, studentId: me.id } },
      create: { storyId, studentId: me.id },
      update: {},
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
