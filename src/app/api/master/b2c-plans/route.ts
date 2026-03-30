import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/b2c-plans — List all B2C plans with subscriber count
export async function GET() {
  try {
    await requireMaster()

    const plans = await prisma.plan.findMany({
      where: { isB2C: true },
      orderBy: [{ active: "desc" }, { price: "asc" }],
      include: {
        _count: { select: { subscriptions: true } },
      },
    })

    const result = plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      interval: p.interval,
      active: p.active,
      isB2C: p.isB2C,
      hasAI: p.hasAI,
      hasPostureCamera: p.hasPostureCamera,
      hasVipGroup: p.hasVipGroup,
      hasNutrition: p.hasNutrition,
      maxSessionsWeek: p.maxSessionsWeek,
      description: p.description,
      subscriberCount: p._count.subscriptions,
    }))

    return Response.json(result)
  } catch (error) {
    console.error("[Master B2C Plans GET]", error)
    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Unauthorized")
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST /api/master/b2c-plans — Create a new B2C plan
export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const {
      name,
      description,
      price,
      interval,
      hasAI,
      hasPostureCamera,
      hasNutrition,
      hasVipGroup,
      maxSessionsWeek,
    } = body

    if (!name || price == null) {
      return Response.json(
        { error: "Nome e preco sao obrigatorios" },
        { status: 400 }
      )
    }

    // Generate slug from name + interval
    const slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")}_${(interval || "MONTHLY").toLowerCase()}`

    // B2C plans need a "system" trainer — find or create one
    let systemTrainer = await prisma.trainerProfile.findFirst({
      where: { user: { email: "system@victor.app" } },
    })

    if (!systemTrainer) {
      // Create system user + trainer for B2C plans
      const systemUser = await prisma.user.upsert({
        where: { email: "system@victor.app" },
        update: {},
        create: {
          email: "system@victor.app",
          name: "Sistema Victor App",
          password: "SYSTEM_NO_LOGIN",
          role: "ADMIN",
          active: false,
        },
      })
      systemTrainer = await prisma.trainerProfile.create({
        data: {
          userId: systemUser.id,
          bio: "System trainer for B2C plans",
          onboardingComplete: true,
        },
      })
    }

    const plan = await prisma.plan.create({
      data: {
        trainerId: systemTrainer.id,
        name: name.trim(),
        slug,
        price: Number(price),
        interval: interval || "MONTHLY",
        description: description || null,
        hasAI: hasAI ?? false,
        hasPostureCamera: hasPostureCamera ?? false,
        hasNutrition: hasNutrition ?? false,
        hasVipGroup: hasVipGroup ?? false,
        maxSessionsWeek:
          maxSessionsWeek != null ? Number(maxSessionsWeek) : null,
        isB2C: true,
        active: true,
      },
    })

    return Response.json(plan, { status: 201 })
  } catch (error) {
    console.error("[Master B2C Plans POST]", error)
    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Unauthorized")
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// PATCH /api/master/b2c-plans — Update a B2C plan
export async function PATCH(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json({ error: "ID obrigatorio" }, { status: 400 })
    }

    // Verify plan exists and is B2C
    const existing = await prisma.plan.findUnique({ where: { id } })
    if (!existing || !existing.isB2C) {
      return Response.json(
        { error: "Plano B2C nao encontrado" },
        { status: 404 }
      )
    }

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {}
    if (updates.name !== undefined) data.name = updates.name.trim()
    if (updates.description !== undefined)
      data.description = updates.description || null
    if (updates.price !== undefined) data.price = Number(updates.price)
    if (updates.interval !== undefined) data.interval = updates.interval
    if (updates.active !== undefined) data.active = Boolean(updates.active)
    if (updates.hasAI !== undefined) data.hasAI = Boolean(updates.hasAI)
    if (updates.hasPostureCamera !== undefined)
      data.hasPostureCamera = Boolean(updates.hasPostureCamera)
    if (updates.hasNutrition !== undefined)
      data.hasNutrition = Boolean(updates.hasNutrition)
    if (updates.hasVipGroup !== undefined)
      data.hasVipGroup = Boolean(updates.hasVipGroup)
    if (updates.maxSessionsWeek !== undefined)
      data.maxSessionsWeek =
        updates.maxSessionsWeek != null
          ? Number(updates.maxSessionsWeek)
          : null

    // Regenerate slug if name or interval changed
    if (data.name || data.interval) {
      const newName = (data.name as string) || existing.name
      const newInterval = (data.interval as string) || existing.interval
      data.slug = `${newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")}_${newInterval.toLowerCase()}`
    }

    const updated = await prisma.plan.update({
      where: { id },
      data,
    })

    return Response.json(updated)
  } catch (error) {
    console.error("[Master B2C Plans PATCH]", error)
    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Unauthorized")
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE /api/master/b2c-plans — Deactivate a B2C plan (soft delete)
export async function DELETE(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "ID obrigatorio" }, { status: 400 })
    }

    const existing = await prisma.plan.findUnique({ where: { id } })
    if (!existing || !existing.isB2C) {
      return Response.json(
        { error: "Plano B2C nao encontrado" },
        { status: 404 }
      )
    }

    await prisma.plan.update({
      where: { id },
      data: { active: false },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Master B2C Plans DELETE]", error)
    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Unauthorized")
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
