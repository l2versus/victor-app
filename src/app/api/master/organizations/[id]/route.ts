import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ═══ GET — Organization detail ═══
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        trainers: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
            _count: { select: { students: true } },
          },
        },
        nutritionists: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
            _count: { select: { students: true } },
          },
        },
        _count: { select: { students: true } },
      },
    })

    if (!organization) {
      return Response.json({ error: "Organização não encontrada" }, { status: 404 })
    }

    // Recent students (last 10)
    const recentStudents = await prisma.student.findMany({
      where: { organizationId: id },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
      // Using select-based approach for plan name
    })

    return Response.json({ organization, recentStudents })
  } catch (error) {
    console.error("[Master Org GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ═══ PATCH — Update organization ═══
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params
    const body = await request.json()

    const allowedFields = ["name", "slug", "status", "maxProfessionals", "maxStudents", "brandConfig"]
    const data: Record<string, unknown> = {}

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // If slug changed, check uniqueness
    if (data.slug) {
      const existing = await prisma.organization.findFirst({
        where: { slug: data.slug as string, NOT: { id } },
      })
      if (existing) {
        return Response.json({ error: "Slug já existe" }, { status: 409 })
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data,
    })

    return Response.json({ organization })
  } catch (error) {
    console.error("[Master Org PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ═══ DELETE — Soft-delete (set CANCELLED) ═══
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const organization = await prisma.organization.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    return Response.json({ organization })
  } catch (error) {
    console.error("[Master Org DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
