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

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const student = await prisma.student.findFirst({
      where: { id, nutritionistId: nutriProfile.id },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        mealPlanAssignments: {
          where: { active: true },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                targetCalories: true,
                targetProtein: true,
                targetCarbs: true,
                targetFat: true,
                meals: true,
              },
            },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        nutritionLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    })

    if (!student) {
      return Response.json({ error: "Paciente não encontrado" }, { status: 404 })
    }

    const activePlan = student.mealPlanAssignments[0]?.plan ?? null
    const logs = student.nutritionLogs
    const recentLogs = logs.filter(
      (l) => new Date(l.date) >= sevenDaysAgo
    )

    // ── 7-day averages ──
    const avgCalories =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s, l) => s + l.totalCalories, 0) / recentLogs.length)
        : 0
    const avgProtein =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s, l) => s + l.protein, 0) / recentLogs.length * 10) / 10
        : 0
    const avgCarbs =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s, l) => s + l.carbs, 0) / recentLogs.length * 10) / 10
        : 0
    const avgFat =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s, l) => s + l.fat, 0) / recentLogs.length * 10) / 10
        : 0

    // ── 7-day adherence grid ──
    const adherenceGrid: { date: string; logged: boolean; percentage: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const dayLog = recentLogs.find(
        (l) => new Date(l.date).toISOString().split("T")[0] === dateStr
      )

      let percentage = 0
      if (dayLog && activePlan?.targetCalories) {
        // Calculate how close to target (capped at 100%)
        const calRatio = dayLog.totalCalories / activePlan.targetCalories
        percentage = Math.min(100, Math.round(calRatio * 100))
      } else if (dayLog) {
        percentage = 100 // Logged but no target = counts as done
      }

      adherenceGrid.push({
        date: dateStr,
        logged: !!dayLog,
        percentage,
      })
    }

    // ── History (last 30 logs) ──
    const history = logs.map((l) => ({
      id: l.id,
      date: l.date,
      totalCalories: l.totalCalories,
      protein: l.protein,
      carbs: l.carbs,
      fat: l.fat,
      waterMl: l.waterMl,
      meals: l.meals,
    }))

    return Response.json({
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        avatar: student.user.avatar,
        weight: student.weight,
        height: student.height,
        birthDate: student.birthDate,
        goals: student.goals,
        restrictions: student.restrictions,
        gender: student.gender,
      },
      currentPlan: activePlan,
      macroAverages: {
        calories: avgCalories,
        protein: avgProtein,
        carbs: avgCarbs,
        fat: avgFat,
      },
      adherenceGrid,
      history,
    })
  } catch (error) {
    console.error("[Nutri Student Detail]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
