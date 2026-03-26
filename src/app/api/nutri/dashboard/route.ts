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

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(now.getDate() - 3)

    // ── Parallel queries ──
    const [
      totalPatients,
      activeMealPlans,
      recentPatients,
      recentLogs,
      studentsWithoutRecentLogs,
    ] = await Promise.all([
      // Total patients linked to this nutritionist
      prisma.student.count({
        where: { nutritionistId: nutriProfile.id, status: "ACTIVE" },
      }),

      // Active meal plan assignments
      prisma.studentMealPlan.count({
        where: {
          plan: { nutritionistId: nutriProfile.id },
          active: true,
        },
      }),

      // Recent 5 patients with their data
      prisma.student.findMany({
        where: { nutritionistId: nutriProfile.id, status: "ACTIVE" },
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          mealPlanAssignments: {
            where: { active: true },
            include: { plan: { select: { name: true, targetCalories: true, targetProtein: true, targetCarbs: true, targetFat: true } } },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          nutritionLogs: {
            where: { date: { gte: sevenDaysAgo } },
            orderBy: { date: "desc" },
            take: 7,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // All recent logs for adherence calculation
      prisma.nutritionLog.findMany({
        where: {
          student: { nutritionistId: nutriProfile.id, status: "ACTIVE" },
          date: { gte: sevenDaysAgo },
        },
        select: { studentId: true, date: true },
      }),

      // Students without logs in last 3 days (for alerts)
      prisma.student.findMany({
        where: {
          nutritionistId: nutriProfile.id,
          status: "ACTIVE",
          nutritionLogs: {
            none: { date: { gte: threeDaysAgo } },
          },
        },
        include: {
          user: { select: { name: true } },
        },
      }),
    ])

    // ── Calculate avg adherence ──
    // adherence = unique student-days with logs / (totalPatients * 7)
    const uniqueStudentDays = new Set(
      recentLogs.map((l) => `${l.studentId}_${l.date.toISOString().split("T")[0]}`)
    )
    const maxPossible = totalPatients * 7
    const avgAdherence = maxPossible > 0 ? Math.round((uniqueStudentDays.size / maxPossible) * 100) : 0

    // ── Build patients with adherence ──
    const patientsData = recentPatients.map((s) => {
      const logs = s.nutritionLogs
      const adherence = Math.round((logs.length / 7) * 100)
      const lastLog = logs.length > 0 ? logs[0].date : null
      const activePlan = s.mealPlanAssignments[0]?.plan ?? null

      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        avatar: s.user.avatar,
        adherence,
        lastLogDate: lastLog,
        currentPlan: activePlan?.name ?? null,
      }
    })

    // ── Build alerts ──
    const alerts: { type: "danger" | "warning" | "info"; message: string }[] = []

    studentsWithoutRecentLogs.forEach((s) => {
      alerts.push({
        type: "danger",
        message: `${s.user.name} não registra refeições há 3+ dias`,
      })
    })

    // Check for low protein adherence
    for (const patient of recentPatients) {
      const activePlan = patient.mealPlanAssignments[0]?.plan
      if (activePlan?.targetProtein && patient.nutritionLogs.length > 0) {
        const avgProtein =
          patient.nutritionLogs.reduce((sum, l) => sum + l.protein, 0) / patient.nutritionLogs.length
        if (avgProtein < activePlan.targetProtein * 0.7) {
          alerts.push({
            type: "warning",
            message: `${patient.user.name} está ${Math.round((1 - avgProtein / activePlan.targetProtein) * 100)}% abaixo da meta de proteína`,
          })
        }
      }

      // Check for 30-day plan milestone
      const assignment = patient.mealPlanAssignments[0]
      if (assignment) {
        const daysSinceStart = Math.floor(
          (now.getTime() - new Date(assignment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceStart >= 28 && daysSinceStart <= 32) {
          alerts.push({
            type: "info",
            message: `${patient.user.name} completou 30 dias de plano`,
          })
        }
      }
    }

    return Response.json({
      stats: {
        totalPatients,
        activeMealPlans,
        avgAdherence,
        alertCount: alerts.length,
      },
      recentPatients: patientsData,
      alerts: alerts.slice(0, 5),
    })
  } catch (error) {
    console.error("[Nutri Dashboard]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
