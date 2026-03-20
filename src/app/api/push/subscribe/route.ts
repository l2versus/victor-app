import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// POST /api/push/subscribe — save push subscription
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const body = await req.json()
    const { endpoint, keys } = body as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        studentId: student.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        studentId: student.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/push/subscribe — remove push subscription
export async function DELETE(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const body = await req.json()
    const { endpoint } = body as { endpoint: string }

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint obrigatório" }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { studentId: student.id, endpoint },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
