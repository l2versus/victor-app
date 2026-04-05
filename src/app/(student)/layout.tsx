import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StudentNav } from "@/components/student/nav"
import { HomeHeader } from "@/components/student/home-header"
import { getStudentFeatures } from "@/lib/subscription"
import { ImpersonateHandler } from "@/components/admin/impersonate-handler"
import { ImpersonateBanner } from "@/components/admin/impersonate-banner"
import { AiChatFab } from "@/components/student/ai-chat-fab"
import { WaterReminder } from "@/components/student/water-reminder"

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

  // Guard: no student record → login
  if (!student) redirect("/login")

  // Onboarding guard — force new AND existing students through health screening
  if (!student.onboardingComplete) {
    redirect("/onboarding")
  }

  // Update online presence (fire-and-forget)
  if (student) {
    prisma.student.update({
      where: { id: student.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {})
  }

  // Weekly stats + feature flags (parallel)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const [weekSessions, streak, weekPlansCount, features, healthScreening] = await Promise.all([
    student ? prisma.workoutSession.count({
      where: { studentId: student.id, startedAt: { gte: weekStart }, completedAt: { not: null } },
    }) : 0,
    // Streak: 1 aggregated query instead of up to 52 individual ones
    (async () => {
      if (!student) return 0
      const sessions = await prisma.workoutSession.findMany({
        where: { studentId: student.id, completedAt: { not: null } },
        select: { startedAt: true },
        orderBy: { startedAt: "desc" },
      })
      if (sessions.length === 0) return 0
      const now = new Date()
      let s = 0
      for (let w = 0; w < 52; w++) {
        const end = new Date(now); end.setDate(now.getDate() - w * 7)
        const start = new Date(end); start.setDate(end.getDate() - 7)
        const hasSession = sessions.some(
          (sess) => sess.startedAt >= start && sess.startedAt < end
        )
        if (hasSession) s++; else break
      }
      return s
    })(),
    student ? prisma.studentWorkoutPlan.count({
      where: { studentId: student.id, active: true },
    }) : 0,
    student ? getStudentFeatures(student.id) : null,
    prisma.healthScreening.findUnique({
      where: { studentId: student.id },
      select: { goal: true, frequency: true, sessionMinutes: true },
    }),
  ])

  const userName = student?.user.name || session.email.split("@")[0]
  const userAvatar = student?.user.avatar || null

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-x-hidden">
      {/* Impersonation support */}
      <ImpersonateHandler />
      <ImpersonateBanner studentName={userName} />

      {/* ═══ Premium Background — Victor Personal hero + cinematic overlay ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Victor Personal gym photo — fixed, covers viewport */}
        <img
          src="/img/ironberg.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.15) saturate(0.3)" }}
        />

        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#030303]/85 to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" style={{ height: "100%" }} />

        {/* Subtle red accent glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 bg-red-600/[0.04] rounded-full blur-[120px]"
          style={{ willChange: "transform" }}
        />
        <div
          className="absolute bottom-40 left-0 w-60 h-60 bg-red-800/[0.03] rounded-full blur-[100px]"
          style={{ willChange: "transform" }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
      </div>

      {/* ═══ Social Header ═══ */}
      <div className="relative z-20 max-w-lg mx-auto px-4 pt-5">
        <HomeHeader
          name={userName}
          avatar={userAvatar}
          streak={streak}
          weekSessions={weekSessions}
          weekTarget={weekPlansCount}
        />
      </div>

      {/* ═══ Content ═══ */}
      <main className="relative max-w-lg mx-auto px-4 pb-24">
        {/* Water reminder — based on weight + health screening */}
        <WaterReminder
          weightKg={student.weight}
          goal={healthScreening?.goal}
          frequency={healthScreening?.frequency}
          sessionMinutes={healthScreening?.sessionMinutes}
        />
        {children}
      </main>

      {/* ═══ AI Chat FAB ═══ */}
      <AiChatFab />

      {/* ═══ Navigation ═══ */}
      <StudentNav hasNutrition={features?.hasNutrition ?? false} />

    </div>
  )
}
