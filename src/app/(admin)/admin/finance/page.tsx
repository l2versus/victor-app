import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { DollarSign } from "lucide-react"
import { FinanceClient } from "./finance-client"
import { BackButton } from "@/components/ui/back-button"

export const metadata: Metadata = {
  title: "Financeiro",
  robots: { index: false, follow: false },
}

export default async function FinancePage() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  // Load students for payment registration dropdown
  const students = await prisma.student.findMany({
    where: { trainerId: trainer.id, status: "ACTIVE" },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  })

  const studentList = students.map(s => ({
    id: s.id,
    name: s.user.name,
  }))

  return (
    <div className="space-y-6 sm:space-y-8">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Financeiro
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Receitas, custos e lucro em tempo real</p>
        </div>
      </div>

      <FinanceClient students={studentList} />
    </div>
  )
}
