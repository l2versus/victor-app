import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAuth()

    // Get student's trainerId for isolation
    let trainerId: string | undefined
    let myStudentId: string | undefined
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { trainerId: true, id: true },
      })
      trainerId = student?.trainerId
      myStudentId = student?.id
    } else {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      trainerId = trainer?.id
    }

    if (!trainerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Run all queries in parallel
    const [activeChallenges, topPerformers, newMembers, transformationStudents] =
      await Promise.all([
        // 1. Active challenges
        prisma.challenge.findMany({
          where: { status: "ACTIVE" },
          include: {
            _count: { select: { entries: true } },
          },
          orderBy: { endDate: "asc" },
          take: 10,
        }),

        // 2. Top performers — students with most completed sessions in last 7 days
        prisma.workoutSession.groupBy({
          by: ["studentId"],
          where: {
            completedAt: { not: null },
            startedAt: { gte: sevenDaysAgo },
            student: { trainerId },
          },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),

        // 3. New members — students created in last 7 days
        prisma.student.findMany({
          where: {
            trainerId,
            user: { createdAt: { gte: sevenDaysAgo } },
          },
          include: {
            user: { select: { name: true, avatar: true, createdAt: true } },
          },
          take: 10,
          orderBy: { user: { createdAt: "desc" } },
        }),

        // 4. Transformations — students with 2+ FRONT progress photos
        prisma.student.findMany({
          where: {
            trainerId,
            progressPhotos: {
              some: { category: "FRONT" },
            },
          },
          include: {
            user: { select: { name: true, avatar: true } },
            progressPhotos: {
              where: { category: "FRONT" },
              orderBy: { createdAt: "asc" },
              take: 20,
            },
          },
          take: 10,
        }),
      ])

    // Enrich top performers with student details
    const topPerformerIds = topPerformers.map((tp) => tp.studentId)
    const topStudents = topPerformerIds.length
      ? await prisma.student.findMany({
          where: { id: { in: topPerformerIds } },
          include: { user: { select: { name: true, avatar: true } } },
        })
      : []

    const studentMap = new Map(topStudents.map((s) => [s.id, s]))

    const enrichedTopPerformers = topPerformers
      .map((tp) => {
        const student = studentMap.get(tp.studentId)
        if (!student) return null
        return {
          studentId: tp.studentId,
          name: student.user.name,
          avatar: student.user.avatar,
          sessionsCount: tp._count.id,
        }
      })
      .filter(Boolean)

    // Format challenges
    const formattedChallenges = activeChallenges.map((c) => {
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        metric: c.metric,
        targetValue: c.targetValue,
        participantCount: c._count.entries,
        daysRemaining,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
      }
    })

    // Format new members
    const formattedNewMembers = newMembers.map((s) => ({
      studentId: s.id,
      name: s.user.name,
      avatar: s.user.avatar,
      goals: s.goals,
      joinedAt: s.user.createdAt.toISOString(),
      isMe: s.id === myStudentId,
    }))

    // Format transformations — only include students with 2+ photos
    const formattedTransformations = transformationStudents
      .filter((s) => s.progressPhotos.length >= 2)
      .map((s) => {
        const photos = s.progressPhotos
        const before = photos[0]
        const after = photos[photos.length - 1]
        const weightDiff =
          before.weight && after.weight
            ? Number((after.weight - before.weight).toFixed(1))
            : null
        return {
          studentId: s.id,
          name: s.user.name,
          avatar: s.user.avatar,
          beforePhoto: before.imageUrl,
          afterPhoto: after.imageUrl,
          beforeDate: before.createdAt.toISOString(),
          afterDate: after.createdAt.toISOString(),
          beforeWeight: before.weight,
          afterWeight: after.weight,
          weightDiff,
        }
      })

    const response = NextResponse.json({
      activeChallenges: formattedChallenges,
      topPerformers: enrichedTopPerformers,
      newMembers: formattedNewMembers,
      transformations: formattedTransformations,
    })
    // Discover data changes infrequently — cache 3 minutes
    response.headers.set("Cache-Control", "public, s-maxage=180, stale-while-revalidate=600")
    return response
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[DISCOVER API]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
