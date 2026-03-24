"use client"

import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { RotateCcw, Maximize2, X } from "lucide-react"

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <Center><primitive object={scene} scale={1} /></Center>
}

interface Props {
  slug: string
  machineName?: string
  onBrandLoaded?: (brand: string | null) => void
}

export default function MachineInlineViewer({ slug, machineName, onBrandLoaded }: Props) {
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [resolvedName, setResolvedName] = useState(machineName || slug)
  const [brand, setBrand] = useState<string | null>(null)
  const modelUrl = `/models/machines/${slug}.glb`

  useEffect(() => {
    // Load machine info from index.json
    Promise.all([
      fetch(modelUrl, { method: "HEAD" }).then(r => r.ok).catch(() => false),
      fetch("/api/machines").then(r => r.json()).catch(() => ({})),
    ]).then(([fileExists, index]) => {
      setExists(fileExists)
      const info = index[slug]
      if (info) {
        if (info.name && !info.name.includes("-")) setResolvedName(info.name)
        if (info.brand) {
          setBrand(info.brand)
          onBrandLoaded?.(info.brand)
        }
      }
      setLoading(false)
    })
  }, [modelUrl, slug, onBrandLoaded])

  if (loading) {
    return (
      <div className="w-full h-75 rounded-2xl bg-[#080808] border border-white/[0.06] flex items-center justify-center">
        <RotateCcw className="w-5 h-5 text-neutral-700 animate-spin" />
      </div>
    )
  }

  if (!exists) return null

  return (
    <>
      <div className="relative w-full h-75 rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.06]">
        <Canvas camera={{ position: [2.5, 1.8, 2.5], fov: 40 }} style={{ background: "#080808" }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} />
          <pointLight position={[0, 3, 0]} intensity={0.3} color="#ef4444" />
          <Suspense fallback={null}>
            <Model url={modelUrl} />
            <Environment preset="studio" />
          </Suspense>
          <OrbitControls autoRotate autoRotateSpeed={1.5} enablePan={false} minDistance={0.5} maxDistance={6} />
        </Canvas>

        {/* Loading spinner fallback */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <RotateCcw className="w-5 h-5 text-neutral-800 animate-spin" />
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-white/10"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* 3D badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-red-600/20 text-[10px] text-red-400 font-bold border border-red-500/20 backdrop-blur-sm">3D IRONBERG</span>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[9px] text-neutral-600">Arraste para girar</span>
        </div>
      </div>

      {resolvedName && (
        <div className="text-center mt-2">
          <p className="text-xs text-white font-medium">{resolvedName}</p>
          {brand && <p className="text-[10px] text-neutral-500">{brand}</p>}
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-80 bg-black" onClick={() => setFullscreen(false)}>
          <Canvas camera={{ position: [3, 2, 3], fov: 40 }} style={{ background: "#000" }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <directionalLight position={[-3, 2, -3]} intensity={0.4} />
            <pointLight position={[0, 3, 0]} intensity={0.3} color="#ef4444" />
            <Suspense fallback={null}>
              <Model url={modelUrl} />
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls autoRotate autoRotateSpeed={0.8} enablePan minDistance={0.3} maxDistance={10} />
          </Canvas>
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="px-3 py-1.5 rounded-xl bg-red-600/20 text-xs text-red-400 font-bold border border-red-500/20 backdrop-blur-sm">3D IRONBERG</span>
            {resolvedName && <p className="text-neutral-500 text-xs mt-2">{resolvedName}</p>}
          </div>
        </div>
      )}
    </>
  )
}
