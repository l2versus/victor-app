import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// PATCH /api/admin/plans/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.plan.findFirst({
      where: { id, trainerId: trainer.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        price: body.price ?? undefined,
        interval: body.interval ?? undefined,
        maxSessionsWeek: body.maxSessionsWeek ?? undefined,
        hasAI: body.hasAI ?? undefined,
        hasPostureCamera: body.hasPostureCamera ?? undefined,
        hasVipGroup: body.hasVipGroup ?? undefined,
        hasNutrition: body.hasNutrition ?? undefined,
        description: body.description ?? undefined,
        active: body.active ?? undefined,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("PATCH /api/admin/plans/[id] error:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

// DELETE /api/admin/plans/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const { id } = await params

    const existing = await prisma.plan.findFirst({
      where: { id, trainerId: trainer.id },
      include: { _count: { select: { subscriptions: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (existing._count.subscriptions > 0) {
      // Deactivate instead of delete if has active subscriptions
      await prisma.plan.update({
        where: { id },
        data: { active: false },
      })
      return NextResponse.json({ ok: true, deactivated: true })
    }

    await prisma.plan.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/plans/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
