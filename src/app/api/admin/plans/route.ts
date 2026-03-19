import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const plans = await prisma.plan.findMany({
    where: { trainerId: trainer.id },
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)
  const body = await req.json()

  const plan = await prisma.plan.create({
    data: {
      trainerId: trainer.id,
      name: body.name,
      interval: body.interval || "MONTHLY",
      price: body.price,
      hasAI: body.hasAI ?? false,
      hasPostureCamera: body.hasPostureCamera ?? false,
      hasVipGroup: body.hasVipGroup ?? false,
      hasNutrition: body.hasNutrition ?? false,
      maxSessionsWeek: body.maxSessionsWeek ?? null,
      description: body.description || null,
    },
  })

  return Response.json(plan, { status: 201 })
}
