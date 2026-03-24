import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/search?q=nome — search users by name
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const q = new URL(req.url).searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const me = session.role === "STUDENT"
      ? await prisma.student.findUnique({ where: { userId: session.userId }, select: { id: true } })
      : null

    const students = await prisma.student.findMany({
      where: {
        user: { name: { contains: q, mode: "insensitive" } },
        status: "ACTIVE",
      },
      select: {
        id: true,
        bio: true,
        profession: true,
        user: { select: { name: true, avatar: true } },
        _count: { select: { followers: true, sessions: true } },
      },
      take: 15,
    })

    return NextResponse.json({
      users: students.map((s) => ({
        studentId: s.id,
        name: s.user.name,
        avatar: s.user.avatar,
        bio: s.bio,
        profession: s.profession,
        followers: s._count.followers,
        sessions: s._count.sessions,
        isMe: me?.id === s.id,
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
