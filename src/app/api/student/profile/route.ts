import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

export async function GET() {
  try {
    const { student } = await requireStudent()

    // Aggregate training stats
    const [totalSessions, rpeAgg, lastSession] = await Promise.all([
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null } },
      }),
      prisma.workoutSession.aggregate({
        where: { studentId: student.id, completedAt: { not: null }, rpe: { not: null } },
        _avg: { rpe: true },
      }),
      prisma.workoutSession.findFirst({
        where: { studentId: student.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
    ])

    // Most trained muscle group
    const topMuscle = await prisma.sessionSet.groupBy({
      by: ["exerciseId"],
      where: { session: { studentId: student.id } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    })

    let favoriteMuscles: string[] = []
    if (topMuscle.length > 0) {
      const exerciseIds = topMuscle.map((t) => t.exerciseId)
      const exercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, muscle: true },
      })
      const muscleCount: Record<string, number> = {}
      for (const t of topMuscle) {
        const ex = exercises.find((e) => e.id === t.exerciseId)
        if (ex) muscleCount[ex.muscle] = (muscleCount[ex.muscle] || 0) + t._count.id
      }
      favoriteMuscles = Object.entries(muscleCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([m]) => m)
    }

    return NextResponse.json({
      student,
      stats: {
        totalSessions,
        avgRpe: rpeAgg._avg.rpe ? Math.round(rpeAgg._avg.rpe * 10) / 10 : null,
        lastSession: lastSession?.completedAt || null,
        favoriteMuscles,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const body = await req.json()

    // Campos do Student
    const studentFields = ["weight", "height", "birthDate", "gender", "goals"]
    const updateData: Record<string, unknown> = {}

    for (const key of studentFields) {
      if (body[key] !== undefined) {
        if (key === "weight" || key === "height") {
          updateData[key] = body[key] ? parseFloat(body[key]) : null
        } else if (key === "birthDate") {
          updateData[key] = body[key] ? new Date(body[key]) : null
        } else {
          updateData[key] = body[key] || null
        }
      }
    }

    // Campos do User (dados pessoais + endereço)
    const userFields = [
      "name", "phone",
      "addressStreet", "addressNumber", "addressComp",
      "addressNeighborhood", "addressCity", "addressState", "addressZip",
    ]
    const userUpdateData: Record<string, unknown> = {}

    for (const key of userFields) {
      if (body[key] !== undefined) {
        userUpdateData[key] = body[key] || null
      }
    }

    // name é obrigatório — não pode ser null
    if (userUpdateData.name === null) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [updatedStudent] = await Promise.all([
      Object.keys(updateData).length > 0
        ? prisma.student.update({ where: { id: student.id }, data: updateData })
        : Promise.resolve(student),
      Object.keys(userUpdateData).length > 0
        ? prisma.user.update({ where: { id: student.userId }, data: userUpdateData })
        : Promise.resolve(null),
    ])

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
