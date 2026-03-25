"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Plus, Dumbbell, X, ChevronRight, Pencil, ImageIcon, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

type Exercise = {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string | null
  gifUrl: string | null
  videoUrl: string | null
  imageUrl: string | null
  machineBrand: string | null
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
  Barra: "🏋️",
  Halter: "💪",
  "Máquina": "⚙️",
  Cabo: "🔗",
  "Peso Corporal": "🤸",
  Kettlebell: "🔔",
  "Elástico": "🎗️",
  Outro: "📦",
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [editMedia, setEditMedia] = useState({ name: "", instructions: "", machine3dModel: "", gifUrl: "", videoUrl: "", imageUrl: "", machineBrand: "" })
  const [savingMedia, setSavingMedia] = useState(false)

  const fetchExercises = useCallback(async (s: string, m: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set("search", s)
      if (m) params.set("muscle", m)
      params.set("limit", "9999")

      const res = await fetch(`/api/admin/exercises?${params}`)
      const data: ExerciseData = await res.json()
      setExercises(data.exercises)
      setTotal(data.total)
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
      fetchExercises(search, muscle)
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
      fetchExercises(search, muscle)
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
                            <button
                              key={ex.id}
                              onClick={() => { setSelectedExercise(ex); setEditMedia({ name: ex.name, instructions: ex.instructions || "", machine3dModel: (ex as Record<string, unknown>).machine3dModel as string || "", gifUrl: ex.gifUrl || "", videoUrl: ex.videoUrl || "", imageUrl: ex.imageUrl || "", machineBrand: ex.machineBrand || "" }) }}
                              className="group/item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer"
                            >
                              {/* Thumbnail */}
                              <div className="w-10 h-10 rounded-lg bg-neutral-800/50 border border-neutral-700/30 overflow-hidden shrink-0 flex items-center justify-center">
                                {ex.gifUrl ? (
                                  <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <Dumbbell className="w-4 h-4 text-neutral-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-neutral-200 text-sm truncate">{ex.name}</p>
                                  {ex.isCustom && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 shrink-0">
                                      Personalizado
                                    </span>
                                  )}
                                  {ex.videoUrl && (
                                    <Play className="w-3 h-3 text-blue-400 shrink-0" />
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-neutral-800 shrink-0">
                                {equipmentIcons[ex.equipment] || "📦"} {ex.equipment}
                              </span>
                              <Pencil className="w-3.5 h-3.5 text-neutral-700 group-hover/item:text-neutral-400 transition-colors shrink-0" />
                            </button>
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

      {/* All exercises loaded — no pagination needed */}

      {/* Exercise Detail / Edit Media Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setSelectedExercise(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedExercise(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all">
              <X className="w-4 h-4" />
            </button>

            {/* Image */}
            <div className="w-full h-48 bg-neutral-900 flex items-center justify-center overflow-hidden">
              {selectedExercise.gifUrl ? (
                <img src={selectedExercise.gifUrl} alt={selectedExercise.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-600 text-xs">Sem imagem</p>
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-1">{selectedExercise.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">{selectedExercise.muscle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-neutral-800">{equipmentIcons[selectedExercise.equipment] || "📦"} {selectedExercise.equipment}</span>
              </div>

              {selectedExercise.instructions && (
                <p className="text-neutral-400 text-sm leading-relaxed mb-5">{selectedExercise.instructions}</p>
              )}

              {/* Video embed */}
              {selectedExercise.videoUrl && (
                <div className="mb-5 rounded-xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={selectedExercise.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* Edit media form */}
              <div className="border-t border-white/[0.06] pt-4 space-y-3">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" /> Editar Exercício
                </p>

                {/* Nome do exercício */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Nome do exercício</label>
                  <input
                    value={editMedia.name}
                    onChange={e => setEditMedia({ ...editMedia, name: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                  />
                </div>

                {/* Instruções */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Instruções de execução</label>
                  <textarea
                    value={editMedia.instructions}
                    onChange={e => setEditMedia({ ...editMedia, instructions: e.target.value })}
                    placeholder="Descreva a execução correta..."
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30 resize-none"
                  />
                </div>

                {/* Modelo 3D */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Modelo 3D (slug do arquivo .glb)</label>
                  <input
                    value={editMedia.machine3dModel}
                    onChange={e => setEditMedia({ ...editMedia, machine3dModel: e.target.value })}
                    placeholder="ex: flexora, leg-press-45"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                  />
                  <p className="text-[9px] text-neutral-600 mt-1">Nome do arquivo em /models/machines/ (sem .glb)</p>
                </div>

                {/* Marca da máquina — dropdown com marcas da Ironberg */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Marca da máquina</label>
                  <select
                    value={editMedia.machineBrand}
                    onChange={e => setEditMedia({ ...editMedia, machineBrand: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                  >
                    <option value="">Sem máquina específica</option>
                    <option value="Hammer Strength">Hammer Strength</option>
                    <option value="Hammer Strength MTS">Hammer Strength MTS</option>
                    <option value="Hoist">Hoist</option>
                    <option value="Hoist ROC-IT">Hoist ROC-IT</option>
                    <option value="Nautilus">Nautilus</option>
                    <option value="Nautilus Impact">Nautilus Impact</option>
                    <option value="Nautilus Inspiration">Nautilus Inspiration</option>
                    <option value="Life Fitness">Life Fitness</option>
                    <option value="Life Fitness Insignia">Life Fitness Insignia</option>
                    <option value="Cybex Prestige">Cybex Prestige</option>
                    <option value="Matrix">Matrix</option>
                    <option value="Panatta">Panatta</option>
                    <option value="Panatta Monolith">Panatta Monolith</option>
                    <option value="Panatta Inspiration">Panatta Inspiration</option>
                    <option value="Stark Strong">Stark Strong</option>
                    <option value="ICG">ICG</option>
                    <option value="Barra livre">Barra livre</option>
                    <option value="Halter">Halter</option>
                    <option value="Cabo">Cabo</option>
                    <option value="Peso corporal">Peso corporal</option>
                  </select>
                </div>

                {/* Foto da máquina */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Foto da máquina</label>
                  <div className="flex gap-2">
                    <input
                      value={editMedia.imageUrl}
                      onChange={e => setEditMedia({ ...editMedia, imageUrl: e.target.value })}
                      placeholder="https://link-da-foto.com/maquina.jpg"
                      className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                    />
                    <label className="shrink-0 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs text-neutral-400 cursor-pointer hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
                      📷 Upload
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setEditMedia({ ...editMedia, imageUrl: reader.result as string })
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                  <p className="text-[9px] text-neutral-600 mt-1">Cole um link ou faça upload direto da foto</p>
                </div>

                {/* Vídeo */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Vídeo do exercício (YouTube / Instagram / Upload)</label>
                  <div className="flex gap-2">
                    <input
                      value={editMedia.videoUrl}
                      onChange={e => setEditMedia({ ...editMedia, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... ou Instagram"
                      className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                    />
                    <label className="shrink-0 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs text-neutral-400 cursor-pointer hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
                      🎬 Upload
                      <input type="file" accept="video/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setEditMedia({ ...editMedia, videoUrl: reader.result as string })
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                  <p className="text-[9px] text-neutral-600 mt-1">YouTube, Instagram ou vídeo gravado direto do celular</p>
                </div>

                {/* GIF */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">GIF animado (opcional)</label>
                  <input
                    value={editMedia.gifUrl}
                    onChange={e => setEditMedia({ ...editMedia, gifUrl: e.target.value })}
                    placeholder="https://exemplo.com/exercicio.gif"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                  />
                </div>

                <button
                  onClick={async () => {
                    setSavingMedia(true)
                    try {
                      const res = await fetch(`/api/admin/exercises?id=${selectedExercise.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: editMedia.name || undefined,
                          instructions: editMedia.instructions || null,
                          machine3dModel: editMedia.machine3dModel || null,
                          gifUrl: editMedia.gifUrl || null,
                          videoUrl: editMedia.videoUrl || null,
                          imageUrl: editMedia.imageUrl || null,
                          machineBrand: editMedia.machineBrand || null,
                        }),
                      })
                      if (res.ok) {
                        setExercises(prev => prev.map(ex =>
                          ex.id === selectedExercise.id ? {
                            ...ex,
                            name: editMedia.name || ex.name,
                            instructions: editMedia.instructions || null,
                            gifUrl: editMedia.gifUrl || null,
                            videoUrl: editMedia.videoUrl || null,
                            imageUrl: editMedia.imageUrl || null,
                            machineBrand: editMedia.machineBrand || null,
                          } : ex
                        ))
                        setSelectedExercise(null)
                      }
                    } finally { setSavingMedia(false) }
                  }}
                  disabled={savingMedia}
                  className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {savingMedia ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
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
