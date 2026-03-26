import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

/**
 * GET /api/student/exercise-progress?exerciseId=xxx
 * Returns daily aggregated progress for a specific exercise:
 * [{ date, maxLoad, totalVolume, sets }]
 */
export async function GET(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { searchParams } = new URL(req.url)
    const exerciseId = searchParams.get("exerciseId")

    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId is required" },
        { status: 400 },
      )
    }

    // Fetch all completed session sets for this exercise
    const sets = await prisma.sessionSet.findMany({
      where: {
        exerciseId,
        session: {
          studentId: student.id,
          completedAt: { not: null },
        },
      },
      select: {
        reps: true,
        loadKg: true,
        session: {
          select: { startedAt: true },
        },
      },
      orderBy: { session: { startedAt: "asc" } },
    })

    // Group by date
    const byDate = new Map<
      string,
      { maxLoad: number; totalVolume: number; sets: number }
    >()

    for (const s of sets) {
      const date = s.session.startedAt.toISOString().split("T")[0]
      const existing = byDate.get(date) ?? {
        maxLoad: 0,
        totalVolume: 0,
        sets: 0,
      }

      existing.maxLoad = Math.max(existing.maxLoad, s.loadKg)
      existing.totalVolume += s.reps * s.loadKg
      existing.sets += 1

      byDate.set(date, existing)
    }

    const result = [...byDate.entries()]
      .map(([date, data]) => ({
        date,
        maxLoad: data.maxLoad,
        totalVolume: Math.round(data.totalVolume),
        sets: data.sets,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Also fetch the exercise list the student has trained (for the dropdown)
    const exerciseList = await prisma.sessionSet.findMany({
      where: {
        session: {
          studentId: student.id,
          completedAt: { not: null },
        },
      },
      select: { exerciseId: true },
      distinct: ["exerciseId"],
    })

    const exerciseIds = exerciseList.map((e) => e.exerciseId)
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true, muscle: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ progress: result, exercises })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
