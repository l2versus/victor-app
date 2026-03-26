"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Flame,
  GripVertical,
  Clock,
  ChevronDown,
  Loader2,
} from "lucide-react"

const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Café da Manhã" },
  { value: "MORNING_SNACK", label: "Lanche da Manhã" },
  { value: "LUNCH", label: "Almoço" },
  { value: "AFTERNOON_SNACK", label: "Lanche da Tarde" },
  { value: "DINNER", label: "Jantar" },
  { value: "SUPPER", label: "Ceia" },
  { value: "PRE_WORKOUT", label: "Pré-Treino" },
  { value: "POST_WORKOUT", label: "Pós-Treino" },
]

const UNITS = ["g", "ml", "unidade", "colher (sopa)", "colher (chá)", "xícara", "fatia", "porção"]

interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Meal {
  id: string
  type: string
  time: string
  foods: FoodItem[]
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function createEmptyFood(): FoodItem {
  return { id: generateId(), name: "", quantity: 100, unit: "g", calories: 0, protein: 0, carbs: 0, fat: 0 }
}

function createEmptyMeal(): Meal {
  return { id: generateId(), type: "BREAKFAST", time: "08:00", foods: [createEmptyFood()] }
}

export default function EditMealPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Plan fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [targetCalories, setTargetCalories] = useState("")
  const [targetProtein, setTargetProtein] = useState("")
  const [targetCarbs, setTargetCarbs] = useState("")
  const [targetFat, setTargetFat] = useState("")

  // Meals
  const [meals, setMeals] = useState<Meal[]>([])

  // Load existing plan
  useEffect(() => {
    fetch(`/api/nutri/meal-plans/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.plan) {
          const p = d.plan
          setName(p.name)
          setDescription(p.description || "")
          setTargetCalories(p.targetCalories?.toString() || "")
          setTargetProtein(p.targetProtein?.toString() || "")
          setTargetCarbs(p.targetCarbs?.toString() || "")
          setTargetFat(p.targetFat?.toString() || "")

          // Parse meals JSON — add IDs for React keys
          const rawMeals = (p.meals as Array<{ type: string; time: string; foods: Array<Omit<FoodItem, "id">> }>) ?? []
          setMeals(
            rawMeals.length > 0
              ? rawMeals.map((m) => ({
                  id: generateId(),
                  type: m.type || "BREAKFAST",
                  time: m.time || "08:00",
                  foods:
                    m.foods?.map((f) => ({ ...f, id: generateId() })) ?? [createEmptyFood()],
                }))
              : [createEmptyMeal()]
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // ── Meal handlers ──
  const addMeal = useCallback(() => {
    setMeals((prev) => [...prev, createEmptyMeal()])
  }, [])

  const removeMeal = useCallback((mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId))
  }, [])

  const updateMeal = useCallback((mealId: string, field: string, value: string) => {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, [field]: value } : m)))
  }, [])

  // ── Food handlers ──
  const addFood = useCallback((mealId: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, foods: [...m.foods, createEmptyFood()] } : m))
    )
  }, [])

  const removeFood = useCallback((mealId: string, foodId: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m
      )
    )
  }, [])

  const updateFood = useCallback((mealId: string, foodId: string, field: string, value: string | number) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, foods: m.foods.map((f) => (f.id === foodId ? { ...f, [field]: value } : f)) }
          : m
      )
    )
  }, [])

  // ── Totals ──
  const totalMacros = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.calories += f.calories || 0
        acc.protein += f.protein || 0
        acc.carbs += f.carbs || 0
        acc.fat += f.fat || 0
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // ── Save ──
  async function handleSave() {
    if (!name.trim()) return alert("Nome do plano é obrigatório")

    setSaving(true)
    try {
      const res = await fetch(`/api/nutri/meal-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFat,
          meals: meals.map((m) => ({
            type: m.type,
            time: m.time,
            foods: m.foods.map((f) => ({
              name: f.name,
              quantity: f.quantity,
              unit: f.unit,
              calories: f.calories,
              protein: f.protein,
              carbs: f.carbs,
              fat: f.fat,
            })),
          })),
        }),
      })

      if (res.ok) {
        router.push("/nutri/meal-plans")
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao salvar")
      }
    } catch {
      alert("Erro de conexão")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-28">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push("/nutri/meal-plans")}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/[0.1] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Editar{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300">
                Plano Alimentar
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Atualize refeições e macros
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ PLAN INFO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
            <ClipboardList className="w-3 h-3 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">Informações do Plano</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="sm:col-span-2">
            <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Nome do Plano *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dieta Hipercalórica 3000kcal"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações sobre o plano..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all resize-none"
            />
          </div>
        </div>

        {/* Target macros */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
            <Flame className="w-2.5 h-2.5 text-amber-500" />
          </div>
          <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Metas de Macros</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1 block">Calorias (kcal)</label>
            <input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="2500"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-emerald-500/70 uppercase tracking-wider mb-1 block">Proteína (g)</label>
            <input
              type="number"
              value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)}
              placeholder="150"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-sky-500/70 uppercase tracking-wider mb-1 block">Carboidrato (g)</label>
            <input
              type="number"
              value={targetCarbs}
              onChange={(e) => setTargetCarbs(e.target.value)}
              placeholder="300"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-amber-500/70 uppercase tracking-wider mb-1 block">Gordura (g)</label>
            <input
              type="number"
              value={targetFat}
              onChange={(e) => setTargetFat(e.target.value)}
              placeholder="80"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>
        </div>
      </motion.div>

      {/* ═══ MEALS ═══ */}
      <AnimatePresence mode="popLayout">
        {meals.map((meal, mealIndex) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7"
          >
            {/* Meal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="text-neutral-700">
                  <GripVertical className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                  Refeição {mealIndex + 1}
                </span>
              </div>
              {meals.length > 1 && (
                <button
                  onClick={() => removeMeal(meal.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Meal type + time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="relative">
                <label className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1 block">Tipo</label>
                <div className="relative">
                  <select
                    value={meal.type}
                    onChange={(e) => updateMeal(meal.id, "type", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all appearance-none cursor-pointer"
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#111] text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1 block">Horário</label>
                <div className="relative">
                  <input
                    type="time"
                    value={meal.time}
                    onChange={(e) => updateMeal(meal.id, "time", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all [color-scheme:dark]"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Foods list */}
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_80px_100px_70px_70px_70px_70px_32px] gap-2 px-1">
                <span className="text-[9px] text-neutral-600 uppercase tracking-wider">Alimento</span>
                <span className="text-[9px] text-neutral-600 uppercase tracking-wider">Qtd</span>
                <span className="text-[9px] text-neutral-600 uppercase tracking-wider">Unidade</span>
                <span className="text-[9px] text-neutral-600 uppercase tracking-wider text-center">Kcal</span>
                <span className="text-[9px] text-emerald-600/60 uppercase tracking-wider text-center">Prot</span>
                <span className="text-[9px] text-sky-600/60 uppercase tracking-wider text-center">Carb</span>
                <span className="text-[9px] text-amber-600/60 uppercase tracking-wider text-center">Gord</span>
                <span />
              </div>

              {meal.foods.map((food) => (
                <div key={food.id} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 sm:p-0 sm:border-0 sm:bg-transparent">
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[1fr_80px_100px_70px_70px_70px_70px_32px] gap-2 items-center">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => updateFood(meal.id, food.id, "name", e.target.value)}
                      placeholder="Nome do alimento"
                      className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/30 transition-all"
                    />
                    <input
                      type="number"
                      value={food.quantity || ""}
                      onChange={(e) => updateFood(meal.id, food.id, "quantity", parseFloat(e.target.value) || 0)}
                      className="px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                    />
                    <div className="relative">
                      <select
                        value={food.unit}
                        onChange={(e) => updateFood(meal.id, food.id, "unit", e.target.value)}
                        className="w-full px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-[11px] focus:outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u} className="bg-[#111] text-white">{u}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600 pointer-events-none" />
                    </div>
                    <input
                      type="number"
                      value={food.calories || ""}
                      onChange={(e) => updateFood(meal.id, food.id, "calories", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                    />
                    <input
                      type="number"
                      value={food.protein || ""}
                      onChange={(e) => updateFood(meal.id, food.id, "protein", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="px-2 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-300 text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                    />
                    <input
                      type="number"
                      value={food.carbs || ""}
                      onChange={(e) => updateFood(meal.id, food.id, "carbs", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="px-2 py-2 rounded-lg bg-sky-500/[0.04] border border-sky-500/10 text-sky-300 text-sm focus:outline-none focus:border-sky-500/30 transition-all text-center"
                    />
                    <input
                      type="number"
                      value={food.fat || ""}
                      onChange={(e) => updateFood(meal.id, food.id, "fat", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="px-2 py-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/10 text-amber-300 text-sm focus:outline-none focus:border-amber-500/30 transition-all text-center"
                    />
                    <button
                      onClick={() => removeFood(meal.id, food.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-2">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => updateFood(meal.id, food.id, "name", e.target.value)}
                      placeholder="Nome do alimento"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-emerald-500/30 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={food.quantity || ""}
                        onChange={(e) => updateFood(meal.id, food.id, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="Qtd"
                        className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-emerald-500/30 transition-all"
                      />
                      <div className="relative">
                        <select
                          value={food.unit}
                          onChange={(e) => updateFood(meal.id, food.id, "unit", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u} className="bg-[#111] text-white">{u}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[8px] text-neutral-600 uppercase block mb-0.5 text-center">Kcal</label>
                        <input
                          type="number"
                          value={food.calories || ""}
                          onChange={(e) => updateFood(meal.id, food.id, "calories", parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-emerald-500/60 uppercase block mb-0.5 text-center">Prot</label>
                        <input
                          type="number"
                          value={food.protein || ""}
                          onChange={(e) => updateFood(meal.id, food.id, "protein", parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-sky-500/60 uppercase block mb-0.5 text-center">Carb</label>
                        <input
                          type="number"
                          value={food.carbs || ""}
                          onChange={(e) => updateFood(meal.id, food.id, "carbs", parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1.5 rounded-lg bg-sky-500/[0.04] border border-sky-500/10 text-sky-300 text-xs focus:outline-none focus:border-sky-500/30 transition-all text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-amber-500/60 uppercase block mb-0.5 text-center">Gord</label>
                        <input
                          type="number"
                          value={food.fat || ""}
                          onChange={(e) => updateFood(meal.id, food.id, "fat", parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10 text-amber-300 text-xs focus:outline-none focus:border-amber-500/30 transition-all text-center"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeFood(meal.id, food.id)}
                        className="text-[10px] text-neutral-600 hover:text-red-400 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add food button */}
              <button
                onClick={() => addFood(meal.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 border border-dashed border-emerald-500/15 hover:border-emerald-500/30 transition-all w-full justify-center"
              >
                <Plus className="w-3 h-3" />
                Adicionar Alimento
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add meal button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={addMeal}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] border border-dashed border-emerald-500/20 hover:border-emerald-500/40 transition-all w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Adicionar Refeição
      </motion.button>

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-40">
        <div className="bg-[#060606]/90 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
            {/* Daily totals */}
            <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <Flame className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs text-neutral-400">Total:</span>
              </div>
              <MacroChip
                label="Kcal"
                value={totalMacros.calories}
                target={targetCalories ? parseInt(targetCalories) : null}
                color="white"
              />
              <MacroChip
                label="Prot"
                value={Math.round(totalMacros.protein * 10) / 10}
                target={targetProtein ? parseFloat(targetProtein) : null}
                color="emerald"
              />
              <MacroChip
                label="Carb"
                value={Math.round(totalMacros.carbs * 10) / 10}
                target={targetCarbs ? parseFloat(targetCarbs) : null}
                color="sky"
              />
              <MacroChip
                label="Gord"
                value={Math.round(totalMacros.fat * 10) / 10}
                target={targetFat ? parseFloat(targetFat) : null}
                color="amber"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 disabled:text-emerald-300/50 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ MACRO CHIP ═══ */
function MacroChip({
  label,
  value,
  target,
  color,
}: {
  label: string
  value: number
  target: number | null
  color: string
}) {
  const colorMap: Record<string, string> = {
    white: "text-white/90",
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    amber: "text-amber-400",
  }

  const pct = target && target > 0 ? Math.round((value / target) * 100) : null

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={`text-xs font-semibold ${colorMap[color] ?? "text-white"}`}>{value}</span>
      {pct !== null && (
        <span className={`text-[9px] ${pct > 100 ? "text-red-400" : pct >= 90 ? "text-emerald-500" : "text-neutral-600"}`}>
          ({pct}%)
        </span>
      )}
      <span className="text-[9px] text-neutral-600">{label}</span>
    </div>
  )
}
