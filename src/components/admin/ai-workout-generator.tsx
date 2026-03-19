"use client"

import { useState } from "react"
import {
  Sparkles, Loader2, Dumbbell, Save, RotateCcw,
  Brain, Target, AlertTriangle, Wrench, CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"

type GeneratedWorkout = {
  name: string
  type: string
  notes: string
  exercises: Array<{
    exerciseName: string
    sets: number
    reps: string
    restSeconds: number
    loadKg: number | null
    notes: string | null
    supersetGroup: string | null
  }>
}

export function AIWorkoutGenerator({ studentId, onSave }: { studentId?: string; onSave?: (workout: GeneratedWorkout) => void }) {
  const [objective, setObjective] = useState("")
  const [level, setLevel] = useState("intermediario")
  const [restrictions, setRestrictions] = useState("")
  const [equipment, setEquipment] = useState("academia completa")
  const [focus, setFocus] = useState("")
  const [days, setDays] = useState("4")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedWorkout | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleGenerate() {
    if (!objective) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/admin/ai/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, objective, level, restrictions, equipment, days, focus }),
      })

      const data = await res.json()
      if (data.workout) {
        setResult(data.workout)
      } else {
        setError(data.error || "Erro ao gerar treino")
      }
    } catch {
      setError("Falha na conexao com IA")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)

    try {
      if (onSave) {
        onSave(result)
      } else {
        // Save directly via API
        const res = await fetch("/api/admin/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: result.name,
            type: result.type,
            notes: result.notes,
            exercises: result.exercises.map((ex, i) => ({
              exerciseName: ex.exerciseName,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              loadKg: ex.loadKg,
              notes: ex.notes,
              order: i,
              supersetGroup: ex.supersetGroup,
            })),
          }),
        })

        if (res.ok) {
          setResult(null)
          setObjective("")
        }
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      {!result && (
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            Gerar Treino com IA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Objetivo *
              </label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Hipertrofia de membros superiores"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Nivel</label>
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediario</option>
                <option value="avancado">Avancado</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Equipamentos
              </label>
              <Input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="academia completa"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Dias/semana
              </label>
              <Select value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="2">2 dias</option>
                <option value="3">3 dias</option>
                <option value="4">4 dias</option>
                <option value="5">5 dias</option>
                <option value="6">6 dias</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Foco especifico</label>
            <Input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex: Peito e triceps, posterior de coxa..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Restricoes
            </label>
            <Textarea
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="Lesoes, limitacoes, exercicios proibidos..."
              rows={2}
            />
          </div>

          <Button onClick={handleGenerate} disabled={!objective || loading} fullWidth>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando treino...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Treino com IA
              </>
            )}
          </Button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-violet-500/20 bg-[#111] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                {result.name}
              </h3>
              <p className="text-neutral-500 text-xs mt-0.5">
                {result.type} &middot; {result.exercises.length} exercicios &middot; Gerado por IA
              </p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {result.notes && (
            <p className="text-sm text-neutral-400 bg-white/[0.02] rounded-xl p-3 border border-neutral-800">
              {result.notes}
            </p>
          )}

          <div className="space-y-2">
            {result.exercises.map((ex, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-neutral-800/50 hover:border-neutral-700 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600/20 to-violet-800/20 flex items-center justify-center text-violet-400 text-xs font-bold border border-violet-500/10 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ex.exerciseName}</p>
                  {ex.notes && <p className="text-neutral-600 text-[10px] truncate">{ex.notes}</p>}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 shrink-0">
                  <span>{ex.sets}x{ex.reps}</span>
                  <span>{ex.restSeconds}s</span>
                  {ex.loadKg && <span>{ex.loadKg}kg</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setResult(null) }} fullWidth>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Gerar Outro
            </Button>
            <Button onClick={handleSave} loading={saving} fullWidth>
              <Save className="w-4 h-4 mr-1.5" />
              Salvar Treino
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
