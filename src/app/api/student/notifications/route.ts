import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// GET /api/student/notifications — list notifications for current user
export async function GET() {
  try {
    const { student } = await requireStudent()

    const notifications = await prisma.notification.findMany({
      where: { userId: student.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const unreadCount = notifications.filter(n => !n.read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH /api/student/notifications — mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const body = await req.json().catch(() => ({}))

    // If ids provided, mark only those; otherwise mark all
    const where = body.ids?.length
      ? { userId: student.userId, id: { in: body.ids as string[] } }
      : { userId: student.userId, read: false }

    await prisma.notification.updateMany({ where, data: { read: true } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
