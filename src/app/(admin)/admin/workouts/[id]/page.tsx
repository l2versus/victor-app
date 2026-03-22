"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft, Plus, Trash2,
  Dumbbell, Search, X, Save, ChevronUp, ChevronDown,
  Check, ChevronRight, Settings2, Loader2, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import Link from "next/link"

type Exercise = {
  id: string
  name: string
  muscle: string
  equipment: string
}

type SetDetail = {
  reps: string
  loadKg: string
}

type WorkoutExercise = {
  tempId: string
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: string
  restSeconds: number
  loadKg: string
  notes: string
  supersetGroup: string
  suggestedMachine: string
  technique: string
  setDetails: SetDetail[]
  showSetDetails: boolean
}

const TECHNIQUES = [
  { value: "NORMAL", label: "Normal" },
  { value: "DROP_SET", label: "Drop Set" },
  { value: "REST_PAUSE", label: "Rest-Pause" },
  { value: "PYRAMID", label: "Pirâmide" },
  { value: "REVERSE_PYRAMID", label: "Pirâmide Inversa" },
  { value: "FST7", label: "FST-7" },
  { value: "MYO_REPS", label: "Myo Reps" },
]

function buildSetDetails(sets: number, reps: string, loadKg: string): SetDetail[] {
  return Array.from({ length: sets }, () => ({
    reps: reps || "10",
    loadKg: loadKg || "",
  }))
}

