import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ExtraActivityClient } from "./extra-client"

export const metadata: Metadata = {
  title: "Atividades Extra",
  robots: { index: false, follow: false },
}

export default async function ExtraPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const student = await prisma.student.findUnique({ where: { userId: session.userId } })
  if (!student) redirect("/login")

  const activities = await prisma.extraActivity.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 50,
  })

  return <ExtraActivityClient activities={activities.map(a => ({ ...a, date: a.date.toISOString(), createdAt: a.createdAt.toISOString() }))} />
}
