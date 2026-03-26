import type { Metadata } from "next"
import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"
import { BackButton } from "@/components/ui/back-button"
import { ScheduleClient } from "./schedule-client"

export const metadata: Metadata = {
  title: "Agenda - Nutri",
  robots: { index: false, follow: false },
}

export default async function NutriSchedulePage() {
  const session = await requireNutritionist()
  const nutri = await getNutriProfile(session.userId)

  const students = await prisma.student.findMany({
    where: { nutritionistId: nutri.id, status: "ACTIVE" },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { user: { name: "asc" } },
  })

  const studentList = students.map(s => ({
    id: s.id,
    name: s.user.name,
    avatar: s.user.avatar,
  }))

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Agenda</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Gerencie suas consultas e retornos</p>
      </div>
      <ScheduleClient students={studentList} />
    </div>
  )
}
