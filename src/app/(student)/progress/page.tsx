import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProgressClient } from "./progress-client"

export const metadata: Metadata = {
  title: "Fotos de Progresso",
  robots: { index: false, follow: false },
}

export default async function ProgressPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  })
  if (!student) redirect("/login")

  const photos = await prisma.progressPhoto.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  })

  return <ProgressClient photos={photos.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }))} />
}
