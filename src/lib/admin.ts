import { prisma } from "./prisma"

export async function getTrainerProfile(userId: string) {
  // Try own profile first, then fallback to primary trainer (for backup admin accounts)
  const profile = await prisma.trainerProfile.findUnique({ where: { userId } })
  if (profile) return profile

  // Fallback: find the trainer with the most students (primary trainer)
  console.warn(`[Admin] No trainer profile for userId=${userId}, falling back to primary trainer`)
  const primary = await prisma.trainerProfile.findFirst({
    orderBy: { students: { _count: "desc" } },
  })
  if (primary) return primary

  throw new Error("Trainer profile not found")
}
