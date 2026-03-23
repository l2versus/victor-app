import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp-bot"
import webpush from "web-push"

// GET /api/admin/broadcasts — list past broadcasts
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    // Get students with counts for filter preview
    const students = await prisma.student.findMany({
      where: { trainerId: trainer.id },
      select: { id: true, gender: true, birthDate: true, status: true, user: { select: { name: true, phone: true } } },
    })

    const now = new Date()
    const stats = {
      total: students.length,
      active: students.filter(s => s.status === "ACTIVE").length,
      male: students.filter(s => s.gender === "MALE").length,
      female: students.filter(s => s.gender === "FEMALE").length,
      seniors: students.filter(s => {
        if (!s.birthDate) return false
        const age = Math.floor((now.getTime() - s.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        return age >= 60
      }).length,
      withPhone: students.filter(s => !!s.user.phone).length,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// POST /api/admin/broadcasts — send broadcast message
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { title, message, channels, filters } = body as {
      title: string
      message: string
      channels: ("app" | "push" | "whatsapp")[]
      filters: {
        gender?: "MALE" | "FEMALE" | "OTHER" | null
        status?: "ACTIVE" | "INACTIVE" | null
        ageMin?: number | null
        ageMax?: number | null
      }
    }

    if (!title || !message) {
      return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 })
    }

    // Build student filter
    const where: Record<string, unknown> = { trainerId: trainer.id }
    if (filters?.status) where.status = filters.status
    if (filters?.gender) where.gender = filters.gender

    const students = await prisma.student.findMany({
      where,
      include: { user: { select: { id: true, name: true, phone: true } } },
    })

    // Age filter (needs post-query filtering since it's calculated)
    const now = new Date()
    let filtered = students
    if (filters?.ageMin || filters?.ageMax) {
      filtered = students.filter(s => {
        if (!s.birthDate) return false
        const age = Math.floor((now.getTime() - s.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (filters.ageMin && age < filters.ageMin) return false
        if (filters.ageMax && age > filters.ageMax) return false
        return true
      })
    }

    const results = { app: 0, push: 0, whatsapp: 0, failed: 0, total: filtered.length }

    for (const student of filtered) {
      // Personalize message with student name
      const personalizedMsg = message.replace(/\{nome\}/g, student.user.name.split(" ")[0])

      // 1) In-app notification
      if (channels.includes("app")) {
        try {
          await prisma.notification.create({
            data: {
              userId: student.user.id,
              type: "announcement",
              title,
              body: personalizedMsg,
              metadata: { broadcast: true, channels },
            },
          })
          results.app++
        } catch { results.failed++ }
      }

      // 2) Web Push
      if (channels.includes("push")) {
        try {
          const sent = await sendPushToStudent(student.id, { title, body: personalizedMsg, url: "/today" })
          if (sent) results.push++
        } catch { /* ignore */ }
      }

      // 3) WhatsApp
      if (channels.includes("whatsapp") && student.user.phone) {
        try {
          let formatted = student.user.phone.replace(/\D/g, "")
          if (formatted.startsWith("0")) formatted = "55" + formatted.slice(1)
          if (!formatted.startsWith("55")) formatted = "55" + formatted
          const sent = await sendWhatsAppMessage(formatted, personalizedMsg)
          if (sent) results.whatsapp++
        } catch { results.failed++ }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// ═══ PUSH HELPER ═══
async function sendPushToStudent(studentId: string, payload: { title: string; body: string; url: string }): Promise<boolean> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) return false

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const subs = await prisma.pushSubscription.findMany({ where: { studentId } })
  let sent = false

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
      sent = true
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }
  return sent
}

