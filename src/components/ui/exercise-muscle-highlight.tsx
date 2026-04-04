"use client"

import { cn } from "@/lib/utils"
import { BodyMap } from "@/components/student/body-map"

/**
 * Maps exercise muscle names (EN/PT) → primary + secondary muscles
 * for the BodyMap SVG highlight. Works with ANY brand (Panatta, Hammer, etc.)
 */
const MUSCLE_HIGHLIGHT_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  // ── Chest / Peitoral ──
  Chest:      { primary: ["Chest"], secondary: ["Triceps", "Shoulders"] },
  Peito:      { primary: ["Chest"], secondary: ["Triceps", "Shoulders"] },
  Peitoral:   { primary: ["Chest"], secondary: ["Triceps", "Shoulders"] },

  // ── Back / Costas ──
  Back:       { primary: ["Back"], secondary: ["Biceps"] },
  Costas:     { primary: ["Back"], secondary: ["Biceps"] },
  Dorsal:     { primary: ["Back"], secondary: ["Biceps"] },

  // ── Shoulders / Ombros ──
  Shoulders:  { primary: ["Shoulders"], secondary: ["Triceps"] },
  Ombros:     { primary: ["Shoulders"], secondary: ["Triceps"] },
  Deltoids:   { primary: ["Shoulders"], secondary: ["Triceps"] },
  Deltoides:  { primary: ["Shoulders"], secondary: ["Triceps"] },

  // ── Biceps ──
  Biceps:     { primary: ["Biceps"], secondary: ["Forearms"] },
  "Bíceps":   { primary: ["Biceps"], secondary: ["Forearms"] },

  // ── Triceps ──
  Triceps:    { primary: ["Triceps"], secondary: ["Chest", "Shoulders"] },
  "Tríceps":  { primary: ["Triceps"], secondary: ["Chest", "Shoulders"] },

  // ── Abs / Core ──
  Abs:        { primary: ["Core"], secondary: [] },
  "Abdômen":  { primary: ["Core"], secondary: [] },
  Abdomen:    { primary: ["Core"], secondary: [] },
  Core:       { primary: ["Core"], secondary: [] },

  // ── Quads ──
  Quadriceps: { primary: ["Quadriceps"], secondary: ["Glutes"] },
  "Quadríceps": { primary: ["Quadriceps"], secondary: ["Glutes"] },

  // ── Hamstrings / Posterior ──
  Hamstrings: { primary: ["Hamstrings"], secondary: ["Glutes"] },
  Posterior:  { primary: ["Hamstrings"], secondary: ["Glutes"] },
  "Posterior de Coxa": { primary: ["Hamstrings"], secondary: ["Glutes"] },

  // ── Glutes ──
  Glutes:     { primary: ["Glutes"], secondary: ["Hamstrings", "Quadriceps"] },
  "Glúteos":  { primary: ["Glutes"], secondary: ["Hamstrings", "Quadriceps"] },
  Gluteos:    { primary: ["Glutes"], secondary: ["Hamstrings", "Quadriceps"] },

  // ── Calves ──
  Calves:     { primary: ["Calves"], secondary: [] },
  Panturrilha:{ primary: ["Calves"], secondary: [] },

  // ── Traps ──
  Traps:      { primary: ["Traps"], secondary: ["Shoulders"] },
  "Trapézio": { primary: ["Traps"], secondary: ["Shoulders"] },

  // ── Forearms ──
  Forearms:   { primary: ["Forearms"], secondary: ["Biceps"] },
  "Antebraço":{ primary: ["Forearms"], secondary: ["Biceps"] },

  // ── Abductors (Panatta 3D Abductor etc.) ──
  Abductors:  { primary: ["Glutes"], secondary: [] },
}

interface ExerciseMuscleHighlightProps {
  /** The muscle name from the exercise (e.g., "Chest", "Biceps", "Glutes") */
  muscle: string
  /** Optional: which view to show */
  view?: "front" | "back" | "both" | "auto"
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Show label under the body map */
  showLabel?: boolean
}

/** Determines best view based on muscle group */
function autoView(muscle: string): "front" | "back" | "both" {
  const backMuscles = ["Back", "Costas", "Dorsal", "Hamstrings", "Posterior", "Glutes", "Glúteos", "Gluteos", "Calves", "Panturrilha", "Traps", "Trapézio", "Posterior de Coxa"]
  const frontMuscles = ["Chest", "Peito", "Peitoral", "Abs", "Abdômen", "Abdomen", "Core", "Quadriceps", "Quadríceps", "Biceps", "Bíceps"]

  if (backMuscles.some(m => muscle.toLowerCase().includes(m.toLowerCase()))) return "back"
  if (frontMuscles.some(m => muscle.toLowerCase().includes(m.toLowerCase()))) return "front"
  return "both"
}

/**
 * Reusable muscle highlight component.
 * Pass the exercise `muscle` field and it auto-highlights primary (100%) + secondary (35%) muscles.
 * Works with any brand — Panatta, Hammer Strength, Matrix, generic exercises, etc.
 */
export function ExerciseMuscleHighlight({
  muscle,
  view = "auto",
  className,
  size = "md",
  showLabel = true,
}: ExerciseMuscleHighlightProps) {
  const mapping = MUSCLE_HIGHLIGHT_MAP[muscle]

  // Build BodyMap data with primary at 100% and secondary at 35%
  const bodyMapData = [
    ...(mapping?.primary ?? [{ toString: () => muscle }]).map(m => ({
      muscle: typeof m === "string" ? m : muscle,
      volume: 100,
      percentage: 100,
    })),
    ...(mapping?.secondary ?? []).map(m => ({
      muscle: m,
      volume: 35,
      percentage: 35,
    })),
  ]

  // Fallback: if no mapping found, just highlight the raw muscle name
  if (!mapping) {
    bodyMapData.length = 0
    bodyMapData.push({ muscle, volume: 100, percentage: 100 })
  }

  const resolvedView = view === "auto" ? autoView(muscle) : view

  const sizeClasses = {
    sm: "w-16 h-24",
    md: "w-28 h-40",
    lg: "w-40 h-56",
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn(sizeClasses[size])}>
        <BodyMap
          data={bodyMapData}
          view={resolvedView}
          className="w-full h-full"
        />
      </div>
      {showLabel && (
        <span className="text-[9px] text-neutral-500 font-medium mt-1 uppercase tracking-wider">
          {muscle}
        </span>
      )}
    </div>
  )
}

/**
 * Compact version for use in exercise cards/lists.
 * Shows just the body silhouette with highlighted muscles.
 */
export function ExerciseMuscleIcon({
  muscle,
  className,
}: {
  muscle: string
  className?: string
}) {
  return (
    <ExerciseMuscleHighlight
      muscle={muscle}
      size="sm"
      showLabel={false}
      className={className}
    />
  )
}
