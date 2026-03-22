"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import {
  ChevronLeft, ChevronRight, Check, Tag, Search,
  Dumbbell, Save, Trash2, Eye,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════════
// MACHINES 3D PREVIEW — QA + Identification Tool
// Visualiza cada .glb, identifica máquina via dropdown, salva mapeamento
// Rota: /posture/machines-preview
//
// Fluxo:
// 1. Abre a página → carrega todos modelos do index.json
// 2. Navega com setas ou grid → vê modelo 3D com rotação
// 3. Seleciona máquina no dropdown (agrupado por setor)
// 4. Salva → grava no localStorage + marca como identificado
// 5. No final, copia o JSON de mapeamento para usar no script
// ═══════════════════════════════════════════════════════════════════

interface ModelEntry {
  slug: string
  file: string
  name: string
  addedAt: string
}

// ─── Todas as 52 máquinas Ironberg agrupadas por setor ───
const IRONBERG_MACHINES = [
  { group: "ABDOMEN / CORE", machines: [
    { slug: "matrix-abdominal-crunch", name: "Matrix Abdominal Crunch (cabo)" },
    { slug: "hammer-seated-ab-crunch", name: "Hammer Strength Seated Ab Crunch" },
    { slug: "nautilus-impact-abdominal", name: "Nautilus Impact Abdominal (cabo)" },
    { slug: "hoist-rocit-ab-crunch", name: "Hoist ROC-IT Ab Crunch" },
    { slug: "nautilus-inspiration-abdominal", name: "Nautilus Inspiration Abdominal (cabo)" },
    { slug: "panatta-monolith-abdominal", name: "Panatta Monolith Abdominal Crunch (cabo)" },
    { slug: "matrix-rotary-torso", name: "Matrix Rotary Torso" },
    { slug: "panatta-knee-raise", name: "Panatta Captain's Chair / Knee Raise" },
  ]},
  { group: "PEITO", machines: [
    { slug: "hammer-mts-chest-press", name: "Hammer Strength MTS Chest Press" },
    { slug: "hammer-mts-incline-press", name: "Hammer Strength MTS Incline Press" },
    { slug: "hammer-mts-shoulder-chest", name: "Hammer Strength MTS Shoulder/Chest Press" },
    { slug: "panatta-supine-press", name: "Panatta Supine Press (plate-loaded)" },
    { slug: "panatta-lower-chest-flight", name: "Panatta Super Lower Chest Flight" },
    { slug: "panatta-inspiration-pec-deck", name: "Panatta Inspiration Pec Deck" },
    { slug: "matrix-incline-bench", name: "Matrix Incline Bench (barra)" },
    { slug: "matrix-flat-bench", name: "Matrix Flat Bench Press (barra)" },
    { slug: "stark-strong-decline-bench", name: "Stark Strong Decline Bench (barra)" },
    { slug: "panatta-converging-chest-press", name: "Panatta Converging Chest Press" },
    { slug: "matrix-adjustable-bench", name: "Matrix Banco Regulavel" },
    { slug: "panatta-cable-crossover", name: "Panatta Cable Crossover" },
  ]},
  { group: "COSTAS", machines: [
    { slug: "panatta-super-low-row", name: "Panatta Super Low Row" },
    { slug: "panatta-monolith-seated-row", name: "Panatta Monolith Seated Row (cabo)" },
    { slug: "nautilus-impact-lat-pulldown", name: "Nautilus Impact Lat Pulldown" },
    { slug: "hoist-rocit-lat-pulldown", name: "Hoist ROC-IT Lat Pulldown" },
    { slug: "panatta-lat-pulldown", name: "Panatta Lat Pulldown" },
    { slug: "hammer-gravitron", name: "Hammer Strength Gravitron (barra assistida)" },
    { slug: "hammer-iso-high-row", name: "Hammer Strength Iso-Lateral High Row" },
  ]},
  { group: "OMBROS", machines: [
    { slug: "hammer-mts-shoulder-press", name: "Hammer Strength MTS Shoulder Press" },
    { slug: "hammer-plate-shoulder-press", name: "Hammer Strength Plate-Loaded Shoulder Press" },
    { slug: "panatta-monolith-shoulder-press", name: "Panatta Monolith Shoulder Press" },
  ]},
  { group: "PERNAS", machines: [
    { slug: "matrix-leg-extension", name: "Matrix Extensora (cabo)" },
    { slug: "hoist-rocit-prone-leg-curl", name: "Hoist ROC-IT Mesa Flexora (cabo)" },
    { slug: "matrix-prone-leg-curl", name: "Matrix Mesa Flexora (cabo)" },
    { slug: "hammer-kneeling-leg-curl", name: "Hammer Strength Flexora Ajoelhado" },
    { slug: "hammer-standing-leg-curl", name: "Hammer Strength Flexora em Pe" },
    { slug: "nautilus-seated-leg-curl", name: "Nautilus Flexora Sentado" },
    { slug: "life-fitness-linear-leg-press", name: "Life Fitness Leg Press Linear" },
    { slug: "hoist-leg-press-45", name: "Hoist Leg Press 45" },
    { slug: "panatta-leg-press-45", name: "Panatta Leg Press 45" },
    { slug: "nautilus-leg-press-45", name: "Nautilus Leg Press 45" },
    { slug: "panatta-monolith-hip-thrust", name: "Panatta Monolith Hip Thrust" },
    { slug: "panatta-hack-squat", name: "Panatta Hack Squat" },
    { slug: "stark-strong-hack-squat", name: "Stark Strong Hack Squat" },
    { slug: "panatta-standing-calf-raise", name: "Panatta Panturrilha em Pe" },
    { slug: "hoist-rocit-calf-raise", name: "Hoist ROC-IT Panturrilha Sentado" },
    { slug: "panatta-v-squat", name: "Panatta V-Squat / Power Squat" },
    { slug: "matrix-hip-abduction", name: "Matrix Abdutora/Adutora" },
    { slug: "hammer-pendulum-squat", name: "Hammer Strength Pendulum Squat" },
  ]},
  { group: "BRACOS", machines: [
    { slug: "life-fitness-biceps-curl", name: "Life Fitness Rosca Biceps (cabo)" },
    { slug: "panatta-monolith-arm-curl", name: "Panatta Monolith Rosca Alternada" },
  ]},
]

