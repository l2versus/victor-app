import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifySocial } from "@/lib/social-notifications"

// POST /api/community/follow — follow or unfollow a student
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    let me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })

    // Admin proxy for community
    if (!me && session.role === "ADMIN") {
      const trainer = await prisma.trainerProfile.findUnique({ where: { userId: session.userId }, select: { id: true } })
      if (trainer) {
        me = await prisma.student.upsert({
          where: { userId: session.userId },
          create: { userId: session.userId, trainerId: trainer.id, goals: "Personal Trainer", status: "ACTIVE" },
          update: {},
          select: { id: true },
        })
      }
    }

    if (!me) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

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

    // Notify the person being followed
    const followed = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } })
    if (followed && followed.userId !== session.userId) {
      const myUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
      notifySocial({ toUserId: followed.userId, fromName: myUser?.name || "Alguém", type: "social_follow" })
    }

    return NextResponse.json({ following: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/community/follow?type=following|followers&studentId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ users: [] })

    const type = req.nextUrl.searchParams.get("type") || "following"
    // If studentId provided, show that user's followers/following instead of mine
    const targetId = req.nextUrl.searchParams.get("studentId") || me.id

    // Get my follows to check "following back" status
    const myFollows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    })
    const myFollowingSet = new Set(myFollows.map(f => f.followingId))

    // Get who follows me to check "follows me" status
    const myFollowers = await prisma.follow.findMany({
      where: { followingId: me.id },
      select: { followerId: true },
    })
    const myFollowerSet = new Set(myFollowers.map(f => f.followerId))

    if (type === "followers") {
      const followers = await prisma.follow.findMany({
        where: { followingId: targetId },
        include: { follower: { include: { user: { select: { name: true, avatar: true } } } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({
        users: followers.map((f) => ({
          studentId: f.follower.id,
          name: f.follower.user.name,
          avatar: f.follower.user.avatar,
          isMe: f.follower.id === me.id,
          iFollow: myFollowingSet.has(f.follower.id),
          followsMe: myFollowerSet.has(f.follower.id),
        })),
        count: followers.length,
      })
    }

    // following
    const following = await prisma.follow.findMany({
      where: { followerId: targetId },
      include: { following: { include: { user: { select: { name: true, avatar: true } } } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({
      users: following.map((f) => ({
        studentId: f.following.id,
        name: f.following.user.name,
        avatar: f.following.user.avatar,
        isMe: f.following.id === me.id,
        iFollow: myFollowingSet.has(f.following.id),
        followsMe: myFollowerSet.has(f.following.id),
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
