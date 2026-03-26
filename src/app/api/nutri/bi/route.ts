import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(now.getDate() - 3)

    // Week boundaries (Mon-Sun)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // ── Parallel queries ──
    const [
      allStudents,
      studentsWithPlan,
      mealPlans,
      activeMealPlans,
      logs7d,
      logs30d,
      scheduleThisWeek,
      allLogs7dWithMacros,
    ] = await Promise.all([
      // All students for this nutritionist
      prisma.student.findMany({
        where: { nutritionistId: nutri.id },
        select: {
          id: true,
          status: true,
          user: { select: { name: true } },
          nutritionLogs: {
            where: { date: { gte: sevenDaysAgo } },
            select: { date: true },
            orderBy: { date: "desc" },
            take: 7,
          },
        },
      }),

      // Students with active meal plan
      prisma.student.count({
        where: {
          nutritionistId: nutri.id,
          mealPlanAssignments: { some: { active: true } },
        },
      }),

      // All meal plans by this nutritionist
      prisma.mealPlan.findMany({
        where: { nutritionistId: nutri.id },
        select: {
          id: true,
          active: true,
          targetCalories: true,
          targetProtein: true,
        },
      }),

      // Active meal plans count
      prisma.mealPlan.count({
        where: { nutritionistId: nutri.id, active: true },
      }),

      // NutritionLogs from last 7 days (for adherence)
      prisma.nutritionLog.findMany({
        where: {
          student: { nutritionistId: nutri.id, status: "ACTIVE" },
          date: { gte: sevenDaysAgo },
        },
        select: { studentId: true, date: true },
      }),

      // NutritionLogs from last 30 days (for 30d adherence)
      prisma.nutritionLog.findMany({
        where: {
          student: { nutritionistId: nutri.id, status: "ACTIVE" },
          date: { gte: thirtyDaysAgo },
        },
        select: { studentId: true, date: true },
      }),

      // Schedule slots this week
      prisma.scheduleSlot.findMany({
        where: {
          nutritionistId: nutri.id,
          date: { gte: weekStart, lt: weekEnd },
        },
        select: { status: true },
      }),

      // Logs with macro data (last 7 days) for macro averages
      prisma.nutritionLog.findMany({
        where: {
          student: { nutritionistId: nutri.id, status: "ACTIVE" },
          date: { gte: sevenDaysAgo },
        },
        select: {
          totalCalories: true,
          protein: true,
          carbs: true,
          fat: true,
          waterMl: true,
          date: true,
          studentId: true,
        },
      }),
    ])

    // ── Patient stats ──
    const totalPatients = allStudents.length
    const activePatients = allStudents.filter((s) => s.status === "ACTIVE").length
    const inactivePatients = totalPatients - activePatients
    const withoutMealPlan = totalPatients - studentsWithPlan

    // Students who logged at least 1 log in last 7 days
    const studentsLoggedThisWeek = new Set(logs7d.map((l) => l.studentId)).size

    // ── Adherence ──
    const activeStudentIds = allStudents
      .filter((s) => s.status === "ACTIVE")
      .map((s) => s.id)
    const activeCount = activeStudentIds.length

    // 7-day adherence: unique students who logged / total active * 100
    const uniqueLoggers7d = new Set(
      logs7d.filter((l) => activeStudentIds.includes(l.studentId)).map((l) => l.studentId)
    ).size
    const adherence7d = activeCount > 0 ? Math.round((uniqueLoggers7d / activeCount) * 100) : 0

    // 30-day adherence
    const uniqueLoggers30d = new Set(
      logs30d.filter((l) => activeStudentIds.includes(l.studentId)).map((l) => l.studentId)
    ).size
    const adherence30d = activeCount > 0 ? Math.round((uniqueLoggers30d / activeCount) * 100) : 0

    // Trend: compare first half vs second half of 7 days
    const midpoint = new Date(now)
    midpoint.setDate(now.getDate() - 3)
    const recentLogs = logs7d.filter((l) => new Date(l.date) >= midpoint).length
    const olderLogs = logs7d.filter((l) => new Date(l.date) < midpoint).length
    const trend: "up" | "down" | "stable" =
      recentLogs > olderLogs * 1.1 ? "up" : recentLogs < olderLogs * 0.9 ? "down" : "stable"

    // ── Meal plan stats ──
    const plansWithCalories = mealPlans.filter((p) => p.targetCalories)
    const avgCalories =
      plansWithCalories.length > 0
        ? Math.round(
            plansWithCalories.reduce((sum, p) => sum + (p.targetCalories ?? 0), 0) /
              plansWithCalories.length
          )
        : 0
    const plansWithProtein = mealPlans.filter((p) => p.targetProtein)
    const avgProtein =
      plansWithProtein.length > 0
        ? Math.round(
            plansWithProtein.reduce((sum, p) => sum + (p.targetProtein ?? 0), 0) /
              plansWithProtein.length
          )
        : 0

    // ── Schedule stats ──
    const scheduleTotal = scheduleThisWeek.length
    const scheduleConfirmed = scheduleThisWeek.filter((s) => s.status === "CONFIRMED").length
    const scheduleNoShow = scheduleThisWeek.filter((s) => s.status === "NO_SHOW").length
    const scheduleCompleted = scheduleThisWeek.filter((s) => s.status === "COMPLETED").length

    // ── Macro averages (from actual logs) ──
    const logCount = allLogs7dWithMacros.length
    const macroAverages = {
      calories:
        logCount > 0
          ? Math.round(allLogs7dWithMacros.reduce((s, l) => s + l.totalCalories, 0) / logCount)
          : 0,
      protein:
        logCount > 0
          ? Math.round(allLogs7dWithMacros.reduce((s, l) => s + l.protein, 0) / logCount)
          : 0,
      carbs:
        logCount > 0
          ? Math.round(allLogs7dWithMacros.reduce((s, l) => s + l.carbs, 0) / logCount)
          : 0,
      fat:
        logCount > 0
          ? Math.round(allLogs7dWithMacros.reduce((s, l) => s + l.fat, 0) / logCount)
          : 0,
      water:
        logCount > 0
          ? Math.round(allLogs7dWithMacros.reduce((s, l) => s + l.waterMl, 0) / logCount)
          : 0,
    }

    // ── Charts: adherence by day & logs by day (last 7 days) ──
    const adherenceByDay: number[] = []
    const logsByDay: number[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const dayStr = day.toISOString().split("T")[0]

      // Unique students who logged on this day
      const logsThisDay = logs7d.filter(
        (l) => new Date(l.date).toISOString().split("T")[0] === dayStr
      )
      const uniqueStudentsThisDay = new Set(logsThisDay.map((l) => l.studentId)).size
      const dayAdherence =
        activeCount > 0 ? Math.round((uniqueStudentsThisDay / activeCount) * 100) : 0

      adherenceByDay.push(dayAdherence)
      logsByDay.push(logsThisDay.length)
    }

    // ── Lists: at-risk patients & top adherent ──
    const atRiskPatients = allStudents
      .filter((s) => s.status === "ACTIVE")
      .map((s) => {
        const lastLog = s.nutritionLogs[0]?.date
        const daysSinceLog = lastLog
          ? Math.floor((now.getTime() - new Date(lastLog).getTime()) / (1000 * 60 * 60 * 24))
          : 999
        const studentLogs7d = logs7d.filter((l) => l.studentId === s.id)
        const adherence = Math.round((studentLogs7d.length / 7) * 100)
        return {
          id: s.id,
          name: s.user.name,
          daysSinceLog,
          adherence,
        }
      })
      .filter((s) => s.daysSinceLog >= 3)
      .sort((a, b) => b.daysSinceLog - a.daysSinceLog)
      .slice(0, 10)

    // Top adherent: students with most logs in 7 days
    const topAdherent = allStudents
      .filter((s) => s.status === "ACTIVE")
      .map((s) => {
        const studentLogs7d = logs7d.filter((l) => l.studentId === s.id)
        const adherence = Math.round((studentLogs7d.length / 7) * 100)

        // Calculate streak (consecutive days with logs ending today or yesterday)
        const logDates = s.nutritionLogs
          .map((l) => new Date(l.date).toISOString().split("T")[0])
          .sort()
          .reverse()
        let streak = 0
        for (let i = 0; i < logDates.length; i++) {
          const expected = new Date(now)
          expected.setDate(now.getDate() - i)
          const expectedStr = expected.toISOString().split("T")[0]
          if (logDates.includes(expectedStr)) {
            streak++
          } else if (i === 0) {
            // Allow 1-day gap (yesterday still counts)
            continue
          } else {
            break
          }
        }

        return {
          id: s.id,
          name: s.user.name,
          adherence,
          streak,
        }
      })
      .filter((s) => s.adherence > 0)
      .sort((a, b) => b.adherence - a.adherence || b.streak - a.streak)
      .slice(0, 10)

    return Response.json({
      patients: {
        total: totalPatients,
        active: activePatients,
        inactive: inactivePatients,
        withMealPlan: studentsWithPlan,
        withoutMealPlan,
        loggedThisWeek: studentsLoggedThisWeek,
      },
      adherence: {
        average7d: adherence7d,
        average30d: adherence30d,
        trend,
      },
      mealPlans: {
        total: mealPlans.length,
        active: activeMealPlans,
        avgCalories,
        avgProtein,
      },
      schedule: {
        thisWeek: scheduleTotal,
        confirmed: scheduleConfirmed,
        noShow: scheduleNoShow,
        completed: scheduleCompleted,
      },
      macroAverages,
      charts: {
        adherenceByDay,
        logsByDay,
      },
      lists: {
        atRiskPatients,
        topAdherent,
      },
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("[Nutri BI]", error)
    if (
      error instanceof Error &&
      (error.message === "Forbidden" || error.message === "Unauthorized" || error.message === "SessionExpired")
    ) {
      return Response.json({ error: error.message }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
