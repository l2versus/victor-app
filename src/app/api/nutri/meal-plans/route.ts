import { requireNutritionist } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireNutritionist()

    const nutriProfile = await prisma.nutritionistProfile.findUnique({
      where: { userId: session.userId },
    })

    if (!nutriProfile) {
      return Response.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: { nutritionistId: nutriProfile.id, active: true },
      include: {
        _count: { select: { assignments: { where: { active: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    })

    const plans = mealPlans.map((p) => {
      const meals = (p.meals as unknown as Array<Record<string, unknown>>) ?? []
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        targetCalories: p.targetCalories,
        targetProtein: p.targetProtein,
        targetCarbs: p.targetCarbs,
        targetFat: p.targetFat,
        mealsCount: meals.length,
        studentsUsing: p._count.assignments,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }
    })

    return Response.json({ plans })
  } catch (error) {
    console.error("[Nutri MealPlans GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireNutritionist()

    const nutriProfile = await prisma.nutritionistProfile.findUnique({
      where: { userId: session.userId },
    })

    if (!nutriProfile) {
      return Response.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, targetCalories, targetProtein, targetCarbs, targetFat, meals } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    if (!meals || !Array.isArray(meals)) {
      return Response.json({ error: "Refeições são obrigatórias" }, { status: 400 })
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        nutritionistId: nutriProfile.id,
        name: name.trim(),
        description: description?.trim() || null,
        targetCalories: targetCalories ? parseInt(targetCalories) : null,
        targetProtein: targetProtein ? parseFloat(targetProtein) : null,
        targetCarbs: targetCarbs ? parseFloat(targetCarbs) : null,
        targetFat: targetFat ? parseFloat(targetFat) : null,
        meals: meals as any,
      },
    })

    return Response.json({ plan: mealPlan }, { status: 201 })
  } catch (error) {
    console.error("[Nutri MealPlans POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
