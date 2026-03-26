import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title: string
  description: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-900/40 bg-red-950/20 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl bg-red-500/15 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
