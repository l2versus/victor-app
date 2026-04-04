"use client"

import { useState } from "react"
import { Search, Dumbbell, ChevronDown, Info, X, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Exercise3DButton } from "@/components/student/exercise-3d-viewer"
import Link from "next/link"
import { MuscleBadge } from "@/components/student/muscle-info-card"
import { find3DModel } from "@/lib/exercise-3d-models"
import dynamic from "next/dynamic"

const Machine3DGuide = dynamic(
  () => import("@/components/student/machine-3d-guide").then(m => ({ default: m.Machine3DGuide })),
  { ssr: false }
)

interface Exercise {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string | null
  videoUrl: string | null
  imageUrl: string | null
  machineBrand: string | null
  machine3dModel: string | null
}

interface ExerciseLibraryProps {
  exercises: Exercise[]
  muscleGroups: string[]
}

export function ExerciseLibrary({ exercises, muscleGroups }: ExerciseLibraryProps) {
  const [search, setSearch] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [expandedEquip, setExpandedEquip] = useState<Set<string>>(new Set())

  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase()) ||
      (ex.instructions?.toLowerCase().includes(search.toLowerCase()))
    const matchMuscle = !selectedMuscle || ex.muscle === selectedMuscle
    return matchSearch && matchMuscle
  })

  // Group by muscle → equipment (two-level hierarchy)
  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = {}
    if (!acc[ex.muscle][ex.equipment]) acc[ex.muscle][ex.equipment] = []
    acc[ex.muscle][ex.equipment].push(ex)
    return acc
  }, {} as Record<string, Record<string, Exercise[]>>)

  const equipmentIcons: Record<string, string> = {
    Barbell: "🏋️", Dumbbell: "💪", Cable: "🔗", Machine: "⚙️",
    Bodyweight: "🤸", Kettlebell: "🔔", Band: "🎗️", Other: "📦",
    Barra: "🏋️", Halter: "💪", Cabo: "🔗", "Máquina": "⚙️",
    "Peso Corporal": "🤸", "Elástico": "🎗️", Outro: "📦",
  }

  const equipmentOrder = ["Barbell", "Barra", "Dumbbell", "Halter", "Machine", "Máquina", "Cable", "Cabo", "Bodyweight", "Peso Corporal", "Kettlebell", "Band", "Elástico", "Other", "Outro"]
  const sortEquipment = (a: string, b: string) => {
    const ia = equipmentOrder.indexOf(a)
    const ib = equipmentOrder.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-red-400" />
          Biblioteca de Exercícios
        </h1>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {exercises.length} exercícios · Toque para aprender
        </p>
      </div>

      {/* Victor Personal 3D Machines banner */}
      <Link
        href="/exercises/machines"
        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600/15 to-red-900/10 border border-red-500/20 hover:from-red-600/20 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center">
            <span className="text-sm">🏋️</span>
          </div>
          <div>
            <p className="text-xs font-bold text-red-400">Maquinas Victor Personal 3D</p>
            <p className="text-[10px] text-neutral-500">Visualize as maquinas em 3D</p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-red-500/50 -rotate-90" />
      </Link>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar exercício, músculo ou equipamento..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        )}
      </div>

      {/* Muscle filter chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedMuscle(null)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
            !selectedMuscle
              ? "bg-red-600/20 text-red-400 border border-red-500/20"
              : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
          )}
        >
          Todos ({exercises.length})
        </button>
        {muscleGroups.map(m => {
          const count = exercises.filter(e => e.muscle === m).length
          return (
            <button
              key={m}
              onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                selectedMuscle === m
                  ? "bg-red-600/20 text-red-400 border border-red-500/20"
                  : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
              )}
            >
              {m} ({count})
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <p className="text-[10px] text-neutral-600 uppercase tracking-wider">
        {filtered.length} exercício{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Exercise list by muscle → equipment */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([muscle, byEquip]) => {
          const totalInMuscle = Object.values(byEquip).reduce((s, arr) => s + arr.length, 0)
          return (
          <div key={muscle}>
            {/* Muscle group header */}
            <div className="flex items-center gap-2 mb-3">
              <MuscleBadge muscle={muscle} showInfoOnTap={true} />
              <span className="text-[10px] text-neutral-600">{totalInMuscle}</span>
            </div>

            {/* Equipment sub-groups — collapsible */}
            <div className="space-y-1 pl-1">
              {Object.entries(byEquip).sort(([a], [b]) => sortEquipment(a, b)).map(([equip, exs]) => {
                const eqKey = `${muscle}-${equip}`
                const isEqOpen = expandedEquip.has(eqKey)
                return (
                <div key={eqKey}>
                  {/* Equipment sub-header — clickable accordion */}
                  <button
                    onClick={() => setExpandedEquip(prev => {
                      const next = new Set(prev)
                      if (next.has(eqKey)) next.delete(eqKey)
                      else next.add(eqKey)
                      return next
                    })}
                    className="w-full flex items-center gap-1.5 py-2 px-1 rounded-lg active:bg-white/[0.04] transition-colors"
                  >
                    <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform duration-200 ${isEqOpen ? "" : "-rotate-90"}`} />
                    <span className="text-xs">{equipmentIcons[equip] || "📦"}</span>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{equip}</span>
                    <span className="text-[9px] text-neutral-600">({exs.length})</span>
                  </button>

            {/* Exercise cards — collapsible */}
            {isEqOpen && (
            <div className="space-y-1.5 pb-2">
              {exs.map(ex => {
                const isExpanded = expandedExercise === ex.id
                const has3D = !!find3DModel(ex.name)

                return (
                  <div
                    key={ex.id}
                    className={cn(
                      "rounded-xl border transition-all duration-300",
                      isExpanded
                        ? "border-red-500/20 bg-red-600/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    {/* Exercise header (clickable) */}
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                      className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99] transition-transform"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Dumbbell className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                        <p className="text-[10px] text-neutral-600">
                          {ex.machineBrand ? `${ex.machineBrand} · ` : ""}{ex.equipment}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ex.machine3dModel && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">AR</span>
                        )}
                        {has3D && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">3D</span>
                        )}
                        <ChevronDown className={cn(
                          "w-4 h-4 text-neutral-600 transition-transform duration-300",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-white/[0.04] pt-3">
                        {/* Machine photo */}
                        {ex.imageUrl && (
                          <img
                            src={ex.imageUrl}
                            alt={ex.machineBrand || ex.name}
                            className="w-full rounded-xl object-cover max-h-48 bg-neutral-900"
                            loading="lazy"
                          />
                        )}

                        {/* Machine brand badge */}
                        {ex.machineBrand && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-[9px] text-neutral-500 uppercase tracking-wider">Máquina:</span>
                            <span className="text-xs font-semibold text-white">{ex.machineBrand}</span>
                          </div>
                        )}

                        {/* Instructions */}
                        {ex.instructions && (
                          <div className="flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-neutral-400 leading-relaxed">{ex.instructions}</p>
                          </div>
                        )}

                        {/* Video from Victor */}
                        {ex.videoUrl && (
                          <div className="rounded-xl overflow-hidden bg-black">
                            {ex.videoUrl.includes("youtube.com") || ex.videoUrl.includes("youtu.be") ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYouTubeId(ex.videoUrl)}`}
                                className="w-full aspect-video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                allowFullScreen
                                loading="lazy"
                              />
                            ) : ex.videoUrl.includes("instagram.com") ? (
                              <a
                                href={ex.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 text-xs text-pink-400 hover:text-pink-300 transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                Ver vídeo no Instagram
                              </a>
                            ) : (
                              <video
                                src={ex.videoUrl}
                                controls
                                playsInline
                                className="w-full aspect-video"
                                preload="metadata"
                              />
                            )}
                          </div>
                        )}

                        {/* 3D Machine model (local .glb) */}
                        {ex.machine3dModel && (
                          <Machine3DGuide
                            modelSlug={ex.machine3dModel}
                            machineName={ex.name}
                            onClose={() => {}}
                          />
                        )}

                        {/* 3D Muscle viewer (Sketchfab) */}
                        {has3D && (
                          <Exercise3DButton exerciseName={ex.name} className="w-full justify-center py-2" />
                        )}

                        {/* Muscle info */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-neutral-600">Músculo:</span>
                          <MuscleBadge muscle={ex.muscle} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )}
                </div>
                )
              })}
            </div>
          </div>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhum exercício encontrado</p>
          <p className="text-neutral-600 text-xs mt-1">Tente outro termo de busca</p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string {
  // youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return url // fallback: assume it's already the ID
}
