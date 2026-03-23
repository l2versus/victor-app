import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { BackButton } from "@/components/ui/back-button"
import { ScheduleClient } from "./schedule-client"

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
}

export default async function SchedulePage() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const students = await prisma.student.findMany({
    where: { trainerId: trainer.id, status: "ACTIVE" },
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
        <p className="text-xs text-neutral-500 mt-0.5">Gerencie seus horários e sessões</p>
      </div>
      <ScheduleClient students={studentList} />
    </div>
  )
}
