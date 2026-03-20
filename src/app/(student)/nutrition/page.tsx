import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature, getStudentFeatures } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Lock, Crown, ChevronRight, Utensils } from "lucide-react"
import Link from "next/link"
import { NutritionClient } from "./nutrition-client"

export default async function NutritionPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasNutrition = await checkFeature(student.id, "hasNutrition")

  if (!hasNutrition) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 rounded-2xl bg-emerald-600/20 flex items-center justify-center mx-auto">
            <Utensils className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Módulo de Nutrição</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Registre refeições, acompanhe macros e receba sugestões da IA baseadas nos seus treinos.
              Exclusivo dos <span className="text-emerald-400 font-semibold">planos Pro e Elite</span>.
            </p>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-4 space-y-2 text-left">
            {[
              "Registro de refeições com macros detalhados",
              "Metas diárias baseadas no seu objetivo (cutting/bulking)",
              "Tracker de água integrado",
              "Sugestão de ajuste nutricional por IA baseada nos treinos",
              "Histórico semanal com gráfico de progresso",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-neutral-400">
                <ChevronRight className="w-4 h-4 text-emerald-500/70 shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 active:scale-[0.97] transition-all shadow-lg shadow-emerald-600/20"
          >
            <Crown className="w-4 h-4" />
            Ver planos Pro e Elite
          </Link>
        </div>
      </div>
    )
  }

  const features = await getStudentFeatures(student.id)

  // Load today's log + 7-day history (server-side initial data)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)

  const logs = await prisma.nutritionLog.findMany({
    where: { studentId: student.id, date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
  })

  const todayLog = logs.find((l) => new Date(l.date).toDateString() === today.toDateString()) ?? null

  // Calculate daily targets based on weight and goal
  const weight = student.weight ?? 75
  const goals = student.goals?.toLowerCase() ?? ""
  const isBulking = goals.includes("massa") || goals.includes("ganho") || goals.includes("hipertrofia")
  const isCutting = goals.includes("emagrec") || goals.includes("cutting") || goals.includes("perda")

  const targets = isBulking
    ? { calories: Math.round(weight * 38), protein: Math.round(weight * 2.2), carbs: Math.round(weight * 4.5), fat: Math.round(weight * 1.0) }
    : isCutting
      ? { calories: Math.round(weight * 28), protein: Math.round(weight * 2.0), carbs: Math.round(weight * 2.5), fat: Math.round(weight * 0.8) }
      : { calories: Math.round(weight * 33), protein: Math.round(weight * 2.0), carbs: Math.round(weight * 3.5), fat: Math.round(weight * 0.9) }

  const goalLabel = isBulking ? "Ganho de massa" : isCutting ? "Emagrecimento" : "Manutenção"

  return (
    <NutritionClient
      initialLog={todayLog ? {
        id: todayLog.id,
        meals: todayLog.meals as Meal[],
        totalCalories: todayLog.totalCalories,
        protein: todayLog.protein,
        carbs: todayLog.carbs,
        fat: todayLog.fat,
        waterMl: todayLog.waterMl,
        aiSuggestion: todayLog.aiSuggestion,
      } : null}
      history={logs.map((l) => ({
        date: l.date.toISOString().split("T")[0],
        calories: l.totalCalories,
        protein: l.protein,
        carbs: l.carbs,
        fat: l.fat,
      }))}
      targets={targets}
      goalLabel={goalLabel}
      planName={features.planName ?? "Pro"}
    />
  )
}

// Type exported for server component usage
export type Meal = {
  id: string
  type: "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "post_workout"
  name: string
  time?: string
  foods: {
    name: string
    amount: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
}
