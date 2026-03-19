import { prisma } from "@/lib/prisma"

export type StudentFeatures = {
  hasAI: boolean
  hasPostureCamera: boolean
  hasVipGroup: boolean
  hasNutrition: boolean
  maxSessionsWeek: number | null
  planName: string | null
  planInterval: string | null
  subscriptionStatus: string | null
  daysRemaining: number | null
}

const FREE_FEATURES: StudentFeatures = {
  hasAI: false,
  hasPostureCamera: false,
  hasVipGroup: false,
  hasNutrition: false,
  maxSessionsWeek: 3,
  planName: null,
  planInterval: null,
  subscriptionStatus: null,
  daysRemaining: null,
}

export async function getStudentFeatures(studentId: string): Promise<StudentFeatures> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      studentId,
      status: { in: ["ACTIVE", "TRIAL"] },
      endDate: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { endDate: "desc" },
  })

  if (!subscription) return FREE_FEATURES

  const now = new Date()
  const daysRemaining = Math.ceil(
    (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    hasAI: subscription.plan.hasAI,
    hasPostureCamera: subscription.plan.hasPostureCamera,
    hasVipGroup: subscription.plan.hasVipGroup,
    hasNutrition: subscription.plan.hasNutrition,
    maxSessionsWeek: subscription.plan.maxSessionsWeek,
    planName: subscription.plan.name,
    planInterval: subscription.plan.interval,
    subscriptionStatus: subscription.status,
    daysRemaining,
  }
}

export async function checkFeature(
  studentId: string,
  feature: keyof Pick<StudentFeatures, "hasAI" | "hasPostureCamera" | "hasVipGroup" | "hasNutrition">
): Promise<boolean> {
  const features = await getStudentFeatures(studentId)
  return features[feature]
}
