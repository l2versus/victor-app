"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

function ImpersonateClient() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      window.location.href = "/admin/students"
      return
    }
    document.cookie = `token=${token}; path=/; max-age=3600; SameSite=Lax`
    window.location.href = "/today"
  }, [searchParams])

  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      <p className="text-neutral-400 text-sm">Entrando como aluno...</p>
    </div>
  )
}

export default function ImpersonatePage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-red-500 animate-spin" />}>
        <ImpersonateClient />
      </Suspense>
    </div>
  )
}
