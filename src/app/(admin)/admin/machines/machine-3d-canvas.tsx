"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { RotateCcw } from "lucide-react"

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  )
}

export default function Machine3DCanvas({ modelUrl, fullscreen }: { modelUrl: string; fullscreen?: boolean }) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [2.5, 1.8, 2.5], fov: fullscreen ? 40 : 45 }}
        style={{ background: fullscreen ? "#000" : "#050505" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.3} color="#ff4444" />
        <Suspense fallback={null}>
          <Model url={modelUrl} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={fullscreen ? 1.5 : 3}
          enablePan={false}
          minDistance={0.5}
          maxDistance={8}
        />
      </Canvas>

      {/* Subtle loading spinner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <RotateCcw className="w-5 h-5 text-neutral-800 animate-spin" />
      </div>
    </div>
  )
}
