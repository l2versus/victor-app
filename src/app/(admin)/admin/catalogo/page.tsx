"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, ChevronLeft, ChevronRight, Power, Package, Dumbbell, Ruler, Weight, CheckCheck, XCircle, ArrowLeft } from "lucide-react"

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
                          className={`group rounded-xl border overflow-hidden transition-all hover:scale-[1.01] ${
                            ex.isActive
                              ? "border-green-500/15 bg-[#080808]"
                              : "border-white/[0.04] bg-[#060606] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="aspect-square bg-[#050505] flex items-center justify-center overflow-hidden relative">
                            {img && !failedImgs.has(ex.id) ? (
                              <img src={img} alt={ex.name} className="w-full h-full object-contain p-2" loading="lazy" onError={() => setFailedImgs(prev => new Set(prev).add(ex.id))} />
                            ) : (
                              <Dumbbell className="w-8 h-8 text-neutral-800" />
                            )}
                            <button
                              onClick={() => toggleActive(ex.id, ex.isActive)}
                              disabled={isToggling}
                              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                ex.isActive
                                  ? "bg-green-500/20 border border-green-500/30 hover:bg-red-500/20 hover:border-red-500/30"
                                  : "bg-neutral-800/80 border border-neutral-700/30 hover:bg-green-500/20 hover:border-green-500/30"
                              } ${isToggling ? "animate-pulse" : ""}`}
                            >
                              <Power className={`w-3.5 h-3.5 ${ex.isActive ? "text-green-400" : "text-neutral-500"}`} />
                            </button>
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
                            {(ex.widthCm || ex.lengthCm) && (
                              <p className="text-[9px] text-neutral-700 flex items-center gap-0.5">
                                <Ruler className="w-2.5 h-2.5" />
                                {[ex.lengthCm, ex.widthCm, ex.heightCm].filter(Boolean).join(" x ")} cm
                              </p>
                            )}
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
