import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const body = await request.json()
    const { name, price, interval, maxProfessionals, maxStudents, features, active } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (price !== undefined) data.price = Number(price)
    if (interval !== undefined) data.interval = interval
    if (maxProfessionals !== undefined) data.maxProfessionals = Number(maxProfessionals)
    if (maxStudents !== undefined) data.maxStudents = Number(maxStudents)
    if (features !== undefined) data.features = features
    if (active !== undefined) data.active = Boolean(active)

    const plan = await prisma.saasPlan.update({
      where: { id },
      data,
    })

    return Response.json(plan)
  } catch (error) {
    console.error("[Master Billing Plan PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMaster()
    const { id } = await params

    const plan = await prisma.saasPlan.update({
      where: { id },
      data: { active: false },
    })

    return Response.json(plan)
  } catch (error) {
    console.error("[Master Billing Plan DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
