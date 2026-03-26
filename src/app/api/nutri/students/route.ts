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

    const students = await prisma.student.findMany({
      where: { nutritionistId: nutriProfile.id },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        mealPlanAssignments: {
          where: { active: true },
          include: { plan: { select: { name: true } } },
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
    })

    const studentsData = students.map((s) => {
      const logs = s.nutritionLogs
      const adherence = Math.round((logs.length / 7) * 100)
      const lastLog = logs.length > 0 ? logs[0].date : null
      const activePlan = s.mealPlanAssignments[0]?.plan ?? null

      // Check for issues
      const hasNoRecentLogs = logs.length === 0 || (lastLog && new Date(lastLog) < threeDaysAgo)

      return {
        id: s.id,
        userId: s.userId,
        name: s.user.name,
        email: s.user.email,
        avatar: s.user.avatar,
        status: s.status,
        weight: s.weight,
        currentPlan: activePlan?.name ?? null,
        adherence,
        lastLogDate: lastLog,
        hasAlert: hasNoRecentLogs,
      }
    })

    return Response.json({ students: studentsData })
  } catch (error) {
    console.error("[Nutri Students]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
