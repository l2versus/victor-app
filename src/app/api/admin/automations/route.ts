import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp-bot"

// POST /api/admin/automations — run automation manually or via cron
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()
    const { type } = body as { type: "birthday" | "inactive" | "payment_due" | "workout_reminder" }

    const now = new Date()
    const results = { sent: 0, failed: 0, students: [] as string[] }

    if (type === "birthday") {
      // Find students with birthday today
      const students = await prisma.student.findMany({
        where: { trainerId: trainer.id, status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, phone: true, birthDate: true } } },
      })

      const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

      for (const s of students) {
        const bd = s.birthDate || s.user.birthDate
        if (!bd) continue
        const bdStr = `${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`
        if (bdStr !== today) continue

        const firstName = s.user.name.split(" ")[0]
        const msg = `Parabéns, ${firstName}! 🎂🎉\n\nHoje é seu dia especial! Que tal comemorar com um treino massa? Bora fazer desse ano o mais forte! 💪🔥\n\nSeu personal, Victor`

        // Send WhatsApp if has phone
        if (s.user.phone) {
          let formatted = s.user.phone.replace(/\D/g, "")
          if (!formatted.startsWith("55")) formatted = "55" + formatted
          const sent = await sendWhatsAppMessage(formatted, msg)
          if (sent) results.sent++
          else results.failed++
        }

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: s.user.id,
            type: "achievement",
            title: "Feliz Aniversário! 🎂",
            body: `Parabéns, ${firstName}! Bora comemorar com um treino?`,
          },
        })

        results.students.push(firstName)
      }
    }

    if (type === "inactive") {
      // Find active students who haven't trained in 7+ days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const students = await prisma.student.findMany({
        where: { trainerId: trainer.id, status: "ACTIVE" },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          sessions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { startedAt: true },
          },
        },
      })

      for (const s of students) {
        const lastSession = s.sessions[0]?.startedAt
        if (lastSession && lastSession > sevenDaysAgo) continue // Trained recently

        const firstName = s.user.name.split(" ")[0]
        const msg = lastSession
          ? `E aí, ${firstName}! Tá sumido(a) hein! 😅\n\nFaz ${Math.floor((now.getTime() - lastSession.getTime()) / (24 * 60 * 60 * 1000))} dias que não treina. Bora voltar? Teu corpo tá pedindo! 💪`
          : `Fala, ${firstName}! Ainda não começou a treinar comigo pelo app.\n\nBora? É só abrir o app e começar o treino de hoje! 🔥`

        if (s.user.phone) {
          let formatted = s.user.phone.replace(/\D/g, "")
          if (!formatted.startsWith("55")) formatted = "55" + formatted
          const sent = await sendWhatsAppMessage(formatted, msg)
          if (sent) results.sent++
          else results.failed++
        }

        await prisma.notification.create({
          data: {
            userId: s.user.id,
            type: "announcement",
            title: "Sentimos sua falta! 💪",
            body: `${firstName}, bora voltar a treinar? Seu progresso te espera!`,
          },
        })

        results.students.push(firstName)
      }
    }

    if (type === "payment_due") {
      // Find students with pending payments
      const pendingPayments = await prisma.payment.findMany({
        where: { student: { trainerId: trainer.id }, status: "PENDING" },
        include: {
          student: {
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      })

      for (const p of pendingPayments) {
        const firstName = p.student.user.name.split(" ")[0]
        const amount = p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        const msg = `Oi, ${firstName}! 👋\n\nSó passando pra lembrar que tem um pagamento pendente de ${amount}.\n\nQualquer dúvida é só me chamar! 😊`

        if (p.student.user.phone) {
          let formatted = p.student.user.phone.replace(/\D/g, "")
          if (!formatted.startsWith("55")) formatted = "55" + formatted
          const sent = await sendWhatsAppMessage(formatted, msg)
          if (sent) results.sent++
          else results.failed++
        }

        results.students.push(firstName)
      }
    }

    if (type === "workout_reminder") {
      // Send reminder to students who have a workout planned today but haven't started
      const dayOfWeek = now.getDay()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)

      const plansToday = await prisma.studentWorkoutPlan.findMany({
        where: {
          dayOfWeek,
          active: true,
          student: { trainerId: trainer.id, status: "ACTIVE" },
        },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
              sessions: {
                where: { startedAt: { gte: todayStart } },
                take: 1,
              },
            },
          },
          template: { select: { name: true } },
        },
      })

      for (const plan of plansToday) {
        // Skip if already trained today
        if (plan.student.sessions.length > 0) continue

        const firstName = plan.student.user.name.split(" ")[0]
        const msg = `Fala, ${firstName}! 💪\n\nHoje é dia de ${plan.template.name}! Bora treinar? O app tá te esperando! 🔥`

        if (plan.student.user.phone) {
          let formatted = plan.student.user.phone.replace(/\D/g, "")
          if (!formatted.startsWith("55")) formatted = "55" + formatted
          const sent = await sendWhatsAppMessage(formatted, msg)
          if (sent) results.sent++
          else results.failed++
        }

        await prisma.notification.create({
          data: {
            userId: plan.student.user.id,
            type: "announcement",
            title: `Treino de hoje: ${plan.template.name} 🏋️`,
            body: `${firstName}, hoje é dia de ${plan.template.name}! Abre o app e bora!`,
          },
        })

        results.students.push(firstName)
      }
    }

    return NextResponse.json({ success: true, type, results })
  } catch (error) {
    console.error("Automation error:", error)
    return NextResponse.json({ error: "Falha na automação" }, { status: 500 })
  }
}