const ALL_MACHINES = IRONBERG_MACHINES.flatMap(g => g.machines)

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  )
}

export default function MachinesPreview() {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mappings, setMappings] = useState<Record<string, { slug: string; name: string }>>({})
  const [search, setSearch] = useState("")
  const [showSelector, setShowSelector] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Load models + saved mappings
  useEffect(() => {
    fetch("/models/machines/index.json")
      .then(r => r.json())
      .then((data: Record<string, { file: string; name: string; addedAt: string }>) => {
        const entries = Object.entries(data).map(([slug, info]) => ({ slug, ...info }))
        setModels(entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Load saved mappings from localStorage
    try {
      const saved = localStorage.getItem("ironberg-3d-mappings")
      if (saved) setMappings(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Save mappings to localStorage
  const saveMappings = useCallback((newMappings: Record<string, { slug: string; name: string }>) => {
    setMappings(newMappings)
    localStorage.setItem("ironberg-3d-mappings", JSON.stringify(newMappings))
  }, [])

  const identifyMachine = useCallback((fileSlug: string, machine: { slug: string; name: string }) => {
    const newMappings = { ...mappings, [fileSlug]: machine }
    saveMappings(newMappings)
    setShowSelector(false)
    setSearch("")
    // Auto-advance to next unidentified
    const nextUnidentified = models.findIndex((m, i) => i > currentIndex && !newMappings[m.slug])
    if (nextUnidentified !== -1) setCurrentIndex(nextUnidentified)
  }, [mappings, saveMappings, models, currentIndex])

  const removeMapping = useCallback((fileSlug: string) => {
    const newMappings = { ...mappings }
    delete newMappings[fileSlug]
    saveMappings(newMappings)
  }, [mappings, saveMappings])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-neutral-500 text-sm animate-pulse">Carregando modelos 3D...</p>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <p className="text-neutral-400 text-sm">Nenhum modelo encontrado</p>
      </div>
    )
  }

  const current = models[currentIndex]
  const currentMapping = mappings[current.slug]
  const identifiedCount = Object.keys(mappings).length
  const usedSlugs = new Set(Object.values(mappings).map(m => m.slug))

  // Filter machines by search
  const filteredGroups = IRONBERG_MACHINES.map(g => ({
    ...g,
    machines: g.machines.filter(m =>
      !usedSlugs.has(m.slug) &&
      (search === "" || m.name.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(g => g.machines.length > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-red-500" />
            <h1 className="text-sm font-bold">Identificador 3D — Ironberg</h1>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            {currentIndex + 1}/{models.length}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-emerald-500 rounded-full transition-all"
              style={{ width: `${(identifiedCount / models.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">{identifiedCount}/{models.length}</span>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="relative w-full" style={{ height: "45vh" }}>
        <Canvas
          key={current.file}
          camera={{ position: [2.5, 1.8, 2.5], fov: 45 }}
          style={{ background: "#111" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-3, 2, -3]} intensity={0.3} />
          <Suspense fallback={null}>
            <Model url={current.file} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls
            autoRotate
            autoRotateSpeed={3}
            enablePan={false}
            minDistance={0.5}
            maxDistance={8}
          />
        </Canvas>

        {/* Nav arrows */}
        <button
          onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setShowSelector(false) }}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center disabled:opacity-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setCurrentIndex(Math.min(models.length - 1, currentIndex + 1)); setShowSelector(false) }}
          disabled={currentIndex === models.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center disabled:opacity-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          currentMapping
            ? "bg-emerald-600/30 border-emerald-500/30"
            : "bg-amber-600/20 border-amber-500/20"
        }`}>
          {currentMapping ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-medium">{currentMapping.name}</span>
            </>
          ) : (
            <span className="text-[11px] text-amber-400 font-medium">Nao identificado</span>
          )}
        </div>

        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 border border-white/10">
          <span className="text-[10px] font-mono text-neutral-400"># {currentIndex + 1}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Current file info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <Tag className="w-3 h-3 text-neutral-600 shrink-0" />
          <span className="text-[10px] font-mono text-neutral-500 truncate">{current.slug}.glb</span>
        </div>

        {/* Identify / Change button */}
        {currentMapping ? (
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium truncate">
              {currentMapping.name}
            </div>
            <button
              onClick={() => removeMapping(current.slug)}
              className="px-3 py-2.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="w-full py-3 rounded-xl bg-red-600/15 border border-red-500/20 text-sm font-medium text-red-400 flex items-center justify-center gap-2"
          >
            <Dumbbell className="w-4 h-4" />
            Identificar esta maquina
          </button>
        )}

        {/* Machine selector */}
        {showSelector && (
          <div className="rounded-xl border border-white/[0.08] bg-[#111] overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
                <Search className="w-3.5 h-3.5 text-neutral-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar maquina..."
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Grouped list */}
            <div className="max-h-[35vh] overflow-y-auto">
              {filteredGroups.map(group => (
                <div key={group.group}>
                  <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">{group.group}</span>
                  </div>
                  {group.machines.map(machine => (
                    <button
                      key={machine.slug}
                      onClick={() => identifyMachine(current.slug, machine)}
                      className="w-full px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-red-600/10 hover:text-white border-b border-white/[0.03] transition-all"
                    >
                      {machine.name}
                    </button>
                  ))}
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <p className="p-4 text-center text-xs text-neutral-600">Nenhuma maquina encontrada</p>
              )}
            </div>
          </div>
        )}

        {/* Grid navigation */}
        <div className="grid grid-cols-8 gap-1">
          {models.map((m, i) => (
            <button
              key={m.slug}
              onClick={() => { setCurrentIndex(i); setShowSelector(false) }}
              className={`aspect-square rounded-lg border text-[9px] font-mono flex items-center justify-center transition-all ${
                i === currentIndex
                  ? "border-red-500/50 bg-red-600/15 text-red-400 font-bold"
                  : mappings[m.slug]
                    ? "border-emerald-500/30 bg-emerald-600/10 text-emerald-400"
                    : "border-white/[0.06] bg-white/[0.02] text-neutral-600"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Export button */}
        {identifiedCount > 0 && (
          <button
            onClick={() => setShowExport(!showExport)}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-400 flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" />
            {showExport ? "Fechar" : "Ver mapeamento"} ({identifiedCount} identificados)
          </button>
        )}

        {showExport && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 max-h-[30vh] overflow-y-auto">
            <div className="space-y-1.5">
              {Object.entries(mappings).map(([fileSlug, machine]) => (
                <div key={fileSlug} className="flex items-center gap-2 text-[10px]">
                  <span className="text-neutral-600 font-mono truncate flex-1">{fileSlug}</span>
                  <span className="text-neutral-500">→</span>
                  <span className="text-emerald-400 font-medium truncate flex-1">{machine.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-[9px] text-neutral-600 mb-2">Renomear arquivos (rodar no terminal):</p>
              <pre className="text-[9px] text-amber-400/80 font-mono whitespace-pre-wrap break-all bg-black/30 rounded-lg p-2">
                {Object.entries(mappings).map(([fileSlug, machine]) =>
                  `mv "scripts/glb-input/${fileSlug}.glb" "scripts/glb-input/${machine.slug}.glb"`
                ).join("\n")}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
