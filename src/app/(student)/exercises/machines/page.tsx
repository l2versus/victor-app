"use client"

import dynamic from "next/dynamic"

const MachinesGallery = dynamic(() => import("./machines-gallery"), { ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-neutral-500 text-sm animate-pulse">Carregando modelos 3D...</p>
    </div>
  ),
})

export default function Page() {
  return <MachinesGallery />
}
