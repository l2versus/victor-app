"use client"

import { useState, useCallback } from "react"
import {
  Utensils, Plus, Droplets, Sparkles, ChevronRight, X, Check,
  Coffee, Sun, Moon, Apple, Zap, Dumbbell, Trash2, TrendingUp,
} from "lucide-react"
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/lib/utils"
import type { Meal } from "./page"

// ─── Types ───────────────────────────────────────────────────────────────────

type Food = Meal["foods"][number]

type DayHistory = {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type NutritionLog = {
  id: string
  meals: Meal[]
  totalCalories: number
  protein: number
  carbs: number
  fat: number
  waterMl: number
  aiSuggestion: string | null
}

type Targets = { calories: number; protein: number; carbs: number; fat: number }

// ─── Constants ───────────────────────────────────────────────────────────────

const MEAL_TYPES: { type: Meal["type"]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "breakfast", label: "Café da manhã", icon: Coffee },
  { type: "lunch", label: "Almoço", icon: Sun },
  { type: "dinner", label: "Jantar", icon: Moon },
  { type: "snack", label: "Lanche", icon: Apple },
  { type: "pre_workout", label: "Pré-treino", icon: Zap },
  { type: "post_workout", label: "Pós-treino", icon: Dumbbell },
]

const QUICK_FOODS: Food[] = [
  // ═══ PROTEÍNAS ═══
  { name: "Frango grelhado", amount: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Ovo cozido", amount: "1 un (50g)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: "Ovo mexido (2un)", amount: "100g", calories: 154, protein: 11, carbs: 1.6, fat: 11.2 },
  { name: "Whey protein", amount: "1 dose (30g)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: "Peito de peru", amount: "4 fatias (40g)", calories: 42, protein: 8.4, carbs: 0.6, fat: 0.6 },
  { name: "Atum em lata", amount: "1 lata (120g)", calories: 144, protein: 30, carbs: 0, fat: 1.8 },
  { name: "Carne moída", amount: "100g", calories: 212, protein: 26, carbs: 0, fat: 11.5 },
  { name: "Tilápia grelhada", amount: "100g", calories: 128, protein: 26, carbs: 0, fat: 2.7 },

  // ═══ CARBOIDRATOS ═══
  { name: "Arroz branco", amount: "100g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Arroz integral", amount: "100g", calories: 124, protein: 2.6, carbs: 25.8, fat: 1 },
  { name: "Feijão cozido", amount: "100g", calories: 77, protein: 4.5, carbs: 14, fat: 0.5 },
  { name: "Batata-doce cozida", amount: "100g", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Macarrão cozido", amount: "100g", calories: 126, protein: 4.5, carbs: 25, fat: 0.6 },
  { name: "Mandioca cozida", amount: "100g", calories: 125, protein: 0.6, carbs: 30, fat: 0.3 },
  { name: "Cuscuz", amount: "100g", calories: 112, protein: 2.6, carbs: 23, fat: 0.6 },

  // ═══ CAFÉ DA MANHÃ ═══
  { name: "Pão integral", amount: "2 fatias (50g)", calories: 127, protein: 4.2, carbs: 21, fat: 1.5 },
  { name: "Pão francês", amount: "1 un (50g)", calories: 150, protein: 4.5, carbs: 28.5, fat: 1.5 },
  { name: "Tapioca", amount: "1 un (40g goma)", calories: 136, protein: 0.1, carbs: 34, fat: 0 },
  { name: "Aveia", amount: "40g", calories: 152, protein: 5.4, carbs: 26, fat: 2.8 },
  { name: "Granola", amount: "40g", calories: 176, protein: 3.2, carbs: 26, fat: 6.8 },
  { name: "Banana", amount: "1 un (100g)", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Mamão", amount: "100g", calories: 40, protein: 0.5, carbs: 10.4, fat: 0.1 },
  { name: "Maçã", amount: "1 un (130g)", calories: 68, protein: 0.3, carbs: 18, fat: 0.2 },
  { name: "Leite integral", amount: "200ml", calories: 124, protein: 6.6, carbs: 10, fat: 6.6 },
  { name: "Leite desnatado", amount: "200ml", calories: 70, protein: 6.6, carbs: 10, fat: 0.4 },
  { name: "Iogurte natural", amount: "170g", calories: 100, protein: 5.8, carbs: 7.6, fat: 5 },
  { name: "Iogurte grego", amount: "100g", calories: 97, protein: 10, carbs: 4, fat: 5 },
  { name: "Queijo minas", amount: "30g", calories: 64, protein: 5.7, carbs: 0.4, fat: 4.3 },
  { name: "Requeijão", amount: "1 col sopa (20g)", calories: 54, protein: 1.2, carbs: 0.4, fat: 5.2 },
  { name: "Manteiga", amount: "10g", calories: 72, protein: 0.1, carbs: 0, fat: 8.1 },
  { name: "Café com leite", amount: "200ml", calories: 67, protein: 3.3, carbs: 5.3, fat: 3.5 },
  { name: "Café preto", amount: "100ml", calories: 2, protein: 0.1, carbs: 0, fat: 0 },
  { name: "Suco de laranja", amount: "200ml", calories: 94, protein: 1.4, carbs: 22, fat: 0.2 },
  { name: "Açaí", amount: "100g", calories: 58, protein: 0.8, carbs: 6.2, fat: 3.9 },
  { name: "Mel", amount: "1 col sopa (21g)", calories: 64, protein: 0.1, carbs: 17, fat: 0 },
  { name: "Pasta de amendoim", amount: "1 col sopa (16g)", calories: 94, protein: 4, carbs: 3, fat: 8 },
  { name: "Cream cheese", amount: "20g", calories: 57, protein: 1.3, carbs: 0.6, fat: 5.6 },

  // ═══ GORDURAS BOAS ═══
  { name: "Azeite", amount: "1 col sopa (14g)", calories: 124, protein: 0, carbs: 0, fat: 14 },
  { name: "Castanha-do-pará", amount: "3 un (12g)", calories: 79, protein: 1.7, carbs: 1.5, fat: 7.7 },
  { name: "Amendoim", amount: "30g", calories: 170, protein: 7.8, carbs: 4.8, fat: 14.1 },
  { name: "Abacate", amount: "100g", calories: 96, protein: 1.2, carbs: 6, fat: 8.4 },

  // ═══ SUPLEMENTOS ═══
  { name: "Creatina", amount: "5g", calories: 0, protein: 0, carbs: 0, fat: 0 },
  { name: "Dextrose", amount: "30g", calories: 120, protein: 0, carbs: 30, fat: 0 },
  { name: "Maltodextrina", amount: "30g", calories: 114, protein: 0, carbs: 28.5, fat: 0 },
  { name: "BCAA", amount: "5g", calories: 20, protein: 5, carbs: 0, fat: 0 },
  { name: "Albumina", amount: "30g", calories: 105, protein: 24, carbs: 1.5, fat: 0.3 },
]

const WATER_GOAL_ML = 3000
const WATER_GLASS_ML = 250

// ─── Macro Ring SVG ─────────────────────────────────────────────────────────

function MacroRing({
  value, target, color, label, unit,
}: {
  value: number; target: number; color: string; label: string; unit: string
}) {
  const pct = Math.min(value / Math.max(target, 1), 1)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-white leading-none">{Math.round(value)}</span>
          <span className="text-[8px] text-neutral-500 leading-none">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] text-neutral-500 uppercase tracking-wider">{label}</span>
      <span className="text-[8px] text-neutral-700">meta {target}{unit}</span>
    </div>
  )
}

// ─── Add Food Modal ──────────────────────────────────────────────────────────

function AddFoodModal({
  mealType,
  onAdd,
  onClose,
}: {
  mealType: Meal["type"]
  onAdd: (food: Food) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<"quick" | "manual">("quick")
  const [manual, setManual] = useState<Partial<Food>>({ name: "", amount: "", calories: 0, protein: 0, carbs: 0, fat: 0 })

  const mealLabel = MEAL_TYPES.find((m) => m.type === mealType)?.label ?? mealType

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-h-[80vh] bg-[#0f0f0f] border-t border-white/5 rounded-t-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Adicionar alimento</p>
            <p className="text-sm font-semibold text-white">{mealLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-2 mb-3">
          {(["quick", "manual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t ? "bg-emerald-600 text-white" : "bg-white/5 text-neutral-500"
              )}
            >
              {t === "quick" ? "Alimentos comuns" : "Manual"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {tab === "quick" ? (
            <div className="space-y-2">
              {QUICK_FOODS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => { onAdd(f); onClose() }}
                  className="w-full flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl active:scale-[0.98] transition-transform text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{f.name}</p>
                    <p className="text-[10px] text-neutral-500">{f.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">{f.calories} kcal</p>
                    <p className="text-[10px] text-neutral-600">
                      P{f.protein}g C{f.carbs}g G{f.fat}g
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/50"
                placeholder="Nome do alimento"
                value={manual.name}
                onChange={(e) => setManual((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500/50"
                placeholder="Quantidade (ex: 100g, 1 unidade)"
                value={manual.amount}
                onChange={(e) => setManual((p) => ({ ...p, amount: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                {([["calories", "Calorias (kcal)"], ["protein", "Proteína (g)"], ["carbs", "Carboidrato (g)"], ["fat", "Gordura (g)"]] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] text-neutral-600 mb-1 block">{label}</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                      value={manual[key] ?? 0}
                      onChange={(e) => setManual((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!manual.name) return
                  onAdd({
                    name: manual.name,
                    amount: manual.amount ?? "",
                    calories: manual.calories ?? 0,
                    protein: manual.protein ?? 0,
                    carbs: manual.carbs ?? 0,
                    fat: manual.fat ?? 0,
                  })
                  onClose()
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm active:scale-[0.97] transition-all"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NutritionClientProps {
  initialLog: NutritionLog | null
  history: DayHistory[]
  targets: Targets
  goalLabel: string
  planName: string
}

export function NutritionClient({ initialLog, history, targets, goalLabel }: NutritionClientProps) {
  const [meals, setMeals] = useState<Meal[]>(initialLog?.meals ?? [])
  const [waterMl, setWaterMl] = useState(initialLog?.waterMl ?? 0)
  const [aiSuggestion, setAiSuggestion] = useState(initialLog?.aiSuggestion ?? "")
  const [loadingAi, setLoadingAi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingTo, setAddingTo] = useState<Meal["type"] | null>(null)

  // Compute totals
  const totals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.calories += f.calories
        acc.protein += f.protein
        acc.carbs += f.carbs
        acc.fat += f.fat
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const waterGlasses = Math.round(waterMl / WATER_GLASS_ML)
  const targetGlasses = Math.round(WATER_GOAL_ML / WATER_GLASS_ML)

  const getMealsOfType = (type: Meal["type"]) => meals.filter((m) => m.type === type)

  const addFood = useCallback((type: Meal["type"], food: Food) => {
    setMeals((prev) => {
      const existing = prev.find((m) => m.type === type)
      if (existing) {
        return prev.map((m) =>
          m.type === type ? { ...m, foods: [...m.foods, food] } : m
        )
      }
      const label = MEAL_TYPES.find((mt) => mt.type === type)?.label ?? type
      return [...prev, { id: crypto.randomUUID(), type, name: label, foods: [food] }]
    })
  }, [])

  const removeFood = useCallback((mealType: Meal["type"], foodIndex: number) => {
    setMeals((prev) =>
      prev
        .map((m) =>
          m.type === mealType
            ? { ...m, foods: m.foods.filter((_, i) => i !== foodIndex) }
            : m
        )
        .filter((m) => m.foods.length > 0)
    )
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await fetch("/api/student/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, waterMl }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [meals, waterMl])

  const getAiSuggestion = useCallback(async () => {
    setLoadingAi(true)
    try {
      const res = await fetch("/api/student/nutrition/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, ...totals, waterMl }),
      })
      const data = await res.json()
      if (data.suggestion) setAiSuggestion(data.suggestion)
    } finally {
      setLoadingAi(false)
    }
  }, [meals, totals, waterMl])

  // Weekly chart data (oldest → newest, fill missing days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split("T")[0]
    const found = history.find((h) => h.date === key)
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
      calories: found?.calories ?? 0,
      isToday: i === 6,
    }
  })

  return (
    <>
      {addingTo && (
        <AddFoodModal
          mealType={addingTo}
          onAdd={(food) => addFood(addingTo, food)}
          onClose={() => setAddingTo(null)}
        />
      )}

      <div className="py-4 space-y-4">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              Nutrição
            </h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              {" · "}
              <span className="text-emerald-500/80">{goalLabel}</span>
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving || saved}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
              saved
                ? "bg-emerald-600/20 text-emerald-400"
                : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
            )}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : saving ? (
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {/* ── Macro Rings ─────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          {/* Calories bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400 font-medium">Calorias</span>
              <span className="text-xs font-bold text-white">
                <span className="text-emerald-400">{Math.round(totals.calories)}</span>
                <span className="text-neutral-600"> / {targets.calories} kcal</span>
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  totals.calories > targets.calories ? "bg-red-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Macro rings */}
          <div className="flex justify-around">
            <MacroRing value={totals.protein} target={targets.protein} color="#10b981" label="Proteína" unit="g" />
            <MacroRing value={totals.carbs} target={targets.carbs} color="#f59e0b" label="Carb" unit="g" />
            <MacroRing value={totals.fat} target={targets.fat} color="#f97316" label="Gordura" unit="g" />
          </div>
        </div>

        {/* ── Water Tracker ────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">Água</span>
            </div>
            <span className="text-xs text-neutral-500">{waterMl}ml / {WATER_GOAL_ML}ml</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: targetGlasses }, (_, i) => (
              <button
                key={i}
                onClick={() => setWaterMl(i < waterGlasses ? i * WATER_GLASS_ML : (i + 1) * WATER_GLASS_ML)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90",
                  i < waterGlasses
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "bg-white/[0.03] border border-white/5"
                )}
              >
                <Droplets className={cn("w-4 h-4", i < waterGlasses ? "text-blue-400" : "text-neutral-700")} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Meal Sections ────────────────────────────────────── */}
        {MEAL_TYPES.map(({ type, label, icon: Icon }) => {
          const mealFoods = getMealsOfType(type)
          const allFoods = mealFoods.flatMap((m) => m.foods)
          const mealCals = allFoods.reduce((s, f) => s + f.calories, 0)

          return (
            <div key={type} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              {/* Meal header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    {allFoods.length > 0 && (
                      <p className="text-[10px] text-neutral-500">{Math.round(mealCals)} kcal</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAddingTo(type)}
                  className="w-7 h-7 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

              {/* Food items */}
              {allFoods.length > 0 && (
                <div className="border-t border-white/[0.03]">
                  {allFoods.map((food, fi) => (
                    <div key={fi} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.02] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{food.name}</p>
                        <p className="text-[10px] text-neutral-600">{food.amount}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-400">{Math.round(food.calories)} kcal</p>
                        <p className="text-[9px] text-neutral-700">
                          P{food.protein}g C{food.carbs}g G{food.fat}g
                        </p>
                      </div>
                      <button
                        onClick={() => removeFood(type, fi)}
                        className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Trash2 className="w-3 h-3 text-neutral-700 hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {allFoods.length === 0 && (
                <button
                  onClick={() => setAddingTo(type)}
                  className="w-full px-4 pb-3 flex items-center gap-1.5 text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar alimento
                </button>
              )}
            </div>
          )
        })}

        {/* ── AI Suggestion ────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 border border-emerald-600/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-emerald-300">Sugestão do Coach IA</p>
            </div>
            <button
              onClick={getAiSuggestion}
              disabled={loadingAi || meals.length === 0}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95",
                loadingAi
                  ? "bg-emerald-600/20 text-emerald-500"
                  : meals.length === 0
                    ? "bg-white/5 text-neutral-600"
                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              )}
            >
              {loadingAi ? (
                <span className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {aiSuggestion ? "Atualizar" : "Analisar"}
            </button>
          </div>

          {aiSuggestion ? (
            <p className="text-sm text-neutral-200 leading-relaxed">{aiSuggestion}</p>
          ) : (
            <p className="text-xs text-neutral-600 leading-relaxed">
              {meals.length === 0
                ? "Registre pelo menos uma refeição para receber sugestões personalizadas."
                : "Clique em \"Analisar\" para receber sugestões baseadas nas suas refeições e treinos recentes."}
            </p>
          )}
        </div>

        {/* ── Weekly Chart ─────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Últimos 7 dias
              <span className="ml-auto text-neutral-600 font-normal">meta {targets.calories} kcal/dia</span>
            </p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "#525252" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isToday
                          ? "#10b981"
                          : entry.calories >= targets.calories
                            ? "#10b981aa"
                            : "#262626"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-neutral-600">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2 rounded-sm bg-emerald-500" />Meta atingida</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2 rounded-sm bg-neutral-700" />Abaixo da meta</div>
            </div>
          </div>
        )}

        {/* Bottom spacer for nav */}
        <div className="h-4" />
      </div>
    </>
  )
}
