import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"

// GET /api/student/nutrition — today's log + 7-day history
export async function GET() {
  try {
    const { student } = await requireStudent()

    const hasAccess = await checkFeature(student.id, "hasNutrition")
    if (!hasAccess) {
      return NextResponse.json({ error: "Plano Pro ou Elite necessário" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    const logs = await prisma.nutritionLog.findMany({
      where: {
        studentId: student.id,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "desc" },
    })

    const todayLog = logs.find((l) => {
      const d = new Date(l.date)
      return d.toDateString() === today.toDateString()
    }) ?? null

    return NextResponse.json({ today: todayLog, history: logs })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/student/nutrition — upsert today's log
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const hasAccess = await checkFeature(student.id, "hasNutrition")
    if (!hasAccess) {
      return NextResponse.json({ error: "Plano Pro ou Elite necessário" }, { status: 403 })
    }

    const body = await req.json()
    const { meals, waterMl } = body as {
      meals: Array<{
        id: string
        type: string
        name: string
        time?: string
        foods: Array<{
          name: string
          amount: string
          calories: number
          protein: number
          carbs: number
          fat: number
        }>
      }>
      waterMl?: number
    }

    if (!Array.isArray(meals)) {
      return NextResponse.json({ error: "meals deve ser um array" }, { status: 400 })
    }

    // Calculate totals from meals
    const totals = meals.reduce(
      (acc, meal) => {
        meal.foods.forEach((f) => {
          acc.calories += f.calories
          acc.protein += f.protein
          acc.carbs += f.carbs
          acc.fat += f.fat
        })
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const log = await prisma.nutritionLog.upsert({
      where: { studentId_date: { studentId: student.id, date: today } },
      create: {
        studentId: student.id,
        date: today,
        meals,
        totalCalories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        waterMl: waterMl ?? 0,
      },
      update: {
        meals,
        totalCalories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        ...(waterMl !== undefined && { waterMl }),
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
