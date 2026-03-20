"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface MuscleData {
  muscle: string
  volume: number
  percentage: number
}

interface BodyMapProps {
  data: MuscleData[]
  className?: string
  /** Show front view, back view, or both */
  view?: "front" | "back" | "both"
  /** Callback when a muscle is tapped */
  onMuscleSelect?: (muscle: string) => void
  /** Currently selected muscle */
  selectedMuscle?: string | null
}

// Map database muscle names to body regions
const muscleToRegion: Record<string, string[]> = {
  // Front muscles
  Peito: ["chest-left", "chest-right"],
  Peitoral: ["chest-left", "chest-right"],
  Chest: ["chest-left", "chest-right"],
  Ombros: ["shoulder-left-front", "shoulder-right-front", "shoulder-left-back", "shoulder-right-back"],
  Shoulders: ["shoulder-left-front", "shoulder-right-front", "shoulder-left-back", "shoulder-right-back"],
  Deltoides: ["shoulder-left-front", "shoulder-right-front", "shoulder-left-back", "shoulder-right-back"],
  Bíceps: ["bicep-left", "bicep-right"],
  Biceps: ["bicep-left", "bicep-right"],
  Tríceps: ["tricep-left", "tricep-right"],
  Triceps: ["tricep-left", "tricep-right"],
  Antebraço: ["forearm-left-front", "forearm-right-front"],
  Forearms: ["forearm-left-front", "forearm-right-front"],
  Abdômen: ["abs-upper", "abs-lower", "obliques-left", "obliques-right"],
  Abdomen: ["abs-upper", "abs-lower", "obliques-left", "obliques-right"],
  Core: ["abs-upper", "abs-lower", "obliques-left", "obliques-right"],
  Quadríceps: ["quad-left", "quad-right"],
  Quadriceps: ["quad-left", "quad-right"],
  // Back muscles
  Costas: ["upper-back-left", "upper-back-right", "lower-back"],
  "Costas (Geral)": ["upper-back-left", "upper-back-right", "lower-back"],
  Back: ["upper-back-left", "upper-back-right", "lower-back"],
  Dorsal: ["upper-back-left", "upper-back-right"],
  Trapézio: ["trap-left", "trap-right"],
  Traps: ["trap-left", "trap-right"],
  Glúteos: ["glute-left", "glute-right"],
  Gluteos: ["glute-left", "glute-right"],
  Glutes: ["glute-left", "glute-right"],
  "Posterior de Coxa": ["hamstring-left", "hamstring-right"],
  Hamstrings: ["hamstring-left", "hamstring-right"],
  Panturrilha: ["calf-left", "calf-right"],
  Calves: ["calf-left", "calf-right"],
}

// Get intensity color based on percentage (0-100)
function getIntensityColor(percentage: number, isSelected: boolean): string {
  if (isSelected) return "rgba(239, 68, 68, 0.95)"
  if (percentage >= 30) return "rgba(239, 68, 68, 0.85)"
  if (percentage >= 20) return "rgba(239, 68, 68, 0.65)"
  if (percentage >= 10) return "rgba(239, 68, 68, 0.45)"
  if (percentage > 0) return "rgba(239, 68, 68, 0.25)"
  return "rgba(255, 255, 255, 0.04)"
}

function getGlowIntensity(percentage: number): string {
  if (percentage >= 30) return "drop-shadow(0 0 8px rgba(239,68,68,0.5))"
  if (percentage >= 20) return "drop-shadow(0 0 5px rgba(239,68,68,0.3))"
  if (percentage >= 10) return "drop-shadow(0 0 3px rgba(239,68,68,0.2))"
  return "none"
}

// Build a lookup: region-id → { percentage, muscle }
function buildRegionMap(data: MuscleData[]) {
  const map: Record<string, { percentage: number; muscle: string }> = {}
  for (const d of data) {
    const regions = muscleToRegion[d.muscle]
    if (!regions) {
      // Try partial match
      for (const [key, regs] of Object.entries(muscleToRegion)) {
        if (d.muscle.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(d.muscle.toLowerCase())) {
          for (const r of regs) {
            map[r] = { percentage: d.percentage, muscle: d.muscle }
          }
          break
        }
      }
      continue
    }
    for (const r of regions) {
      map[r] = { percentage: d.percentage, muscle: d.muscle }
    }
  }
  return map
}

