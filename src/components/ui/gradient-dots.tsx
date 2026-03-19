"use client"

import { cn } from "@/lib/utils"

export function GradientDots({
  dotSize = 8,
  spacing = 10,
  duration = 30,
  backgroundColor = "#030303",
  className,
}: {
  dotSize?: number
  spacing?: number
  duration?: number
  backgroundColor?: string
  className?: string
}) {
  const hexSpacing = spacing * 1.732

  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{
        backgroundColor,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, #dc2626, transparent 60%),
          radial-gradient(circle at 50% 50%, #7f1d1d, transparent 60%),
          radial-gradient(circle at 50% 50%, #c2410c, transparent 60%),
          radial-gradient(ellipse at 50% 50%, #991b1b, transparent 60%)
        `,
        backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
        animation: `gradient-dots-drift ${duration}s linear infinite`,
      }}
    />
  )
}
