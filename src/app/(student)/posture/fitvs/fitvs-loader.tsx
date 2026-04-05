"use client"

import dynamic from "next/dynamic"

const FitVSBattle = dynamic(() => import("./fitvs-battle").then(m => ({ default: m.FitVSBattle })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-neutral-400">Carregando FitVS...</p>
      </div>
    </div>
  ),
})

export function FitVSLoader({ roomId, userName }: { roomId: string | null; userName: string }) {
  return <FitVSBattle initialRoomId={roomId} userName={userName} />
}
