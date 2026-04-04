"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, ChevronRight, Power, Package, Dumbbell, Ruler, Weight, CheckCheck, XCircle } from "lucide-react"

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

function getMachineImage(ex: CatalogExercise): string | null {
  if (ex.imageUrl) return ex.imageUrl
  if (ex.machineCode) return `/machines/panatta/${ex.machineCode.toLowerCase()}.png`
  return null
}

export default function CatalogoPage() {
  const [exercises, setExercises] = useState<CatalogExercise[]>([])
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [batchingGroup, setBatchingGroup] = useState<string | null>(null)
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ showInactive: "true", hasMachine: "true", limit: "9999" })
      if (brandFilter) params.set("brand", brandFilter)
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/exercises?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const exs = data.exercises || []
      setExercises(exs)
      if (!brandFilter) {
        setAllBrands([...new Set(exs.map((e: CatalogExercise) => e.machineBrand).filter(Boolean))] as string[])
      }
    } catch {
      console.error("Failed to fetch catalog")
    } finally {
      setLoading(false)
    }
  }, [brandFilter, search])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [fetchData])

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

  // Batch toggle all in a group
  async function batchToggle(groupKey: string, ids: string[], activate: boolean) {
    setBatchingGroup(groupKey)
    setExercises(prev => prev.map(ex => ids.includes(ex.id) ? { ...ex, isActive: activate } : ex))
    const failedIds: string[] = []
    const batches = []
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10))
    }
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
      setExercises(prev => prev.map(ex =>
        failedIds.includes(ex.id) ? { ...ex, isActive: !activate } : ex
      ))
    }
    setBatchingGroup(null)
  }

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key); else n.add(key)
      return n
    })
  }

  // Stats
  const totalActive = exercises.filter(e => e.isActive).length
  const totalInactive = exercises.filter(e => !e.isActive).length

  // Use cached brands for dropdown (so changing filter doesn't lose options)
  const brands = allBrands.length > 0 ? allBrands : [...new Set(exercises.map(e => e.machineBrand).filter(Boolean))] as string[]

  // Group by brand + line
  const grouped = exercises.reduce<Record<string, CatalogExercise[]>>((acc, ex) => {
    const key = ex.machineLine
      ? `${ex.machineBrand} — ${ex.machineLine}`
      : ex.machineBrand || "Outros"
    if (!acc[key]) acc[key] = []
    acc[key].push(ex)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Catalogo de Equipamentos</h1>
            <p className="text-xs text-neutral-500">Gerencie as maquinas disponiveis na academia</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/15 text-xs font-semibold text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {totalActive} ativas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/15 text-xs font-semibold text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-500" />
            {totalInactive} inativas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.06] text-xs font-semibold text-neutral-300">
            {exercises.length} total
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
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
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 min-w-[180px]"
        >
          <option value="">Todas as Marcas</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden animate-pulse">
              <div className="aspect-square bg-neutral-900" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-neutral-800 rounded w-3/4" />
                <div className="h-2 bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">Nenhum equipamento encontrado</p>
          <p className="text-neutral-600 text-sm mt-1">Rode o seed de maquinas ou ajuste o filtro</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, items]) => {
              const isCollapsed = collapsedGroups.has(groupKey)
              const activeCount = items.filter(e => e.isActive).length
              const allActive = activeCount === items.length
              const isBatching = batchingGroup === groupKey

              return (
                <div key={groupKey} className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                  {/* Group Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                    <button onClick={() => toggleGroup(groupKey)} className="flex items-center gap-3 flex-1 min-w-0">
                      <ChevronRight className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`} />
                      <span className="text-sm font-bold text-white uppercase tracking-wider truncate">{groupKey}</span>
                      <span className="text-[10px] text-neutral-600 shrink-0">
                        {activeCount}/{items.length} ativas
                      </span>
                    </button>

                    {/* Batch buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!allActive && (
                        <button
                          onClick={() => batchToggle(groupKey, items.filter(e => !e.isActive).map(e => e.id), true)}
                          disabled={isBatching}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/15 text-[10px] font-semibold text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                        >
                          <CheckCheck className="w-3 h-3" />
                          {isBatching ? "..." : "Ativar todas"}
                        </button>
                      )}
                      {activeCount > 0 && (
                        <button
                          onClick={() => batchToggle(groupKey, items.filter(e => e.isActive).map(e => e.id), false)}
                          disabled={isBatching}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-500/10 border border-neutral-500/15 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-500/20 transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          {isBatching ? "..." : "Desativar"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className={`transition-all duration-200 ${isCollapsed ? "max-h-0 overflow-hidden" : ""}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                      {items.sort((a, b) => a.name.localeCompare(b.name)).map(ex => {
                        const img = getMachineImage(ex)
                        const isToggling = togglingIds.has(ex.id)

                        return (
                          <div
                            key={ex.id}
                            className={`group rounded-xl border overflow-hidden transition-all hover:scale-[1.01] ${
                              ex.isActive
                                ? "border-green-500/15 bg-[#080808]"
                                : "border-white/[0.04] bg-[#060606] opacity-75 hover:opacity-100"
                            }`}
                          >
                            {/* Photo */}
                            <div className="aspect-square bg-[#050505] flex items-center justify-center overflow-hidden relative">
                              {img && !failedImgs.has(ex.id) ? (
                                <img
                                  src={img}
                                  alt={ex.name}
                                  className="w-full h-full object-contain p-2"
                                  loading="lazy"
                                  onError={() => setFailedImgs(prev => new Set(prev).add(ex.id))}
                                />
                              ) : (
                                <Dumbbell className="w-8 h-8 text-neutral-800" />
                              )}

                              {/* Active dot */}
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

                            {/* Info */}
                            <div className="p-2.5 space-y-1">
                              <p className="text-xs font-semibold text-white truncate leading-tight">{ex.name}</p>
                              {ex.machineCode && (
                                <p className="text-[10px] text-neutral-600 font-mono">{ex.machineCode}</p>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/15">
                                  {ex.muscle}
                                </span>
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
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
