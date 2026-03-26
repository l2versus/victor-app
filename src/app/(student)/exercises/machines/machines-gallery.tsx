"use client"

import { useState, useEffect, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { ArrowLeft, X, RotateCcw, Box, ChevronRight } from "lucide-react"
import Link from "next/link"

// ═══════════════════════════════════════════════════════════════════
// VICTOR PERSONAL MACHINES 3D GALLERY
// Galeria de todas as máquinas 3D do Victor Personal
// Clica no card → abre viewer fullscreen com rotação
// ═══════════════════════════════════════════════════════════════════

interface ModelEntry {
  slug: string
  file: string
  name: string
  addedAt: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  )
}

function MiniPreview({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [2, 1.5, 2], fov: 50 }} style={{ background: "#111" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <Suspense fallback={null}>
        <Model url={url} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} enablePan={false} />
    </Canvas>
  )
}

function FullscreenViewer({ model, onClose }: { model: ModelEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <p className="text-sm font-bold text-white">
            {model.name.length > 36 ? `Maquina #${model.slug.slice(0, 6)}` : model.name}
          </p>
          <p className="text-[10px] text-neutral-500">Arraste para girar · Pinch para zoom</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas camera={{ position: [3, 2, 3], fov: 40 }} style={{ background: "#0a0a0a" }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-3, 2, -3]} intensity={0.3} />
          <Suspense fallback={null}>
            <Model url={model.file} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enablePan={false}
            minDistance={0.5}
            maxDistance={8}
          />
        </Canvas>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between safe-bottom">
        <p className="text-[9px] text-neutral-600 font-mono">{model.slug}.glb</p>
        <span className="text-[8px] px-2 py-1 rounded-full bg-red-600/15 text-red-400 border border-red-500/20 font-bold">
          VICTOR PERSONAL
        </span>
      </div>
    </div>
  )
}

export default function MachinesGallery() {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ModelEntry | null>(null)

  useEffect(() => {
    fetch("/api/machines")
      .then(r => r.json())
      .then((data: Record<string, { file: string; name: string; addedAt: string }>) => {
        const entries = Object.entries(data)
          .filter(([slug]) => !slug.includes("(1)")) // skip duplicates
          .map(([slug, info]) => ({ slug, ...info }))
        setModels(entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RotateCcw className="w-6 h-6 text-red-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <Link href="/exercises" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 mb-3 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Biblioteca
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Maquinas Victor Personal</h1>
            <p className="text-[11px] text-neutral-500">{models.length} modelos 3D · Toque para visualizar</p>
          </div>
        </div>
      </div>

      {/* Grid de máquinas */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {models.map((model, i) => (
          <button
            key={model.slug}
            onClick={() => setSelected(model)}
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-red-500/20 hover:bg-red-600/[0.03] transition-all active:scale-[0.97]"
          >
            {/* 3D Preview */}
            <div className="aspect-square relative">
              <MiniPreview url={model.file} />
              {/* Number badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/10">
                <span className="text-[9px] font-mono text-neutral-400">{i + 1}</span>
              </div>
              {/* Tap indicator */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span className="text-[8px] text-neutral-400">Abrir</span>
                <ChevronRight className="w-2.5 h-2.5 text-neutral-500" />
              </div>
            </div>

            {/* Label */}
            <div className="px-3 py-2 border-t border-white/[0.04]">
              <p className="text-[10px] text-neutral-400 truncate font-medium">
                {model.slug === "flexora" ? "Flexora"
                  : model.slug === "perdulo" ? "Pendulum Squat"
                  : `Maquina ${i + 1}`}
              </p>
              <p className="text-[8px] text-neutral-700 font-mono truncate">{model.slug.slice(0, 12)}...</p>
            </div>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {models.length === 0 && (
        <div className="text-center py-16">
          <Box className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhum modelo 3D encontrado</p>
          <p className="text-neutral-600 text-xs mt-1">Adicione .glb em scripts/glb-input/</p>
        </div>
      )}

      {/* Fullscreen viewer */}
      {selected && (
        <FullscreenViewer model={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
