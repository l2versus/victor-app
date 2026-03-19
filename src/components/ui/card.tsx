import { type ReactNode } from "react"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ═══ CARD ═══ */

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-[#111] p-6",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ═══ STAT CARD ═══ */

export interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    direction: "up" | "down"
    value: string
  }
  className?: string
}

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-[#111] p-6 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-5 w-5 text-red-500" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-neutral-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}
