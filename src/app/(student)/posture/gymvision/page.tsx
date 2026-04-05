import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GymVisionClient } from "./gymvision-client"

export default async function GymVisionPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  return <GymVisionClient />
}
