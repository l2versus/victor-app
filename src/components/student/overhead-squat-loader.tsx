"use client"

import dynamic from "next/dynamic"
import { Dumbbell } from "lucide-react"

const OverheadSquatWizard = dynamic(
  () => import("@/components/student/overhead-squat-wizard").then(m => ({ default: m.OverheadSquatWizard })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-2">
        <Dumbbell className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
        <p className="text-xs text-neutral-600">Carregando overhead squat...</p>
      </div>
    </div>
  )}
)

export function OverheadSquatLoader() {
  return <OverheadSquatWizard />
}
