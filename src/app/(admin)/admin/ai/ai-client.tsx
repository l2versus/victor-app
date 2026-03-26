"use client"

import { useState } from "react"
import {
  Brain, Dumbbell, Stethoscope, MessageSquare,
  Sparkles, ChevronRight,
} from "lucide-react"
import { AIWorkoutGenerator } from "@/components/admin/ai-workout-generator"
import { AIAnamnesisAnalyzer } from "@/components/admin/ai-anamnesis-analyzer"
import { AIEngagement } from "@/components/admin/ai-engagement"

type Tab = "workouts" | "anamnesis" | "engagement"

const tabs = [
  {
    id: "workouts" as Tab,
    label: "Gerar Treinos",
    icon: Dumbbell,
    desc: "Crie treinos personalizados com IA",
    accent: "violet",
  },
  {
    id: "anamnesis" as Tab,
    label: "Anamnese",
    icon: Stethoscope,
    desc: "Análise automática de anamnese",
    accent: "emerald",
  },
  {
    id: "engagement" as Tab,
    label: "Engajamento",
    icon: MessageSquare,
    desc: "Mensagens motivacionais para alunos",
    accent: "amber",
  },
]

export default function AdminAIPage() {
  const [activeTab, setActiveTab] = useState<Tab>("workouts")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-violet-500/20 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            Inteligência Artificial
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15 uppercase tracking-wider">
              Beta
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-500">
            Ferramentas de IA para turbinar sua consultoria
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const accentMap: Record<string, { active: string; icon: string; glow: string }> = {
            violet: {
              active: "border-violet-500/30 bg-violet-500/5",
              icon: "from-violet-600/20 to-violet-800/20 text-violet-400 border-violet-500/10",
              glow: "bg-violet-600/15",
            },
            emerald: {
              active: "border-emerald-500/30 bg-emerald-500/5",
              icon: "from-emerald-600/20 to-emerald-800/20 text-emerald-400 border-emerald-500/10",
              glow: "bg-emerald-600/15",
            },
            amber: {
              active: "border-amber-500/30 bg-amber-500/5",
              icon: "from-amber-600/20 to-amber-800/20 text-amber-400 border-amber-500/10",
              glow: "bg-amber-600/15",
            },
          }
          const accentClasses = accentMap[tab.accent]

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-4 text-left transition-all duration-300 ${
                isActive
                  ? accentClasses.active
                  : "border-neutral-800 bg-[#111] hover:border-neutral-700"
              }`}
            >
              {isActive && (
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl ${accentClasses.glow}`} />
              )}
              <div className="relative z-10">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accentClasses.icon} flex items-center justify-center border mb-2`}>
                  <tab.icon className="w-4 h-4" />
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold">{tab.label}</p>
                <p className="text-neutral-500 text-[10px] hidden sm:block mt-0.5">{tab.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === "workouts" && <AIWorkoutGenerator />}
        {activeTab === "anamnesis" && <AIAnamnesisAnalyzer />}
        {activeTab === "engagement" && <AIEngagement />}
      </div>
    </div>
  )
}
