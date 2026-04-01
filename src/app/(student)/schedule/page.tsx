import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ScheduleStudentClient } from "./schedule-client"

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
}

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <ScheduleStudentClient />
}
