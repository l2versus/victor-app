import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// Ideal recovery hours per muscle group (evidence-based)
const RECOVERY_HOURS: Record<string, number> = {
  // Large muscles: 48-72h
  "Quadríceps": 72, "Posterior de Coxa": 72, "Glúteos": 72,
  "Costas": 72, "Peito": 72,
  // Medium muscles: 48h
  "Ombros": 48, "Trapézio": 48, "Abdômen": 48,
  // Small muscles: 24-48h
  "Bíceps": 48, "Tríceps": 48, "Panturrilha": 36, "Antebraço": 36,
}

// Normalize muscle names from exercises to standard names
function normalizeMuscle(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("peit") || lower.includes("chest")) return "Peito"
  if (lower.includes("costa") || lower.includes("dorsal") || lower.includes("lat") || lower.includes("back")) return "Costas"
  if (lower.includes("ombro") || lower.includes("deltoid") || lower.includes("shoulder")) return "Ombros"
  if (lower.includes("bícep") || lower.includes("bicep") || lower.includes("biceps")) return "Bíceps"
  if (lower.includes("trícep") || lower.includes("tricep") || lower.includes("triceps")) return "Tríceps"
  if (lower.includes("quadr") || lower.includes("quad")) return "Quadríceps"
  if (lower.includes("posterior") || lower.includes("hamstr") || lower.includes("isquio")) return "Posterior de Coxa"
  if (lower.includes("glút") || lower.includes("glute") || lower.includes("gluteo")) return "Glúteos"
  if (lower.includes("pantur") || lower.includes("calve") || lower.includes("calf") || lower.includes("sóleo")) return "Panturrilha"
  if (lower.includes("abdom") || lower.includes("core") || lower.includes("oblíq") || lower.includes("reto abdom")) return "Abdômen"
  if (lower.includes("trapéz") || lower.includes("trap")) return "Trapézio"
  if (lower.includes("antebraço") || lower.includes("forearm")) return "Antebraço"
  if (lower.includes("adutor")) return "Adutores"
  if (lower.includes("abdutor")) return "Abdutores"
  return raw
}

export interface MuscleRecovery {
  muscle: string
  lastWorkedAt: string | null
  hoursSince: number | null
  recoveryHours: number
  recoveryPercent: number // 0-100
  status: "fresh" | "recovering" | "ready" | "overdue"
  totalVolume: number // last session volume for this muscle
  sets: number // last session sets for this muscle
}

export async function GET() {
  try {
    const { student } = await requireStudent()

    // Get all completed sessions in last 14 days (recovery window)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const sessions = await prisma.workoutSession.findMany({
      where: {
        studentId: student.id,
        completedAt: { not: null },
        startedAt: { gte: twoWeeksAgo },
      },
      include: {
        sets: {
          where: { completed: true },
          select: { exerciseId: true, reps: true, loadKg: true },
        },
      },
      orderBy: { startedAt: "desc" },
    })

    // Get exercise muscle mapping
    const exerciseIds = [...new Set(sessions.flatMap(s => s.sets.map(set => set.exerciseId)))]
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, muscle: true },
    })
    const exerciseMuscleMap = new Map(exercises.map(e => [e.id, normalizeMuscle(e.muscle)]))

    // Calculate last worked date + volume per muscle
    const muscleLastWorked = new Map<string, { date: Date; volume: number; sets: number }>()

    for (const session of sessions) {
      const sessionDate = session.completedAt || session.startedAt

      for (const set of session.sets) {
        const muscle = exerciseMuscleMap.get(set.exerciseId)
        if (!muscle) continue

        const existing = muscleLastWorked.get(muscle)
        const setVolume = (set.reps || 0) * (set.loadKg || 0)

        if (!existing || sessionDate > existing.date) {
          // More recent session — replace
          muscleLastWorked.set(muscle, {
            date: sessionDate,
            volume: setVolume,
            sets: 1,
          })
        } else if (sessionDate.getTime() === existing.date.getTime()) {
          // Same session — accumulate
          existing.volume += setVolume
          existing.sets++
        }
      }
    }

    // Build recovery data for ALL muscles (even unworked)
    const now = Date.now()
    const allMuscles = Object.keys(RECOVERY_HOURS)

    // Add any extra muscles found in data
    for (const m of muscleLastWorked.keys()) {
      if (!allMuscles.includes(m)) allMuscles.push(m)
    }

    const recovery: MuscleRecovery[] = allMuscles.map(muscle => {
      const data = muscleLastWorked.get(muscle)
      const recoveryHours = RECOVERY_HOURS[muscle] || 48

      if (!data) {
        return {
          muscle,
          lastWorkedAt: null,
          hoursSince: null,
          recoveryHours,
          recoveryPercent: 100,
          status: "ready" as const,
          totalVolume: 0,
          sets: 0,
        }
      }

      const hoursSince = Math.round((now - data.date.getTime()) / (1000 * 60 * 60))
      const recoveryPercent = Math.min(100, Math.round((hoursSince / recoveryHours) * 100))

      let status: "fresh" | "recovering" | "ready" | "overdue"
      if (hoursSince < 6) status = "fresh"
      else if (hoursSince < recoveryHours) status = "recovering"
      else if (hoursSince < recoveryHours * 3) status = "ready"
      else status = "overdue"

      return {
        muscle,
        lastWorkedAt: data.date.toISOString(),
        hoursSince,
        recoveryHours,
        recoveryPercent,
        status,
        totalVolume: Math.round(data.volume),
        sets: data.sets,
      }
    })

    // Sort: recovering first, then fresh, then ready, then overdue
    const statusOrder = { fresh: 0, recovering: 1, ready: 2, overdue: 3 }
    recovery.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    return NextResponse.json({ recovery })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" || msg === "SessionExpired" ? 401 : 500 })
  }
}
