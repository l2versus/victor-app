"use client"

import { useState } from "react"
import { Calculator, X, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface RMCalculatorProps {
  exerciseName?: string
  onClose?: () => void
  className?: string
}

// Epley formula: 1RM = weight × (1 + reps/30)
// Brzycki formula: 1RM = weight × (36 / (37 - reps))
function calculate1RM(weight: number, reps: number): { epley: number; brzycki: number; avg: number } {
  if (reps <= 0 || weight <= 0) return { epley: 0, brzycki: 0, avg: 0 }
  if (reps === 1) return { epley: weight, brzycki: weight, avg: weight }

  const epley = weight * (1 + reps / 30)
  const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley
  const avg = (epley + brzycki) / 2

  return {
    epley: Math.round(epley * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    avg: Math.round(avg * 10) / 10,
  }
}

const PERCENTAGE_TABLE = [
  { pct: 100, reps: "1" },
  { pct: 95, reps: "2" },
  { pct: 90, reps: "3-4" },
  { pct: 85, reps: "5-6" },
  { pct: 80, reps: "7-8" },
  { pct: 75, reps: "9-10" },
  { pct: 70, reps: "11-12" },
  { pct: 65, reps: "13-15" },
  { pct: 60, reps: "16-20" },
]

export function RMCalculator({ exerciseName, onClose, className }: RMCalculatorProps) {
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [showTable, setShowTable] = useState(false)

  const w = Number(weight)
  const r = Number(reps)
  const result = w > 0 && r > 0 ? calculate1RM(w, r) : null

  return (
    <div className={cn("rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden", className)}>
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Calculadora 1RM</span>
          {exerciseName && <span className="text-[10px] text-neutral-500">· {exerciseName}</span>}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-500 mb-1 block">Carga (kg)</label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="80"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 mb-1 block">Repetições</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="8"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 min-h-[44px]"
            />
          </div>
        </div>

        {result && (
          <>
            <div className="rounded-lg bg-gradient-to-r from-amber-600/10 to-amber-900/5 border border-amber-500/15 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold">1RM Estimado</span>
              </div>
              <p className="text-2xl font-black text-amber-400">{result.avg} kg</p>
              <div className="flex items-center justify-center gap-4 mt-1.5 text-[9px] text-neutral-500">
                <span>Epley: {result.epley}kg</span>
                <span>Brzycki: {result.brzycki}kg</span>
              </div>
            </div>

            <button
              onClick={() => setShowTable(!showTable)}
              className="w-full text-center text-[10px] text-neutral-500 hover:text-neutral-400 transition-colors py-1"
            >
              {showTable ? "Ocultar tabela" : "Ver tabela de % do 1RM"}
            </button>

            {showTable && (
              <div className="space-y-1">
                {PERCENTAGE_TABLE.map(row => (
                  <div key={row.pct} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-bold w-8",
                        row.pct >= 90 ? "text-red-400" : row.pct >= 75 ? "text-amber-400" : "text-green-400"
                      )}>
                        {row.pct}%
                      </span>
                      <span className="text-[10px] text-neutral-500">{row.reps} reps</span>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {Math.round(result.avg * row.pct / 100 * 10) / 10} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Inline mini 1RM button for use inside workout player
export function RMCalculatorButton({ exerciseName }: { exerciseName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15 text-[9px] text-amber-400 font-semibold hover:bg-amber-500/15 transition-colors"
      >
        <Calculator className="w-3 h-3" />
        1RM
      </button>
      {open && (
        <div className="mt-2">
          <RMCalculator exerciseName={exerciseName} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
