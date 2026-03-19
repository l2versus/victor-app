import { prisma } from "./prisma"

export async function getTrainerProfile(userId: string) {
  const profile = await prisma.trainerProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error("Trainer profile not found")
  return profile
}
