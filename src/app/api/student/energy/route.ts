import { NextResponse } from "next/server"
import { requireStudent } from "@/lib/student"
import { prisma } from "@/lib/prisma"

// ═══════════════════════════════════════
// FORMULAS
// ═══════════════════════════════════════

/** Mifflin-St Jeor BMR (kcal/day) */
function calcBMR(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  if (gender === "FEMALE") return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
}

/** MET value for resistance training based on RPE */
function getResistanceMET(rpe: number | null): number {
  if (!rpe) return 4.0
  if (rpe <= 3) return 3.0  // light
  if (rpe <= 5) return 4.5  // moderate
  if (rpe <= 7) return 5.5  // hard
  return 6.5               // very hard
}

/** MET value for cardio activities */
function getCardioMET(type: string): number {
  const METS: Record<string, number> = {
    RUNNING: 9.8, CYCLING: 7.5, SWIMMING: 8.0, HIIT: 10.0,
    CARDIO: 5.5, YOGA: 3.0, STRETCHING: 2.5, SPORT: 6.5, OTHER: 4.0,
  }
  return METS[type] || 5.0
}

/** Age from birthdate */
function getAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

// ═══════════════════════════════════════
// GET /api/student/energy — Full energy analysis
// ═══════════════════════════════════════

export async function GET() {
  try {
    const { student } = await requireStudent()

    // Get student profile data
    const profile = await prisma.student.findUnique({
      where: { id: student.id },
      include: { user: { select: { birthDate: true } } },
    })
    if (!profile) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })

    const weight = profile.weight ?? 70
    const height = profile.height ?? 170
    const birthDate = profile.user.birthDate
    const age = birthDate ? getAge(new Date(birthDate)) : 25
    const gender = profile.gender ?? "MALE"
    const goals = (profile.goals || "").toLowerCase()

    // ─── BMR ──────────────────────────────────────────────────
    const bmr = Math.round(calcBMR(weight, height, age, gender))

    // ─── Last 7 days of data ──────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [sessions, extraActivities, nutritionLogs, progressPhotos] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { studentId: student.id, completedAt: { not: null }, startedAt: { gte: sevenDaysAgo } },
        include: {
          sets: { select: { reps: true, loadKg: true } },
        },
      }),
      prisma.extraActivity.findMany({
        where: { studentId: student.id, date: { gte: sevenDaysAgo } },
      }),
      prisma.nutritionLog.findMany({
        where: { studentId: student.id, date: { gte: sevenDaysAgo } },
        orderBy: { date: "desc" },
      }),
      prisma.progressPhoto.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { weight: true, bodyFat: true, createdAt: true },
      }),
    ])

    // ─── WORKOUT CALORIES (resistance training) ───────────────
    const workoutDays: { date: string; calories: number; duration: number; volume: number }[] = []
    let totalWorkoutCals = 0

    for (const s of sessions) {
      const duration = s.durationMin ?? Math.round(
        s.completedAt && s.startedAt
          ? (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
          : 60
      )
      const met = getResistanceMET(s.rpe)
      const cals = Math.round(met * weight * (duration / 60))
      const volume = s.sets.reduce((sum, set) => sum + set.reps * set.loadKg, 0)

      workoutDays.push({
        date: new Date(s.startedAt).toISOString().slice(0, 10),
        calories: cals,
        duration,
        volume: Math.round(volume),
      })
      totalWorkoutCals += cals
    }

    // ─── CARDIO CALORIES ──────────────────────────────────────
    let totalCardioCals = 0
    const cardioDays: { date: string; calories: number; type: string; duration: number }[] = []

    for (const a of extraActivities) {
      const cals = a.caloriesBurned ?? Math.round(
        getCardioMET(a.type) * weight * ((a.durationMin ?? 30) / 60)
      )
      cardioDays.push({
        date: new Date(a.date).toISOString().slice(0, 10),
        calories: cals,
        type: a.type,
        duration: a.durationMin ?? 30,
      })
      totalCardioCals += cals
    }

    // ─── ACTIVITY FACTOR for TDEE ─────────────────────────────
    const sessionsPerWeek = sessions.length
    const cardioPerWeek = extraActivities.length
    const totalActivityDays = new Set([
      ...workoutDays.map(d => d.date),
      ...cardioDays.map(d => d.date),
    ]).size

    let activityFactor = 1.2 // sedentary
    if (totalActivityDays >= 6) activityFactor = 1.725
    else if (totalActivityDays >= 4) activityFactor = 1.55
    else if (totalActivityDays >= 2) activityFactor = 1.375

    const tdee = Math.round(bmr * activityFactor)

    // ─── NUTRITION (intake) ───────────────────────────────────
    const daysWithNutrition = nutritionLogs.filter(l => (l.totalCalories ?? 0) > 0)
    const avgIntake = daysWithNutrition.length > 0
      ? Math.round(daysWithNutrition.reduce((s, l) => s + (l.totalCalories ?? 0), 0) / daysWithNutrition.length)
      : null
    const avgProtein = daysWithNutrition.length > 0
      ? Math.round(daysWithNutrition.reduce((s, l) => s + (l.protein ?? 0), 0) / daysWithNutrition.length)
      : null
    const avgCarbs = daysWithNutrition.length > 0
      ? Math.round(daysWithNutrition.reduce((s, l) => s + (l.carbs ?? 0), 0) / daysWithNutrition.length)
      : null
    const avgFat = daysWithNutrition.length > 0
      ? Math.round(daysWithNutrition.reduce((s, l) => s + (l.fat ?? 0), 0) / daysWithNutrition.length)
      : null

    // ─── DEFICIT / SURPLUS ────────────────────────────────────
    const dailyBalance = avgIntake !== null ? avgIntake - tdee : null
    const weeklyBalance = dailyBalance !== null ? dailyBalance * 7 : null
    // 1 kg of fat ≈ 7700 kcal
    const projectedWeightChangeKg = weeklyBalance !== null ? +(weeklyBalance / 7700).toFixed(2) : null

    // ─── GOAL ANALYSIS ────────────────────────────────────────
    let goalType: "cut" | "bulk" | "maintain" | "unknown" = "unknown"
    if (goals.includes("emagrec") || goals.includes("perder") || goals.includes("defin") || goals.includes("secar") || goals.includes("cut"))
      goalType = "cut"
    else if (goals.includes("massa") || goals.includes("ganhar") || goals.includes("hipertrofia") || goals.includes("bulk") || goals.includes("volume"))
      goalType = "bulk"
    else if (goals.includes("manter") || goals.includes("saude") || goals.includes("qualidade"))
      goalType = "maintain"

    let goalAlignment: "on_track" | "off_track" | "needs_data" = "needs_data"
    let goalMessage = "Registre sua alimentação para análise completa"

    if (dailyBalance !== null) {
      if (goalType === "cut") {
        if (dailyBalance < -200) { goalAlignment = "on_track"; goalMessage = `Déficit de ${Math.abs(dailyBalance)} kcal/dia — perda estimada de ${Math.abs(projectedWeightChangeKg!)} kg/semana` }
        else if (dailyBalance < 0) { goalAlignment = "on_track"; goalMessage = `Déficit leve de ${Math.abs(dailyBalance)} kcal/dia — pode aumentar o déficit` }
        else { goalAlignment = "off_track"; goalMessage = `Superávit de ${dailyBalance} kcal/dia — não está em déficit para o objetivo de emagrecimento` }
      } else if (goalType === "bulk") {
        if (dailyBalance > 200) { goalAlignment = "on_track"; goalMessage = `Superávit de ${dailyBalance} kcal/dia — ganho estimado de ${projectedWeightChangeKg} kg/semana` }
        else if (dailyBalance > 0) { goalAlignment = "on_track"; goalMessage = `Superávit leve de ${dailyBalance} kcal/dia — pode aumentar a ingestão` }
        else { goalAlignment = "off_track"; goalMessage = `Déficit de ${Math.abs(dailyBalance)} kcal/dia — não está em superávit para ganhar massa` }
      } else if (goalType === "maintain") {
        if (Math.abs(dailyBalance) < 200) { goalAlignment = "on_track"; goalMessage = `Balanço equilibrado (${dailyBalance > 0 ? "+" : ""}${dailyBalance} kcal/dia) — ótimo para manutenção` }
        else { goalAlignment = "off_track"; goalMessage = `Desbalanceado em ${dailyBalance > 0 ? "+" : ""}${dailyBalance} kcal/dia — ajuste para manter o peso` }
      } else {
        goalMessage = `Balanço diário: ${dailyBalance > 0 ? "+" : ""}${dailyBalance} kcal/dia`
      }
    }

    // ─── WEIGHT TREND ─────────────────────────────────────────
    const weightHistory = progressPhotos
      .filter(p => p.weight)
      .map(p => ({ weight: p.weight!, date: new Date(p.createdAt).toISOString().slice(0, 10) }))
      .reverse()

    // ─── PROTEIN TARGET ───────────────────────────────────────
    // 1.6-2.2g/kg for muscle building, 1.2-1.6g/kg for maintenance
    const proteinTarget = goalType === "bulk" ? Math.round(weight * 2.0) : goalType === "cut" ? Math.round(weight * 2.2) : Math.round(weight * 1.6)

    return NextResponse.json({
      // Profile
      weight, height, age, gender, goalType,

      // Energy
      bmr,
      tdee,
      activityFactor: +activityFactor.toFixed(2),
      activityLevel: totalActivityDays >= 6 ? "Muito ativo" : totalActivityDays >= 4 ? "Ativo" : totalActivityDays >= 2 ? "Moderado" : "Sedentário",

      // Workout (7 days)
      workoutDays,
      totalWorkoutCals,
      sessionsPerWeek,
      avgWorkoutCals: sessions.length > 0 ? Math.round(totalWorkoutCals / sessions.length) : 0,

      // Cardio (7 days)
      cardioDays,
      totalCardioCals,

      // Nutrition (7 days)
      avgIntake,
      avgProtein,
      avgCarbs,
      avgFat,
      proteinTarget,
      daysLogged: daysWithNutrition.length,

      // Balance
      dailyBalance,
      weeklyBalance,
      projectedWeightChangeKg,

      // Goal
      goalAlignment,
      goalMessage,

      // History
      weightHistory,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno"
    if (msg === "Unauthorized" || msg === "SessionExpired") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
