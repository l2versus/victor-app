"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Apple,
  Search,
  Plus,
  X,
  Flame,
  Database,
  Sparkles,
  BarChart3,
  Loader2,
  UtensilsCrossed,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  ChevronDown,
  PackageOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface Food {
  id: string
  name: string
  brand: string | null
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  isCustom: boolean
  createdById: string | null
}

interface FoodFormData {
  name: string
  brand: string
  servingSize: string
  servingUnit: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string
}

const SERVING_UNITS = [
  { value: "g", label: "Gramas (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unidade", label: "Unidade" },
  { value: "colher", label: "Colher" },
  { value: "xícara", label: "Xícara" },
  { value: "fatia", label: "Fatia" },
  { value: "porção", label: "Porção" },
  { value: "copo", label: "Copo" },
]

const UNIT_SHORT: Record<string, string> = {
  g: "g",
  ml: "ml",
  unidade: "un",
  colher: "col",
  "xícara": "xíc",
  fatia: "fatia",
  "porção": "porção",
  copo: "copo",
}

const EMPTY_FORM: FoodFormData = {
  name: "",
  brand: "",
  servingSize: "100",
  servingUnit: "g",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 350 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

/* ═══════════════════════════════════════════════════════════════════
   MACRO BAR COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat
  if (total === 0) return null
  const pPct = (protein / total) * 100
  const cPct = (carbs / total) * 100
  const fPct = (fat / total) * 100
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.06] w-full">
      <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pPct}%` }} title={`Proteína ${protein}g`} />
      <div className="bg-sky-500 transition-all duration-500" style={{ width: `${cPct}%` }} title={`Carbs ${carbs}g`} />
      <div className="bg-amber-500 transition-all duration-500" style={{ width: `${fPct}%` }} title={`Gordura ${fat}g`} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: typeof Database
  label: string
  value: string | number
  accent: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", accent)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function NutriFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FoodFormData>(EMPTY_FORM)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* ─── Debounced search ─── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  /* ─── Fetch foods ─── */
  const fetchFoods = useCallback(async (searchTerm: string, append = false) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!append) setLoading(true)
    else setLoadingMore(true)

    try {
      const offset = append ? foods.length : 0
      const res = await fetch(
        `/api/nutri/foods?search=${encodeURIComponent(searchTerm)}&limit=50&offset=${offset}`,
        { signal: controller.signal }
      )
      if (!res.ok) throw new Error("Erro ao carregar alimentos")
      const data = await res.json()
      const newFoods: Food[] = data.foods ?? []

      if (append) {
        setFoods((prev) => [...prev, ...newFoods])
      } else {
        setFoods(newFoods)
      }
      setHasMore(newFoods.length >= 50)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [foods.length])

  useEffect(() => {
    fetchFoods(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  /* ─── Intersection observer for infinite scroll ─── */
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchFoods(debouncedSearch, true)
        }
      },
      { threshold: 0.1 }
    )
    const el = loadMoreRef.current
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loading, loadingMore, debouncedSearch, fetchFoods])

  /* ─── Stats ─── */
  const totalFoods = foods.length
  const customFoods = foods.filter((f) => f.isCustom).length
  const avgCalories = totalFoods > 0
    ? Math.round(foods.reduce((sum, f) => sum + f.calories, 0) / totalFoods)
    : 0

  /* ─── Form handlers ─── */
  function updateForm(field: keyof FoodFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setShowModal(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error("Nome obrigatório", "Informe o nome do alimento")
      return
    }
    if (!form.calories || !form.protein || !form.carbs || !form.fat) {
      toast.error("Macros obrigatórios", "Preencha calorias, proteína, carboidratos e gordura")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/nutri/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          servingSize: parseFloat(form.servingSize) || 100,
          servingUnit: form.servingUnit,
          calories: parseInt(form.calories),
          protein: parseFloat(form.protein),
          carbs: parseFloat(form.carbs),
          fat: parseFloat(form.fat),
          fiber: form.fiber ? parseFloat(form.fiber) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao salvar")
      }

      const data = await res.json()
      setFoods((prev) => [data.food, ...prev])
      toast.success("Alimento criado", `${form.name} foi adicionado com sucesso`)
      resetForm()
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : "Tente novamente")
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render ─── */
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
              <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Base de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300">
                  Alimentos
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                Cadastre e pesquise alimentos para seus planos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Alimento</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={Database}
          label="Total alimentos"
          value={totalFoods}
          accent="bg-gradient-to-br from-emerald-600 to-emerald-800"
          delay={0.05}
        />
        <StatCard
          icon={Sparkles}
          label="Customizados"
          value={customFoods}
          accent="bg-gradient-to-br from-violet-600 to-violet-800"
          delay={0.1}
        />
        <StatCard
          icon={BarChart3}
          label="Média calorias"
          value={avgCalories > 0 ? `${avgCalories} kcal` : "--"}
          accent="bg-gradient-to-br from-amber-600 to-amber-800"
          delay={0.15}
        />
      </div>

      {/* ═══ SEARCH ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Buscar alimento por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ FOOD GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 w-32 bg-white/[0.05] rounded" />
                <div className="h-5 w-12 bg-white/[0.03] rounded-full" />
              </div>
              <div className="h-3 w-24 bg-white/[0.03] rounded mb-4" />
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full mb-4" />
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-white/[0.03] rounded" />
                <div className="h-6 w-20 bg-white/[0.05] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : foods.length === 0 ? (
        /* ─── Empty state ─── */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-emerald-900/5 border border-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <PackageOpen className="w-9 h-9 text-emerald-500/40" />
          </div>
          <p className="text-neutral-400 text-sm mb-1">
            {debouncedSearch ? "Nenhum alimento encontrado" : "Nenhum alimento cadastrado"}
          </p>
          <p className="text-neutral-600 text-xs mb-6">
            {debouncedSearch
              ? `Sem resultados para "${debouncedSearch}"`
              : "Adicione seu primeiro alimento para começar"}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Adicionar Alimento
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* ─── Desktop: Card grid / Mobile: List ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foods.map((food, i) => (
              <motion.div
                key={food.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
              >
                {/* Header: name + badges */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white/90 truncate flex-1">
                    {food.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {food.isCustom && (
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                        Custom
                      </span>
                    )}
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-400 border border-white/[0.08] uppercase tracking-wider">
                      {UNIT_SHORT[food.servingUnit] || food.servingUnit}
                    </span>
                  </div>
                </div>

                {/* Brand + serving */}
                <p className="text-[11px] text-neutral-500 mb-3 truncate">
                  {food.brand && <span className="text-neutral-400">{food.brand} · </span>}
                  {food.servingSize}{food.servingUnit}
                </p>

                {/* Macro bar */}
                <div className="mb-3">
                  <MacroBar protein={food.protein} carbs={food.carbs} fat={food.fat} />
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[9px] text-emerald-400/70 flex items-center gap-0.5">
                      <Beef className="w-2.5 h-2.5" /> P {food.protein}g
                    </span>
                    <span className="text-[9px] text-sky-400/70 flex items-center gap-0.5">
                      <Wheat className="w-2.5 h-2.5" /> C {food.carbs}g
                    </span>
                    <span className="text-[9px] text-amber-400/70 flex items-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" /> G {food.fat}g
                    </span>
                    {food.fiber != null && (
                      <span className="text-[9px] text-lime-400/70 flex items-center gap-0.5">
                        <Leaf className="w-2.5 h-2.5" /> F {food.fiber}g
                      </span>
                    )}
                  </div>
                </div>

                {/* Calories */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3 h-3 text-neutral-600" />
                    <span className="text-[11px] text-neutral-500">por porção</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    <span className="text-[12px] font-semibold text-emerald-400 tabular-nums">
                      {food.calories} kcal
                    </span>
                  </div>
                </div>

                {/* Hover glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </motion.div>
            ))}
          </div>

          {/* ─── Infinite scroll trigger ─── */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando mais...
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ CREATION MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}
          >
            <motion.div
              key="modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl max-h-[85dvh] overflow-y-auto overscroll-contain"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Novo Alimento</h2>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">
                      Cadastro personalizado
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 block">
                    Nome do alimento *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Ex: Peito de frango grelhado"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    autoFocus
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 block">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => updateForm("brand", e.target.value)}
                    placeholder="Ex: Sadia, Seara (opcional)"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Serving size + unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 block">
                      Porção
                    </label>
                    <input
                      type="number"
                      value={form.servingSize}
                      onChange={(e) => updateForm("servingSize", e.target.value)}
                      placeholder="100"
                      min="0"
                      step="any"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 block">
                      Unidade
                    </label>
                    <div className="relative">
                      <select
                        value={form.servingUnit}
                        onChange={(e) => updateForm("servingUnit", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                      >
                        {SERVING_UNITS.map((u) => (
                          <option key={u.value} value={u.value} className="bg-neutral-900 text-white">
                            {u.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Informação nutricional</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Calories */}
                <div>
                  <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    Calorias (kcal) *
                  </label>
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(e) => updateForm("calories", e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                  />
                </div>

                {/* Macros grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Proteína (g) *
                    </label>
                    <input
                      type="number"
                      value={form.protein}
                      onChange={(e) => updateForm("protein", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Carboidratos (g) *
                    </label>
                    <input
                      type="number"
                      value={form.carbs}
                      onChange={(e) => updateForm("carbs", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Gordura (g) *
                    </label>
                    <input
                      type="number"
                      value={form.fat}
                      onChange={(e) => updateForm("fat", e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                    />
                  </div>
                </div>

                {/* Fiber */}
                <div>
                  <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
                    <Leaf className="w-3 h-3 text-lime-400" />
                    Fibra (g)
                  </label>
                  <input
                    type="number"
                    value={form.fiber}
                    onChange={(e) => updateForm("fiber", e.target.value)}
                    placeholder="Opcional"
                    min="0"
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all tabular-nums"
                  />
                </div>

                {/* Live preview */}
                {(form.protein || form.carbs || form.fat) && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Preview</p>
                    <MacroBar
                      protein={parseFloat(form.protein) || 0}
                      carbs={parseFloat(form.carbs) || 0}
                      fat={parseFloat(form.fat) || 0}
                    />
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-[9px] text-emerald-400/70">P {form.protein || 0}g</span>
                      <span className="text-[9px] text-sky-400/70">C {form.carbs || 0}g</span>
                      <span className="text-[9px] text-amber-400/70">G {form.fat || 0}g</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2 pb-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-neutral-400 text-sm font-medium hover:bg-white/[0.05] hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                      saving
                        ? "bg-emerald-600/50 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Salvar Alimento
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
