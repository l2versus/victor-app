import { requireMaster, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function generatePassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let pw = ""
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ═══ GET — List all organizations ═══
export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { ownerEmail: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          logo: true,
          ownerEmail: true,
          maxProfessionals: true,
          maxStudents: true,
          brandConfig: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
              trainers: true,
              nutritionists: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ])

    return Response.json({ organizations, total })
  } catch (error) {
    console.error("[Master Organizations GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ═══ POST — Create organization + admin user ═══
export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const {
      name,
      slug: rawSlug,
      ownerEmail,
      ownerName,
      ownerPassword,
      maxProfessionals = 3,
      maxStudents = 50,
    } = body

    if (!name || !ownerEmail || !ownerName) {
      return Response.json({ error: "name, ownerEmail e ownerName são obrigatórios" }, { status: 400 })
    }

    const slug = rawSlug ? slugify(rawSlug) : slugify(name)

    // Check unique slug
    const existingSlug = await prisma.organization.findUnique({ where: { slug } })
    if (existingSlug) {
      return Response.json({ error: "Slug já existe. Escolha outro nome." }, { status: 409 })
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } })
    if (existingUser) {
      return Response.json({ error: "Email já cadastrado no sistema." }, { status: 409 })
    }

    const password = ownerPassword || generatePassword()
    const hashedPassword = await hashPassword(password)

    // Create org + user + trainer profile + trial subscription in transaction
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          ownerEmail,
          maxProfessionals,
          maxStudents,
          status: "TRIAL",
        },
      })

      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          password: hashedPassword,
          name: ownerName,
          role: "ADMIN",
        },
      })

      await tx.trainerProfile.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          gymName: name,
          onboardingComplete: false,
        },
      })

      // Auto-create 14-day trial on the Pro plan (best plan for trial)
      const proPlan = await tx.saasPlan.findFirst({
        where: { name: "Pro", interval: "MONTHLY", active: true },
      })

      if (proPlan) {
        const now = new Date()
        const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

        await tx.saasSubscription.create({
          data: {
            organizationId: org.id,
            planId: proPlan.id,
            status: "TRIAL",
            startDate: now,
            trialEndsAt,
          },
        })

        // Set org limits to Pro plan limits during trial
        await tx.organization.update({
          where: { id: org.id },
          data: {
            maxProfessionals: proPlan.maxProfessionals,
            maxStudents: proPlan.maxStudents,
          },
        })
      }

      return org
    })

    return Response.json(
      {
        organization,
        credentials: { email: ownerEmail, password },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Master Organizations POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
