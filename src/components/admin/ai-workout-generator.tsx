"use client"

import { useState, useRef, useCallback } from "react"
import {
  Sparkles, Loader2, Dumbbell, Save, RotateCcw,
  Brain, Target, AlertTriangle, Wrench, CalendarDays,
  ImagePlus, Link2, X, Youtube, FileText,
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

type Attachment = {
  id: string
  type: "image" | "youtube" | "link" | "text"
  preview: string // display label or thumbnail data URL
  data: string    // base64 for images, URL for links, raw text
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/.test(url)
}

function isUrl(text: string) {
  return /^https?:\/\/.+/i.test(text.trim())
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
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [freeText, setFreeText] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addAttachment = useCallback((att: Attachment) => {
    setAttachments(prev => [...prev, att])
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }, [])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        addAttachment({
          id: crypto.randomUUID(),
          type: "image",
          preview: base64,
          data: base64,
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  function handlePaste(e: React.ClipboardEvent) {
    // Handle pasted images
    const items = e.clipboardData?.items
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = () => {
            addAttachment({
              id: crypto.randomUUID(),
              type: "image",
              preview: reader.result as string,
              data: reader.result as string,
            })
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
    // Handle pasted URLs
    const text = e.clipboardData?.getData("text")
    if (text && isUrl(text)) {
      e.preventDefault()
      if (isYouTubeUrl(text)) {
        addAttachment({ id: crypto.randomUUID(), type: "youtube", preview: text, data: text })
      } else {
        addAttachment({ id: crypto.randomUUID(), type: "link", preview: text, data: text })
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = e.dataTransfer.files
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        addAttachment({
          id: crypto.randomUUID(),
          type: "image",
          preview: reader.result as string,
          data: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    })
  }

  function handleAddLink() {
    const url = prompt("Cole o link (YouTube, site de treino, etc):")
    if (!url || !isUrl(url)) return
    if (isYouTubeUrl(url)) {
      addAttachment({ id: crypto.randomUUID(), type: "youtube", preview: url, data: url })
    } else {
      addAttachment({ id: crypto.randomUUID(), type: "link", preview: url, data: url })
    }
  }

  async function handleGenerate() {
    const hasInput = objective || freeText || attachments.length > 0
    if (!hasInput) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/admin/ai/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          objective,
          level,
          restrictions,
          equipment,
          days,
          focus,
          freeText,
          attachments: attachments.map(a => ({ type: a.type, data: a.data })),
        }),
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
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600/20 to-violet-800/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            Gerar Treino com IA
          </h3>

          {/* Multimodal input area */}
          <div
            className="relative rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-600"
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Textarea
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="Descreva o treino, cole um print, link do YouTube, ou texto copiado da internet..."
              rows={3}
              className="border-0! bg-transparent! ring-0! p-0! min-h-0! resize-none focus:ring-0!"
              onPaste={handlePaste}
            />

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-800">
                {attachments.map(att => (
                  <div key={att.id} className="relative group">
                    {att.type === "image" ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-700">
                        <img src={att.preview} alt="Anexo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 max-w-[200px]">
                        {att.type === "youtube" ? (
                          <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : att.type === "link" ? (
                          <Link2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="truncate">{att.preview}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Foto
              </button>
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Link / YouTube
              </button>
              <span className="text-[10px] text-neutral-600 ml-auto">
                Cole imagens ou links direto aqui
              </span>
            </div>
          </div>

          {/* Advanced options toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
          >
            <Target className="w-3 h-3" />
            {showAdvanced ? "Ocultar" : "Mostrar"} opcoes avancadas
          </button>

          {showAdvanced && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Objetivo
                  </label>
                  <Input
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Ex: Hipertrofia de membros superiores"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1">Nivel</label>
                  <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Equipamentos
                  </label>
                  <Input
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="academia completa"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
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
                <label className="text-xs font-medium text-neutral-400 mb-1">Foco especifico</label>
                <Input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Ex: Peito e triceps, posterior de coxa..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Restricoes
                </label>
                <Textarea
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder="Lesoes, limitacoes, exercicios proibidos..."
                  rows={2}
                />
              </div>
            </>
          )}

          <Button
            onClick={handleGenerate}
            disabled={(!objective && !freeText && attachments.length === 0) || loading}
            fullWidth
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando{attachments.some(a => a.type === "image") ? " imagens e" : ""} gerando treino...
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
                {result.type} &middot; {result.exercises.length} exercícios &middot; Gerado por IA
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
