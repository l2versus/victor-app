import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/bi-treino — Business Intelligence for training
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const trainerId = trainer.id

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    // All queries in parallel
    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      studentsWithPlan,
      studentsWithoutPlan,
      plansExpiringSoon,
      expiredPlans,
      sessionsThisWeek,
      sessionsThisMonth,
      sessionsToday,
      recentSessions,
      allPlans,
      totalScheduleSlots,
      confirmedSlots,
      noShowSlots,
      pendingPaymentsCount,
      pendingPaymentsTotal,
    ] = await Promise.all([
      // Students
      prisma.student.count({ where: { trainerId } }),
      prisma.student.count({ where: { trainerId, status: "ACTIVE" } }),
      prisma.student.count({ where: { trainerId, status: "INACTIVE" } }),

      // Students with active workout plans
      prisma.student.count({
        where: {
          trainerId,
          status: "ACTIVE",
          workoutPlans: { some: { active: true } },
        },
      }),

      // Students without any workout plan
      prisma.student.count({
        where: {
          trainerId,
          status: "ACTIVE",
          workoutPlans: { none: {} },
        },
      }),

      // Plans expiring in next 7 days (using subscriptions)
      prisma.subscription.count({
        where: {
          student: { trainerId },
          status: "ACTIVE",
          endDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Expired plans (subscriptions past endDate but still active)
      prisma.subscription.count({
        where: {
          student: { trainerId },
          status: "ACTIVE",
          endDate: { lt: now },
        },
      }),

      // Sessions
      prisma.workoutSession.count({ where: { student: { trainerId }, startedAt: { gte: weekStart } } }),
      prisma.workoutSession.count({ where: { student: { trainerId }, startedAt: { gte: monthStart } } }),
      prisma.workoutSession.count({ where: { student: { trainerId }, startedAt: { gte: todayStart } } }),

      // Recent sessions with duration for average calc
      prisma.workoutSession.findMany({
        where: { student: { trainerId }, completedAt: { not: null }, startedAt: { gte: thirtyDaysAgo } },
        select: { startedAt: true, completedAt: true, studentId: true },
      }),

      // All student workout plans for "em dia" vs "vencidos" calc
      prisma.studentWorkoutPlan.findMany({
        where: { student: { trainerId }, active: true },
        select: { studentId: true, createdAt: true },
      }),

      // Schedule
      prisma.scheduleSlot.count({ where: { trainerId, date: { gte: weekStart } } }),
      prisma.scheduleSlot.count({ where: { trainerId, date: { gte: weekStart }, status: "CONFIRMED" } }),
      prisma.scheduleSlot.count({ where: { trainerId, date: { gte: weekStart }, status: "NO_SHOW" } }),

      // Payments
      prisma.payment.count({ where: { student: { trainerId }, status: "PENDING" } }),
      prisma.payment.aggregate({ where: { student: { trainerId }, status: "PENDING" }, _sum: { amount: true } }),
    ])

    // Calculate average session duration
    let avgDurationMinutes = 0
    if (recentSessions.length > 0) {
      const totalMinutes = recentSessions.reduce((sum, s) => {
        if (!s.completedAt) return sum
        const diff = (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
        return sum + diff
      }, 0)
      avgDurationMinutes = Math.round(totalMinutes / recentSessions.length)
    }

    // Unique students who trained this month
    const studentsTrainedThisMonth = new Set(recentSessions.map(s => s.studentId)).size

    // Students "em dia" (trained in last 7 days)
    const recentSessionsByStudent = new Map<string, Date>()
    recentSessions.forEach(s => {
      const existing = recentSessionsByStudent.get(s.studentId)
      if (!existing || new Date(s.startedAt) > existing) {
        recentSessionsByStudent.set(s.studentId, new Date(s.startedAt))
      }
    })

    // Students who trained in last 7 days = "em dia"
    const studentsUpToDate = Array.from(recentSessionsByStudent.entries())
      .filter(([, lastSession]) => lastSession >= weekStart).length

    // "Não acompanhados" = active students who never trained (no sessions at all in last 30 days)
    const studentsNotFollowed = activeStudents - studentsTrainedThisMonth

    // Recently renewed (new subscriptions in last 30 days)
    const recentlyRenewed = await prisma.subscription.count({
      where: {
        student: { trainerId },
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    // Training days distribution (for chart)
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    recentSessions.forEach(s => {
      const day = new Date(s.startedAt).getDay()
      dayOfWeekCounts[day]++
    })

    // Time of day distribution
    const timeDistribution = { morning: 0, afternoon: 0, evening: 0 }
    recentSessions.forEach(s => {
      const hour = new Date(s.startedAt).getHours()
      if (hour < 12) timeDistribution.morning++
      else if (hour < 18) timeDistribution.afternoon++
      else timeDistribution.evening++
    })
    const totalSessions30d = recentSessions.length || 1
    const timePercentages = {
      morning: Math.round((timeDistribution.morning / totalSessions30d) * 100),
      afternoon: Math.round((timeDistribution.afternoon / totalSessions30d) * 100),
      evening: Math.round((timeDistribution.evening / totalSessions30d) * 100),
    }

    return NextResponse.json({
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        withPlan: studentsWithPlan,
        withoutPlan: studentsWithoutPlan,
        upToDate: studentsUpToDate,
        notFollowed: studentsNotFollowed > 0 ? studentsNotFollowed : 0,
        trainedThisMonth: studentsTrainedThisMonth,
      },
      plans: {
        expiringSoon: plansExpiringSoon,
        expired: expiredPlans,
        recentlyRenewed,
      },
      sessions: {
        today: sessionsToday,
        thisWeek: sessionsThisWeek,
        thisMonth: sessionsThisMonth,
        avgDurationMinutes,
      },
      schedule: {
        total: totalScheduleSlots,
        confirmed: confirmedSlots,
        noShow: noShowSlots,
      },
      payments: {
        pendingCount: pendingPaymentsCount,
        pendingTotal: pendingPaymentsTotal._sum.amount || 0,
      },
      charts: {
        dayOfWeek: dayOfWeekCounts,
        timePercentages,
      },
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/bi-treino error:", error)
    return NextResponse.json({ error: "Failed to fetch BI data" }, { status: 500 })
  }
}
