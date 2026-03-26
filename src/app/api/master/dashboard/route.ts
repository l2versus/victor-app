import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    // Query all stats in parallel
    const [
      totalOrgs,
      activeOrgs,
      totalTrainers,
      totalNutris,
      totalStudents,
      activeStudents,
      recentOrgs,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "NUTRITIONIST" } }),
      prisma.student.count(),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          logo: true,
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
    ])

    return Response.json({
      stats: {
        totalOrgs,
        activeOrgs,
        totalTrainers,
        totalNutris,
        totalStudents,
        activeStudents,
        totalProfessionals: totalTrainers + totalNutris,
      },
      recentOrgs,
    })
  } catch (error) {
    console.error("[Master Dashboard]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