function MuscleRegion({
  d, id, regionMap, selectedMuscle, onSelect,
}: {
  d: string; id: string
  regionMap: Record<string, { percentage: number; muscle: string }>
  selectedMuscle?: string | null
  onSelect?: (muscle: string) => void
}) {
  const info = regionMap[id]
  const percentage = info?.percentage ?? 0
  const isSelected = !!(selectedMuscle && info?.muscle === selectedMuscle)
  const fill = getIntensityColor(percentage, isSelected)
  const glow = getGlowIntensity(percentage)

  return (
    <path
      d={d}
      fill={fill}
      stroke={percentage > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.06)"}
      strokeWidth={isSelected ? 1.5 : 0.5}
      style={{ filter: glow, cursor: percentage > 0 ? "pointer" : "default", transition: "all 0.3s ease" }}
      onClick={() => { if (info?.muscle && onSelect) onSelect(info.muscle) }}
    />
  )
}

/* ═══════════════════════════════════════════
   SVG BODY — FRONT VIEW
   ═══════════════════════════════════════════ */
function FrontBody({ regionMap, selectedMuscle, onSelect }: {
  regionMap: Record<string, { percentage: number; muscle: string }>
  selectedMuscle?: string | null
  onSelect?: (muscle: string) => void
}) {
  const props = { regionMap, selectedMuscle, onSelect }
  return (
    <svg viewBox="0 0 200 440" className="w-full h-full">
      {/* Head */}
      <ellipse cx="100" cy="32" rx="22" ry="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Neck */}
      <rect x="90" y="58" width="20" height="14" rx="4" fill="rgba(255,255,255,0.05)" />

      {/* Traps */}
      <MuscleRegion id="trap-left" d="M 70 72 Q 80 65 90 72 L 90 80 L 70 80 Z" {...props} />
      <MuscleRegion id="trap-right" d="M 130 72 Q 120 65 110 72 L 110 80 L 130 80 Z" {...props} />

      {/* Shoulders */}
      <MuscleRegion id="shoulder-left-front" d="M 52 78 Q 58 68 70 72 L 70 95 Q 58 92 52 85 Z" {...props} />
      <MuscleRegion id="shoulder-right-front" d="M 148 78 Q 142 68 130 72 L 130 95 Q 142 92 148 85 Z" {...props} />

      {/* Chest */}
      <MuscleRegion id="chest-left" d="M 70 80 L 99 80 L 99 118 Q 85 122 70 115 Z" {...props} />
      <MuscleRegion id="chest-right" d="M 101 80 L 130 80 L 130 115 Q 115 122 101 118 Z" {...props} />

      {/* Abs */}
      <MuscleRegion id="abs-upper" d="M 80 120 L 120 120 L 120 155 L 80 155 Z" {...props} />
      <MuscleRegion id="abs-lower" d="M 82 157 L 118 157 L 115 190 Q 100 195 85 190 Z" {...props} />

      {/* Obliques */}
      <MuscleRegion id="obliques-left" d="M 70 118 L 80 120 L 82 190 L 72 175 Q 68 150 70 118 Z" {...props} />
      <MuscleRegion id="obliques-right" d="M 130 118 L 120 120 L 118 190 L 128 175 Q 132 150 130 118 Z" {...props} />

      {/* Biceps */}
      <MuscleRegion id="bicep-left" d="M 48 98 Q 42 95 40 105 L 38 140 Q 40 148 48 148 L 54 148 Q 58 145 56 135 L 54 100 Z" {...props} />
      <MuscleRegion id="bicep-right" d="M 152 98 Q 158 95 160 105 L 162 140 Q 160 148 152 148 L 146 148 Q 142 145 144 135 L 146 100 Z" {...props} />

      {/* Forearms */}
      <MuscleRegion id="forearm-left-front" d="M 38 150 L 54 150 L 50 200 Q 44 205 38 200 Z" {...props} />
      <MuscleRegion id="forearm-right-front" d="M 146 150 L 162 150 L 162 200 Q 156 205 150 200 Z" {...props} />

      {/* Quads */}
      <MuscleRegion id="quad-left" d="M 78 195 Q 72 200 70 210 L 68 290 Q 72 300 80 300 L 95 300 Q 98 295 98 285 L 98 195 Z" {...props} />
      <MuscleRegion id="quad-right" d="M 122 195 Q 128 200 130 210 L 132 290 Q 128 300 120 300 L 105 300 Q 102 295 102 285 L 102 195 Z" {...props} />

      {/* Knees */}
      <ellipse cx="82" cy="310" rx="14" ry="10" fill="rgba(255,255,255,0.03)" />
      <ellipse cx="118" cy="310" rx="14" ry="10" fill="rgba(255,255,255,0.03)" />

      {/* Calves (front) */}
      <MuscleRegion id="calf-left" d="M 70 322 Q 68 320 68 330 L 66 385 Q 70 400 80 400 L 90 400 Q 94 395 92 380 L 92 322 Z" {...props} />
      <MuscleRegion id="calf-right" d="M 130 322 Q 132 320 132 330 L 134 385 Q 130 400 120 400 L 110 400 Q 106 395 108 380 L 108 322 Z" {...props} />

      {/* Feet */}
      <ellipse cx="80" cy="412" rx="16" ry="8" fill="rgba(255,255,255,0.03)" />
      <ellipse cx="120" cy="412" rx="16" ry="8" fill="rgba(255,255,255,0.03)" />

      {/* Center line (subtle) */}
      <line x1="100" y1="80" x2="100" y2="190" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   SVG BODY — BACK VIEW
   ═══════════════════════════════════════════ */
function BackBody({ regionMap, selectedMuscle, onSelect }: {
  regionMap: Record<string, { percentage: number; muscle: string }>
  selectedMuscle?: string | null
  onSelect?: (muscle: string) => void
}) {
  const props = { regionMap, selectedMuscle, onSelect }
  return (
    <svg viewBox="0 0 200 440" className="w-full h-full">
      {/* Head */}
      <ellipse cx="100" cy="32" rx="22" ry="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Neck */}
      <rect x="90" y="58" width="20" height="14" rx="4" fill="rgba(255,255,255,0.05)" />

      {/* Traps (back) */}
      <MuscleRegion id="trap-left" d="M 70 72 Q 80 65 90 72 L 90 85 L 70 85 Z" {...props} />
      <MuscleRegion id="trap-right" d="M 130 72 Q 120 65 110 72 L 110 85 L 130 85 Z" {...props} />

      {/* Shoulders (back) */}
      <MuscleRegion id="shoulder-left-back" d="M 52 78 Q 58 68 70 72 L 70 95 Q 58 92 52 85 Z" {...props} />
      <MuscleRegion id="shoulder-right-back" d="M 148 78 Q 142 68 130 72 L 130 95 Q 142 92 148 85 Z" {...props} />

      {/* Upper back */}
      <MuscleRegion id="upper-back-left" d="M 70 85 L 99 85 L 99 135 Q 85 140 70 132 Z" {...props} />
      <MuscleRegion id="upper-back-right" d="M 101 85 L 130 85 L 130 132 Q 115 140 101 135 Z" {...props} />

      {/* Lower back */}
      <MuscleRegion id="lower-back" d="M 75 138 L 125 138 L 122 185 Q 100 192 78 185 Z" {...props} />

      {/* Triceps */}
      <MuscleRegion id="tricep-left" d="M 48 98 Q 42 95 40 105 L 38 145 Q 40 150 48 150 L 54 150 Q 58 147 56 137 L 54 100 Z" {...props} />
      <MuscleRegion id="tricep-right" d="M 152 98 Q 158 95 160 105 L 162 145 Q 160 150 152 150 L 146 150 Q 142 147 144 137 L 146 100 Z" {...props} />

      {/* Glutes */}
      <MuscleRegion id="glute-left" d="M 78 188 L 99 188 L 99 225 Q 88 232 78 225 Z" {...props} />
      <MuscleRegion id="glute-right" d="M 101 188 L 122 188 L 122 225 Q 112 232 101 225 Z" {...props} />

      {/* Hamstrings */}
      <MuscleRegion id="hamstring-left" d="M 72 228 Q 68 225 68 235 L 68 295 Q 72 305 82 305 L 95 305 Q 98 300 98 290 L 98 228 Z" {...props} />
      <MuscleRegion id="hamstring-right" d="M 128 228 Q 132 225 132 235 L 132 295 Q 128 305 118 305 L 105 305 Q 102 300 102 290 L 102 228 Z" {...props} />

      {/* Calves (back) */}
      <MuscleRegion id="calf-left" d="M 70 315 Q 65 325 66 340 L 66 385 Q 70 400 80 400 L 90 400 Q 94 395 92 380 L 92 330 Q 90 318 85 315 Z" {...props} />
      <MuscleRegion id="calf-right" d="M 130 315 Q 135 325 134 340 L 134 385 Q 130 400 120 400 L 110 400 Q 106 395 108 380 L 108 330 Q 110 318 115 315 Z" {...props} />

      {/* Feet */}
      <ellipse cx="80" cy="412" rx="16" ry="8" fill="rgba(255,255,255,0.03)" />
      <ellipse cx="120" cy="412" rx="16" ry="8" fill="rgba(255,255,255,0.03)" />

      {/* Spine line */}
      <line x1="100" y1="72" x2="100" y2="185" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeDasharray="3 3" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   BODY MAP COMPONENT
   ═══════════════════════════════════════════ */
export function BodyMap({
  data,
  className,
  view = "both",
  onMuscleSelect,
  selectedMuscle,
}: BodyMapProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null)
  const selected = selectedMuscle ?? internalSelected
  const handleSelect = onMuscleSelect ?? setInternalSelected

  const regionMap = buildRegionMap(data)

  // Find the selected muscle info
  const selectedInfo = selected ? data.find(d => d.muscle === selected) : null

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex items-start justify-center gap-3",
        view === "both" ? "gap-2" : ""
      )}>
        {(view === "front" || view === "both") && (
          <div className="flex flex-col items-center">
            <FrontBody regionMap={regionMap} selectedMuscle={selected} onSelect={handleSelect} />
            <span className="text-[8px] text-neutral-600 uppercase tracking-widest mt-1">Frente</span>
          </div>
        )}
        {(view === "back" || view === "both") && (
          <div className="flex flex-col items-center">
            <BackBody regionMap={regionMap} selectedMuscle={selected} onSelect={handleSelect} />
            <span className="text-[8px] text-neutral-600 uppercase tracking-widest mt-1">Costas</span>
          </div>
        )}
      </div>

      {/* Selected muscle tooltip */}
      {selectedInfo && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#0a0a0a]/95 border border-red-500/20 backdrop-blur-xl shadow-xl shadow-red-600/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-xs font-semibold text-white text-center">{selectedInfo.muscle}</p>
          <p className="text-[10px] text-red-400 text-center font-medium">{selectedInfo.percentage.toFixed(0)}% do volume</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   INTENSITY LEGEND
   ═══════════════════════════════════════════ */
export function BodyMapLegend() {
  return (
    <div className="flex items-center justify-center gap-3 mt-2">
      {[
        { label: "Leve", opacity: 0.25 },
        { label: "Moderado", opacity: 0.45 },
        { label: "Intenso", opacity: 0.65 },
        { label: "Máximo", opacity: 0.85 },
      ].map(({ label, opacity }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: `rgba(239, 68, 68, ${opacity})` }}
          />
          <span className="text-[8px] text-neutral-600">{label}</span>
        </div>
      ))}
    </div>
  )
}
