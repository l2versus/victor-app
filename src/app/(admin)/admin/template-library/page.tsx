"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  BookOpen, Copy, Search, Filter, Dumbbell,
  Target, Zap, Heart, Shield, Activity,
  ChevronDown, Check, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Template = {
  id: string
  name: string
  description: string | null
  goal: string
  level: string
  daysPerWeek: number
  exercises: unknown[]
  usageCount: number
}

const GOALS = [
  { value: "", label: "Todos", icon: BookOpen },
  { value: "HYPERTROPHY", label: "Hipertrofia", icon: Dumbbell },
  { value: "STRENGTH", label: "Força", icon: Zap },
  { value: "FAT_LOSS", label: "Emagrecimento", icon: Heart },
  { value: "ENDURANCE", label: "Resistência", icon: Activity },
  { value: "GENERAL_FITNESS", label: "Condicionamento", icon: Target },
  { value: "REHABILITATION", label: "Reabilitação", icon: Shield },
]

const LEVELS = [
  { value: "", label: "Todos" },
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Intermediário" },
  { value: "ADVANCED", label: "Avançado" },
]

const GOAL_COLORS: Record<string, string> = {
  HYPERTROPHY: "text-red-400 bg-red-500/15 border-red-500/20",
  STRENGTH: "text-amber-400 bg-amber-500/15 border-amber-500/20",
  FAT_LOSS: "text-pink-400 bg-pink-500/15 border-pink-500/20",
  ENDURANCE: "text-blue-400 bg-blue-500/15 border-blue-500/20",
  GENERAL_FITNESS: "text-green-400 bg-green-500/15 border-green-500/20",
  REHABILITATION: "text-purple-400 bg-purple-500/15 border-purple-500/20",
}

const LEVEL_BADGES: Record<string, string> = {
  BEGINNER: "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-amber-500/15 text-amber-400",
  ADVANCED: "bg-red-500/15 text-red-400",
}

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [goalFilter, setGoalFilter] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [copying, setCopying] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (goalFilter) params.set("goal", goalFilter)
    if (levelFilter) params.set("level", levelFilter)

    try {
      const res = await fetch(`/api/admin/template-library?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [goalFilter, levelFilter])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function copyTemplate(id: string) {
    setCopying(id)
    try {
      const res = await fetch("/api/admin/template-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      })
      if (res.ok) {
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
        // Update usage count locally
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t))
      }
    } catch { /* ignore */ }
    setCopying(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          Templates Prontos
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Copie treinos prontos para seus alunos</p>
      </div>

      {/* Goal filter chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {GOALS.map(g => {
          const Icon = g.icon
          return (
            <button key={g.value} onClick={() => setGoalFilter(goalFilter === g.value ? "" : g.value)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                goalFilter === g.value ? "bg-red-600/20 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
              )}>
              <Icon className="w-3 h-3" />
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Level filter */}
      <div className="flex gap-1.5">
        {LEVELS.map(l => (
          <button key={l.value} onClick={() => setLevelFilter(levelFilter === l.value ? "" : l.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
              levelFilter === l.value ? "bg-amber-600/20 text-amber-400 border border-amber-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
            )}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhum template disponível</p>
          <p className="text-neutral-600 text-xs mt-1">Templates serão adicionados em breve!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const goalColor = GOAL_COLORS[t.goal] || GOAL_COLORS.GENERAL_FITNESS
            const levelBadge = LEVEL_BADGES[t.level] || LEVEL_BADGES.BEGINNER
            const exercises = Array.isArray(t.exercises) ? t.exercises : []
            const isCopying = copying === t.id
            const isCopied = copied === t.id

            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                    {t.description && <p className="text-xs text-neutral-400 mt-1">{t.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border", goalColor)}>
                        {GOALS.find(g => g.value === t.goal)?.label || t.goal}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-semibold", levelBadge)}>
                        {LEVELS.find(l => l.value === t.level)?.label || t.level}
                      </span>
                      <span className="text-[10px] text-neutral-500">{t.daysPerWeek}x/semana</span>
                      <span className="text-[10px] text-neutral-500">{exercises.length} exercícios</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyTemplate(t.id)}
                    disabled={isCopying}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold min-h-[44px] transition-all",
                      isCopied
                        ? "bg-green-600/20 text-green-400 border border-green-500/20"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20"
                    )}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? "Copiado!" : isCopying ? "..." : "Copiar"}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                  <Users className="w-3 h-3" />
                  <span>Usado {t.usageCount}x</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
