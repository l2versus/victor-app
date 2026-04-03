"use client"

import { Lock, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UpgradePromptProps {
  /** Feature name shown in the title */
  feature: string
  /** Description of what the user unlocks */
  description: string
  /** Minimum plan needed (shown in the CTA) */
  minPlan?: string
  /** Price shown in the CTA */
  price?: string
  /** Additional bullet points of what's included */
  perks?: string[]
  /** Custom className for the container */
  className?: string
  /** Whether to show inline (compact) or full (page-level) */
  variant?: "inline" | "full"
}

export function UpgradePrompt({
  feature,
  description,
  minPlan = "Premium",
  price = "R$19,90/mês",
  perks,
  className,
  variant = "full",
}: UpgradePromptProps) {
  if (variant === "inline") {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15",
        className
      )}>
        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300/80 flex-1">
          {feature} é exclusivo do plano {minPlan}+.{" "}
          <Link href="/upgrade" className="text-amber-400 font-semibold underline underline-offset-2">
            Fazer upgrade
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center space-y-5",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-bold text-white">{feature}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
      </div>

      {perks && perks.length > 0 && (
        <div className="space-y-1.5 text-left max-w-xs">
          {perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-neutral-300">{perk}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/upgrade"
        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all"
      >
        Fazer Upgrade — {minPlan} {price}
        <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-[10px] text-neutral-600">
        Cancele quando quiser. Garantia de 7 dias.
      </p>
    </div>
  )
}
