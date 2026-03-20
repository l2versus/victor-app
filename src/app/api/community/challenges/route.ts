import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — list challenges (student view)
export async function GET() {
  try {
    const session = await requireAuth()

    const challenges = await prisma.challenge.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
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
      },
    })

    // Get current student
    let currentStudentId: string | null = null
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
      currentStudentId = student?.id ?? null
    }

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

// POST — create challenge (admin) or join challenge (student)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()

    // Admin: create challenge
    if (session.role === "ADMIN") {
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

    // Student: join challenge
    const { challengeId } = body
    if (!challengeId) {
      return NextResponse.json({ error: "challengeId obrigatório" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
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
