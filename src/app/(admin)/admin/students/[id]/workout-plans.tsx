"use client"

import { useState, useEffect } from "react"
import { Calendar, Dumbbell, Plus, X, Loader2 } from "lucide-react"

interface WorkoutPlan {
  id: string
  dayOfWeek: number
  templateId: string
  template: { id: string; name: string; type: string }
}

interface Template {
  id: string
  name: string
  type: string
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const DAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

export function WorkoutPlans({ studentId }: { studentId: string }) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [plansRes, templatesRes] = await Promise.all([
        fetch(`/api/admin/students/${studentId}/plans`),
        fetch("/api/admin/workouts?limit=100"),
      ])
      const plansData = await plansRes.json()
      const templatesData = await templatesRes.json()

      // Handle both possible API response shapes
      setPlans(plansData.plans || [])
      if (Array.isArray(templatesData)) {
        setTemplates(templatesData)
      } else if (templatesData.workouts) {
        setTemplates(templatesData.workouts.map((w: { id: string; name: string; type: string }) => ({ id: w.id, name: w.name, type: w.type })))
      } else {
        setTemplates([])
      }
      setLoading(false)
    }
    load()
  }, [studentId])

  async function handleAssign() {
    if (selectedDay === null || !selectedTemplate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: selectedDay, templateId: selectedTemplate }),
      })
      const data = await res.json()
      if (data.plan) {
        setPlans((prev) => {
          const filtered = prev.filter((p) => p.dayOfWeek !== selectedDay)
          return [...filtered, data.plan].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        })
      }
      setSelectedDay(null)
      setSelectedTemplate("")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(dayOfWeek: number) {
    await fetch(`/api/admin/students/${studentId}/plans?dayOfWeek=${dayOfWeek}`, {
      method: "DELETE",
    })
    setPlans((prev) => prev.filter((p) => p.dayOfWeek !== dayOfWeek))
  }

  const planMap = new Map(plans.map((p) => [p.dayOfWeek, p]))

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-purple-500" />
        Plano Semanal
      </h3>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {DAY_NAMES.map((day, i) => {
            const plan = planMap.get(i)
            const isSelected = selectedDay === i

            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 w-8 font-medium">{day}</span>

                {plan ? (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/15 min-w-0">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-sm text-neutral-300 truncate min-w-0">
                      {plan.template.name.length > 30
                        ? plan.template.name.slice(0, 30) + "…"
                        : plan.template.name}
                    </span>
                    <span className="text-[9px] text-purple-400/70 uppercase shrink-0">{plan.template.type}</span>
                    <button
                      onClick={() => handleRemove(i)}
                      className="text-neutral-600 hover:text-red-400 transition-colors p-0.5 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isSelected ? (
                  <div className="flex-1 flex items-center gap-2">
                    {templates.length === 0 ? (
                      <a
                        href="/admin/workouts"
                        className="flex-1 h-8 flex items-center px-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        Nenhum treino criado — clique para criar
                      </a>
                    ) : (
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="flex-1 h-8 rounded-lg border border-neutral-700 bg-white/[0.03] px-2 text-xs text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                    >
                      <option value="" className="bg-[#111]">Selecionar treino...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#111]">
                          {t.name} ({t.type})
                        </option>
                      ))}
                    </select>
                    )}
                    <button
                      onClick={handleAssign}
                      disabled={!selectedTemplate || saving}
                      className="h-8 px-3 rounded-lg bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600/30 disabled:opacity-30 transition-all"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                    </button>
                    <button
                      onClick={() => { setSelectedDay(null); setSelectedTemplate("") }}
                      className="h-8 px-2 rounded-lg text-neutral-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedDay(i)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-neutral-800 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400 transition-all text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    {DAY_FULL[i]} — descanso
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
