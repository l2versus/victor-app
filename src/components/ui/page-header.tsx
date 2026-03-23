"use client"

import { type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  icon?: ReactNode
  back?: string | true
}

export function PageHeader({ title, description, action, className, icon, back }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof back === "string") {
      router.push(back)
    } else {
      router.back()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {back && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
