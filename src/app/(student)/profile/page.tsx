import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileClient } from "./profile-client"

export const metadata: Metadata = {
  title: "Meu Perfil",
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true, createdAt: true } },
    },
  })

  if (!student) redirect("/login")

  // Aggregate stats
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

  return (
    <ProfileClient
      student={{
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        birthDate: student.birthDate?.toISOString() || null,
        gender: student.gender,
        weight: student.weight,
        height: student.height,
        goals: student.goals,
        restrictions: student.restrictions as string | null,
        memberSince: student.user.createdAt.toISOString(),
      }}
      stats={{
        totalSessions,
        avgRpe: rpeAgg._avg.rpe ? Math.round(rpeAgg._avg.rpe * 10) / 10 : null,
        lastSession: lastSession?.completedAt?.toISOString() || null,
      }}
    />
  )
}
