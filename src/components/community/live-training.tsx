"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, ChevronUp } from "lucide-react"
import Link from "next/link"
import { SafeAvatar } from "@/components/ui/safe-image"

type LiveTrainer = {
  studentId: string
  name: string
  avatar: string | null
  workoutName: string
  durationMin: number
  startedAt: string
}

// ═══════════════════════════════════════
// Compact banner for the Today page
// ═══════════════════════════════════════

export function LiveTrainingBanner() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/community/live")
        if (res.ok) {
          const data = await res.json()
          if (mounted) setCount(data.live?.length ?? 0)
        }
      } catch { /* ignore */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (count === 0) return null

  return (
    <Link href="/community">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/15 px-3 py-2 backdrop-blur-xl"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-emerald-300 font-medium">
          {count} {count === 1 ? "pessoa treinando" : "pessoas treinando"} agora
        </span>
        <ChevronUp className="w-3 h-3 text-emerald-500 rotate-90 ml-auto" />
      </motion.div>
    </Link>
  )
}

// ═══════════════════════════════════════
// Full card for the Community page
// ═══════════════════════════════════════

export function LiveTrainingCard() {
  const [trainers, setTrainers] = useState<LiveTrainer[]>([])
  const [collapsed, setCollapsed] = useState(false)

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/community/live")
      if (res.ok) {
        const data = await res.json()
        setTrainers(data.live ?? [])
      }
    } catch { /* ignore */ }
  }, [])

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [fetchLive])

  // Update durations every 60s (recalculate from startedAt)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (trainers.length === 0) return
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [trainers.length])

  // Recalculate durations on tick
  const liveWithDuration = trainers.map((t) => ({
    ...t,
    durationMin: Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 60000),
  }))
  // Suppress unused variable warning — tick drives re-renders
  void tick

  if (trainers.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/30 via-black/40 to-black/20 backdrop-blur-xl overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-white">
              Treinando agora
            </span>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              {trainers.length}
            </span>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Body — collapsible */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2">
                {liveWithDuration.map((trainer) => (
                  <Link
                    key={trainer.studentId}
                    href={`/community/profile/${trainer.studentId}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 py-1.5 group"
                    >
                      {/* Avatar with green ring */}
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-black overflow-hidden">
                          <SafeAvatar
                            src={trainer.avatar}
                            name={trainer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Tiny green dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                            {trainer.name.split(" ")[0]}
                          </span>
                          <span className="text-neutral-600">·</span>
                          <span className="text-neutral-400 truncate text-xs">
                            {trainer.workoutName}
                          </span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-400">
                          {trainer.durationMin}min
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
