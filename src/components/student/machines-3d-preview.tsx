"use client"

import { useState, useEffect, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { ChevronLeft, ChevronRight, RotateCcw, Check, Tag } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════
// MACHINES 3D PREVIEW — QA Page
// Visualiza cada modelo .glb, permite renomear, identificar máquinas
// Rota: /posture/machines-preview (temporária, só para QA)
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

export default function MachinesPreview() {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [identified, setIdentified] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/models/machines/index.json")
      .then(r => r.json())
      .then((data: Record<string, { file: string; name: string; addedAt: string }>) => {
        const entries = Object.entries(data).map(([slug, info]) => ({
          slug,
          ...info,
        }))
        setModels(entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-neutral-500 text-sm animate-pulse">Carregando modelos...</p>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-neutral-400 text-sm">Nenhum modelo encontrado</p>
          <p className="text-neutral-600 text-xs mt-2">Rode: node scripts/process-3d-models.js</p>
        </div>
      </div>
    )
  }

  const current = models[currentIndex]
  const isIdentified = !!identified[current.slug]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold">QA — Modelos 3D Máquinas</h1>
          <p className="text-[10px] text-neutral-500">{currentIndex + 1} de {models.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-1 rounded-lg bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
            {Object.keys(identified).length} identificados
          </span>
          <span className="text-[9px] px-2 py-1 rounded-lg bg-amber-600/15 text-amber-400 border border-amber-500/20">
            {models.length - Object.keys(identified).length} pendentes
          </span>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="relative w-full" style={{ height: "55vh" }}>
        <Canvas
          key={current.file}
          camera={{ position: [2, 1.5, 2], fov: 50 }}
          style={{ background: "#111" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-3, 3, -3]} intensity={0.4} />
          <Suspense fallback={null}>
            <Model url={current.file} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enablePan={false}
            minDistance={1}
            maxDistance={6}
          />
        </Canvas>

        {/* Navigation arrows */}
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(models.length - 1, currentIndex + 1))}
          disabled={currentIndex === models.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Model number badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10">
          <span className="text-xs font-mono text-white"># {currentIndex + 1}</span>
        </div>

        {/* Identified badge */}
        {isIdentified && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/30 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300">{identified[current.slug]}</span>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="p-4 space-y-3">
        {/* File info */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Arquivo</span>
          </div>
          <p className="text-xs font-mono text-neutral-300 break-all">{current.slug}.glb</p>
          <p className="text-[10px] text-neutral-600 mt-1">Nome atual: {current.name}</p>
        </div>

        {/* Quick identify buttons — 2 que já sabemos */}
        {current.slug === "flexora" && !isIdentified && (
          <button
            onClick={() => setIdentified(prev => ({ ...prev, [current.slug]: "Flexora (Mesa Flexora)" }))}
            className="w-full py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/20 text-sm text-emerald-400"
          >
            Identificar como: Flexora (Mesa Flexora)
          </button>
        )}
        {current.slug === "perdulo" && !isIdentified && (
          <button
            onClick={() => setIdentified(prev => ({ ...prev, [current.slug]: "Pendulum Squat" }))}
            className="w-full py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/20 text-sm text-emerald-400"
          >
            Identificar como: Pendulum Squat
          </button>
        )}

        {/* Model grid — thumbnails */}
        <div className="grid grid-cols-5 gap-1.5">
          {models.map((m, i) => (
            <button
              key={m.slug}
              onClick={() => setCurrentIndex(i)}
              className={`aspect-square rounded-lg border text-[9px] font-mono flex items-center justify-center transition-all ${
                i === currentIndex
                  ? "border-red-500/40 bg-red-600/10 text-red-400"
                  : identified[m.slug]
                    ? "border-emerald-500/20 bg-emerald-600/[0.06] text-emerald-500"
                    : "border-white/[0.06] bg-white/[0.02] text-neutral-600 hover:border-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <p className="text-[10px] text-neutral-600 text-center">
          Arraste para girar o modelo. Use as setas para navegar. Tire print e mande aqui para identificar.
        </p>
      </div>
    </div>
  )
}
