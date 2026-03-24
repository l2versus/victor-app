import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)
  const studentId = req.nextUrl.searchParams.get("studentId")

  const where: Record<string, unknown> = {
    student: { trainerId: trainer.id },
  }
  if (studentId) where.studentId = studentId

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      plan: { select: { name: true, interval: true, price: true } },
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(subscriptions)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)
  const body = await req.json()

  const { studentId, planId, startDate } = body

  // Verify student belongs to this trainer
  const studentCheck = await prisma.student.findUnique({ where: { id: studentId } })
  if (!studentCheck || studentCheck.trainerId !== trainer.id) {
    return Response.json({ error: "Aluno não encontrado" }, { status: 404 })
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId, trainerId: trainer.id } })
  if (!plan) return Response.json({ error: "Plano não encontrado" }, { status: 404 })

  // Calculate end date based on plan interval
  const start = startDate ? new Date(startDate) : new Date()
  const end = new Date(start)
  switch (plan.interval) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1)
      break
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3)
      break
    case "SEMIANNUAL":
      end.setMonth(end.getMonth() + 6)
      break
    case "ANNUAL":
      end.setFullYear(end.getFullYear() + 1)
      break
  }

  // Atomic: cancel old + create new in a single transaction
  const subscription = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { studentId, status: "ACTIVE", student: { trainerId: trainer.id } },
      data: { status: "CANCELLED" },
    })

    return tx.subscription.create({
      data: {
        studentId,
        planId,
        startDate: start,
        endDate: end,
        status: "ACTIVE",
      },
      include: {
        plan: { select: { name: true, interval: true, price: true } },
      },
    })
  })

  return Response.json(subscription, { status: 201 })
}
