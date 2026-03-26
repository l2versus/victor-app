"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ClipboardList, Plus, Flame, Users, Trash2, UtensilsCrossed } from "lucide-react"

interface MealPlanItem {
  id: string
  name: string
  description: string | null
  targetCalories: number | null
  targetProtein: number | null
  targetCarbs: number | null
  targetFat: number | null
  mealsCount: number
  studentsUsing: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function MealPlansPage() {
  const [plans, setPlans] = useState<MealPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/nutri/meal-plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este plano alimentar?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/nutri/meal-plans/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id))
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null)
    }
  }

  function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
    const total = protein + carbs + fat
    if (total === 0) return null
    const pPct = (protein / total) * 100
    const cPct = (carbs / total) * 100
    const fPct = (fat / total) * 100
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.06] w-full">
        <div className="bg-emerald-500 transition-all" style={{ width: `${pPct}%` }} title={`Proteína ${protein}g`} />
        <div className="bg-sky-500 transition-all" style={{ width: `${cPct}%` }} title={`Carbs ${carbs}g`} />
        <div className="bg-amber-500 transition-all" style={{ width: `${fPct}%` }} title={`Gordura ${fat}g`} />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Planos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300">
                  Alimentares
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                Gerencie dietas e refeições dos pacientes
              </p>
            </div>
          </div>
          <Link
            href="/nutri/meal-plans/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Plano</span>
          </Link>
        </div>
      </motion.div>

      {/* ═══ PLANS GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse">
              <div className="h-5 w-32 bg-white/[0.05] rounded mb-3" />
              <div className="h-3 w-48 bg-white/[0.03] rounded mb-4" />
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full mb-4" />
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-white/[0.03] rounded" />
                <div className="h-4 w-16 bg-white/[0.03] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-neutral-600" />
          </div>
          <p className="text-neutral-400 text-sm mb-1">Nenhum plano alimentar criado</p>
          <p className="text-neutral-600 text-xs mb-6">Crie seu primeiro plano para atribuir aos pacientes</p>
          <Link
            href="/nutri/meal-plans/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Criar Plano
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(plan.id)}
                disabled={deleting === plan.id}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <Link href={`/nutri/meal-plans/${plan.id}`} className="block">
                {/* Name & description */}
                <h3 className="text-sm font-semibold text-white/90 mb-1 pr-8 truncate">{plan.name}</h3>
                {plan.description && (
                  <p className="text-[11px] text-neutral-500 mb-3 line-clamp-2">{plan.description}</p>
                )}
                {!plan.description && <div className="mb-3" />}

                {/* Calories badge */}
                {plan.targetCalories && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 mb-3">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-400">{plan.targetCalories} kcal</span>
                  </div>
                )}

                {/* Macro split bar */}
                {(plan.targetProtein || plan.targetCarbs || plan.targetFat) && (
                  <div className="mb-3">
                    <MacroBar
                      protein={plan.targetProtein ?? 0}
                      carbs={plan.targetCarbs ?? 0}
                      fat={plan.targetFat ?? 0}
                    />
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-[9px] text-emerald-400/70">P {plan.targetProtein ?? 0}g</span>
                      <span className="text-[9px] text-sky-400/70">C {plan.targetCarbs ?? 0}g</span>
                      <span className="text-[9px] text-amber-400/70">G {plan.targetFat ?? 0}g</span>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3 h-3 text-neutral-600" />
                    <span className="text-[11px] text-neutral-500">{plan.mealsCount} refeições</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-neutral-600" />
                    <span className="text-[11px] text-neutral-500">{plan.studentsUsing} pacientes</span>
                  </div>
                </div>
              </Link>

              {/* Hover glow */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
