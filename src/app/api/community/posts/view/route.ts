import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/community/posts/view — track that the current user viewed a post
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const { postId } = await req.json()
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Upsert view — don't count same user twice
    await prisma.postView.upsert({
      where: { postId_studentId: { postId, studentId: student.id } },
      create: { postId, studentId: student.id },
      update: {},
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
