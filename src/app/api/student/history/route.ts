import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { getStudentFeatures } from "@/lib/subscription"

export async function GET(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Free tier: limit history to last 7 days
    const features = await getStudentFeatures(student.id)
    const isFree = !features.subscriptionStatus || features.subscriptionStatus === "EXPIRED"
    const dateFilter = isFree ? { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } : undefined

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { studentId: student.id, completedAt: { not: null }, ...(dateFilter && { startedAt: dateFilter }) },
        include: {
          template: { select: { name: true, type: true } },
          sets: {
            select: { id: true, exerciseId: true, setNumber: true, reps: true, loadKg: true, rpe: true, completed: true, technique: true, isExtra: true },
          },
          _count: { select: { sets: true } },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null }, ...(dateFilter && { startedAt: dateFilter }) },
      }),
    ])

    return NextResponse.json({
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit),
      ...(isFree && { limitedHistory: true, historyDays: 7, upgradeUrl: "/upgrade" }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
