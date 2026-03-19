"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
  dotSize?: number
  spacing?: number
  duration?: number
  colorCycleDuration?: number
  backgroundColor?: string
}

export function GradientDots({
  dotSize = 8,
  spacing = 10,
  duration = 30,
  colorCycleDuration = 8,
  backgroundColor = "#030303",
  className,
  ...props
}: GradientDotsProps) {
  const hexSpacing = spacing * 1.732

  return (
    <motion.div
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
        backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
      }}
      animate={{
        backgroundPosition: [
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px`,
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
        ],
      }}
      transition={{
        backgroundPosition: {
          duration,
          ease: "linear",
          repeat: Infinity,
        },
      }}
      {...props}
    />
  )
}
