"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Plus, Dumbbell, X, Video, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

type Exercise = {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string | null
  videoUrl: string | null
  isCustom: boolean
}

type ExerciseData = {
  exercises: Exercise[]
  total: number
  page: number
  pages: number
  muscles: string[]
}

const equipmentIcons: Record<string, string> = {
  Barbell: "🏋️",
  Dumbbell: "💪",
  Machine: "⚙️",
  Cable: "🔗",
  Bodyweight: "🤸",
  Kettlebell: "🔔",
  Band: "🎗️",
  Other: "📦",
}

export function ExerciseList({ initialData }: { initialData: ExerciseData }) {
  const [exercises, setExercises] = useState(initialData.exercises)
  const [muscles, setMuscles] = useState(initialData.muscles)
  const [total, setTotal] = useState(initialData.total)
  const [search, setSearch] = useState("")
  const [muscle, setMuscle] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(initialData.pages)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const fetchExercises = useCallback(async (s: string, m: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set("search", s)
      if (m) params.set("muscle", m)
      params.set("page", String(p))
      params.set("limit", "50")

      const res = await fetch(`/api/admin/exercises?${params}`)
      const data: ExerciseData = await res.json()
      setExercises(data.exercises)
      setTotal(data.total)
      setPages(data.pages)
      if (data.muscles.length > 0) setMuscles(data.muscles)
    } catch {
      console.error("Failed to fetch exercises")
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchExercises(search, muscle, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, muscle, fetchExercises])

  // When search is active, auto-expand all groups so results are visible
  useEffect(() => {
    if (search) {
      const allMuscles = Object.keys(
        exercises.reduce<Record<string, boolean>>((acc, ex) => {
          acc[ex.muscle] = true
          return acc
        }, {})
      )
      setExpandedGroups(new Set(allMuscles))
    }
  }, [search, exercises])

  async function handleCreate(data: { name: string; muscle: string; equipment: string; instructions: string }) {
    const res = await fetch("/api/admin/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setShowForm(false)
      fetchExercises(search, muscle, page)
    }
  }

  function toggleGroup(muscleGroup: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(muscleGroup)) {
        next.delete(muscleGroup)
      } else {
        next.add(muscleGroup)
      }
      return next
    })
  }

  function expandAll() {
    const allMuscles = Object.keys(grouped)
    setExpandedGroups(new Set(allMuscles))
  }

  function collapseAll() {
    setExpandedGroups(new Set())
  }

  // Group exercises by muscle
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = []
    acc[ex.muscle].push(ex)
    return acc
  }, {})

  const allExpanded = Object.keys(grouped).length > 0 && expandedGroups.size === Object.keys(grouped).length

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar exercícios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <Select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="pl-10 min-w-[180px]"
            >
              <option value="">Todos os Músculos</option>
              {muscles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>

          <Button onClick={() => setShowForm(true)} className="whitespace-nowrap">
            <Plus className="w-4 h-4 mr-1.5" />
            Personalizado
          </Button>
        </div>
      </div>

      {/* Results count + expand/collapse toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">
          {total} exercício{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          {muscle && <span className="text-red-400 ml-1">&middot; {muscle}</span>}
        </p>
        {Object.keys(grouped).length > 1 && (
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {allExpanded ? "Recolher Tudo" : "Expandir Tudo"}
          </button>
        )}
      </div>

      {/* Exercise Accordion — Grouped by Muscle */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-[#111] p-3.5 animate-pulse">
              <div className="h-4 bg-neutral-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">Nenhum exercício encontrado</p>
          <p className="text-neutral-600 text-sm mt-1">Tente uma busca ou filtro diferente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([muscleGroup, exs]) => {
              const isExpanded = expandedGroups.has(muscleGroup)
              return (
                <div
                  key={muscleGroup}
                  className="rounded-xl border border-neutral-800 bg-[#111] overflow-hidden transition-colors hover:border-neutral-700"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleGroup(muscleGroup)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left group"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-white font-semibold text-sm uppercase tracking-wider flex-1">
                      {muscleGroup}
                    </span>
                    <span className="text-neutral-600 text-xs tabular-nums">
                      {exs.length} exercício{exs.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-3 pt-1 border-t border-neutral-800/50">
                        <div className="space-y-1">
                          {exs.map((ex) => (
                            <div
                              key={ex.id}
                              className="group/item flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-neutral-200 text-sm truncate">{ex.name}</p>
                                  {ex.isCustom && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 shrink-0">
                                      Personalizado
                                    </span>
                                  )}
                                  {ex.videoUrl && (
                                    <Video className="w-3 h-3 text-blue-400 shrink-0" />
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-neutral-800 shrink-0">
                                {equipmentIcons[ex.equipment] || "📦"} {ex.equipment}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPage(page - 1); fetchExercises(search, muscle, page - 1) }}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-neutral-500 text-sm px-3">
            {page} / {pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPage(page + 1); fetchExercises(search, muscle, page + 1) }}
            disabled={page >= pages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Create Exercise Modal */}
      {showForm && (
        <CreateExerciseModal
          muscles={muscles}
          onClose={() => setShowForm(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

/* --- CREATE EXERCISE MODAL --- */
function CreateExerciseModal({
  muscles,
  onClose,
  onCreate,
}: {
  muscles: string[]
  onClose: () => void
  onCreate: (data: { name: string; muscle: string; equipment: string; instructions: string }) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [muscleGroup, setMuscleGroup] = useState("")
  const [equipment, setEquipment] = useState("Dumbbell")
  const [instructions, setInstructions] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !muscleGroup || !equipment) return
    setSubmitting(true)
    await onCreate({ name, muscle: muscleGroup, equipment, instructions })
    setSubmitting(false)
  }

  return (
    <Modal title="Adicionar Exercício Personalizado" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nome do Exercício *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Elevação Lateral com Cabo" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Grupo Muscular *</label>
            <Select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} required>
              <option value="">Selecionar...</option>
              {muscles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="Other">Outro</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Equipamento *</label>
            <Select value={equipment} onChange={(e) => setEquipment(e.target.value)} required>
              {Object.keys(equipmentIcons).map((eq) => (
                <option key={eq} value={eq}>{equipmentIcons[eq]} {eq}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Instruções</label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Breve descrição de como executar este exercício..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={submitting} className="flex-1">Criar Exercício</Button>
        </div>
      </form>
    </Modal>
  )
}
