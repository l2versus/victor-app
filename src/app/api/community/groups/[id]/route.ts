import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/groups/[id] — group detail with members, challenges, leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    const studentId = student?.id

    const group = await prisma.communityGroup.findUnique({
      where: { id },
      include: {
        createdBy: { include: { user: { select: { name: true, avatar: true } } } },
        members: {
          include: { student: { include: { user: { select: { name: true, avatar: true } } } } },
          orderBy: { joinedAt: "asc" },
        },
        challenges: {
          where: { status: "ACTIVE" },
          include: {
            entries: {
              include: { student: { include: { user: { select: { name: true, avatar: true } } } } },
              orderBy: { value: "desc" },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })
    }

    const isMember = group.members.some((m) => m.studentId === studentId)

    // If INVITE_ONLY and not member, hide details
    if (group.visibility === "INVITE_ONLY" && !isMember) {
      return NextResponse.json({
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          imageUrl: group.imageUrl,
          visibility: group.visibility,
          memberCount: group.members.length,
          isMember: false,
          isOwner: false,
        },
      })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        imageUrl: group.imageUrl,
        visibility: group.visibility,
        creatorName: group.createdBy.user.name,
        creatorAvatar: group.createdBy.user.avatar,
        isMember,
        isOwner: group.createdById === studentId,
        myRole: group.members.find((m) => m.studentId === studentId)?.role ?? null,
        members: group.members.map((m) => ({
          studentId: m.studentId,
          name: m.student.user.name,
          avatar: m.student.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        challenges: group.challenges.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          metric: c.metric,
          targetValue: c.targetValue,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          participantCount: c.entries.length,
          isParticipating: c.entries.some((e) => e.studentId === studentId),
          leaderboard: c.entries.slice(0, 10).map((e, i) => ({
            position: i + 1,
            name: e.student.user.name,
            avatar: e.student.user.avatar,
            value: e.value,
            isMe: e.studentId === studentId,
          })),
          myEntry: c.entries.find((e) => e.studentId === studentId)
            ? { value: c.entries.find((e) => e.studentId === studentId)!.value }
            : null,
        })),
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/community/groups/[id] — join, leave, create-challenge, invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const { action } = body

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const group = await prisma.communityGroup.findUnique({
      where: { id },
      include: { members: { select: { studentId: true, role: true } } },
    })
    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })

    const membership = group.members.find((m) => m.studentId === student.id)

    // ═══ JOIN ═══
    if (action === "join") {
      if (membership) return NextResponse.json({ error: "Já é membro" }, { status: 409 })
      if (group.visibility === "INVITE_ONLY") {
        return NextResponse.json({ error: "Grupo só aceita convites" }, { status: 403 })
      }
      // Limit: max 20 groups per student
      const membershipCount = await prisma.groupMember.count({ where: { studentId: student.id } })
      if (membershipCount >= 20) {
        return NextResponse.json({ error: "Limite de 20 grupos atingido" }, { status: 429 })
      }

      await prisma.groupMember.create({
        data: { groupId: id, studentId: student.id, role: "MEMBER" },
      })
      return NextResponse.json({ ok: true, action: "joined" })
    }

    // ═══ LEAVE ═══
    if (action === "leave") {
      if (!membership) return NextResponse.json({ error: "Não é membro" }, { status: 400 })
      if (membership.role === "OWNER") {
        // Transfer ownership to oldest admin, or oldest member, or delete group
        const nextOwner = group.members
          .filter((m) => m.studentId !== student.id)
          .sort((a, b) => {
            if (a.role === "ADMIN" && b.role !== "ADMIN") return -1
            if (b.role === "ADMIN" && a.role !== "ADMIN") return 1
            return 0
          })[0]

        if (nextOwner) {
          await prisma.$transaction([
            prisma.groupMember.deleteMany({ where: { groupId: id, studentId: student.id } }),
            prisma.groupMember.updateMany({
              where: { groupId: id, studentId: nextOwner.studentId },
              data: { role: "OWNER" },
            }),
            prisma.communityGroup.update({
              where: { id },
              data: { createdById: nextOwner.studentId },
            }),
          ])
        } else {
          // Last member — delete group
          await prisma.communityGroup.delete({ where: { id } })
        }
      } else {
        await prisma.groupMember.deleteMany({ where: { groupId: id, studentId: student.id } })
      }
      return NextResponse.json({ ok: true, action: "left" })
    }

    // ═══ CREATE CHALLENGE ═══
    if (action === "create-challenge") {
      if (!membership) return NextResponse.json({ error: "Precisa ser membro" }, { status: 403 })

      const { title, description, metric, targetValue, endDate } = body
      if (!title?.trim() || !metric || !endDate) {
        return NextResponse.json({ error: "title, metric e endDate obrigatórios" }, { status: 400 })
      }

      // Limit: max 3 active challenges per group
      const activeCount = await prisma.challenge.count({
        where: { groupId: id, status: "ACTIVE" },
      })
      if (activeCount >= 3) {
        return NextResponse.json({ error: "Máximo 3 desafios ativos por grupo" }, { status: 429 })
      }

      const challenge = await prisma.challenge.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          metric,
          targetValue: targetValue ? Number(targetValue) : null,
          startDate: new Date(),
          endDate: new Date(endDate),
          groupId: id,
          createdById: student.id,
          entries: {
            create: { studentId: student.id, value: 0 },
          },
        },
      })

      return NextResponse.json({ challenge }, { status: 201 })
    }

    // ═══ INVITE ═══
    if (action === "invite") {
      if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return NextResponse.json({ error: "Apenas owner/admin pode convidar" }, { status: 403 })
      }
      const { studentId: inviteeId } = body
      if (!inviteeId) return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 })

      const exists = group.members.some((m) => m.studentId === inviteeId)
      if (exists) return NextResponse.json({ error: "Já é membro" }, { status: 409 })

      await prisma.groupMember.create({
        data: { groupId: id, studentId: inviteeId, role: "MEMBER" },
      })
      return NextResponse.json({ ok: true, action: "invited" })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/community/groups/[id] — delete group (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const group = await prisma.communityGroup.findUnique({ where: { id } })
    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })
    if (group.createdById !== student.id) {
      return NextResponse.json({ error: "Apenas o criador pode deletar" }, { status: 403 })
    }

    await prisma.communityGroup.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
