import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireMaster()

    const plans = await prisma.saasPlan.findMany({
      orderBy: { price: "asc" },
      include: {
        _count: { select: { subscriptions: true } },
      },
    })

    return Response.json(plans)
  } catch (error) {
    console.error("[Master Billing Plans]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { name, price, interval, maxProfessionals, maxStudents, features } = body

    if (!name || price == null) {
      return Response.json({ error: "Nome e preço são obrigatórios" }, { status: 400 })
    }

    const plan = await prisma.saasPlan.create({
      data: {
        name,
        price: Number(price),
        interval: interval || "MONTHLY",
        maxProfessionals: Number(maxProfessionals) || 1,
        maxStudents: Number(maxStudents) || 10,
        features: features || null,
      },
    })

    return Response.json(plan, { status: 201 })
  } catch (error) {
    console.error("[Master Billing Plans POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
