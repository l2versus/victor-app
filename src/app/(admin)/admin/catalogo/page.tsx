"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { Search, X, ChevronRight, Power, Package, Dumbbell, Ruler, Weight, CheckCheck, XCircle, ArrowLeft, Target, Maximize2, RotateCcw, View } from "lucide-react"
import dynamic from "next/dynamic"

const MachineViewer = dynamic(
  () => import("@/components/student/machine-3d-inline-viewer"),
  { ssr: false, loading: () => <div className="w-full h-64 rounded-2xl bg-[#080808] flex items-center justify-center"><RotateCcw className="w-5 h-5 text-neutral-700 animate-spin" /></div> }
)

const MachineARViewer = lazy(() => import("@/components/student/machine-ar-viewer"))

type CatalogExercise = {
  id: string
  name: string
  muscle: string
  equipment: string
  imageUrl: string | null
  machineBrand: string | null
  machineLine: string | null
  machineCode: string | null
  isActive: boolean
  instructions: string | null
  machine3dModel: string | null
  widthCm: number | null
  lengthCm: number | null
  heightCm: number | null
  weightKg: number | null
  maxLoadKg: number | null
}

type BrandGroup = {
  brand: string
  lines: { line: string; machines: CatalogExercise[] }[]
  total: number
  active: number
  sampleImage: string | null
}

function getMachineImage(ex: CatalogExercise): string | null {
  if (ex.imageUrl) return ex.imageUrl
  if (ex.machineCode) return `/machines/panatta/${ex.machineCode.toLowerCase()}.png`
  return null
}

const BRAND_INFO: Record<string, { flag: string; origin: string; color: string }> = {
  "Panatta": { flag: "🇮🇹", origin: "Italia", color: "red" },
  "Hammer Strength": { flag: "🇺🇸", origin: "EUA", color: "amber" },
  "Hammer Strength MTS": { flag: "🇺🇸", origin: "EUA", color: "amber" },
  "Matrix": { flag: "🇺🇸", origin: "EUA", color: "blue" },
  "Nautilus": { flag: "🇺🇸", origin: "EUA", color: "cyan" },
  "Nautilus Impact": { flag: "🇺🇸", origin: "EUA", color: "cyan" },
  "Nautilus Inspiration": { flag: "🇺🇸", origin: "EUA", color: "cyan" },
  "Hoist": { flag: "🇺🇸", origin: "EUA", color: "purple" },
  "Hoist ROC-IT": { flag: "🇺🇸", origin: "EUA", color: "purple" },
  "Life Fitness": { flag: "🇺🇸", origin: "EUA", color: "orange" },
  "Cybex Prestige": { flag: "🇺🇸", origin: "EUA", color: "emerald" },
  "Stark Strong": { flag: "🇧🇷", origin: "Brasil", color: "yellow" },
}

