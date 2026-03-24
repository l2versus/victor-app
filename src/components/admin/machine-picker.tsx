"use client"

import { useState, useEffect, Suspense } from "react"
import { Box, X, Search, Check, RotateCcw } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { cn } from "@/lib/utils"

type MachineEntry = {
  slug: string
  name: string
  brand: string | null
  file: string
  addedAt: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <Center><primitive object={scene} scale={1} /></Center>
}

function MiniPreview({ slug }: { slug: string }) {
  return (
    <div className="relative w-full h-[180px] rounded-xl overflow-hidden bg-[#080808] border border-white/[0.06]">
      <Canvas camera={{ position: [2, 1.5, 2], fov: 45 }} style={{ background: "#080808" }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, 2, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <Model url={`/models/machines/${slug}.glb`} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} minDistance={0.8} maxDistance={5} />
      </Canvas>
      <div className="absolute bottom-2 right-2">
        <span className="px-1.5 py-0.5 rounded bg-red-600/20 text-[8px] text-red-400 font-bold border border-red-500/20">3D</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <RotateCcw className="w-4 h-4 text-neutral-800 animate-spin" />
      </div>
    </div>
  )
}

interface MachinePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MachinePicker({ value, onChange, className }: MachinePickerProps) {
  const [open, setOpen] = useState(false)
  const [machines, setMachines] = useState<MachineEntry[]>([])
  const [search, setSearch] = useState("")
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/machines")
      .then(r => r.json())
      .then((data: Record<string, { file: string; name: string; brand?: string | null; addedAt: string }>) => {
        setMachines(Object.entries(data).map(([slug, info]) => ({
          slug,
          name: info.name,
          brand: info.brand || null,
          file: info.file,
          addedAt: info.addedAt,
        })))
      })
      .catch(() => {})
  }, [])

  const filtered = machines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.slug.toLowerCase().includes(search.toLowerCase())
  )

  const selectedMachine = machines.find(m => m.slug === value || m.name === value)

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-8 sm:h-9 px-3 rounded-xl border text-xs sm:text-sm transition-all w-full text-left",
          value
            ? "border-amber-500/20 bg-amber-500/5 text-amber-300 hover:border-amber-500/30"
            : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700",
          className
        )}
      >
        <Box className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 truncate">
          {selectedMachine ? selectedMachine.name : value || "Selecionar máquina 3D"}
        </span>
        {value && (
          <span className="px-1 py-0.5 rounded bg-red-600/20 text-[8px] text-red-400 font-bold border border-red-500/20 shrink-0">3D</span>
        )}
      </button>

      {/* Picker Modal */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md max-h-[85dvh] rounded-t-3xl sm:rounded-2xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white">Equipamentos 3D</h3>
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-400 font-medium">{machines.length}</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar máquina..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-500/30"
                  autoFocus
                />
              </div>
            </div>

            {/* 3D Preview */}
            {preview && (
              <div className="px-4 pb-3 shrink-0">
                <MiniPreview slug={preview} />
              </div>
            )}

            {/* Machine List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {/* "Nenhuma" option */}
              <button
                onClick={() => { onChange(""); setOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                  !value ? "bg-red-600/10 border border-red-500/20" : "hover:bg-white/[0.03] border border-transparent"
                )}
              >
                <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0", !value ? "bg-red-600 border-red-600" : "border-neutral-700")}>
                  {!value && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-neutral-400">Nenhuma máquina</span>
              </button>

              {filtered.map(machine => {
                const isSelected = value === machine.slug || value === machine.name
                return (
                  <div key={machine.slug} className="flex items-center gap-1">
                    <button
                      onClick={() => { onChange(machine.slug); setOpen(false) }}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                        isSelected ? "bg-red-600/10 border border-red-500/20" : "hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0", isSelected ? "bg-red-600 border-red-600" : "border-neutral-700")}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{machine.name}</p>
                        <p className="text-[10px] text-neutral-600 truncate">{machine.brand || "Sem marca"}</p>
                      </div>
                      <span className="px-1 py-0.5 rounded bg-amber-500/10 text-[8px] text-amber-400 font-bold border border-amber-500/15 shrink-0">3D</span>
                    </button>
                    {/* Preview toggle */}
                    <button
                      onClick={() => setPreview(preview === machine.slug ? null : machine.slug)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        preview === machine.slug
                          ? "bg-red-600/15 text-red-400 border border-red-500/20"
                          : "bg-white/[0.03] text-neutral-600 hover:text-neutral-400 border border-transparent"
                      )}
                      title="Preview 3D"
                    >
                      <Box className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <p className="text-xs text-neutral-600 text-center py-6">Nenhuma máquina encontrada</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
