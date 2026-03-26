import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (statusFilter === "pending") {
      where.status = "pending"
    } else if (statusFilter === "paid") {
      where.status = "paid"
    } else if (statusFilter === "overdue") {
      where.status = "overdue"
    }

    const invoices = await prisma.saasInvoice.findMany({
      where,
      orderBy: { dueDate: "desc" },
      take: 100,
      include: {
        subscription: {
          include: {
            organization: { select: { name: true } },
            plan: { select: { name: true } },
          },
        },
      },
    })

    return Response.json(invoices)
  } catch (error) {
    console.error("[Master Billing Invoices]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
