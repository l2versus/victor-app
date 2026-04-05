"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Droplets, X, Plus, Minus } from "lucide-react"
import { calculateWaterIntake } from "@/lib/water-calculator"

interface WaterReminderProps {
  weightKg: number | null
  goal?: string | null
  frequency?: number | null
  sessionMinutes?: number | null
}

const STORAGE_KEY = "victor-water-tracker"

interface DayData {
  date: string  // YYYY-MM-DD
  glasses: number
}

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

function loadDayData(): DayData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: getToday(), glasses: 0 }
    const data: DayData = JSON.parse(raw)
    if (data.date !== getToday()) return { date: getToday(), glasses: 0 }
    return data
  } catch {
    return { date: getToday(), glasses: 0 }
  }
}

export function WaterReminder({ weightKg, goal, frequency, sessionMinutes }: WaterReminderProps) {
  const [dayData, setDayData] = useState<DayData>({ date: getToday(), glasses: 0 })
  const [showTip, setShowTip] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const hasWeight = !!weightKg && weightKg > 0

  const water = useMemo(() => {
    if (!hasWeight) return null
    return calculateWaterIntake({
      weightKg: weightKg!,
      goal: goal || undefined,
      frequency: frequency || undefined,
      sessionMinutes: sessionMinutes || undefined,
    })
  }, [hasWeight, weightKg, goal, frequency, sessionMinutes])

  // Load day data from localStorage on mount
  useEffect(() => {
    if (hasWeight) setDayData(loadDayData())
  }, [hasWeight])

  // Schedule reminders based on interval
  useEffect(() => {
    if (!water) return
    const interval = setInterval(() => {
      const current = loadDayData()
      if (current.glasses < water.glassesPerDay) {
        setShowReminder(true)
      }
    }, water.intervalMinutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [water])

  const updateGlasses = useCallback((delta: number) => {
    setDayData((prev) => {
      const newGlasses = Math.max(0, prev.glasses + delta)
      const updated = { date: getToday(), glasses: newGlasses }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    setShowReminder(false)
  }, [])

  // Guard AFTER all hooks — Rules of Hooks compliant
  if (!water) return null

  const progress = Math.min(1, dayData.glasses / water.glassesPerDay)
  const mlConsumed = dayData.glasses * water.perGlassMl
  const completed = dayData.glasses >= water.glassesPerDay

  return (
    <>
      {/* ═══ COMPACT WATER TRACKER BAR ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowTip(!showTip)}
            className="flex items-center gap-2"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              completed ? "bg-cyan-600/20 text-cyan-400" : "bg-blue-600/10 text-blue-400"
            }`}>
              <Droplets className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-neutral-300">
                {completed ? "Meta atingida!" : "Hidratação"}
              </p>
              <p className="text-[10px] text-neutral-500">
                {mlConsumed}ml / {water.dailyMl}ml ({water.dailyLiters}L)
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateGlasses(-1)}
              disabled={dayData.glasses <= 0}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold text-white w-8 text-center">
              {dayData.glasses}
            </span>
            <button
              onClick={() => updateGlasses(1)}
              className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-neutral-500 ml-0.5">
              /{water.glassesPerDay}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completed
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500"
                : "bg-gradient-to-r from-blue-600 to-cyan-500"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Expandable tips */}
        {showTip && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
            <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
              Dicas personalizadas (cada {water.intervalMinutes}min = 1 copo)
            </p>
            {water.tips.map((tip, i) => (
              <p key={i} className="text-xs text-neutral-400 leading-relaxed flex gap-2">
                <span className="text-blue-400 shrink-0">•</span>
                {tip}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ═══ REMINDER TOAST ═══ */}
      {showReminder && !dismissed && (
        <div className="fixed top-4 left-4 right-4 z-[80] max-w-lg mx-auto animate-in slide-in-from-top-2">
          <div className="bg-blue-950/90 border border-blue-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Hora de beber água!</p>
              <p className="text-xs text-blue-300/70 mt-0.5">
                {dayData.glasses}/{water.glassesPerDay} copos hoje · Falta {water.glassesPerDay - dayData.glasses} copos
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateGlasses(1)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                +1
              </button>
              <button
                onClick={() => { setDismissed(true); setShowReminder(false); setTimeout(() => setDismissed(false), 60000) }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
