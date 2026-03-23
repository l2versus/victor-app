import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { BackButton } from "@/components/ui/back-button"
import { AssessmentsManager } from "./assessments-manager"

export default async function AssessmentsPage() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const [students, assessments] = await Promise.all([
    prisma.student.findMany({
      where: { trainerId: trainer.id, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.assessment.findMany({
      where: { student: { trainerId: trainer.id } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    }),
  ])

  return (
    <div>
      <BackButton />
      <AssessmentsManager
      students={students.map(s => ({
        id: s.id,
        name: s.user.name,
        weight: s.weight,
        birthDate: s.birthDate?.toISOString() || null,
        gender: s.gender,
      }))}
      initialAssessments={assessments.map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.student.user.name,
        type: a.type,
        title: a.title,
        data: a.data as Record<string, unknown>,
        notes: a.notes,
        createdAt: a.createdAt.toISOString(),
      }))}
      />
    </div>
  )
}
