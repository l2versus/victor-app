import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentFeatures } from "@/lib/subscription"

export async function GET() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })

  if (!student) {
    return Response.json({ error: "Aluno não encontrado" }, { status: 404 })
  }

  const features = await getStudentFeatures(student.id)

  return Response.json(features)
}
