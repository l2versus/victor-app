"use client"

import { useMotionValue, motion, useMotionTemplate } from "framer-motion"
import React, { useState } from "react"
import { cn } from "@/lib/utils"

export function CardSpotlight({
  children,
  radius = 300,
  color = "rgba(220, 38, 38, 0.15)",
  className,
  ...props
}: {
  radius?: number
  color?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovering, setIsHovering] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
  }

  return (
    <div
      className={cn("group/spotlight relative rounded-3xl", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover/spotlight:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              ${color},
              transparent 80%
            )
          `,
        }}
      />
      {/* Dot matrix reveal on hover */}
      {isHovering && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl overflow-hidden z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(rgba(220,38,38,0.3) 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
              mask: `radial-gradient(${radius}px circle at ${mouseX.get()}px ${mouseY.get()}px, black, transparent 80%)`,
              WebkitMask: `radial-gradient(${radius}px circle at ${mouseX.get()}px ${mouseY.get()}px, black, transparent 80%)`,
            }}
          />
        </motion.div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
