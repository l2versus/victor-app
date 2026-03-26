import { prisma } from "./prisma"

export async function getNutriProfile(userId: string) {
  const profile = await prisma.nutritionistProfile.findUnique({ where: { userId } })
  if (profile) return profile

  // Fallback: find the nutritionist with the most students (primary nutri)
  const primary = await prisma.nutritionistProfile.findFirst({
    orderBy: { students: { _count: "desc" } },
  })
  if (primary) return primary

  throw new Error("Nutritionist profile not found")
}
