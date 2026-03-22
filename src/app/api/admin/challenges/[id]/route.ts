import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/admin/challenges/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        metric: body.metric ?? undefined,
        targetValue: body.targetValue ?? undefined,
        status: body.status ?? undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    })

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error("PATCH /api/admin/challenges/[id] error:", error)
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
  }
}

// DELETE /api/admin/challenges/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.$transaction([
      prisma.challengeEntry.deleteMany({ where: { challengeId: id } }),
      prisma.challenge.delete({ where: { id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/challenges/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 })
  }
}
