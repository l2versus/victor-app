import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireMaster()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const invoices = await prisma.saasInvoice.findMany({
      where,
      include: {
        subscription: {
          include: {
            organization: { select: { name: true, slug: true } },
            plan: { select: { name: true, price: true, interval: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: limit,
    })

    // Summary counts
    const [pendingCount, paidCount, overdueCount, totalAmount] = await Promise.all([
      prisma.saasInvoice.count({ where: { status: "pending" } }),
      prisma.saasInvoice.count({ where: { status: "paid" } }),
      prisma.saasInvoice.count({ where: { status: "overdue" } }),
      prisma.saasInvoice.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    ])

    return Response.json({
      invoices,
      summary: {
        pending: pendingCount,
        paid: paidCount,
        overdue: overdueCount,
        totalPaid: totalAmount._sum.amount || 0,
      },
    })
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}

// Mark invoice as paid
export async function PUT(request: Request) {
  try {
    await requireMaster()

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return Response.json({ error: "id and status required" }, { status: 400 })
    }

    const data: Record<string, unknown> = { status }
    if (status === "paid") {
      data.paidAt = new Date()
    }

    const invoice = await prisma.saasInvoice.update({
      where: { id },
      data,
    })

    return Response.json(invoice)
  } catch (error) {
    console.error("[master/finance/invoices] PUT", error)
    return Response.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// Auto-generate monthly invoices for all active subscriptions
export async function POST() {
  try {
    await requireMaster()

    const now = new Date()
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Get all active subscriptions
    const activeSubs = await prisma.saasSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    })

    let created = 0
    let skipped = 0

    for (const sub of activeSubs) {
      // Check if invoice already exists for this month
      const existing = await prisma.saasInvoice.findFirst({
        where: { subscriptionId: sub.id, referenceMonth },
      })

      if (existing) {
        skipped++
        continue
      }

      // Create invoice
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10) // Due on 10th
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1)

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

    return Response.json({ created, skipped, referenceMonth })
  } catch (error) {
    console.error("[master/finance/invoices] POST", error)
    return Response.json({ error: "Failed to generate invoices" }, { status: 500 })
  }
}
