"use client"

import dynamic from "next/dynamic"

const MachinesPreview = dynamic(() => import("@/components/student/machines-3d-preview"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-neutral-500 text-sm">Carregando viewer 3D...</p>
    </div>
  ),
})

export default function MachinesPreviewPage() {
  return <MachinesPreview />
}
