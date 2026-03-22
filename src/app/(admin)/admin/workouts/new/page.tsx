"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Trash2,
  Dumbbell, Search, X, Save, ChevronUp, ChevronDown, Mic,
  Check, ChevronRight, Settings2, FileText, Zap,
} from "lucide-react"
import { VoiceWorkoutPrescriber } from "@/components/admin/voice-workout-prescriber"
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
  /** Per-set detail — when user wants different kg/reps per set */
  setDetails: SetDetail[]
  /** Whether per-set detail is expanded */
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

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

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
        // Sync set details when sets count changes
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
      const res = await fetch("/api/admin/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          notes: notes || null,
          exercises: exercises.map((ex, i) => {
            // If per-set details active, encode kg progression in notes
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
                  // Store first kg as base, encode progression in notes
                  finalLoadKg = parseFloat(kgs[0]) || null
                  const kgStr = ex.setDetails.map((d, si) => `S${si + 1}: ${d.loadKg || "--"}kg`).join(" → ")
                  extraNotes = extraNotes ? `${kgStr} | ${extraNotes}` : kgStr
                }
              }
              // If reps vary per set, encode too
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
      console.error("Failed to save workout")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/workouts"
          className="w-9 h-9 rounded-xl bg-white/5 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Criar Treino</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Monte um novo modelo de treino</p>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/15 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-600/25 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Templates
        </button>
        <button
          onClick={() => setShowVoice(!showVoice)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/15 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-600/25 transition-colors"
        >
          <Mic className="w-3.5 h-3.5" />
          Voz
        </button>
      </div>

      {/* Voice Prescriber */}
      {showVoice && (
        <div className="mb-4 sm:mb-6">
          <VoiceWorkoutPrescriber
            onWorkoutParsed={(workout) => {
              setName(workout.name || "")
              setType(workout.type || "")
              setNotes(workout.notes || "")
              setExercises(
                workout.exercises
                  .filter(ex => ex.exerciseId && ex.exercise)
                  .map((ex) => ({
                    tempId: crypto.randomUUID(),
                    exerciseId: ex.exerciseId!,
                    exercise: ex.exercise!,
                    sets: ex.sets || 3,
                    reps: ex.reps || "10",
                    restSeconds: ex.restSeconds || 60,
                    loadKg: "",
                    notes: ex.notes || "",
                    supersetGroup: ex.supersetGroup || "",
                    suggestedMachine: "",
                    technique: "NORMAL",
                    setDetails: buildSetDetails(ex.sets || 3, ex.reps || "10", ""),
                    showSetDetails: false,
                  }))
              )
              setShowVoice(false)
            }}
            onClose={() => setShowVoice(false)}
          />
        </div>
      )}

      {/* Quick Templates */}
      {showTemplates && (
        <div className="mb-4 sm:mb-6">
          <WorkoutTemplatesPanel
            onApply={(template) => {
              setName(template.name)
              setType(template.type)
              setNotes(template.notes || "")
              // Load exercises from template — they use exerciseName for AI resolution
              setExercises(
                template.exercises.map((ex) => ({
                  tempId: crypto.randomUUID(),
                  exerciseId: ex.exerciseId || "",
                  exercise: ex.exercise || { id: "", name: ex.exerciseName, muscle: ex.muscle || "", equipment: ex.equipment || "" },
                  sets: ex.sets,
                  reps: ex.reps,
                  restSeconds: ex.restSeconds,
                  loadKg: "",
                  notes: ex.notes || "",
                  supersetGroup: ex.supersetGroup || "",
                  suggestedMachine: "",
                  technique: ex.technique || "NORMAL",
                  setDetails: buildSetDetails(ex.sets, ex.reps, ""),
                  showSetDetails: false,
                }))
              )
              setShowTemplates(false)
            }}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}

      {/* Workout Info */}
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm">
        <h2 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <Dumbbell className="w-4 h-4 text-red-500" />
          Detalhes do Treino
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5">Nome *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Superior A"
            />
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
            <p className="text-neutral-500 text-xs sm:text-sm mb-1">Nenhum exercício adicionado</p>
            <button
              onClick={() => setShowPicker(true)}
              className="text-red-400 text-xs sm:text-sm hover:text-red-300 transition-colors"
            >
              Adicione seu primeiro exercício
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
                  {/* Exercise Header — always visible, tappable */}
                  <div
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
                    onClick={() => setExpandedExercise(isExpanded ? null : ex.tempId)}
                  >
                    <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveExercise(ex.tempId, "up")}
                        disabled={idx === 0}
                        className="text-neutral-600 hover:text-white disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveExercise(ex.tempId, "down")}
                        disabled={idx === exercises.length - 1}
                        className="text-neutral-600 hover:text-white disabled:opacity-20 transition-colors"
                      >
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

                    {/* Quick summary when collapsed */}
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

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 border-t border-neutral-800/50 pt-3">
                      {/* Basic params row */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Séries</label>
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => updateExercise(ex.tempId, "sets", parseInt(e.target.value) || 0)}
                            className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Reps</label>
                          <Input
                            value={ex.reps}
                            onChange={(e) => updateExercise(ex.tempId, "reps", e.target.value)}
                            placeholder="10"
                            className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Descanso</label>
                          <Input
                            type="number"
                            value={ex.restSeconds}
                            onChange={(e) => updateExercise(ex.tempId, "restSeconds", parseInt(e.target.value) || 0)}
                            className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5 sm:mb-1 text-center">Kg</label>
                          <Input
                            value={ex.loadKg}
                            onChange={(e) => updateExercise(ex.tempId, "loadKg", e.target.value)}
                            placeholder="--"
                            className="text-center h-8 sm:h-9 text-xs sm:text-sm px-1 sm:px-2"
                          />
                        </div>
                      </div>

                      {/* Technique selector */}
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

                      {/* Per-set detail toggle */}
                      <button
                        onClick={() => updateExercise(ex.tempId, "showSetDetails", !ex.showSetDetails)}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        <Settings2 className="w-3 h-3" />
                        {ex.showSetDetails ? "Ocultar detalhes por série" : "Detalhar peso/reps por série"}
                      </button>

                      {/* Per-set detail rows */}
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
                              <Input
                                value={detail.reps}
                                onChange={(e) => updateSetDetail(ex.tempId, si, "reps", e.target.value)}
                                placeholder="10"
                                className="text-center h-7 text-xs px-1"
                              />
                              <Input
                                value={detail.loadKg}
                                onChange={(e) => updateSetDetail(ex.tempId, si, "loadKg", e.target.value)}
                                placeholder="--"
                                className="text-center h-7 text-xs px-1"
                              />
                            </div>
                          ))}
                          <p className="text-[9px] text-neutral-600 mt-1 px-1">
                            Ex: Pirâmide → S1: 12reps 30kg → S2: 10reps 35kg → S3: 8reps 40kg
                          </p>
                        </div>
                      )}

                      {/* Notes + Suggested Machine */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
                        <Input
                          value={ex.notes}
                          onChange={(e) => updateExercise(ex.tempId, "notes", e.target.value)}
                          placeholder="Notas (ex: foco na excêntrica)"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                        />
                        <Input
                          value={ex.suggestedMachine}
                          onChange={(e) => updateExercise(ex.tempId, "suggestedMachine", e.target.value)}
                          placeholder="📍 Máquina (ex: Hammer vermelho, 2ª fileira)"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
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
            Salvar Treino
          </Button>
        </div>
      </div>

      {/* Exercise Picker Modal — MULTI-SELECT */}
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
    </div>
  )
}

