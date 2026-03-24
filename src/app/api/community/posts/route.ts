import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/community/posts — create a user post (text + optional photo)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Apenas alunos podem postar" }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const { content, imageUrl } = body

    if (!content?.trim() && !imageUrl) {
      return NextResponse.json({ error: "Post precisa de texto ou foto" }, { status: 400 })
    }

    const post = await prisma.communityPost.create({
      data: {
        studentId: student.id,
        type: "USER_POST",
        content: content?.trim() || "",
        imageUrl: imageUrl || null,
      },
      include: {
        student: { include: { user: { select: { name: true, avatar: true } } } },
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
