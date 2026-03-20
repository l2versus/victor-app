import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { getStudentFeatures } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { UpgradeClient } from "./upgrade-client"

export default async function UpgradePage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const features = await getStudentFeatures(student.id)

  return (
    <UpgradeClient
      currentPlan={features.planName}
      currentFeatures={{
        hasAI: features.hasAI,
        hasPostureCamera: features.hasPostureCamera,
        hasVipGroup: features.hasVipGroup,
        hasNutrition: features.hasNutrition,
      }}
    />
  )
}
