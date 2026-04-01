import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — list challenges (global + from user's groups)
export async function GET() {
  try {
    const session = await requireAuth()

    // Get current student + their group ids
    let currentStudentId: string | null = null
    let myGroupIds: string[] = []
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: {
          id: true,
          groupMemberships: { select: { groupId: true } },
        },
      })
      currentStudentId = student?.id ?? null
      myGroupIds = student?.groupMemberships?.map((m) => m.groupId) ?? []
    }

    // Fetch global challenges + challenges from user's groups
    const challenges = await prisma.challenge.findMany({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        OR: [
          { groupId: null },             // global
          { groupId: { in: myGroupIds } }, // from user's groups
        ],
      },
      orderBy: { startDate: "desc" },
      include: {
        entries: {
          include: {
            student: {
              include: { user: { select: { name: true, avatar: true } } },
            },
          },
          orderBy: { value: "desc" },
        },
        group: { select: { id: true, name: true } },
        createdBy: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    })

    const result = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      metric: c.metric,
      targetValue: c.targetValue,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      participantCount: c.entries.length,
      isParticipating: c.entries.some((e) => e.studentId === currentStudentId),
      groupName: c.group?.name ?? null,
      groupId: c.groupId,
      creatorName: c.createdBy?.user.name ?? null,
      creatorAvatar: c.createdBy?.user.avatar ?? null,
      isCreator: c.createdById === currentStudentId,
      leaderboard: c.entries.slice(0, 10).map((e, i) => ({
        position: i + 1,
        studentId: e.studentId,
        name: e.student.user.name,
        avatar: e.student.user.avatar,
        value: e.value,
        isMe: e.studentId === currentStudentId,
      })),
      myEntry: c.entries.find((e) => e.studentId === currentStudentId)
        ? { value: c.entries.find((e) => e.studentId === currentStudentId)!.value }
        : null,
    }))

    return NextResponse.json({ challenges: result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — create challenge (admin or student) or join/leave challenge
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()

    // Admin: create global challenge
    if (session.role === "ADMIN" && body.action !== "join" && body.action !== "leave") {
      await requireAdmin()
      const { title, description, metric, targetValue, startDate, endDate } = body

      if (!title || !metric || !startDate || !endDate) {
        return NextResponse.json(
          { error: "title, metric, startDate e endDate obrigatórios" },
          { status: 400 }
        )
      }

      const challenge = await prisma.challenge.create({
        data: {
          title,
          description: description || null,
          metric,
          targetValue: targetValue ? Number(targetValue) : null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      })

      return NextResponse.json({ challenge }, { status: 201 })
    }

    // Student actions
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Student: create challenge
    if (body.action === "create") {
      const { title, description, metric, targetValue, endDate } = body

      if (!title || !metric || !endDate) {
        return NextResponse.json(
          { error: "title, metric e endDate obrigatórios" },
          { status: 400 }
        )
      }

      // Limit: max 3 active challenges per student
      const activeCount = await prisma.challenge.count({
        where: { createdById: student.id, status: "ACTIVE" },
      })
      if (activeCount >= 3) {
        return NextResponse.json(
          { error: "Máximo de 3 desafios ativos por vez" },
          { status: 429 }
        )
      }

      const challenge = await prisma.challenge.create({
        data: {
          title,
          description: description || null,
          metric,
          targetValue: targetValue ? Number(targetValue) : null,
          startDate: new Date(),
          endDate: new Date(endDate),
          createdById: student.id,
        },
      })

      // Creator auto-joins
      await prisma.challengeEntry.create({
        data: { challengeId: challenge.id, studentId: student.id, value: 0 },
      })

      return NextResponse.json({ challenge }, { status: 201 })
    }

    // Student: leave challenge
    if (body.action === "leave") {
      const { challengeId } = body
      if (!challengeId) {
        return NextResponse.json({ error: "challengeId obrigatório" }, { status: 400 })
      }

      // Can't leave if you're the creator
      const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
      if (challenge?.createdById === student.id) {
        return NextResponse.json({ error: "Criador não pode sair do desafio" }, { status: 403 })
      }

      await prisma.challengeEntry.deleteMany({
        where: { challengeId, studentId: student.id },
      })

      return NextResponse.json({ ok: true })
    }

    // Student: join challenge (default)
    const challengeId = body.challengeId
    if (!challengeId) {
      return NextResponse.json({ error: "challengeId obrigatório" }, { status: 400 })
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge || challenge.status !== "ACTIVE") {
      return NextResponse.json({ error: "Desafio não encontrado ou inativo" }, { status: 404 })
    }

    // Check if already participating
    const existing = await prisma.challengeEntry.findUnique({
      where: { challengeId_studentId: { challengeId, studentId: student.id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Já está participando" }, { status: 409 })
    }

    const entry = await prisma.challengeEntry.create({
      data: { challengeId, studentId: student.id, value: 0 },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
