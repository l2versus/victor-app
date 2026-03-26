import { requireMaster } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "all"
    const orgId = searchParams.get("orgId") || ""

    // Build where clause for trainers (role ADMIN with TrainerProfile)
    const trainerWhere: Record<string, unknown> = {
      role: "ADMIN" as const,
      trainerProfile: { isNot: null },
    }

    // Build where clause for nutritionists
    const nutriWhere: Record<string, unknown> = {
      role: "NUTRITIONIST" as const,
      nutritionistProfile: { isNot: null },
    }

    // Search filter
    if (search) {
      const searchFilter = {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
      Object.assign(trainerWhere, searchFilter)
      Object.assign(nutriWhere, searchFilter)
    }

    // Org filter
    if (orgId) {
      trainerWhere.trainerProfile = { organizationId: orgId }
      nutriWhere.nutritionistProfile = { organizationId: orgId }
    }

    const trainers =
      role === "NUTRITIONIST"
        ? []
        : await prisma.user.findMany({
            where: trainerWhere,
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              active: true,
              createdAt: true,
              role: true,
              trainerProfile: {
                select: {
                  id: true,
                  cref: true,
                  organizationId: true,
                  organization: {
                    select: { id: true, name: true, slug: true },
                  },
                  _count: { select: { students: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })

    const nutritionists =
      role === "ADMIN"
        ? []
        : await prisma.user.findMany({
            where: nutriWhere,
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              active: true,
              createdAt: true,
              role: true,
              nutritionistProfile: {
                select: {
                  id: true,
                  crn: true,
                  specialty: true,
                  organizationId: true,
                  organization: {
                    select: { id: true, name: true, slug: true },
                  },
                  _count: { select: { students: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })

    // Normalize into a single array
    const professionals = [
      ...trainers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        avatar: t.avatar,
        active: t.active,
        createdAt: t.createdAt,
        role: t.role as string,
        registration: t.trainerProfile?.cref || null,
        specialty: null as string | null,
        organizationId: t.trainerProfile?.organizationId || null,
        organizationName: t.trainerProfile?.organization?.name || null,
        organizationSlug: t.trainerProfile?.organization?.slug || null,
        studentCount: t.trainerProfile?._count?.students ?? 0,
      })),
      ...nutritionists.map((n) => ({
        id: n.id,
        name: n.name,
        email: n.email,
        avatar: n.avatar,
        active: n.active,
        createdAt: n.createdAt,
        role: n.role as string,
        registration: n.nutritionistProfile?.crn || null,
        specialty: n.nutritionistProfile?.specialty || null,
        organizationId: n.nutritionistProfile?.organizationId || null,
        organizationName: n.nutritionistProfile?.organization?.name || null,
        organizationSlug: n.nutritionistProfile?.organization?.slug || null,
        studentCount: n.nutritionistProfile?._count?.students ?? 0,
      })),
    ]

    return Response.json({ professionals, total: professionals.length })
  } catch (error) {
    console.error("[Master Professionals GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { organizationId, name, email, password, role, cref, crn, specialty } = body

    if (!name || !email || !role) {
      return Response.json({ error: "Nome, email e cargo são obrigatórios" }, { status: 400 })
    }

    if (!["ADMIN", "NUTRITIONIST"].includes(role)) {
      return Response.json({ error: "Cargo inválido" }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "Email já cadastrado" }, { status: 409 })
    }

    // Validate org exists if provided
    if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } })
      if (!org) {
        return Response.json({ error: "Organização não encontrada" }, { status: 404 })
      }
    }

    const rawPassword = password || generatePassword()
    const hashedPassword = await hashPassword(rawPassword)

    // Create user + profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as "ADMIN" | "NUTRITIONIST",
        },
      })

      if (role === "ADMIN") {
        await tx.trainerProfile.create({
          data: {
            userId: newUser.id,
            cref: cref || null,
            organizationId: organizationId || null,
          },
        })
      } else {
        await tx.nutritionistProfile.create({
          data: {
            userId: newUser.id,
            crn: crn || null,
            specialty: specialty || null,
            organizationId: organizationId || null,
          },
        })
      }

      return newUser
    })

    return Response.json(
      {
        professional: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        credentials: {
          email: user.email,
          password: rawPassword,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Master Professionals POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
