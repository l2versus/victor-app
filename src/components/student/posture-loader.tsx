"use client"

import dynamic from "next/dynamic"
import { Camera } from "lucide-react"

function PostureLoading() {
  return (
    <div className="aspect-[4/3] rounded-2xl bg-zinc-900/50 flex items-center justify-center">
      <div className="text-center space-y-2">
        <Camera className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
        <p className="text-xs text-neutral-600">Carregando modulo de postura...</p>
      </div>
    </div>
  )
}

const PostureAnalyzer = dynamic(
  () => import("@/components/student/posture-analyzer").then(m => ({ default: m.PostureAnalyzer })),
  { ssr: false, loading: () => <PostureLoading /> }
)

export function PostureLoader() {
  return <PostureAnalyzer />
}
