"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  FileText,
  DollarSign,
  ClipboardList,
  BarChart3,
  FileUp,
  FileSearch,
  FilePlus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface RadarProps {
  className?: string
}

export function Radar({ className }: RadarProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Radar circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-neutral-700/50"
            style={{
              width: `${i * 25}%`,
              height: `${i * 25}%`,
            }}
          />
        ))}
      </div>

      {/* Radar sweep */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-1/2 h-0.5 origin-left"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.8) 50%, rgba(239, 68, 68, 0) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute w-1/2 h-[1px] origin-left"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(239, 68, 68, 0.15) 30deg, transparent 60deg)",
            height: "50%",
            clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      </div>

      {/* Icon containers positioned around radar */}
      <IconContainer
        icon={FileText}
        text="Documents"
        delay={0}
        className="absolute top-[10%] left-[20%]"
      />
      <IconContainer
        icon={DollarSign}
        text="Revenue"
        delay={0.5}
        className="absolute top-[15%] right-[20%]"
      />
      <IconContainer
        icon={ClipboardList}
        text="Reports"
        delay={1}
        className="absolute bottom-[30%] left-[10%]"
      />
      <IconContainer
        icon={BarChart3}
        text="Analytics"
        delay={1.5}
        className="absolute top-[40%] right-[8%]"
      />
      <IconContainer
        icon={FileUp}
        text="Uploads"
        delay={2}
        className="absolute bottom-[15%] left-[25%]"
      />
      <IconContainer
        icon={FileSearch}
        text="Search"
        delay={2.5}
        className="absolute bottom-[10%] right-[25%]"
      />
      <IconContainer
        icon={FilePlus}
        text="Create"
        delay={3}
        className="absolute top-[5%] left-[45%]"
      />
    </div>
  )
}

interface IconContainerProps {
  icon: LucideIcon
  text: string
  delay?: number
  className?: string
}

export function IconContainer({
  icon: Icon,
  text,
  delay = 0,
  className,
}: IconContainerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true)
      intervalRef.current = setInterval(() => {
        setIsVisible(false)
        setTimeout(() => setIsVisible(true), 500)
      }, 4000)
    }, delay * 1000)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [delay])

  return (
    <div className={cn("z-10", className)}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative p-2 rounded-xl bg-neutral-900/80 border border-neutral-700/50 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <Icon className="w-5 h-5 text-red-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
              {text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