/* --- EXERCISE PICKER — MULTI-SELECT --- */
function ExercisePickerMulti({
  onConfirm,
  onClose,
  excludeIds,
}: {
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
    setSelected((prev) => {
      const exists = prev.find((e) => e.id === ex.id)
      if (exists) return prev.filter((e) => e.id !== ex.id)
      return [...prev, ex]
    })
  }

  function isSelected(id: string) {
    return selected.some((e) => e.id === id)
  }

  // Group by muscle for cleaner display
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = []
    acc[ex.muscle].push(ex)
    return acc
  }, {})

  return (
    <Modal title="Adicionar Exercícios" onClose={onClose} className="mx-4 sm:mx-auto max-h-[90vh]">
      <div className="space-y-3">
        {/* Selected count badge */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between bg-red-600/10 border border-red-500/20 rounded-xl px-3 py-2">
            <span className="text-xs text-red-300">
              {selected.length} exercício{selected.length > 1 ? "s" : ""} selecionado{selected.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setSelected([])}
              className="text-[10px] text-neutral-500 hover:text-white transition-colors"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar exercícios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
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

        {/* Muscle filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMuscle("")}
            className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
              !muscle
                ? "bg-red-600/20 border-red-500/30 text-red-400"
                : "bg-white/5 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            Todos
          </button>
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m === muscle ? "" : m)}
              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
                muscle === m
                  ? "bg-red-600/20 border-red-500/30 text-red-400"
                  : "bg-white/5 border-neutral-800 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="max-h-[45vh] sm:max-h-[300px] overflow-y-auto space-y-0.5 pr-1 -mr-1">
          {loading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">Nenhum exercício encontrado</p>
          ) : (
            Object.entries(grouped).map(([muscleGroup, exs]) => (
              <div key={muscleGroup}>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">{muscleGroup}</span>
                </div>
                {exs.map((ex) => {
                  const checked = isSelected(ex.id)
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExercise(ex)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left group ${
                        checked ? "bg-red-600/10 border border-red-500/20" : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked
                          ? "bg-red-600 border-red-600"
                          : "border-neutral-700 group-hover:border-neutral-500"
                      }`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 group-hover:text-red-400 transition-colors shrink-0">
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

        {/* Confirm button */}
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </div>
    </Modal>
  )
}

