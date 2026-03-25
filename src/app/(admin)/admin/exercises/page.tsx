import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Dumbbell } from "lucide-react"
import { ExerciseList } from "@/components/admin/exercises/exercise-list"
import { BackButton } from "@/components/ui/back-button"

export default async function ExercisesPage() {
  await requireAdmin()

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      orderBy: [{ muscle: "asc" }, { name: "asc" }],
    }),
    prisma.exercise.count(),
  ])

  const muscleGroups = await prisma.exercise.findMany({
    select: { muscle: true },
    distinct: ["muscle"],
    orderBy: { muscle: "asc" },
  })

  return (
    <div>
      <BackButton />
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Biblioteca de Exercícios</h1>
            <p className="text-neutral-500 text-sm">{total} exercícios disponíveis</p>
          </div>
        </div>
      </div>

      <ExerciseList
        initialData={{
          exercises,
          total,
          page: 1,
          pages: Math.ceil(total / 50),
          muscles: muscleGroups.map((m: { muscle: string }) => m.muscle),
        }}
      />
    </div>
  )
}
