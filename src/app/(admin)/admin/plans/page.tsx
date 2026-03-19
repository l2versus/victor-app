import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Crown, Plus, Users, Sparkles, Camera, MessageCircle, Salad } from "lucide-react"
import { PlansClient } from "./plans-client"

export const metadata: Metadata = {
  title: "Planos",
  robots: { index: false, follow: false },
}

export default async function PlansPage() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const plans = await prisma.plan.findMany({
    where: { trainerId: trainer.id },
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { price: "asc" },
  })

  const students = await prisma.student.findMany({
    where: { trainerId: trainer.id },
    include: {
      user: { select: { name: true } },
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        include: { plan: { select: { name: true, interval: true } } },
        take: 1,
        orderBy: { endDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            Planos & Assinaturas
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie planos e controle acesso às features</p>
        </div>
      </div>

      <PlansClient initialPlans={plans} students={students} />
    </div>
  )
}
