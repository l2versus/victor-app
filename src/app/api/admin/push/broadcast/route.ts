import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import webpush from "web-push"

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:app@victoroliveira.com.br",
    publicKey,
    privateKey
  )
  return webpush
}

// POST /api/admin/push/broadcast
// Body: { title, body, url?, studentId? }
// studentId = null → broadcast to all; studentId = "..." → individual
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const wp = getWebPush()
    if (!wp) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 })
    }

    const body = await req.json()
    const { title, body: msgBody, url = "/today", studentId } = body as {
      title: string
      body: string
      url?: string
      studentId?: string
    }

    if (!title || !msgBody) {
      return NextResponse.json({ error: "title e body obrigatórios" }, { status: 400 })
    }

    const where = studentId ? { studentId } : {}
    const subscriptions = await prisma.pushSubscription.findMany({ where })

    if (subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "Nenhum aluno com push ativo" })
    }

    const payload = JSON.stringify({ title, body: msgBody, url, tag: "victor-broadcast" })
    const staleIds: string[] = []

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ).catch((err: { statusCode?: number }) => {
          // 410 Gone = subscription expired, remove it
          if (err?.statusCode === 410) staleIds.push(sub.id)
          throw err
        })
      )
    )

    // Clean up expired subscriptions
    if (staleIds.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } })
    }

    const sent = results.filter((r) => r.status === "fulfilled").length
    const failed = results.length - sent

    return NextResponse.json({ sent, failed, cleaned: staleIds.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
