import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/student/fitvs/contacts — list people to challenge
// Returns: people I follow + people from same trainer, with online status
export async function GET() {
  try {
    const session = await requireAuth()

    const me = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true, trainerId: true },
    })
    if (!me) return NextResponse.json({ contacts: [] })

    // Get IDs of people I follow
    const following = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    })
    const followingIds = new Set(following.map(f => f.followingId))

    // Get all students from same trainer (teammates)
    const teammates = await prisma.student.findMany({
      where: {
        trainerId: me.trainerId,
        status: "ACTIVE",
        id: { not: me.id },
      },
      select: {
        id: true,
        lastSeenAt: true,
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { lastSeenAt: "desc" },
      take: 30,
    })

    // Get people I follow who are NOT in teammates
    const teammateIds = new Set(teammates.map(t => t.id))
    const extraFollowIds = [...followingIds].filter(id => !teammateIds.has(id))

    let extraFollowing: typeof teammates = []
    if (extraFollowIds.length > 0) {
      extraFollowing = await prisma.student.findMany({
        where: { id: { in: extraFollowIds }, status: "ACTIVE" },
        select: {
          id: true,
          lastSeenAt: true,
          user: { select: { name: true, avatar: true } },
        },
        orderBy: { lastSeenAt: "desc" },
        take: 20,
      })
    }

    const now = Date.now()
    const ONLINE_THRESHOLD = 15 * 60 * 1000 // 15 min

    function mapContact(s: typeof teammates[0], isFollowing: boolean) {
      const online = s.lastSeenAt ? (now - new Date(s.lastSeenAt).getTime()) < ONLINE_THRESHOLD : false
      const lastSeen = s.lastSeenAt ? new Date(s.lastSeenAt).toISOString() : null
      return {
        id: s.id,
        name: s.user.name || "Atleta",
        avatar: s.user.avatar || null,
        online,
        lastSeen,
        isFollowing,
        isTeammate: teammateIds.has(s.id) || teammates.some(t => t.id === s.id),
      }
    }

    const contacts = [
      ...teammates.map(s => mapContact(s, followingIds.has(s.id))),
      ...extraFollowing.map(s => mapContact(s, true)),
    ]

    // Sort: online first, then by name
    contacts.sort((a, b) => {
      if (a.online && !b.online) return -1
      if (!a.online && b.online) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ contacts: [] })
  }
}
