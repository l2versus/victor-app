import { prisma } from "./prisma"

export async function getNutriProfile(userId: string) {
  const profile = await prisma.nutritionistProfile.findUnique({ where: { userId } })
  if (profile) return profile

  throw new Error("Nutritionist profile not found")
}
