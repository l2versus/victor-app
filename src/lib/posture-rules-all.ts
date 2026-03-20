// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — Regras Biomecânicas Combinadas (Original + Estendidas)
//
// Este módulo combina os 50 exercícios originais com os 112+ estendidos
// em uma única lista, recalcula os grupos e re-exporta tudo.
//
// Importado pelo posture-analyzer.tsx em vez do posture-rules.ts direto.
// O posture-rules.ts ORIGINAL não é modificado.
// ══════════════════════════════════════════════════════════════════════════════

import {
  EXERCISE_RULES as ORIGINAL_RULES,
  type ExerciseRule,
  type ExerciseGroup,
  type MuscleGroup,
} from "./posture-rules"

import { EXTENDED_EXERCISE_RULES } from "./posture-rules-extended"

// ─── Combine all rules, deduplicate by ID ────────────────────────────────────
const seenIds = new Set<string>()
const allRules: ExerciseRule[] = []

// Original rules take priority
for (const rule of ORIGINAL_RULES) {
  if (!seenIds.has(rule.id)) {
    seenIds.add(rule.id)
    allRules.push(rule)
  }
}

// Then extended rules
for (const rule of EXTENDED_EXERCISE_RULES) {
  if (!seenIds.has(rule.id)) {
    seenIds.add(rule.id)
    allRules.push(rule)
  }
}

// ─── Re-export combined ──────────────────────────────────────────────────────

export const ALL_EXERCISE_RULES: ExerciseRule[] = allRules

export const ALL_EXERCISE_GROUPS: ExerciseGroup[] = [
  { id: "quadriceps", label: "Quadríceps", icon: "🦵", exercises: allRules.filter(r => r.muscleGroup === "quadriceps") },
  { id: "hamstrings", label: "Posterior", icon: "🦿", exercises: allRules.filter(r => r.muscleGroup === "hamstrings") },
  { id: "glutes", label: "Glúteos", icon: "🍑", exercises: allRules.filter(r => r.muscleGroup === "glutes") },
  { id: "calves", label: "Panturrilha", icon: "🦶", exercises: allRules.filter(r => r.muscleGroup === "calves") },
  { id: "chest", label: "Peito", icon: "💪", exercises: allRules.filter(r => r.muscleGroup === "chest") },
  { id: "back", label: "Costas", icon: "🔙", exercises: allRules.filter(r => r.muscleGroup === "back") },
  { id: "shoulders", label: "Ombros", icon: "🏋️", exercises: allRules.filter(r => r.muscleGroup === "shoulders") },
  { id: "biceps", label: "Bíceps", icon: "🦾", exercises: allRules.filter(r => r.muscleGroup === "biceps") },
  { id: "triceps", label: "Tríceps", icon: "🔱", exercises: allRules.filter(r => r.muscleGroup === "triceps") },
  { id: "core", label: "Core / Abdômen", icon: "🎯", exercises: allRules.filter(r => r.muscleGroup === "core") },
  { id: "full_body", label: "Full Body", icon: "⚡", exercises: allRules.filter(r => r.muscleGroup === "full_body") },
]

export const TOTAL_EXERCISES_WITH_POSTURE = allRules.length

export function getExerciseRule(id: string): ExerciseRule | undefined {
  return allRules.find(r => r.id === id)
}
