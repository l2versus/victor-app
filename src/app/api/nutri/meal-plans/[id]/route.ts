import { requireNutritionist } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireNutritionist()
    const { id } = await params

    const nutriProfile = await prisma.nutritionistProfile.findUnique({
      where: { userId: session.userId },
    })

    if (!nutriProfile) {
      return Response.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id, nutritionistId: nutriProfile.id, active: true },
      include: {
        _count: { select: { assignments: { where: { active: true } } } },
      },
    })

    if (!mealPlan) {
      return Response.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    return Response.json({
      plan: {
        ...mealPlan,
        studentsUsing: mealPlan._count.assignments,
      },
    })
  } catch (error) {
    console.error("[Nutri MealPlan GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireNutritionist()
    const { id } = await params

    const nutriProfile = await prisma.nutritionistProfile.findUnique({
      where: { userId: session.userId },
    })

    if (!nutriProfile) {
      return Response.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    // Verify ownership
    const existing = await prisma.mealPlan.findFirst({
      where: { id, nutritionistId: nutriProfile.id, active: true },
    })

    if (!existing) {
      return Response.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, targetCalories, targetProtein, targetCarbs, targetFat, meals } = body

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (targetCalories !== undefined) updateData.targetCalories = targetCalories ? parseInt(targetCalories) : null
    if (targetProtein !== undefined) updateData.targetProtein = targetProtein ? parseFloat(targetProtein) : null
    if (targetCarbs !== undefined) updateData.targetCarbs = targetCarbs ? parseFloat(targetCarbs) : null
    if (targetFat !== undefined) updateData.targetFat = targetFat ? parseFloat(targetFat) : null
    if (meals !== undefined) updateData.meals = meals

    const updated = await prisma.mealPlan.update({
      where: { id },
      data: updateData,
    })

    return Response.json({ plan: updated })
  } catch (error) {
    console.error("[Nutri MealPlan PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireNutritionist()
    const { id } = await params

    const nutriProfile = await prisma.nutritionistProfile.findUnique({
      where: { userId: session.userId },
    })

    if (!nutriProfile) {
      return Response.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const existing = await prisma.mealPlan.findFirst({
      where: { id, nutritionistId: nutriProfile.id, active: true },
    })

    if (!existing) {
      return Response.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    // Soft delete
    await prisma.mealPlan.update({
      where: { id },
      data: { active: false },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Nutri MealPlan DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
