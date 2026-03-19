import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Dumbbell, Plus, ArrowRight, ClipboardList } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function WorkoutsPage() {
  const session = await requireAdmin()
  const trainer = await getTrainerProfile(session.userId)

  const workouts = await prisma.workoutTemplate.findMany({
    where: { trainerId: trainer.id },
    include: {
      exercises: {
        include: { exercise: { select: { name: true, muscle: true } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Get unique muscle groups per workout
  function getWorkoutMuscles(exercises: typeof workouts[0]["exercises"]): string[] {
    const muscles = [...new Set(exercises.map((e: typeof exercises[0]) => e.exercise.muscle))] as string[]
    return muscles.slice(0, 3)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Treinos</h1>
            <p className="text-neutral-500 text-sm">{workouts.length} modelo{workouts.length !== 1 ? "s" : ""} criado{workouts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <Link
          href="/admin/workouts/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          Novo Treino
        </Link>
      </div>

      {/* Workout Grid */}
      {workouts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-neutral-700" />
          </div>
          <p className="text-neutral-400 font-medium mb-1">Nenhum treino ainda</p>
          <p className="text-neutral-600 text-sm mb-6">Crie seu primeiro modelo de treino para atribuir aos alunos</p>
          <Link
            href="/admin/workouts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Treino
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((w: typeof workouts[0]) => {
            const muscles = getWorkoutMuscles(w.exercises)
            return (
              <Link
                key={w.id}
                href={`/admin/workouts/${w.id}`}
                className="group relative rounded-2xl border border-neutral-800 bg-[#111]/80 backdrop-blur-sm p-5 hover:border-neutral-700 hover:bg-[#151515] transition-all duration-300"
              >
                {/* Hover glow */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  {/* Type badge + session count */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium uppercase tracking-wider">
                      {w.type}
                    </span>
                    <span className="text-[10px] text-neutral-600">
                      {w._count.sessions} sessão{w._count.sessions !== 1 ? "es" : ""}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-white font-semibold mb-2 group-hover:text-red-400 transition-colors">
                    {w.name}
                  </h3>

                  {/* Exercise count + muscles */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-neutral-500">
                      {w.exercises.length} exercício{w.exercises.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-neutral-700">·</span>
                    <div className="flex gap-1">
                      {muscles.map((m: string) => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-500">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exercise preview */}
                  <div className="space-y-1 mb-3">
                    {w.exercises.slice(0, 3).map((ex: typeof w.exercises[0]) => (
                      <p key={ex.id} className="text-neutral-500 text-xs truncate">
                        • {ex.exercise.name} — {ex.sets}×{ex.reps}
                      </p>
                    ))}
                    {w.exercises.length > 3 && (
                      <p className="text-neutral-600 text-xs">
                        +{w.exercises.length - 3} mais
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
                    <span className="text-[10px] text-neutral-600">
                      Atualizado em {format(w.updatedAt, "dd/MM/yyyy")}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
