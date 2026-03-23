"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ href, label = "Voltar" }: { href?: string; label?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group mb-3"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  )
}
