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
      allStudents,
      plansExpiringSoonList,
      expiredPlansList,
      sessionsThisWeek,
      sessionsThisMonth,
      sessionsToday,
      recentSessions,
      allPlans,
      totalScheduleSlots,
      confirmedSlots,
      noShowSlots,
      pendingPaymentsList,
      pendingPaymentsTotal,
      recentlyRenewedList,
    ] = await Promise.all([
      // ALL students with their data for drill-down
      prisma.student.findMany({
        where: { trainerId },
        include: {
          user: { select: { name: true, email: true, image: true } },
          workoutPlans: { where: { active: true }, select: { id: true, createdAt: true } },
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: { select: { name: true, price: true } } },
            orderBy: { endDate: "desc" },
            take: 1,
          },
        },
        orderBy: { user: { name: "asc" } },
      }),

      // Plans expiring in next 7 days (with student data)
      prisma.subscription.findMany({
        where: {
          student: { trainerId },
          status: "ACTIVE",
          endDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          plan: { select: { name: true, price: true } },
        },
      }),

      // Expired plans
      prisma.subscription.findMany({
        where: {
          student: { trainerId },
          status: "ACTIVE",
          endDate: { lt: now },
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          plan: { select: { name: true, price: true } },
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

      // Payments (with student data)
      prisma.payment.findMany({
        where: { student: { trainerId }, status: "PENDING" },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.payment.aggregate({ where: { student: { trainerId }, status: "PENDING" }, _sum: { amount: true } }),

      // Recently renewed (with student data)
      prisma.subscription.findMany({
        where: { student: { trainerId }, createdAt: { gte: thirtyDaysAgo } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          plan: { select: { name: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Derived counts
    const totalStudents = allStudents.length
    const activeStudents = allStudents.filter(s => s.status === "ACTIVE").length
    const inactiveStudents = allStudents.filter(s => s.status === "INACTIVE").length

    // Students with/without workout plans
    const studentsWithPlanIds = new Set(allStudents.filter(s => s.status === "ACTIVE" && s.workoutPlans.length > 0).map(s => s.id))
    const studentsWithPlan = studentsWithPlanIds.size
    const studentsWithoutPlan = activeStudents - studentsWithPlan

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
    const trainedThisMonthIds = new Set(recentSessions.map(s => s.studentId))
    const studentsTrainedThisMonth = trainedThisMonthIds.size

    // Students "em dia" (trained in last 7 days)
    const recentSessionsByStudent = new Map<string, Date>()
    recentSessions.forEach(s => {
      const existing = recentSessionsByStudent.get(s.studentId)
      if (!existing || new Date(s.startedAt) > existing) {
        recentSessionsByStudent.set(s.studentId, new Date(s.startedAt))
      }
    })

    const upToDateIds = new Set(
      Array.from(recentSessionsByStudent.entries())
        .filter(([, lastSession]) => lastSession >= weekStart)
        .map(([id]) => id)
    )
    const studentsUpToDate = upToDateIds.size

    // "Não acompanhados" = active students who never trained in last 30 days
    const studentsNotFollowed = activeStudents - studentsTrainedThisMonth

    // Session count per student (for drill-down)
    const sessionCountByStudent = new Map<string, number>()
    recentSessions.forEach(s => {
      sessionCountByStudent.set(s.studentId, (sessionCountByStudent.get(s.studentId) || 0) + 1)
    })

    // Build student lists for drill-down
    const studentsList = allStudents.map(s => {
      const lastSession = recentSessionsByStudent.get(s.id)
      const sessionCount = sessionCountByStudent.get(s.id) || 0
      const sub = s.subscriptions[0]
      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        image: s.user.image,
        status: s.status as string,
        hasPlan: s.workoutPlans.length > 0,
        isUpToDate: upToDateIds.has(s.id),
        trainedThisMonth: trainedThisMonthIds.has(s.id),
        sessionsLast30d: sessionCount,
        lastSessionAt: lastSession?.toISOString() || null,
        subscription: sub ? {
          planName: sub.plan.name,
          planPrice: sub.plan.price,
          endDate: sub.endDate.toISOString(),
          daysLeft: Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        } : null,
      }
    })

    // Expiring plans list
    const expiringList = plansExpiringSoonList.map(sub => ({
      studentName: sub.student.user.name,
      planName: sub.plan.name,
      planPrice: sub.plan.price,
      endDate: sub.endDate.toISOString(),
      daysLeft: Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))

    // Expired list
    const expiredList = expiredPlansList.map(sub => ({
      studentName: sub.student.user.name,
      planName: sub.plan.name,
      planPrice: sub.plan.price,
      endDate: sub.endDate.toISOString(),
      daysOverdue: Math.ceil((now.getTime() - sub.endDate.getTime()) / (1000 * 60 * 60 * 24)),
    }))

    // Pending payments list
    const pendingList = pendingPaymentsList.map(p => ({
      id: p.id,
      studentName: p.student.user.name,
      amount: p.amount,
      method: p.method,
      dueDate: p.dueDate.toISOString(),
      description: p.description,
    }))

    // Recently renewed list
    const renewedList = recentlyRenewedList.map(sub => ({
      studentName: sub.student.user.name,
      planName: sub.plan.name,
      planPrice: sub.plan.price,
      createdAt: sub.createdAt.toISOString(),
    }))

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
        expiringSoon: plansExpiringSoonList.length,
        expired: expiredPlansList.length,
        recentlyRenewed: recentlyRenewedList.length,
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
        pendingCount: pendingPaymentsList.length,
        pendingTotal: pendingPaymentsTotal._sum.amount || 0,
      },
      charts: {
        dayOfWeek: dayOfWeekCounts,
        timePercentages,
      },
      // Drill-down lists
      lists: {
        students: studentsList,
        expiring: expiringList,
        expired: expiredList,
        pending: pendingList,
        renewed: renewedList,
      },
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("GET /api/admin/bi-treino error:", error)
    return NextResponse.json({ error: "Failed to fetch BI data" }, { status: 500 })
  }
}
