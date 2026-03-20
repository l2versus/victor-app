import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StudentNav } from "@/components/student/nav"
import { HomeHeader } from "@/components/student/home-header"
import { getStudentFeatures } from "@/lib/subscription"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT") redirect("/admin/dashboard")

  // Single-session protection: if another device logged in, kick this one
  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  // Fetch student profile + stats for social header
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true, avatar: true } } },
  })

  // Weekly stats + feature flags (parallel)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const [weekSessions, streak, weekPlansCount, features] = await Promise.all([
    student ? prisma.workoutSession.count({
      where: { studentId: student.id, startedAt: { gte: weekStart }, completedAt: { not: null } },
    }) : 0,
    // Streak: consecutive weeks with ≥1 session
    (async () => {
      if (!student) return 0
      const now = new Date()
      let s = 0
      for (let w = 0; w < 52; w++) {
        const end = new Date(now); end.setDate(now.getDate() - w * 7)
        const start = new Date(end); start.setDate(end.getDate() - 7)
        const count = await prisma.workoutSession.count({
          where: { studentId: student.id, completedAt: { not: null }, startedAt: { gte: start, lt: end } },
        })
        if (count > 0) s++; else break
      }
      return s
    })(),
    student ? prisma.studentWorkoutPlan.count({
      where: { studentId: student.id, active: true },
    }) : 0,
    student ? getStudentFeatures(student.id) : null,
  ])

  const userName = student?.user.name || session.email.split("@")[0]
  const userAvatar = student?.user.avatar || null

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* ═══ Living Background ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Ember orbs */}
        <div
          className="absolute top-[-5%] right-[-10%] w-75 h-75 bg-red-600/4 rounded-full blur-[100px]"
          style={{ animation: "student-orb-1 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[20%] left-[-5%] w-62.5 h-62.5 bg-red-800/3 rounded-full blur-[80px]"
          style={{ animation: "student-orb-2 10s ease-in-out infinite 2s" }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-red-600/20 to-transparent" />
      </div>

      {/* ═══ Social Header ═══ */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-5">
        <HomeHeader
          name={userName}
          avatar={userAvatar}
          streak={streak}
          weekSessions={weekSessions}
          weekTarget={weekPlansCount}
        />
      </div>

      {/* ═══ Content ═══ */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pb-24">
        {children}
      </main>

      {/* ═══ Navigation ═══ */}
      <StudentNav hasNutrition={features?.hasNutrition ?? false} />
    </div>
  )
}
