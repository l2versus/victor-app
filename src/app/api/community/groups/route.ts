import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/community/groups — list groups (discover + my groups)
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const url = new URL(req.url)
    const filter = url.searchParams.get("filter") // "mine" | "discover" | null (all)

    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    const studentId = student?.id

    let where = {}
    if (filter === "mine" && studentId) {
      where = { members: { some: { studentId } } }
    } else if (filter === "discover") {
      where = {
        visibility: { in: ["PUBLIC", "PRIVATE"] },
        ...(studentId ? { members: { none: { studentId } } } : {}),
      }
    }

    const groups = await prisma.communityGroup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, challenges: true } },
        createdBy: { include: { user: { select: { name: true, avatar: true } } } },
        members: studentId ? {
          where: { studentId },
          select: { role: true },
        } : false,
      },
      take: 50,
    })

    const result = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      imageUrl: g.imageUrl,
      visibility: g.visibility,
      memberCount: g._count.members,
      challengeCount: g._count.challenges,
      creatorName: g.createdBy.user.name,
      creatorAvatar: g.createdBy.user.avatar,
      isMember: Array.isArray(g.members) && g.members.length > 0,
      myRole: Array.isArray(g.members) && g.members.length > 0 ? g.members[0].role : null,
      isOwner: g.createdById === studentId,
    }))

    return NextResponse.json({ groups: result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/community/groups — create a group
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    })
    if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const body = await req.json()
    const { name, description, imageUrl, visibility } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome do grupo é obrigatório" }, { status: 400 })
    }
    if (name.length > 50) {
      return NextResponse.json({ error: "Nome muito longo (máx 50 chars)" }, { status: 400 })
    }

    // Limit: max 5 groups per student
    const count = await prisma.communityGroup.count({ where: { createdById: student.id } })
    if (count >= 5) {
      return NextResponse.json({ error: "Limite de 5 grupos criados atingido" }, { status: 429 })
    }

    const validVisibility = ["PUBLIC", "PRIVATE", "INVITE_ONLY"]
    const vis = validVisibility.includes(visibility) ? visibility : "PUBLIC"

    const group = await prisma.communityGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        visibility: vis,
        createdById: student.id,
        members: {
          create: { studentId: student.id, role: "OWNER" },
        },
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
