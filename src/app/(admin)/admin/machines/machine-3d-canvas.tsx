"use client"

import { Suspense, useRef, useState, useEffect, Component, type ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei"
import { RotateCcw, Box, AlertTriangle } from "lucide-react"

/* ── Global WebGL context limiter ── */
const MAX_CONTEXTS = 4
let activeCount = 0
const waiters: (() => void)[] = []

function acquireSlot(): Promise<void> {
  if (activeCount < MAX_CONTEXTS) {
    activeCount++
    return Promise.resolve()
  }
  return new Promise<void>(resolve => waiters.push(resolve))
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1)
  const next = waiters.shift()
  if (next) { activeCount++; next() }
}

/* ── Error Boundary — catches GLB load failures ── */
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorPlaceholder />
    }
    return this.props.children
  }
}

/* ── Error placeholder when model fails to load ── */
function ErrorPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <AlertTriangle className="w-6 h-6 text-red-500/50 mx-auto mb-1" />
        <p className="text-[10px] text-neutral-600">Modelo indisponível</p>
      </div>
    </div>
  )
}

/* ── 3D Model component ── */
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  )
}

/* ── Placeholder shown while canvas is not active ── */
function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <Box className="w-8 h-8 text-neutral-700 mx-auto mb-1" />
        <p className="text-[10px] text-neutral-700">3D</p>
      </div>
    </div>
  )
}

/* ── Main component with lazy loading ── */
export default function Machine3DCanvas({ modelUrl, fullscreen }: { modelUrl: string; fullscreen?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [slotReady, setSlotReady] = useState(false)

  // Fullscreen mode: always render immediately
  useEffect(() => {
    if (fullscreen) {
      setVisible(true)
      setSlotReady(true)
    }
  }, [fullscreen])

  // IntersectionObserver — only render when in viewport
  useEffect(() => {
    if (fullscreen) return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px", threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fullscreen])

  // Acquire/release WebGL context slot
  useEffect(() => {
    if (fullscreen || !visible) {
      setSlotReady(false)
      return
    }

    let cancelled = false
    acquireSlot().then(() => {
      if (!cancelled) setSlotReady(true)
    })

    return () => {
      cancelled = true
      if (slotReady) releaseSlot()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fullscreen])

  const showCanvas = fullscreen || (visible && slotReady)

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {showCanvas ? (
        <Canvas3DErrorBoundary>
          <Canvas
            camera={{ position: [2.5, 1.8, 2.5], fov: fullscreen ? 40 : 45 }}
            style={{ background: fullscreen ? "#000" : "#050505" }}
            gl={{ powerPreference: "low-power", antialias: !fullscreen }}
            frameloop={visible ? "always" : "demand"}
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
        </Canvas3DErrorBoundary>
      ) : (
        <Placeholder />
      )}
    </div>
  )
}
