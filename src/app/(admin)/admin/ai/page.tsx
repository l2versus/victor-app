"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function Page() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    import("./ai-client").then(mod => setComponent(() => mod.default))
  }, [])

  if (!Component) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500 text-sm animate-pulse">Carregando IA...</p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>
      <Component />
    </div>
  )
}
