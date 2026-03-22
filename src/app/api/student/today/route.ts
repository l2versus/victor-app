import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()

    const dayOfWeek = new Date().getDay()

    // Find today's assigned plan
    const plan = await prisma.studentWorkoutPlan.findUnique({
      where: { studentId_dayOfWeek: { studentId: student.id, dayOfWeek } },
      include: {
        template: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!plan || !plan.active) {
      return NextResponse.json({ plan: null, template: null, activeSession: null })
    }

    // Check for active (uncompleted) session today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId: plan.templateId,
        startedAt: { gte: today, lt: tomorrow },
        completedAt: null,
      },
      include: {
        sets: true,
      },
    })

    // Get last session's sets for load suggestions
    const lastSession = await prisma.workoutSession.findFirst({
      where: {
        studentId: student.id,
        templateId: plan.templateId,
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      include: { sets: true },
    })

    const lastSetsMap: Record<string, { setNumber: number; reps: number; loadKg: number; technique: string }[]> = {}
    if (lastSession) {
      for (const set of lastSession.sets) {
        if (!lastSetsMap[set.exerciseId]) lastSetsMap[set.exerciseId] = []
        lastSetsMap[set.exerciseId].push({
          setNumber: set.setNumber,
          reps: set.reps,
          loadKg: set.loadKg,
          technique: set.technique,
        })
      }
    }

    return NextResponse.json({
      plan,
      template: plan.template,
      activeSession,
      lastSetsMap,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
