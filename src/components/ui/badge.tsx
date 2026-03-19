import { cn } from "@/lib/utils"

type BadgeStatus = "active" | "inactive" | "pending"

export interface BadgeProps {
  status: BadgeStatus
  label?: string
  className?: string
}

const statusStyles: Record<BadgeStatus, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    defaultLabel: "Active",
  },
  inactive: {
    bg: "bg-neutral-500/10",
    text: "text-neutral-400",
    dot: "bg-neutral-400",
    defaultLabel: "Inactive",
  },
  pending: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    defaultLabel: "Pending",
  },
}

export function Badge({ status, label, className }: BadgeProps) {
  const style = statusStyles[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label ?? style.defaultLabel}
    </span>
  )
}
