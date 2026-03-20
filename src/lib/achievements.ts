import { prisma } from "@/lib/prisma"

interface AchievementResult {
  type: string
  message: string
}

/**
 * After a session is completed, check if the student hit any milestones:
 * - Personal Record (new max load on any exercise)
 * - Streak 7 / 30 days
 * - Total sessions 50 / 100
 *
 * Creates CommunityPost (ACHIEVEMENT) + Notification for each milestone hit.
 */
export async function checkAndCreateAchievements(
  studentId: string,
  sessionId: string
): Promise<AchievementResult[]> {
  const results: AchievementResult[] = []

  // Load student + user info for notification
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true, user: { select: { name: true } } },
  })
  if (!student) return results

  // ── 1. Personal Records ────────────────────────────────────────────────
  const currentSets = await prisma.sessionSet.findMany({
    where: { sessionId },
    select: { exerciseId: true, loadKg: true, reps: true },
  })

  for (const set of currentSets) {
    if (set.loadKg <= 0) continue

    // Find max load for this exercise in ALL previous sessions (excluding current)
    const prevMax = await prisma.sessionSet.aggregate({
      _max: { loadKg: true },
      where: {
        exerciseId: set.exerciseId,
        session: { studentId, completedAt: { not: null } },
        sessionId: { not: sessionId },
      },
    })

    const oldMax = prevMax._max.loadKg ?? 0
    if (set.loadKg > oldMax && oldMax > 0) {
      // Get exercise name
      const exercise = await prisma.exercise.findUnique({
        where: { id: set.exerciseId },
        select: { name: true },
      })
      if (!exercise) continue

      const alreadyPostedToday = await prisma.communityPost.findFirst({
        where: {
          studentId,
          type: "ACHIEVEMENT",
          metadata: { path: ["achievementType"], equals: "PR_PERSONAL" },
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      })
      if (alreadyPostedToday) continue

      const content = `🏆 ${student.user.name} bateu um PR no ${exercise.name}! ${oldMax}kg → ${set.loadKg}kg 💪`

      await Promise.all([
        prisma.communityPost.create({
          data: {
            studentId,
            type: "ACHIEVEMENT",
            content,
            metadata: {
              achievementType: "PR_PERSONAL",
              exerciseName: exercise.name,
              oldPR: oldMax,
              newPR: set.loadKg,
            },
          },
        }),
        prisma.notification.create({
          data: {
            userId: student.userId,
            type: "achievement",
            title: "Novo PR! 🏆",
            body: `Você bateu um recorde no ${exercise.name}: ${set.loadKg}kg!`,
            sentVia: [],
            metadata: { achievementType: "PR_PERSONAL", exerciseName: exercise.name },
          },
        }),
      ])

      results.push({ type: "PR_PERSONAL", message: content })
      break // One PR post per session is enough
    }
  }

  // ── 2. Total sessions milestone ────────────────────────────────────────
  const totalSessions = await prisma.workoutSession.count({
    where: { studentId, completedAt: { not: null } },
  })

  const sessionMilestones: Record<number, string> = {
    50: "50 treinos completados! 🔥",
    100: "100 treinos! Lenda do ferro! 💎",
    200: "200 treinos! Insano! 🚀",
  }

  for (const [milestone, label] of Object.entries(sessionMilestones)) {
    if (totalSessions === Number(milestone)) {
      const content = `🎯 ${student.user.name} completou ${milestone} treinos! ${label}`

      await Promise.all([
        prisma.communityPost.create({
          data: {
            studentId,
            type: "MILESTONE",
            content,
            metadata: { achievementType: `SESSIONS_${milestone}`, totalSessions },
          },
        }),
        prisma.notification.create({
          data: {
            userId: student.userId,
            type: "achievement",
            title: `${milestone} Treinos! 🎯`,
            body: label,
            sentVia: [],
            metadata: { achievementType: `SESSIONS_${milestone}` },
          },
        }),
      ])

      results.push({ type: `SESSIONS_${milestone}`, message: content })
    }
  }

  // ── 3. Streak check ────────────────────────────────────────────────────
  const streak = await calcStreak(studentId)

  const streakMilestones: Record<number, string> = {
    7: "7 dias seguidos treinando! 🔥",
    30: "30 dias de streak! Monstro! 🦾",
    60: "60 dias consecutivos! Elite! 👑",
  }

  for (const [days, label] of Object.entries(streakMilestones)) {
    if (streak === Number(days)) {
      const content = `⚡ ${student.user.name} tem ${days} dias seguidos de treino! ${label}`

      await Promise.all([
        prisma.communityPost.create({
          data: {
            studentId,
            type: "ACHIEVEMENT",
            content,
            metadata: { achievementType: `STREAK_${days}`, streakDays: streak },
          },
        }),
        prisma.notification.create({
          data: {
            userId: student.userId,
            type: "achievement",
            title: `Streak de ${days} dias! ⚡`,
            body: label,
            sentVia: [],
            metadata: { achievementType: `STREAK_${days}` },
          },
        }),
      ])

      results.push({ type: `STREAK_${days}`, message: content })
    }
  }

  return results
}

async function calcStreak(studentId: string): Promise<number> {
  const sessions = await prisma.workoutSession.findMany({
    where: { studentId, completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 90,
  })

  if (sessions.length === 0) return 0

  const uniqueDays = Array.from(
    new Set(
      sessions.map(s => {
        const d = s.completedAt!
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        return `${d.getFullYear()}-${mm}-${dd}`
      })
    )
  )

  let streak = 1
  const today = new Date()

  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const curr = new Date(uniqueDays[i])
    const next = new Date(uniqueDays[i + 1])
    const diffDays = Math.round((curr.getTime() - next.getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }

  // If last session wasn't today or yesterday, streak is broken
  const lastSession = new Date(sessions[0].completedAt!)
  const diffFromToday = Math.floor((today.getTime() - lastSession.getTime()) / 86400000)
  if (diffFromToday > 1) return 0

  return streak
}
