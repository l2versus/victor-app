import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/community/follow — follow or unfollow a student
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Apenas alunos" }, { status: 403 })
    }

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const { studentId } = await req.json()
    if (!studentId || studentId === me.id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Toggle follow
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: studentId } },
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ following: false })
    }

    await prisma.follow.create({
      data: { followerId: me.id, followingId: studentId },
    })
    return NextResponse.json({ following: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/community/follow?type=following|followers — list who I follow / who follows me
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Apenas alunos" }, { status: 403 })
    }

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const type = req.nextUrl.searchParams.get("type") || "following"

    if (type === "followers") {
      const followers = await prisma.follow.findMany({
        where: { followingId: me.id },
        include: { follower: { include: { user: { select: { name: true, avatar: true } } } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({
        users: followers.map((f) => ({
          studentId: f.follower.id,
          name: f.follower.user.name,
          avatar: f.follower.user.avatar,
          since: f.createdAt,
        })),
        count: followers.length,
      })
    }

    // following
    const following = await prisma.follow.findMany({
      where: { followerId: me.id },
      include: { following: { include: { user: { select: { name: true, avatar: true } } } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({
      users: following.map((f) => ({
        studentId: f.following.id,
        name: f.following.user.name,
        avatar: f.following.user.avatar,
        since: f.createdAt,
      })),
      count: following.length,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