export default function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load existing workout
  const loadWorkout = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/workouts/${id}`)
      if (!res.ok) { router.push("/admin/workouts"); return }
      const { workout } = await res.json()

      setName(workout.name)
      setType(workout.type)
      setNotes(workout.notes || "")
      setExercises(
        workout.exercises.map((we: {
          id: string
          exerciseId: string
          exercise: Exercise
          sets: number
          reps: string
          restSeconds: number
          loadKg: number | null
          notes: string | null
          supersetGroup: string | null
          suggestedMachine: string | null
          technique: string
        }) => ({
          tempId: we.id,
          exerciseId: we.exerciseId,
          exercise: we.exercise,
          sets: we.sets,
          reps: we.reps,
          restSeconds: we.restSeconds,
          loadKg: we.loadKg ? String(we.loadKg) : "",
          notes: we.notes || "",
          supersetGroup: we.supersetGroup || "",
          suggestedMachine: we.suggestedMachine || "",
          technique: we.technique || "NORMAL",
          setDetails: buildSetDetails(we.sets, we.reps, we.loadKg ? String(we.loadKg) : ""),
          showSetDetails: false,
        }))
      )
    } catch {
      router.push("/admin/workouts")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadWorkout() }, [loadWorkout])

  function addExercises(exList: Exercise[]) {
    setExercises((prev) => [
      ...prev,
      ...exList.map((ex) => ({
        tempId: crypto.randomUUID(),
        exerciseId: ex.id,
        exercise: ex,
        sets: 3,
        reps: "10",
        restSeconds: 60,
        loadKg: "",
        notes: "",
        supersetGroup: "",
        suggestedMachine: "",
        technique: "NORMAL",
        setDetails: buildSetDetails(3, "10", ""),
        showSetDetails: false,
      })),
    ])
  }

  function removeExercise(tempId: string) {
    setExercises((prev) => prev.filter((e) => e.tempId !== tempId))
    if (expandedExercise === tempId) setExpandedExercise(null)
  }

  function updateExercise(tempId: string, field: string, value: string | number | boolean) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.tempId !== tempId) return e
        const updated = { ...e, [field]: value }
        if (field === "sets") {
          const newSets = value as number
          if (newSets > 0) {
            const details = [...e.setDetails]
            while (details.length < newSets) {
              details.push({ reps: e.reps || "10", loadKg: e.loadKg || "" })
            }
            updated.setDetails = details.slice(0, newSets)
          }
        }
        return updated
      })
    )
  }

  function updateSetDetail(tempId: string, setIdx: number, field: keyof SetDetail, value: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.tempId !== tempId) return e
        const details = [...e.setDetails]
        details[setIdx] = { ...details[setIdx], [field]: value }
        return { ...e, setDetails: details }
      })
    )
  }

  function moveExercise(tempId: string, direction: "up" | "down") {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.tempId === tempId)
      if (idx === -1) return prev
      const newIdx = direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }

  async function handleSave() {
    if (!name || !type || exercises.length === 0) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/workouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          notes: notes || null,
          exercises: exercises.map((ex, i) => {
            let finalLoadKg: number | null = null
            let extraNotes = ex.notes || ""

            if (ex.showSetDetails && ex.setDetails.length > 0) {
              const kgs = ex.setDetails.map((d) => d.loadKg).filter(Boolean)
              const reps = ex.setDetails.map((d) => d.reps).filter(Boolean)
              if (kgs.length > 0) {
                const allSame = kgs.every((k) => k === kgs[0])
                if (allSame) {
                  finalLoadKg = parseFloat(kgs[0]) || null
                } else {
                  finalLoadKg = parseFloat(kgs[0]) || null
                  const kgStr = ex.setDetails.map((d, si) => `S${si + 1}: ${d.loadKg || "--"}kg`).join(" → ")
                  extraNotes = extraNotes ? `${kgStr} | ${extraNotes}` : kgStr
                }
              }
              const allReps = reps.every((r) => r === reps[0])
              if (!allReps && reps.length > 0) {
                const repStr = ex.setDetails.map((d, si) => `S${si + 1}: ${d.reps || "--"}reps`).join(", ")
                extraNotes = extraNotes ? `${extraNotes} | ${repStr}` : repStr
              }
            } else {
              finalLoadKg = ex.loadKg ? parseFloat(ex.loadKg) : null
            }

            return {
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.showSetDetails
                ? ex.setDetails.map((d) => d.reps).join(",")
                : ex.reps,
              restSeconds: ex.restSeconds,
              loadKg: finalLoadKg,
              notes: extraNotes || null,
              order: i,
              supersetGroup: ex.supersetGroup || null,
              suggestedMachine: ex.suggestedMachine || null,
              technique: ex.technique || "NORMAL",
            }
          }),
        }),
      })

      if (res.ok) {
        router.push("/admin/workouts")
      }
    } catch {
      console.error("Failed to update workout")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/workouts/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/admin/workouts")
    } catch {
      console.error("Failed to delete workout")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/workouts"
          className="w-9 h-9 rounded-xl bg-white/5 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Editar Treino</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Ajuste exercícios, séries e repetições</p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/50 border border-red-900/30 text-red-400 text-xs font-medium hover:bg-red-950/80 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir
        </button>
      </div>

      {/* Workout Info */}
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm">
        <h2 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <Dumbbell className="w-4 h-4 text-red-500" />
          Detalhes do Treino
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5">Nome *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Superior A" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5">Tipo *</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Selecionar tipo...</option>
              <option value="Superior A">Superior A</option>
              <option value="Superior B">Superior B</option>
              <option value="Inferior A">Inferior A</option>
              <option value="Inferior B">Inferior B</option>
              <option value="Push">Push</option>
              <option value="Pull">Pull</option>
              <option value="Pernas">Pernas</option>
              <option value="Full Body">Full Body</option>
              <option value="Cardio">Cardio</option>
              <option value="Personalizado">Personalizado</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5">Observações</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais sobre este treino..."
            rows={2}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
            <Dumbbell className="w-4 h-4 text-red-500" />
            Exercícios ({exercises.length})
          </h2>
          <Button size="sm" onClick={() => setShowPicker(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-10 sm:py-12 border-2 border-dashed border-neutral-800 rounded-xl">
            <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-700 mx-auto mb-2 sm:mb-3" />
            <p className="text-neutral-500 text-xs sm:text-sm mb-1">Nenhum exercício</p>
            <button
              onClick={() => setShowPicker(true)}
              className="text-red-400 text-xs sm:text-sm hover:text-red-300 transition-colors"
            >
              Adicione um exercício
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {exercises.map((ex, idx) => {
              const isExpanded = expandedExercise === ex.tempId
              return (
                <div
                  key={ex.tempId}
                  className="group rounded-xl border border-neutral-800 bg-white/[0.02] hover:border-neutral-700 transition-all overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
                    onClick={() => setExpandedExercise(isExpanded ? null : ex.tempId)}
                  >
                    <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveExercise(ex.tempId, "up")} disabled={idx === 0} className="text-neutral-600 hover:text-white disabled:opacity-20 transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveExercise(ex.tempId, "down")} disabled={idx === exercises.length - 1} className="text-neutral-600 hover:text-white disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center text-red-400 text-xs font-bold border border-red-500/10 shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">{ex.exercise.name}</p>
                      <p className="text-neutral-500 text-[10px] sm:text-xs">
                        {ex.exercise.muscle} &middot; {ex.exercise.equipment}
                        {ex.technique !== "NORMAL" && (
                          <span className="text-purple-400 ml-1">· {TECHNIQUES.find(t => t.value === ex.technique)?.label}</span>
                        )}
                      </p>
                    </div>

                    {!isExpanded && (
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 shrink-0">
                        <span>{ex.sets}x{ex.reps}</span>
                        {ex.loadKg && <span>· {ex.loadKg}kg</span>}
                      </div>
                    )}

                    <ChevronRight className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />

                    <button
                      onClick={(e) => { e.stopPropagation(); removeExercise(ex.tempId) }}
                      className="text-neutral-600 hover:text-red-400 transition-colors p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 border-t border-neutral-800/50 pt-3">
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Séries</label>
                          <Input type="number" value={ex.sets} onChange={(e) => updateExercise(ex.tempId, "sets", parseInt(e.target.value) || 0)} className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Reps</label>
                          <Input value={ex.reps} onChange={(e) => updateExercise(ex.tempId, "reps", e.target.value)} placeholder="10" className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Descanso</label>
                          <Input type="number" value={ex.restSeconds} onChange={(e) => updateExercise(ex.tempId, "restSeconds", parseInt(e.target.value) || 0)} className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Kg</label>
                          <Input value={ex.loadKg} onChange={(e) => updateExercise(ex.tempId, "loadKg", e.target.value)} placeholder="--" className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2" />
                        </div>
                      </div>

                      {/* Technique */}
                      <div>
                        <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1">Técnica</label>
                        <div className="flex flex-wrap gap-1.5">
                          {TECHNIQUES.map((t) => (
                            <button
                              key={t.value}
                              onClick={() => updateExercise(ex.tempId, "technique", t.value)}
                              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
                                ex.technique === t.value
                                  ? "bg-purple-600/20 border-purple-500/30 text-purple-400"
                                  : "bg-white/5 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Per-set toggle */}
                      <button
                        onClick={() => updateExercise(ex.tempId, "showSetDetails", !ex.showSetDetails)}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        <Settings2 className="w-3 h-3" />
                        {ex.showSetDetails ? "Ocultar detalhes por série" : "Detalhar peso/reps por série"}
                      </button>

                      {ex.showSetDetails && ex.sets > 0 && (
                        <div className="space-y-1.5 bg-white/[0.02] rounded-lg p-2 sm:p-3 border border-neutral-800/50">
                          <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-[9px] text-neutral-600 uppercase tracking-wider px-1">
                            <span>Série</span>
                            <span className="text-center">Reps</span>
                            <span className="text-center">Kg</span>
                          </div>
                          {ex.setDetails.slice(0, ex.sets).map((detail, si) => (
                            <div key={si} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                              <div className="w-6 h-6 rounded-md bg-red-600/15 flex items-center justify-center text-[10px] font-bold text-red-400 mx-auto">
                                {si + 1}
                              </div>
                              <Input value={detail.reps} onChange={(e) => updateSetDetail(ex.tempId, si, "reps", e.target.value)} placeholder="10" className="text-center h-7 text-xs px-1" />
                              <Input value={detail.loadKg} onChange={(e) => updateSetDetail(ex.tempId, si, "loadKg", e.target.value)} placeholder="--" className="text-center h-7 text-xs px-1" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes + Machine */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
                        <Input value={ex.notes} onChange={(e) => updateExercise(ex.tempId, "notes", e.target.value)} placeholder="Notas (ex: foco na excêntrica)" className="h-8 sm:h-9 text-xs sm:text-sm" />
                        <Input value={ex.suggestedMachine} onChange={(e) => updateExercise(ex.tempId, "suggestedMachine", e.target.value)} placeholder="Máquina (ex: Hammer vermelho)" className="h-8 sm:h-9 text-xs sm:text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3 mb-8">
        <Link href="/admin/workouts" className="flex-1">
          <Button variant="ghost" fullWidth>Cancelar</Button>
        </Link>
        <div className="flex-1">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!name || !type || exercises.length === 0}
            fullWidth
          >
            <Save className="w-4 h-4 mr-1.5" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePickerMulti
          onConfirm={(selected) => {
            addExercises(selected)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((e) => e.exerciseId)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Modal title="Excluir Treino" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-950/30 border border-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Tem certeza?</p>
                <p className="text-xs text-neutral-400 mt-1">
                  O treino <strong className="text-white">{name}</strong> será excluído permanentemente. Alunos que usam este treino perderão o vínculo.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* --- EXERCISE PICKER MULTI-SELECT --- */
function ExercisePickerMulti({ onConfirm, onClose, excludeIds }: {
  onConfirm: (exercises: Exercise[]) => void
  onClose: () => void
  excludeIds: string[]
}) {
  const [search, setSearch] = useState("")
  const [muscle, setMuscle] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscles, setMuscles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Exercise[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (muscle) params.set("muscle", muscle)
      params.set("limit", "100")

      const res = await fetch(`/api/admin/exercises?${params}`)
      const data = await res.json()
      setExercises(data.exercises.filter((e: Exercise) => !excludeIds.includes(e.id)))
      if (data.muscles) setMuscles(data.muscles)
      setLoading(false)
    }

    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [search, muscle, excludeIds])

  function toggleExercise(ex: Exercise) {
    setSelected((prev) => prev.find((e) => e.id === ex.id) ? prev.filter((e) => e.id !== ex.id) : [...prev, ex])
  }

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = []
    acc[ex.muscle].push(ex)
    return acc
  }, {})

  return (
    <Modal title="Adicionar Exercícios" onClose={onClose} className="mx-4 sm:mx-auto max-h-[90vh]">
      <div className="space-y-3">
        {selected.length > 0 && (
          <div className="flex items-center justify-between bg-red-600/10 border border-red-500/20 rounded-xl px-3 py-2">
            <span className="text-xs text-red-300">{selected.length} selecionado{selected.length > 1 ? "s" : ""}</span>
            <button onClick={() => setSelected([])} className="text-[10px] text-neutral-500 hover:text-white">Limpar</button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input placeholder="Buscar exercícios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" autoFocus />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setMuscle("")} className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${!muscle ? "bg-red-600/20 border-red-500/30 text-red-400" : "bg-white/5 border-neutral-800 text-neutral-400"}`}>
            Todos
          </button>
          {muscles.map((m) => (
            <button key={m} onClick={() => setMuscle(m === muscle ? "" : m)} className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${muscle === m ? "bg-red-600/20 border-red-500/30 text-red-400" : "bg-white/5 border-neutral-800 text-neutral-400"}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="max-h-[45vh] sm:max-h-[300px] overflow-y-auto space-y-0.5 pr-1 -mr-1">
          {loading ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : exercises.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">Nenhum exercício encontrado</p>
          ) : (
            Object.entries(grouped).map(([muscleGroup, exs]) => (
              <div key={muscleGroup}>
                <div className="px-3 py-1.5"><span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">{muscleGroup}</span></div>
                {exs.map((ex) => {
                  const checked = selected.some((e) => e.id === ex.id)
                  return (
                    <button key={ex.id} onClick={() => toggleExercise(ex)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left group ${checked ? "bg-red-600/10 border border-red-500/20" : "hover:bg-white/5 border border-transparent"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-red-600 border-red-600" : "border-neutral-700"}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0">
                        <Dumbbell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm truncate">{ex.name}</p>
                        <p className="text-neutral-600 text-[10px]">{ex.equipment}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <button onClick={() => onConfirm(selected)} disabled={selected.length === 0} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-30 transition-opacity flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </div>
    </Modal>
  )
}
