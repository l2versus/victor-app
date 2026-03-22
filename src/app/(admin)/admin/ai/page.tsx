"use client"

import { useEffect, useState } from "react"

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

  return <Component />
}
