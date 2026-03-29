import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/master/billing/invoices — List invoices with filters
export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")
    const monthFilter = searchParams.get("month") // e.g. "2026-03"
    const orgId = searchParams.get("orgId")

    const where: Record<string, unknown> = {}

    if (statusFilter === "pending") {
      where.status = "pending"
    } else if (statusFilter === "paid") {
      where.status = "paid"
    } else if (statusFilter === "overdue") {
      where.status = "overdue"
    }

    if (monthFilter) {
      where.referenceMonth = monthFilter
    }

    if (orgId) {
      where.subscription = { organizationId: orgId }
    }

    const invoices = await prisma.saasInvoice.findMany({
      where,
      orderBy: { dueDate: "desc" },
      take: 200,
      include: {
        subscription: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
            plan: { select: { id: true, name: true, price: true, interval: true } },
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

// POST /api/master/billing/invoices — Generate monthly invoices for all active subscriptions
export async function POST() {
  try {
    await requireMaster()

    const now = new Date()
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Find all ACTIVE + TRIAL subscriptions
    const activeSubscriptions = await prisma.saasSubscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: true, organization: { select: { name: true } } },
    })

    let created = 0
    let skipped = 0

    for (const sub of activeSubscriptions) {
      // Check if invoice already exists for this subscription + month
      const existing = await prisma.saasInvoice.findFirst({
        where: {
          subscriptionId: sub.id,
          referenceMonth,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // Calculate due date (15th of current month)
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 15)
      if (dueDate < now) {
        // If the 15th has passed, set due date to 15th of next month
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      await prisma.saasInvoice.create({
        data: {
          subscriptionId: sub.id,
          amount: sub.plan.price,
          status: "pending",
          dueDate,
          referenceMonth,
        },
      })
      created++
    }

    return Response.json({
      message: `Faturas geradas: ${created} criadas, ${skipped} ja existiam`,
      created,
      skipped,
      referenceMonth,
    })
  } catch (error) {
    console.error("[Master Billing Invoices POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// PATCH /api/master/billing/invoices — Mark invoice as paid
export async function PATCH(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { invoiceId, action } = body

    if (!invoiceId) {
      return Response.json({ error: "invoiceId e obrigatorio" }, { status: 400 })
    }

    const invoice = await prisma.saasInvoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      return Response.json({ error: "Fatura nao encontrada" }, { status: 404 })
    }

    if (action === "mark_paid") {
      const updated = await prisma.saasInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      })
      return Response.json(updated)
    }

    if (action === "mark_overdue") {
      const updated = await prisma.saasInvoice.update({
        where: { id: invoiceId },
        data: { status: "overdue" },
      })
      return Response.json(updated)
    }

    if (action === "mark_pending") {
      const updated = await prisma.saasInvoice.update({
        where: { id: invoiceId },
        data: { status: "pending", paidAt: null },
      })
      return Response.json(updated)
    }

    return Response.json(
      { error: `Acao desconhecida: ${action}. Use: mark_paid, mark_overdue, mark_pending` },
      { status: 400 }
    )
  } catch (error) {
    console.error("[Master Billing Invoices PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
