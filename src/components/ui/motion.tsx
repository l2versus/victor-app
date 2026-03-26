"use client"

import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type Variants,
  type Transition,
} from "framer-motion"
import React, {
  useEffect,
  useRef,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react"

// ---------------------------------------------------------------------------
// Shared config — premium, subtle, Apple/Linear feel
// ---------------------------------------------------------------------------

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

const DEFAULT_DURATION = 0.4
const DEFAULT_STAGGER = 0.06

function useSafeReducedMotion(): boolean {
  const prefersReduced = useReducedMotion()
  return prefersReduced ?? false
}

// ---------------------------------------------------------------------------
// FadeIn
// ---------------------------------------------------------------------------

type Direction = "up" | "down" | "left" | "right" | "none"

interface FadeInProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: Direction
  distance?: number
  once?: boolean
}

const directionOffset = (
  direction: Direction,
  distance: number
): { x: number; y: number } => {
  switch (direction) {
    case "up":
      return { x: 0, y: distance }
    case "down":
      return { x: 0, y: -distance }
    case "left":
      return { x: distance, y: 0 }
    case "right":
      return { x: -distance, y: 0 }
    case "none":
    default:
      return { x: 0, y: 0 }
  }
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  direction = "up",
  distance = 16,
  once = true,
  ...rest
}: FadeInProps) {
  const reduced = useSafeReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  const offset = directionOffset(direction, distance)

  if (reduced) {
    return (
      <div ref={ref} className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// StaggerContainer + StaggerItem
// ---------------------------------------------------------------------------

interface StaggerContainerProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  once?: boolean
}

const staggerContainerVariants = (
  stagger: number,
  delay: number
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
})

export function StaggerContainer({
  children,
  className,
  stagger = DEFAULT_STAGGER,
  delay = 0,
  once = true,
  ...rest
}: StaggerContainerProps) {
  const reduced = useSafeReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  if (reduced) {
    return (
      <div ref={ref} className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainerVariants(stagger, delay)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------

interface StaggerItemProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  direction?: Direction
  distance?: number
  duration?: number
}

const staggerItemVariants = (
  direction: Direction,
  distance: number,
  duration: number
): Variants => {
  const offset = directionOffset(direction, distance)
  return {
    hidden: { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, ease: EASE_OUT_EXPO },
    },
  }
}

export function StaggerItem({
  children,
  className,
  direction = "up",
  distance = 16,
  duration = DEFAULT_DURATION,
  ...rest
}: StaggerItemProps) {
  const reduced = useSafeReducedMotion()

  if (reduced) {
    return (
      <div className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      variants={staggerItemVariants(direction, distance, duration)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// PageTransition
// ---------------------------------------------------------------------------

interface PageTransitionProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  duration?: number
}

export function PageTransition({
  children,
  className,
  duration = 0.35,
  ...rest
}: PageTransitionProps) {
  const reduced = useSafeReducedMotion()

  if (reduced) {
    return (
      <div className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration, ease: EASE_OUT }}
        {...rest}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// ScaleIn
// ---------------------------------------------------------------------------

interface ScaleInProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  initialScale?: number
  once?: boolean
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  initialScale = 0.95,
  once = true,
  ...rest
}: ScaleInProps) {
  const reduced = useSafeReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  if (reduced) {
    return (
      <div ref={ref} className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: initialScale }}
      animate={inView ? { opacity: 1, scale: 1 } : undefined}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// SlideIn
// ---------------------------------------------------------------------------

interface SlideInProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: ReactNode
  className?: string
  direction?: Exclude<Direction, "none">
  distance?: number
  delay?: number
  duration?: number
  once?: boolean
}

export function SlideIn({
  children,
  className,
  direction = "left",
  distance = 40,
  delay = 0,
  duration = 0.5,
  once = true,
  ...rest
}: SlideInProps) {
  const reduced = useSafeReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  const offset = directionOffset(direction, distance)

  if (reduced) {
    return (
      <div ref={ref} className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// CountUp
// ---------------------------------------------------------------------------

interface CountUpProps extends ComponentPropsWithoutRef<"span"> {
  to: number
  from?: number
  duration?: number
  delay?: number
  decimals?: number
  className?: string
  prefix?: string
  suffix?: string
  once?: boolean
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  delay = 0,
  decimals = 0,
  className,
  prefix = "",
  suffix = "",
  once = true,
  ...rest
}: CountUpProps) {
  const reduced = useSafeReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once, margin: "-40px" })

  const motionValue = useMotionValue(from)
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  })

  useEffect(() => {
    if (reduced) return
    if (!inView) return

    const timer = delay > 0 ? setTimeout(() => motionValue.set(to), delay * 1000) : undefined
    if (delay === 0) motionValue.set(to)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [inView, to, delay, motionValue, reduced])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent =
          prefix + latest.toFixed(decimals) + suffix
      }
    })
    return unsubscribe
  }, [springValue, decimals, prefix, suffix])

  if (reduced) {
    return (
      <span ref={ref} className={className} {...rest}>
        {prefix}
        {to.toFixed(decimals)}
        {suffix}
      </span>
    )
  }

  return (
    <span ref={ref} className={className} {...rest}>
      {prefix}
      {from.toFixed(decimals)}
      {suffix}
    </span>
  )
}
