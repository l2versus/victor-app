import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sendPushToStudent } from "@/lib/push"

// POST /api/admin/push/onboarding-reminder
// Sends push + in-app notification to ALL students who haven't completed onboarding
export async function POST() {
  try {
    await requireAdmin()

    // Find all students who haven't completed onboarding
    const students = await prisma.student.findMany({
      where: { onboardingComplete: false, status: "ACTIVE" },
      select: { id: true, userId: true, user: { select: { name: true } } },
    })

    if (students.length === 0) {
      return NextResponse.json({ sent: 0, message: "Todos os alunos já completaram o onboarding" })
    }

    let pushSent = 0
    let notifCreated = 0

    for (const student of students) {
      const firstName = student.user.name?.split(" ")[0] ?? "Aluno"

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: student.userId,
          type: "onboarding",
          title: "Complete seu perfil de saúde",
          body: `${firstName}, precisamos de algumas informações para personalizar seus treinos e garantir sua segurança. Leva menos de 2 minutos!`,
          metadata: { url: "/onboarding" },
        },
      })
      notifCreated++

      // Web push
      const sent = await sendPushToStudent(student.id, {
        title: "Complete seu perfil de saúde",
        body: `${firstName}, precisamos de algumas informações para personalizar seus treinos!`,
        url: "/onboarding",
        tag: "onboarding-reminder",
      })
      if (sent) pushSent++
    }

    return NextResponse.json({
      total: students.length,
      notifications: notifCreated,
      pushSent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
