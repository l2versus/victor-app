"use client"

import dynamic from "next/dynamic"
import { PersonStanding } from "lucide-react"

const PosturalAssessmentWizard = dynamic(
  () => import("@/components/student/postural-assessment-wizard").then(m => ({ default: m.PosturalAssessmentWizard })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-2">
        <PersonStanding className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
        <p className="text-xs text-neutral-600">Carregando avaliação postural...</p>
      </div>
    </div>
  )}
)

interface HistoryItem {
  id: string
  overallScore: number
  severeCount: number
  moderateCount: number
  mildCount: number
  createdAt: string
}

export function PosturalAssessmentLoader({ history }: { history: HistoryItem[] }) {
  return <PosturalAssessmentWizard history={history} />
}