export default function CatalogoPage() {
  const [exercises, setExercises] = useState<CatalogExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [batchingGroup, setBatchingGroup] = useState<string | null>(null)
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set())
  const [collapsedLines, setCollapsedLines] = useState<Set<string>>(new Set())
  const [detailExercise, setDetailExercise] = useState<CatalogExercise | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ showInactive: "true", hasMachine: "true", limit: "9999" })
      const res = await fetch(`/api/admin/exercises?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExercises(data.exercises || [])
    } catch {
      console.error("Failed to fetch catalog")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Toggle single machine
  async function toggleActive(id: string, current: boolean) {
    setTogglingIds(prev => new Set(prev).add(id))
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, isActive: !current } : ex))
    try {
      const res = await fetch(`/api/admin/exercises?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      })
      if (!res.ok) {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, isActive: current } : ex))
      }
    } catch {
      setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, isActive: current } : ex))
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  // Batch toggle
  async function batchToggle(lineKey: string, ids: string[], activate: boolean) {
    setBatchingGroup(lineKey)
    setExercises(prev => prev.map(ex => ids.includes(ex.id) ? { ...ex, isActive: activate } : ex))
    const failedIds: string[] = []
    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += 10) batches.push(ids.slice(i, i + 10))
    for (const batch of batches) {
      const results = await Promise.all(batch.map(id =>
        fetch(`/api/admin/exercises?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: activate }),
        }).then(res => ({ id, ok: res.ok })).catch(() => ({ id, ok: false }))
      ))
      failedIds.push(...results.filter(r => !r.ok).map(r => r.id))
    }
    if (failedIds.length > 0) {
      setExercises(prev => prev.map(ex => failedIds.includes(ex.id) ? { ...ex, isActive: !activate } : ex))
    }
    setBatchingGroup(null)
  }

  // Build brand groups
  const brandGroups: BrandGroup[] = (() => {
    const map = new Map<string, CatalogExercise[]>()
    for (const ex of exercises) {
      const brand = ex.machineBrand || "Outros"
      if (!map.has(brand)) map.set(brand, [])
      map.get(brand)!.push(ex)
    }
    return [...map.entries()].map(([brand, exs]) => {
      const lineMap = new Map<string, CatalogExercise[]>()
      for (const ex of exs) {
        const line = ex.machineLine || "Geral"
        if (!lineMap.has(line)) lineMap.set(line, [])
        lineMap.get(line)!.push(ex)
      }
      const sample = exs.find(e => getMachineImage(e))
      return {
        brand,
        lines: [...lineMap.entries()].map(([line, machines]) => ({ line, machines: machines.sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.line.localeCompare(b.line)),
        total: exs.length,
        active: exs.filter(e => e.isActive).length,
        sampleImage: sample ? getMachineImage(sample) : null,
      }
    }).sort((a, b) => b.total - a.total)
  })()

  // Stats
  const totalActive = exercises.filter(e => e.isActive).length
  const totalInactive = exercises.filter(e => !e.isActive).length

  // ─── BRAND DETAIL VIEW ───
  if (selectedBrand) {
    const group = brandGroups.find(g => g.brand === selectedBrand)
    if (!group) { setSelectedBrand(null); return null }

    const info = BRAND_INFO[selectedBrand]
    const filtered = search
      ? group.lines.map(l => ({ ...l, machines: l.machines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.machineCode?.toLowerCase().includes(search.toLowerCase())) })).filter(l => l.machines.length > 0)
      : group.lines

    return (
      <div className="max-w-7xl mx-auto pb-24">
        {/* Back + Brand Header */}
        <button
          onClick={() => { setSelectedBrand(null); setSearch("") }}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Voltar ao catalogo</span>
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-${info?.color || "neutral"}-500/10 border border-${info?.color || "neutral"}-500/15 flex items-center justify-center shrink-0`}>
            <span className="text-2xl">{info?.flag || "📦"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{selectedBrand}</h1>
            <p className="text-xs text-neutral-500">{info?.origin || ""} — {group.active}/{group.total} maquinas ativas</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/15 text-xs font-semibold text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />{group.active} ativas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/15 text-xs font-semibold text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-500" />{group.total - group.active} inativas
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar maquina..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lines */}
        <div className="space-y-4">
          {filtered.map(({ line, machines }) => {
            const lineKey = `${selectedBrand}-${line}`
            const isCollapsed = collapsedLines.has(lineKey)
            const lineActive = machines.filter(m => m.isActive).length
            const allActive = lineActive === machines.length
            const isBatching = batchingGroup === lineKey

            return (
              <div key={lineKey} className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                {/* Line Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                  <button onClick={() => setCollapsedLines(prev => { const n = new Set(prev); if (n.has(lineKey)) n.delete(lineKey); else n.add(lineKey); return n })} className="flex items-center gap-3 flex-1 min-w-0">
                    <ChevronRight className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`} />
                    <span className="text-sm font-bold text-white tracking-wider truncate">{line}</span>
                    <span className="text-[10px] text-neutral-600 shrink-0">{lineActive}/{machines.length}</span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!allActive && (
                      <button
                        onClick={() => batchToggle(lineKey, machines.filter(e => !e.isActive).map(e => e.id), true)}
                        disabled={isBatching}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/15 text-[10px] font-semibold text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                      >
                        <CheckCheck className="w-3 h-3" />{isBatching ? "..." : "Ativar"}
                      </button>
                    )}
                    {lineActive > 0 && (
                      <button
                        onClick={() => batchToggle(lineKey, machines.filter(e => e.isActive).map(e => e.id), false)}
                        disabled={isBatching}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-500/10 border border-neutral-500/15 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-500/20 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />{isBatching ? "..." : "Desativar"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Machine Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                    {machines.map(ex => {
                      const img = getMachineImage(ex)
                      const isToggling = togglingIds.has(ex.id)
                      return (
                        <div
                          key={ex.id}
                          className={`group rounded-xl border overflow-hidden transition-all hover:scale-[1.01] cursor-pointer ${
                            ex.isActive
                              ? "border-green-500/15 bg-[#080808]"
                              : "border-white/[0.04] bg-[#060606] opacity-70 hover:opacity-100"
                          }`}
                          onClick={() => setDetailExercise(ex)}
                        >
                          <div className="aspect-square bg-[#050505] flex items-center justify-center overflow-hidden relative">
                            {img && !failedImgs.has(ex.id) ? (
                              <img src={img} alt={ex.name} className="w-full h-full object-contain p-2" loading="lazy" onError={() => setFailedImgs(prev => new Set(prev).add(ex.id))} />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 px-3">
                                <Dumbbell className="w-8 h-8 text-neutral-700" />
                                <p className="text-[9px] text-neutral-600 text-center leading-tight">{ex.name}</p>
                              </div>
                            )}
                            {/* 3D badge */}
                            {ex.machine3dModel && (
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-[8px] font-bold text-purple-400">
                                3D
                              </div>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); toggleActive(ex.id, ex.isActive) }}
                              disabled={isToggling}
                              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                ex.isActive
                                  ? "bg-green-500/20 border border-green-500/30 hover:bg-red-500/20 hover:border-red-500/30"
                                  : "bg-neutral-800/80 border border-neutral-700/30 hover:bg-green-500/20 hover:border-green-500/30"
                              } ${isToggling ? "animate-pulse" : ""}`}
                            >
                              <Power className={`w-3.5 h-3.5 ${ex.isActive ? "text-green-400" : "text-neutral-500"}`} />
                            </button>
                            {/* View detail hint */}
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="w-4 h-4 text-neutral-500" />
                            </div>
                          </div>
                          <div className="p-2.5 space-y-1">
                            <p className="text-xs font-semibold text-white truncate leading-tight">{ex.name}</p>
                            {ex.machineCode && <p className="text-[10px] text-neutral-600 font-mono">{ex.machineCode}</p>}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">{ex.muscle}</span>
                              {ex.weightKg && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-white/[0.06] flex items-center gap-0.5">
                                  <Weight className="w-2.5 h-2.5" />{ex.weightKg}kg
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Machine Detail Modal */}
        {detailExercise && <MachineDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} onToggle={toggleActive} onUpdate={(id, data) => { setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, ...data } : ex)); setDetailExercise(prev => prev && prev.id === id ? { ...prev, ...data } : prev) }} getMachineImage={getMachineImage} brandInfo={BRAND_INFO[selectedBrand]} brandName={selectedBrand} />}
      </div>
    )
  }

  // ─── BRAND CARDS VIEW (HOME) ───
  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Catalogo de Equipamentos</h1>
            <p className="text-xs text-neutral-500">Selecione a marca para gerenciar as maquinas</p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/15 text-xs font-semibold text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />{totalActive} ativas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/15 text-xs font-semibold text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-500" />{totalInactive} inativas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.06] text-xs font-semibold text-neutral-300">
            {exercises.length} total
          </span>
        </div>
      </div>

      {/* Brand Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-neutral-900" />
              <div className="p-4 space-y-2"><div className="h-4 bg-neutral-800 rounded w-1/2" /><div className="h-3 bg-neutral-800 rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : brandGroups.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">Nenhum equipamento cadastrado</p>
          <p className="text-neutral-600 text-sm mt-1">Rode o seed de maquinas para popular o catalogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {brandGroups.map(group => {
            const info = BRAND_INFO[group.brand]
            const colorBase = info?.color || "neutral"
            return (
              <button
                key={group.brand}
                onClick={() => setSelectedBrand(group.brand)}
                className={`group text-left rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden transition-all hover:scale-[1.02] hover:border-${colorBase}-500/20 active:scale-[0.98]`}
              >
                {/* Preview image */}
                <div className="aspect-[4/3] bg-[#050505] flex items-center justify-center overflow-hidden relative">
                  {group.sampleImage && !failedImgs.has(group.brand) ? (
                    <img
                      src={group.sampleImage}
                      alt={group.brand}
                      className="w-full h-full object-contain p-4 opacity-80 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                      onError={() => setFailedImgs(prev => new Set(prev).add(group.brand))}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-neutral-800" />
                  )}

                  {/* Flag badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xl">{info?.flag || "📦"}</span>
                  </div>

                  {/* Active count badge */}
                  {group.active > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-400">
                      {group.active} ativas
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-neutral-100">{group.brand}</h2>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {group.total} maquina{group.total !== 1 ? "s" : ""} • {group.lines.length} linha{group.lines.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${group.total > 0 ? (group.active / group.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-1">{group.active}/{group.total} ativas</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MUSCLE TARGET DATA ───
const MUSCLE_TARGETS: Record<string, { primary: string[]; secondary: string[]; tips: string[]; avoid: string[] }> = {
  "Quadriceps": { primary: ["Vasto Lateral", "Vasto Medial", "Vasto Intermedio", "Reto Femoral"], secondary: ["Gluteos", "Core"], tips: ["Joelhos alinhados com os pes", "Descer ate 90° ou mais", "Pressao nos calcanhares", "Core ativado durante todo movimento"], avoid: ["Joelhos colapsando para dentro (valgo)", "Arredondar a lombar", "Travar joelhos na extensao completa"] },
  "Hamstrings": { primary: ["Biceps Femoral", "Semitendioso", "Semimembranoso"], secondary: ["Gluteos", "Panturrilha"], tips: ["Contracao controlada no final", "Fase excentrica lenta (3s)", "Manter quadril estavel"], avoid: ["Usar impulso", "Hiperextensao lombar", "Velocidade excessiva"] },
  "Glutes": { primary: ["Gluteo Maximo", "Gluteo Medio", "Gluteo Minimo"], secondary: ["Isquiotibiais", "Core", "Quadriceps"], tips: ["Squeeze no topo por 2s", "Ativar gluteo antes de empurrar", "Amplitude completa"], avoid: ["Hiperextensao lombar", "Nao completar extensao do quadril", "Compensar com lombar"] },
  "Chest": { primary: ["Peitoral Maior", "Peitoral Menor"], secondary: ["Triceps", "Deltoide Anterior"], tips: ["Escapulas retraidas e deprimidas", "Arco toracico natural", "Cotovelos a 45-75° do tronco"], avoid: ["Bounce no peito", "Cotovelos a 90° (lesao ombro)", "Levantar gluteo do banco"] },
  "Back": { primary: ["Grande Dorsal", "Trapezio", "Romboides"], secondary: ["Biceps", "Deltoide Posterior", "Antebraco"], tips: ["Inicie com retracao escapular", "Puxe com os cotovelos, nao maos", "Segure 1s na contracao"], avoid: ["Usar impulso do corpo", "Arredondar coluna", "Puxar so com biceps"] },
  "Shoulders": { primary: ["Deltoide Anterior", "Deltoide Lateral", "Deltoide Posterior"], secondary: ["Triceps", "Trapezio"], tips: ["Core ativado o tempo todo", "Nao eleve alem de 90° com carga pesada", "Rotacao externa na elevacao"], avoid: ["Encolher trapezio", "Usar impulso das pernas", "Extensao cervical"] },
  "Biceps": { primary: ["Biceps Braquial", "Braquial", "Braquiorradial"], secondary: ["Antebraco"], tips: ["Cotovelos fixos ao lado do corpo", "Supinacao completa no topo", "Fase excentrica lenta (3s)"], avoid: ["Balancar o tronco", "Extensao incompleta", "Carga excessiva com compensacao"] },
  "Triceps": { primary: ["Cabeca Longa", "Cabeca Lateral", "Cabeca Medial"], secondary: ["Peitoral", "Deltoide Anterior"], tips: ["Extensao completa sem travar cotovelo", "Cotovelos apontando para frente", "Enfase na contracao"], avoid: ["Abrir cotovelos", "Usar ombro para compensar", "Velocidade excessiva"] },
  "Calves": { primary: ["Gastrocnemio", "Soleo"], secondary: ["Tibial Posterior"], tips: ["Amplitude completa (alongar bem embaixo)", "Squeeze no topo por 2s", "Controle na descida"], avoid: ["Usar impulso", "Amplitude parcial", "Carga excessiva sem controle"] },
  "Abs": { primary: ["Reto Abdominal", "Obliquos Internos", "Obliquos Externos"], secondary: ["Transverso", "Flexores do Quadril"], tips: ["Expire na contracao", "Mantenha lombar no solo", "Controle o movimento"], avoid: ["Puxar pescoco com as maos", "Usar impulso", "Prender respiracao"] },
  "Adductors": { primary: ["Adutor Longo", "Adutor Curto", "Adutor Magno", "Gracil"], secondary: ["Quadriceps"], tips: ["Movimento controlado", "Amplitude completa", "Manter coluna neutra"], avoid: ["Usar impulso", "Carga excessiva", "Velocidade excessiva"] },
  "Lower Back": { primary: ["Eretores da Espinha", "Multifidos"], secondary: ["Gluteos", "Core"], tips: ["Movimento controlado", "Nao hiperextender", "Core ativado"], avoid: ["Carga excessiva", "Impulso", "Arredondamento lombar"] },
  "Full Body": { primary: ["Multiplos Grupos Musculares"], secondary: ["Core", "Estabilizadores"], tips: ["Tecnica acima de carga", "Ativar core antes do movimento"], avoid: ["Compensacoes posturais", "Carga alem da capacidade"] },
}

// ─── BRAND EXPERTISE DATA ───
const BRAND_EXPERTISE: Record<string, { desc: string; specialty: string; founded: string; hq: string }> = {
  "Panatta": { desc: "Referencia mundial em maquinas plate-loaded e seletorizadas. Conhecida pela curva de carga fisiologica com sistema CAM e design biomecanico italiano.", specialty: "Plate-loaded com curva fisiologica", founded: "1988", hq: "Apiro (MC), Italia" },
  "Hammer Strength": { desc: "Referencia mundial em plate-loaded com design biomecanico convergente. Usada por atletas profissionais e academias premium.", specialty: "Plate-loaded convergente", founded: "1989", hq: "Cincinnati, OH, EUA" },
  "Matrix": { desc: "Equipamentos premium com tecnologia integrada e design ergonomico. Forte em cardio e musculacao.", specialty: "Tecnologia integrada + ergonomia", founded: "2001", hq: "Cottage Grove, WI, EUA" },
  "Nautilus": { desc: "Pioneira em maquinas de musculacao. Inventou o conceito de resistencia variavel com CAM.", specialty: "Resistencia variavel (CAM)", founded: "1970", hq: "Vancouver, WA, EUA" },
  "Hoist": { desc: "Qualidade premium com foco em biomecanica. Linha ROC-IT com ajustes independentes por membro.", specialty: "Biomecanica ROC-IT", founded: "1977", hq: "San Diego, CA, EUA" },
  "Life Fitness": { desc: "Maior fabricante mundial de equipamentos fitness. Presente em mais de 120 paises.", specialty: "Cardio + Musculacao global", founded: "1977", hq: "Rosemont, IL, EUA" },
  "Cybex Prestige": { desc: "Equipamentos de reabilitacao e performance. Foco em seguranca e biomecanica.", specialty: "Reabilitacao + Performance", founded: "1970", hq: "Medway, MA, EUA" },
  "Stark Strong": { desc: "Fabricante brasileira de equipamentos profissionais. Custo-beneficio com qualidade nacional.", specialty: "Maquinas profissionais BR", founded: "2015", hq: "Brasil" },
}

// ─── MACHINE DETAIL MODAL ───
function MachineDetailModal({ exercise, onClose, onToggle, onUpdate, getMachineImage, brandInfo, brandName }: {
  exercise: CatalogExercise
  onClose: () => void
  onToggle: (id: string, current: boolean) => void
  onUpdate: (id: string, data: Partial<CatalogExercise>) => void
  getMachineImage: (ex: CatalogExercise) => string | null
  brandInfo?: { flag: string; origin: string; color: string }
  brandName: string
}) {
  const has3D = !!exercise.machine3dModel
  const [tab, setTab] = useState<"info" | "3d" | "edit">("info")
  const [editData, setEditData] = useState({ name: exercise.name, instructions: exercise.instructions || "", imageUrl: exercise.imageUrl || "" })
  const [saving, setSaving] = useState(false)
  const [showAR, setShowAR] = useState(false)

  const img = getMachineImage(exercise)
  const muscleData = MUSCLE_TARGETS[exercise.muscle]
  const brandExpertise = BRAND_EXPERTISE[brandName]
  const specs = [
    exercise.lengthCm && { label: "Comprimento", value: `${exercise.lengthCm} cm`, icon: "📏" },
    exercise.widthCm && { label: "Largura", value: `${exercise.widthCm} cm`, icon: "↔️" },
    exercise.heightCm && { label: "Altura", value: `${exercise.heightCm} cm`, icon: "↕️" },
    exercise.weightKg && { label: "Peso Maquina", value: `${exercise.weightKg} kg`, icon: "⚖️" },
    exercise.maxLoadKg && { label: "Carga Maxima", value: `${exercise.maxLoadKg} kg`, icon: "🏋️" },
  ].filter(Boolean) as { label: string; value: string; icon: string }[]

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/exercises?id=${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editData.name, instructions: editData.instructions || null, imageUrl: editData.imageUrl || null }),
      })
      if (res.ok) {
        onUpdate(exercise.id, { name: editData.name, instructions: editData.instructions || null, imageUrl: editData.imageUrl || null })
        setTab("info")
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Image (foto only — 3D fica exclusivo na tab) */}
        <div className="relative w-full h-48 sm:h-64 bg-[#050505] flex items-center justify-center overflow-hidden shrink-0">
          {img ? (
            <img src={img} alt={exercise.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="text-center">
              <Dumbbell className="w-14 h-14 text-neutral-700 mx-auto mb-2" />
              <p className="text-[10px] text-neutral-600">{has3D ? "Veja o modelo 3D na aba abaixo" : "Sem foto — edite para adicionar"}</p>
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-semibold text-white border border-white/10">
              {brandInfo?.flag} {brandName}
            </span>
            {exercise.machine3dModel && (
              <span className="px-2 py-1 rounded-full bg-purple-500/20 backdrop-blur-sm text-[10px] font-bold text-purple-400 border border-purple-500/30">3D</span>
            )}
          </div>
          <div className="absolute bottom-3 right-3">
            <button
              onClick={() => onToggle(exercise.id, exercise.isActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                exercise.isActive ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-neutral-800/80 border-neutral-700/30 text-neutral-400"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {exercise.isActive ? "Ativa" : "Inativa"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] shrink-0">
          {[
            { key: "info" as const, label: "Detalhes" },
            ...(has3D ? [{ key: "3d" as const, label: "3D / AR" }] : []),
            { key: "edit" as const, label: "Editar" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${tab === t.key ? "text-white border-b-2 border-red-500" : "text-neutral-600 hover:text-neutral-400"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 pb-10">
          {tab === "info" ? (
            <>
              {/* Title + Tags */}
              <div>
                <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {exercise.machineCode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/[0.06] font-mono">{exercise.machineCode}</span>}
                  {exercise.machineLine && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/[0.06]">{exercise.machineLine}</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">{exercise.muscle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-white/[0.06]">{exercise.equipment}</span>
                </div>
              </div>

              {/* Muscle Targets */}
              {muscleData && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                    Musculos Alvo
                  </h3>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
                      <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">Primarios</p>
                      <div className="flex flex-wrap gap-1.5">
                        {muscleData.primary.map(m => (
                          <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/15">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                      <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1">Secundarios / Sinergistas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {muscleData.secondary.map(m => (
                          <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/15">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {exercise.instructions && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    Descricao e Recursos
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">{exercise.instructions}</p>
                </div>
              )}

              {/* Execution Tips */}
              {muscleData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span> Dicas de Execucao
                    </h3>
                    <div className="space-y-1.5">
                      {muscleData.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <span className="text-emerald-400 text-xs mt-0.5 shrink-0">✓</span>
                          <p className="text-[11px] text-emerald-300/80 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-red-400">✕</span> O Que Evitar
                    </h3>
                    <div className="space-y-1.5">
                      {muscleData.avoid.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                          <p className="text-[11px] text-red-300/80 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Specs */}
              {specs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-blue-400" />
                    Especificacoes Tecnicas
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {specs.map(s => (
                      <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <p className="text-xs mb-0.5">{s.icon}</p>
                        <p className="text-base font-bold text-white">{s.value}</p>
                        <p className="text-[9px] text-neutral-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Expertise Card */}
              <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                    <span className="text-2xl">{brandInfo?.flag || "📦"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{brandName}</p>
                    <p className="text-[10px] text-neutral-500">{brandInfo?.origin || ""} — {exercise.equipment}</p>
                  </div>
                </div>
                {brandExpertise && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{brandExpertise.desc}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Fundada</p>
                        <p className="text-xs font-bold text-white">{brandExpertise.founded}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Sede</p>
                        <p className="text-xs font-bold text-white">{brandExpertise.hq}</p>
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Especialidade</p>
                      <p className="text-xs text-amber-400 font-semibold">{brandExpertise.specialty}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : tab === "3d" && has3D ? (
            /* ─── 3D / AR TAB ─── */
            <div className="space-y-4">
              <MachineViewer slug={exercise.machine3dModel!} machineName={exercise.name} />

              {/* AR Button */}
              <button
                onClick={() => setShowAR(true)}
                className="w-full py-3 rounded-xl bg-purple-600/20 border border-purple-500/20 text-sm font-semibold text-purple-400 hover:bg-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <View className="w-4 h-4" />
                Ver em Realidade Aumentada (AR)
              </button>

              <p className="text-center text-[10px] text-neutral-600">Arraste para girar — Pinca para zoom — AR coloca a maquina no seu espaco</p>

              {showAR && (
                <Suspense fallback={null}>
                  <MachineARViewer
                    modelUrl={`/models/machines/${exercise.machine3dModel}.glb`}
                    machineName={exercise.name}
                    onClose={() => setShowAR(false)}
                  />
                </Suspense>
              )}
            </div>
          ) : (
            /* ─── EDIT TAB ─── */
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Nome do exercicio</label>
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Instrucoes de execucao</label>
                <textarea value={editData.instructions} onChange={e => setEditData({ ...editData, instructions: e.target.value })} rows={5} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30 resize-none" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">URL da foto</label>
                <div className="flex gap-2">
                  <input value={editData.imageUrl} onChange={e => setEditData({ ...editData, imageUrl: e.target.value })} placeholder="/machines/panatta/1fw087.png" className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30" />
                  <label className="shrink-0 px-3 py-2.5 rounded-xl bg-red-600/20 border border-red-500/20 text-xs text-red-400 cursor-pointer hover:bg-red-600/30 transition-colors flex items-center gap-1.5 font-semibold">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const { upload } = await import("@vercel/blob/client")
                        const blob = await upload(`machines/${Date.now()}-${file.name}`, file, { access: "public", handleUploadUrl: "/api/upload" })
                        setEditData({ ...editData, imageUrl: blob.url })
                      } catch {
                        const reader = new FileReader()
                        reader.onload = () => setEditData({ ...editData, imageUrl: reader.result as string })
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                </div>
                {editData.imageUrl && editData.imageUrl.startsWith("http") && (
                  <img src={editData.imageUrl} alt="Preview" className="mt-2 w-full max-h-32 object-cover rounded-lg border border-white/[0.06]" />
                )}
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar Alteracoes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
