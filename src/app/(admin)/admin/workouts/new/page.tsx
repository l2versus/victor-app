"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Trash2,
  Dumbbell, Search, X, Save, ChevronUp, ChevronDown, Mic,
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
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [saving, setSaving] = useState(false)

  function addExercise(ex: Exercise) {
    setExercises((prev) => [
      ...prev,
      {
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
      },
    ])
    setShowPicker(false)
  }

  function removeExercise(tempId: string) {
    setExercises((prev) => prev.filter((e) => e.tempId !== tempId))
  }

  function updateExercise(tempId: string, field: string, value: string | number) {
    setExercises((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, [field]: value } : e))
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
          exercises: exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            loadKg: ex.loadKg ? parseFloat(ex.loadKg) : null,
            notes: ex.notes || null,
            order: i,
            supersetGroup: ex.supersetGroup || null,
            suggestedMachine: ex.suggestedMachine || null,
          })),
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
          onClick={() => setShowVoice(!showVoice)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/15 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-600/25 transition-colors"
        >
          <Mic className="w-3.5 h-3.5" />
          Por Voz
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
                  .map((ex, i) => ({
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
                  }))
              )
              setShowVoice(false)
            }}
            onClose={() => setShowVoice(false)}
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
            {exercises.map((ex, idx) => (
              <div
                key={ex.tempId}
                className="group rounded-xl border border-neutral-800 bg-white/[0.02] p-3 sm:p-4 hover:border-neutral-700 transition-all"
              >
                {/* Exercise Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
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
                    <p className="text-neutral-500 text-[10px] sm:text-xs">{ex.exercise.muscle} &middot; {ex.exercise.equipment}</p>
                  </div>

                  <button
                    onClick={() => removeExercise(ex.tempId)}
                    className="text-neutral-600 hover:text-red-400 transition-colors p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Exercise Params — 4 columns even on mobile */}
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

                {/* Notes + Suggested Machine — collapsible row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 mt-2">
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
            ))}
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

      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((e) => e.exerciseId)}
        />
      )}
    </div>
  )
}

/* --- EXERCISE PICKER MODAL --- */
function ExercisePicker({
  onSelect,
  onClose,
  excludeIds,
}: {
  onSelect: (ex: Exercise) => void
  onClose: () => void
  excludeIds: string[]
}) {
  const [search, setSearch] = useState("")
  const [muscle, setMuscle] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscles, setMuscles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

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

  // Group by muscle for cleaner display
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = []
    acc[ex.muscle].push(ex)
    return acc
  }, {})

  return (
    <Modal title="Adicionar Exercício" onClose={onClose} className="mx-4 sm:mx-auto max-h-[90vh]">
      <div className="space-y-3">
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
        <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto space-y-0.5 pr-1 -mr-1">
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
                {exs.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 group-hover:text-red-400 transition-colors shrink-0">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm truncate">{ex.name}</p>
                      <p className="text-neutral-600 text-[10px]">{ex.equipment}</p>
                    </div>
                    <Plus className="w-4 h-4 text-neutral-700 group-hover:text-red-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
