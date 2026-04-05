import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "STUDENT") redirect("/admin/dashboard")

  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true, birthDate: true } },
      healthScreening: true,
    },
  })

  if (!student) redirect("/login")

  // Already completed? Go to app
  if (student.onboardingComplete) redirect("/today")

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-[#030303] to-[#030303]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <OnboardingWizard
          initialProfile={{
            name: student.user.name,
            email: student.user.email,
            phone: student.user.phone || "",
            avatar: student.user.avatar || "",
            birthDate: student.user.birthDate?.toISOString().split("T")[0] || "",
            gender: student.gender || "",
            weight: student.weight?.toString() || "",
            height: student.height?.toString() || "",
          }}
          existingScreening={student.healthScreening}
        />
      </main>
    </div>
  )
}
