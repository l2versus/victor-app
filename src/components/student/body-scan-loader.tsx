"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const BodyScanAnalyzer = dynamic(
  () => import("@/components/student/body-scan-analyzer").then(m => ({ default: m.BodyScanAnalyzer })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[3/4] rounded-2xl bg-zinc-900/50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-neutral-600 mx-auto animate-spin" />
          <p className="text-xs text-neutral-600">Carregando scanner corporal...</p>
        </div>
      </div>
    ),
  }
)

export function BodyScanLoader() {
  return <BodyScanAnalyzer />
}