/* --- WORKOUT TEMPLATES PANEL --- */

type TemplateExercise = {
  exerciseName: string
  exerciseId?: string
  exercise?: Exercise
  muscle?: string
  equipment?: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  supersetGroup?: string
  technique?: string
}

type WorkoutTemplate = {
  name: string
  type: string
  notes?: string
  category: string
  level: string
  exercises: TemplateExercise[]
}

const PRESET_TEMPLATES: WorkoutTemplate[] = [
  // ─── PUSH / PULL / LEGS ───
  {
    name: "Push A — Peito & Ombro & Tríceps",
    type: "Push",
    category: "PPL",
    level: "Intermediário",
    notes: "Foco em compostos pesados + isolamento",
    exercises: [
      { exerciseName: "Supino Reto com Barra", muscle: "Peitoral", equipment: "Barra", sets: 4, reps: "6-8", restSeconds: 120 },
      { exerciseName: "Supino Inclinado com Halteres", muscle: "Peitoral", equipment: "Halteres", sets: 3, reps: "8-10", restSeconds: 90 },
      { exerciseName: "Crucifixo Inclinado com Halteres", muscle: "Peitoral", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Desenvolvimento com Halteres", muscle: "Ombro", equipment: "Halteres", sets: 4, reps: "8-10", restSeconds: 90 },
      { exerciseName: "Elevação Lateral", muscle: "Ombro", equipment: "Halteres", sets: 3, reps: "12-15", restSeconds: 45, technique: "DROP_SET" },
      { exerciseName: "Tríceps Corda", muscle: "Tríceps", equipment: "Cabo", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Tríceps Testa", muscle: "Tríceps", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 60 },
    ],
  },
  {
    name: "Pull A — Costas & Bíceps",
    type: "Pull",
    category: "PPL",
    level: "Intermediário",
    notes: "Foco em largura e espessura",
    exercises: [
      { exerciseName: "Barra Fixa", muscle: "Costas", equipment: "Barra", sets: 4, reps: "6-10", restSeconds: 120 },
      { exerciseName: "Remada Curvada com Barra", muscle: "Costas", equipment: "Barra", sets: 4, reps: "8-10", restSeconds: 90 },
      { exerciseName: "Remada Unilateral com Haltere", muscle: "Costas", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Puxada Frente", muscle: "Costas", equipment: "Cabo", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Face Pull", muscle: "Ombro Posterior", equipment: "Cabo", sets: 3, reps: "15-20", restSeconds: 45 },
      { exerciseName: "Rosca Direta com Barra", muscle: "Bíceps", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Rosca Martelo", muscle: "Bíceps", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
    ],
  },
  {
    name: "Legs A — Quadríceps & Glúteo",
    type: "Pernas",
    category: "PPL",
    level: "Intermediário",
    notes: "Foco anterior + glúteos",
    exercises: [
      { exerciseName: "Agachamento Livre", muscle: "Quadríceps", equipment: "Barra", sets: 4, reps: "6-8", restSeconds: 180 },
      { exerciseName: "Leg Press 45", muscle: "Quadríceps", equipment: "Máquina", sets: 4, reps: "10-12", restSeconds: 120 },
      { exerciseName: "Hack Squat", muscle: "Quadríceps", equipment: "Máquina", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Cadeira Extensora", muscle: "Quadríceps", equipment: "Máquina", sets: 3, reps: "12-15", restSeconds: 60, technique: "DROP_SET" },
      { exerciseName: "Stiff", muscle: "Posterior", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Elevação Pélvica", muscle: "Glúteo", equipment: "Barra", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseName: "Panturrilha em Pé", muscle: "Panturrilha", equipment: "Máquina", sets: 4, reps: "15-20", restSeconds: 45 },
    ],
  },
  // ─── UPPER / LOWER ───
  {
    name: "Superior A — Peito & Costas & Ombros",
    type: "Superior A",
    category: "Upper/Lower",
    level: "Intermediário",
    exercises: [
      { exerciseName: "Supino Reto com Barra", muscle: "Peitoral", equipment: "Barra", sets: 4, reps: "8-10", restSeconds: 120 },
      { exerciseName: "Remada Curvada com Barra", muscle: "Costas", equipment: "Barra", sets: 4, reps: "8-10", restSeconds: 120 },
      { exerciseName: "Supino Inclinado com Halteres", muscle: "Peitoral", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Puxada Frente", muscle: "Costas", equipment: "Cabo", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Desenvolvimento com Halteres", muscle: "Ombro", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Elevação Lateral", muscle: "Ombro", equipment: "Halteres", sets: 3, reps: "12-15", restSeconds: 45 },
      { exerciseName: "Rosca Direta com Barra", muscle: "Bíceps", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 60, supersetGroup: "A" },
      { exerciseName: "Tríceps Corda", muscle: "Tríceps", equipment: "Cabo", sets: 3, reps: "10-12", restSeconds: 60, supersetGroup: "A" },
    ],
  },
  {
    name: "Inferior A — Quadríceps & Posterior & Glúteo",
    type: "Inferior A",
    category: "Upper/Lower",
    level: "Intermediário",
    exercises: [
      { exerciseName: "Agachamento Livre", muscle: "Quadríceps", equipment: "Barra", sets: 4, reps: "6-8", restSeconds: 180 },
      { exerciseName: "Leg Press 45", muscle: "Quadríceps", equipment: "Máquina", sets: 4, reps: "10-12", restSeconds: 120 },
      { exerciseName: "Cadeira Extensora", muscle: "Quadríceps", equipment: "Máquina", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseName: "Cadeira Flexora", muscle: "Posterior", equipment: "Máquina", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Stiff", muscle: "Posterior", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Elevação Pélvica", muscle: "Glúteo", equipment: "Barra", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseName: "Panturrilha em Pé", muscle: "Panturrilha", equipment: "Máquina", sets: 4, reps: "15-20", restSeconds: 45 },
    ],
  },
  // ─── FULL BODY ───
  {
    name: "Full Body — Iniciante",
    type: "Full Body",
    category: "Full Body",
    level: "Iniciante",
    notes: "Treino completo para iniciantes, 3x por semana",
    exercises: [
      { exerciseName: "Agachamento no Smith", muscle: "Quadríceps", equipment: "Máquina", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Supino Reto com Halteres", muscle: "Peitoral", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Puxada Frente", muscle: "Costas", equipment: "Cabo", sets: 3, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Desenvolvimento com Halteres", muscle: "Ombro", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Cadeira Flexora", muscle: "Posterior", equipment: "Máquina", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseName: "Rosca Direta com Halteres", muscle: "Bíceps", equipment: "Halteres", sets: 2, reps: "12-15", restSeconds: 45, supersetGroup: "A" },
      { exerciseName: "Tríceps Corda", muscle: "Tríceps", equipment: "Cabo", sets: 2, reps: "12-15", restSeconds: 45, supersetGroup: "A" },
      { exerciseName: "Abdominal Crunch", muscle: "Abdômen", equipment: "Corpo", sets: 3, reps: "15-20", restSeconds: 30 },
    ],
  },
  // ─── AVANÇADO ───
  {
    name: "Push Avançado — Peito & Ombro (Alto Volume)",
    type: "Push",
    category: "Avançado",
    level: "Avançado",
    notes: "Alto volume com técnicas intensificadoras",
    exercises: [
      { exerciseName: "Supino Reto com Barra", muscle: "Peitoral", equipment: "Barra", sets: 5, reps: "5", restSeconds: 180, technique: "PYRAMID" },
      { exerciseName: "Supino Inclinado com Halteres", muscle: "Peitoral", equipment: "Halteres", sets: 4, reps: "8-10", restSeconds: 90, technique: "REST_PAUSE" },
      { exerciseName: "Cross Over", muscle: "Peitoral", equipment: "Cabo", sets: 4, reps: "12-15", restSeconds: 60, technique: "DROP_SET" },
      { exerciseName: "Desenvolvimento Máquina", muscle: "Ombro", equipment: "Máquina", sets: 4, reps: "8-10", restSeconds: 90 },
      { exerciseName: "Elevação Lateral", muscle: "Ombro", equipment: "Halteres", sets: 4, reps: "12-15", restSeconds: 30, technique: "MYO_REPS" },
      { exerciseName: "Elevação Frontal", muscle: "Ombro", equipment: "Halteres", sets: 3, reps: "12-15", restSeconds: 45 },
      { exerciseName: "Tríceps Francês", muscle: "Tríceps", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 60, supersetGroup: "A" },
      { exerciseName: "Tríceps Corda", muscle: "Tríceps", equipment: "Cabo", sets: 3, reps: "12-15", restSeconds: 60, supersetGroup: "A", technique: "DROP_SET" },
    ],
  },
  {
    name: "Pull Avançado — Costas & Bíceps (Alto Volume)",
    type: "Pull",
    category: "Avançado",
    level: "Avançado",
    notes: "Foco em espessura e pico de bíceps",
    exercises: [
      { exerciseName: "Barra Fixa", muscle: "Costas", equipment: "Barra", sets: 4, reps: "8-10", restSeconds: 120 },
      { exerciseName: "Remada Curvada com Barra", muscle: "Costas", equipment: "Barra", sets: 4, reps: "6-8", restSeconds: 120, technique: "PYRAMID" },
      { exerciseName: "Remada Cavalinho", muscle: "Costas", equipment: "Máquina", sets: 4, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Pulldown com Corda", muscle: "Costas", equipment: "Cabo", sets: 3, reps: "12-15", restSeconds: 60, technique: "DROP_SET" },
      { exerciseName: "Face Pull", muscle: "Ombro Posterior", equipment: "Cabo", sets: 3, reps: "15-20", restSeconds: 45 },
      { exerciseName: "Rosca Scott", muscle: "Bíceps", equipment: "Barra", sets: 3, reps: "10-12", restSeconds: 60, technique: "REST_PAUSE" },
      { exerciseName: "Rosca Martelo", muscle: "Bíceps", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Rosca Concentrada", muscle: "Bíceps", equipment: "Halteres", sets: 3, reps: "12-15", restSeconds: 45, technique: "DROP_SET" },
    ],
  },
  // ─── FEMININO ───
  {
    name: "Glúteo & Posterior — Feminino",
    type: "Pernas",
    category: "Feminino",
    level: "Intermediário",
    notes: "Foco em glúteo e posterior com ativação",
    exercises: [
      { exerciseName: "Elevação Pélvica", muscle: "Glúteo", equipment: "Barra", sets: 4, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Agachamento Sumô", muscle: "Glúteo", equipment: "Halteres", sets: 4, reps: "12-15", restSeconds: 90 },
      { exerciseName: "Stiff", muscle: "Posterior", equipment: "Barra", sets: 4, reps: "10-12", restSeconds: 90 },
      { exerciseName: "Cadeira Abdutora", muscle: "Glúteo", equipment: "Máquina", sets: 3, reps: "15-20", restSeconds: 45, technique: "DROP_SET" },
      { exerciseName: "Cadeira Flexora", muscle: "Posterior", equipment: "Máquina", sets: 3, reps: "12-15", restSeconds: 60 },
      { exerciseName: "Búlgaro com Halteres", muscle: "Glúteo", equipment: "Halteres", sets: 3, reps: "10-12", restSeconds: 60 },
      { exerciseName: "Panturrilha em Pé", muscle: "Panturrilha", equipment: "Máquina", sets: 4, reps: "15-20", restSeconds: 30 },
    ],
  },
]

const TEMPLATE_CATEGORIES = [...new Set(PRESET_TEMPLATES.map((t) => t.category))]

function WorkoutTemplatesPanel({
  onApply,
  onClose,
}: {
  onApply: (template: WorkoutTemplate) => void
  onClose: () => void
}) {
  const [category, setCategory] = useState("")
  const [resolving, setResolving] = useState<string | null>(null)

  const filtered = category
    ? PRESET_TEMPLATES.filter((t) => t.category === category)
    : PRESET_TEMPLATES

  async function applyTemplate(template: WorkoutTemplate) {
    setResolving(template.name)
    try {
      // Resolve exercise names to IDs from DB
      const res = await fetch("/api/admin/exercises?limit=500")
      const data = await res.json()
      const dbExercises: Exercise[] = data.exercises || []

      const resolved: WorkoutTemplate = {
        ...template,
        exercises: template.exercises.map((ex) => {
          // Fuzzy match: exact name, then partial first word
          const found =
            dbExercises.find((e) => e.name.toLowerCase() === ex.exerciseName.toLowerCase()) ||
            dbExercises.find((e) => e.name.toLowerCase().includes(ex.exerciseName.toLowerCase().split(" ")[0]))
          return {
            ...ex,
            exerciseId: found?.id || "",
            exercise: found || undefined,
          }
        }),
      }
      onApply(resolved)
    } catch {
      // Fallback: apply without IDs
      onApply(template)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-zinc-950/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Templates Prontos</p>
            <p className="text-[10px] text-neutral-500">Selecione um modelo e customize</p>
          </div>
        </div>
        <button onClick={onClose} className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1">
          Fechar
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory("")}
          className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
            !category
              ? "bg-purple-600/20 border-purple-500/30 text-purple-400"
              : "bg-white/5 border-neutral-800 text-neutral-400 hover:border-neutral-700"
          }`}
        >
          Todos
        </button>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? "" : c)}
            className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full border transition-all ${
              category === c
                ? "bg-purple-600/20 border-purple-500/30 text-purple-400"
                : "bg-white/5 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {filtered.map((tpl) => (
          <button
            key={tpl.name}
            onClick={() => applyTemplate(tpl)}
            disabled={resolving !== null}
            className="w-full text-left rounded-xl border border-neutral-800 bg-white/[0.02] p-3 hover:border-purple-500/30 hover:bg-purple-900/10 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs sm:text-sm text-white font-medium truncate pr-2">{tpl.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  tpl.level === "Iniciante" ? "bg-green-600/15 text-green-400" :
                  tpl.level === "Avançado" ? "bg-red-600/15 text-red-400" :
                  "bg-blue-600/15 text-blue-400"
                }`}>
                  {tpl.level}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 mb-1.5">
              {tpl.exercises.length} exercícios · {tpl.type}
              {tpl.notes && ` · ${tpl.notes}`}
            </p>
            <div className="flex flex-wrap gap-1">
              {[...new Set(tpl.exercises.map((e) => e.muscle).filter(Boolean))].slice(0, 4).map((m) => (
                <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-500">{m}</span>
              ))}
            </div>
            {resolving === tpl.name && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-purple-400">Carregando exercícios...</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
