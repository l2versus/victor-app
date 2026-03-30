"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Users,
  Check,
  ChevronDown,
  Sparkles,
  Camera,
  Apple,
  Crown,
  Dumbbell,
  ShoppingBag,
  Loader2,
} from "lucide-react"

// ═══ TYPES ═══

interface B2CPlan {
  id: string
  name: string
  slug: string | null
  price: number
  interval: string
  active: boolean
  isB2C: boolean
  hasAI: boolean
  hasPostureCamera: boolean
  hasVipGroup: boolean
  hasNutrition: boolean
  maxSessionsWeek: number | null
  description: string | null
  subscriberCount: number
}

// ═══ CONSTANTS ═══

const INTERVALS: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
}

const B2C_FEATURES = [
  { key: "hasAI", label: "IA Chat", icon: Sparkles },
  { key: "hasPostureCamera", label: "Camera Postura", icon: Camera },
  { key: "hasNutrition", label: "Nutricao", icon: Apple },
  { key: "hasVipGroup", label: "Comunidade VIP", icon: Crown },
] as const

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

// ═══ MAIN TAB ═══

export default function B2CPlansTab() {
  const [plans, setPlans] = useState<B2CPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<B2CPlan | null>(null)

  const fetchPlans = useCallback(() => {
    fetch("/api/master/b2c-plans")
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleEdit = (plan: B2CPlan) => {
    setEditingPlan(plan)
    setShowModal(true)
  }

  const handleNew = () => {
    setEditingPlan(null)
    setShowModal(true)
  }

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/master/b2c-plans?id=${id}`, { method: "DELETE" })
    fetchPlans()
  }

  const handleSaved = () => {
    setShowModal(false)
    setEditingPlan(null)
    fetchPlans()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-neutral-500">{plans.length} planos B2C cadastrados</p>
            {plans.filter((p) => p.active).length > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {plans.filter((p) => p.active).length} ativos
              </span>
            )}
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Plano B2C
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse"
              >
                <div className="h-5 w-32 bg-white/[0.05] rounded mb-3" />
                <div className="h-8 w-20 bg-white/[0.05] rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/[0.03] rounded" />
                  <div className="h-4 w-3/4 bg-white/[0.03] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !plans.length ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">Nenhum plano B2C cadastrado</p>
            <p className="text-neutral-600 text-xs mt-1">
              Crie planos para vender diretamente ao consumidor final
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`relative rounded-2xl border bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.04] group ${
                  plan.active
                    ? "border-white/[0.06] hover:border-white/[0.1]"
                    : "border-red-500/10 opacity-60"
                }`}
              >
                {/* Status badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {!plan.active && (
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                      Inativo
                    </span>
                  )}
                  {plan.subscriberCount > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Users className="w-2.5 h-2.5" />
                      {plan.subscriberCount}
                    </span>
                  )}
                </div>

                {/* Plan name + price */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white/90">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-violet-400">
                      R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      /{INTERVALS[plan.interval] ?? plan.interval}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Feature toggles */}
                <div className="space-y-1.5 mb-3">
                  {B2C_FEATURES.map((f) => {
                    const enabled = plan[f.key as keyof B2CPlan] as boolean
                    const Icon = f.icon
                    return (
                      <div key={f.key} className="flex items-center gap-2 text-[11px]">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            enabled
                              ? "bg-violet-600/20 text-violet-400"
                              : "bg-white/[0.03] text-neutral-700"
                          }`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                        <span
                          className={
                            enabled ? "text-neutral-300" : "text-neutral-600 line-through"
                          }
                        >
                          {f.label}
                        </span>
                      </div>
                    )
                  })}
                  {/* Max sessions */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <div className="w-4 h-4 rounded flex items-center justify-center bg-white/[0.03] text-neutral-500">
                      <Dumbbell className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-neutral-400">
                      {plan.maxSessionsWeek != null
                        ? `${plan.maxSessionsWeek} sessoes/semana`
                        : "Sessoes ilimitadas"}
                    </span>
                  </div>
                </div>

                {/* Slug */}
                {plan.slug && (
                  <div className="mb-3">
                    <span className="text-[9px] text-neutral-600 font-mono bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.04]">
                      {plan.slug}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                  {plan.active && (
                    <button
                      onClick={() => handleDeactivate(plan.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Desativar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══ B2C PLAN MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <B2CPlanModal
            plan={editingPlan}
            onClose={() => {
              setShowModal(false)
              setEditingPlan(null)
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ═══════════════════════════════════════
// B2C PLAN EDITOR MODAL
// ═══════════════════════════════════════

function B2CPlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: B2CPlan | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!plan
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(plan?.name ?? "")
  const [description, setDescription] = useState(plan?.description ?? "")
  const [price, setPrice] = useState(plan?.price?.toString() ?? "")
  const [interval, setInterval] = useState(plan?.interval ?? "MONTHLY")
  const [hasAI, setHasAI] = useState(plan?.hasAI ?? false)
  const [hasPostureCamera, setHasPostureCamera] = useState(plan?.hasPostureCamera ?? false)
  const [hasNutrition, setHasNutrition] = useState(plan?.hasNutrition ?? false)
  const [hasVipGroup, setHasVipGroup] = useState(plan?.hasVipGroup ?? false)
  const [maxSessionsWeek, setMaxSessionsWeek] = useState(
    plan?.maxSessionsWeek?.toString() ?? ""
  )
  const [active, setActive] = useState(plan?.active ?? true)

  const handleSave = async () => {
    if (!name.trim() || !price) return
    setSaving(true)

    const body = {
      ...(isEdit ? { id: plan.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      interval,
      hasAI,
      hasPostureCamera,
      hasNutrition,
      hasVipGroup,
      maxSessionsWeek: maxSessionsWeek ? parseInt(maxSessionsWeek) : null,
      active,
    }

    try {
      if (isEdit) {
        await fetch("/api/master/b2c-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        await fetch("/api/master/b2c-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      onSaved()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const featureToggles = [
    { key: "hasAI", label: "IA Chat", icon: Sparkles, value: hasAI, setter: setHasAI },
    {
      key: "hasPostureCamera",
      label: "Camera Postura",
      icon: Camera,
      value: hasPostureCamera,
      setter: setHasPostureCamera,
    },
    {
      key: "hasNutrition",
      label: "Nutricao",
      icon: Apple,
      value: hasNutrition,
      setter: setHasNutrition,
    },
    {
      key: "hasVipGroup",
      label: "Comunidade VIP",
      icon: Crown,
      value: hasVipGroup,
      setter: setHasVipGroup,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-neutral-950 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-white/90">
              {isEdit ? "Editar Plano B2C" : "Novo Plano B2C"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Nome do Plano
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Essencial, Pro, Premium..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Descricao
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao do plano para o consumidor..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
            />
          </div>

          {/* Price + Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Preco (R$)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49.90"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
                Intervalo
              </label>
              <div className="relative">
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors appearance-none"
                >
                  {Object.entries(INTERVALS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-neutral-900 text-white">
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Max Sessions */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5 block">
              Max sessoes/semana{" "}
              <span className="text-neutral-600">(vazio = ilimitado)</span>
            </label>
            <input
              type="number"
              value={maxSessionsWeek}
              onChange={(e) => setMaxSessionsWeek(e.target.value)}
              placeholder="Ilimitado"
              min="1"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          {/* Feature Toggles */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-2 block">
              Features do Plano
            </label>
            <div className="space-y-2">
              {featureToggles.map((f) => {
                const Icon = f.icon
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => f.setter(!f.value)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        f.value
                          ? "bg-violet-600 text-white"
                          : "bg-white/[0.04] border border-white/[0.1] text-transparent"
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        f.value ? "text-violet-400" : "text-neutral-600"
                      }`}
                    />
                    <span className="text-xs text-white/80">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active toggle */}
          {isEdit && (
            <div>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    active ? "bg-emerald-600" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      active ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-xs text-white/80">
                  {active ? "Plano ativo" : "Plano inativo"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !price}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Salvando...
              </>
            ) : isEdit ? (
              "Salvar"
            ) : (
              "Criar Plano"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
