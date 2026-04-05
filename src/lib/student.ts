import { prisma } from "./prisma"
import { requireAuth } from "./auth"

export async function getStudentProfile(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true, birthDate: true, createdAt: true } },
    },
  })
  if (!student) throw new Error("Student profile not found")
  return student
}

export async function requireStudent(opts?: { skipOnboardingCheck?: boolean }) {
  const session = await requireAuth()
  if (session.role !== "STUDENT") throw new Error("Forbidden")
  const student = await getStudentProfile(session.userId)
  // Block API access until onboarding is complete (except the onboarding route itself)
  if (!opts?.skipOnboardingCheck && !student.onboardingComplete) {
    throw new Error("OnboardingRequired")
  }
  return { session, student }
}
