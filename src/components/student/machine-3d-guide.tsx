"use client"

import { Suspense, useState, useEffect, lazy } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { RotateCcw, X, Box, View } from "lucide-react"

const MachineARViewer = lazy(() => import("./machine-ar-viewer"))

// ═══════════════════════════════════════════════════════════════════
// MACHINE 3D GUIDE — Guia visual da máquina antes da análise
// Mostra modelo 3D interativo no posture-analyzer
// O aluno vê a máquina, entende como se posicionar, depois inicia
// ═══════════════════════════════════════════════════════════════════

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  )
}

interface Machine3DGuideProps {
  modelSlug: string
  machineName: string
  onClose: () => void
}

export function Machine3DGuide({ modelSlug, machineName, onClose }: Machine3DGuideProps) {
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAR, setShowAR] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const modelUrl = `/models/machines/${modelSlug}.glb`

  useEffect(() => {
    // Check if model file exists
    fetch(modelUrl, { method: "HEAD" })
      .then(r => {
        setExists(r.ok)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [modelUrl])

  if (loading || !exists) return null

  return (
    <>
      <div className="rounded-2xl border border-white/[0.08] bg-[#111] overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] text-neutral-400 font-medium">Guia 3D</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/20 font-bold">3D</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAR(true)}
              className="h-6 px-2 rounded-lg bg-red-600/80 flex items-center gap-1 text-white text-[9px] font-bold border border-red-500/30 active:scale-95 transition-transform"
            >
              <View className="w-3 h-3" />
              AR
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-neutral-500 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3D Viewer */}
        {!loadError ? (
          <div className="relative w-full h-[200px]">
            <Canvas
              camera={{ position: [2, 1.5, 2], fov: 45 }}
              style={{ background: "#0a0a0a" }}
              onError={() => setLoadError(true)}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <Suspense fallback={null}>
                <Model url={modelUrl} />
                <Environment preset="studio" />
              </Suspense>
              <OrbitControls
                autoRotate
                autoRotateSpeed={2}
                enablePan={false}
                minDistance={0.8}
                maxDistance={5}
              />
            </Canvas>

            {/* Loading fallback */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <RotateCcw className="w-4 h-4 text-neutral-700 animate-spin" />
            </div>
          </div>
        ) : (
          <div className="w-full h-[200px] flex flex-col items-center justify-center bg-[#0a0a0a] text-neutral-600">
            <Box className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[10px]">Modelo 3D indisponivel</p>
          </div>
        )}

        {/* Footer with machine name + AR hint */}
        <div className="px-3 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-[10px] text-neutral-500">
            {machineName} — arraste para girar
          </p>
          <button
            onClick={() => setShowAR(true)}
            className="text-[9px] text-red-400 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <View className="w-3 h-3" />
            Ver em AR
          </button>
        </div>
      </div>

      {/* AR Viewer modal */}
      {showAR && (
        <Suspense fallback={null}>
          <MachineARViewer
            modelUrl={modelUrl}
            machineName={machineName}
            onClose={() => setShowAR(false)}
          />
        </Suspense>
      )}
    </>
  )
}

// ─── Utility: check if a machine has a 3D model ───
export function useMachine3DModel(exerciseId: string): string | null {
  const [modelSlug, setModelSlug] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/machines")
      .then(r => r.json())
      .then((index: Record<string, { file: string; name: string }>) => {
        // Check if any model matches this exercise ID
        const match = Object.entries(index).find(([slug]) =>
          exerciseId.includes(slug) || slug.includes(exerciseId)
        )
        if (match) setModelSlug(match[0])
      })
      .catch(() => {})
  }, [exerciseId])

  return modelSlug
}
