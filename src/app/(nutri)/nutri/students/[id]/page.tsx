"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, User, Target, Calendar, History,
  Flame, Droplets, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface StudentDetail {
  student: {
    id: string
    name: string
    email: string
    avatar: string | null
    weight: number | null
    height: number | null
    birthDate: string | null
    goals: string | null
    restrictions: unknown
    gender: string | null
  }
  currentPlan: {
    id: string
    name: string
    description: string | null
    targetCalories: number | null
    targetProtein: number | null
    targetCarbs: number | null
    targetFat: number | null
  } | null
  macroAverages: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  adherenceGrid: {
    date: string
    logged: boolean
    percentage: number
  }[]
  history: {
    id: string
    date: string
    totalCalories: number
    protein: number
    carbs: number
    fat: number
    waterMl: number
    meals: unknown
  }[]
}

type TabKey = "overview" | "adherence" | "history"

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "overview", label: "Visao Geral", icon: User },
  { key: "adherence", label: "Aderencia", icon: Calendar },
  { key: "history", label: "Historico", icon: History },
]

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export default function NutriStudentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  useEffect(() => {
    fetch(`/api/nutri/students/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400 text-sm">Paciente nao encontrado</p>
        <Link href="/nutri/students" className="text-emerald-400 text-sm mt-2 inline-block hover:underline">
          Voltar para lista
        </Link>
      </div>
    )
  }

  const { student, currentPlan, macroAverages, adherenceGrid, history } = data

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <Link
          href="/nutri/students"
          className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-emerald-400 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 flex items-center justify-center text-emerald-400 text-xl font-semibold border border-emerald-500/10 overflow-hidden">
            {student.avatar ? (
              <img src={student.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              student.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-[-0.02em]">
              {student.name}
            </h1>
            <p className="text-[11px] text-neutral-500">{student.email}</p>
            <div className="flex items-center gap-3 mt-1">
              {student.weight && (
                <span className="text-[10px] text-neutral-500">{student.weight} kg</span>
              )}
              {student.height && (
                <span className="text-[10px] text-neutral-500">{student.height} cm</span>
              )}
              {student.gender && (
                <span className="text-[10px] text-neutral-500 uppercase">{student.gender === "MALE" ? "M" : student.gender === "FEMALE" ? "F" : "O"}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                : "text-neutral-500 hover:text-neutral-300 border border-transparent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === "overview" && (
        <OverviewTab
          student={student}
          currentPlan={currentPlan}
          macroAverages={macroAverages}
        />
      )}
      {activeTab === "adherence" && (
        <AdherenceTab adherenceGrid={adherenceGrid} />
      )}
      {activeTab === "history" && (
        <HistoryTab history={history} />
      )}
    </div>
  )
}

/* ═══ OVERVIEW TAB ═══ */
function OverviewTab({
  student,
  currentPlan,
  macroAverages,
}: {
  student: StudentDetail["student"]
  currentPlan: StudentDetail["currentPlan"]
  macroAverages: StudentDetail["macroAverages"]
}) {
  const macros = [
    {
      label: "Calorias",
      icon: Flame,
      actual: macroAverages.calories,
      target: currentPlan?.targetCalories,
      unit: "kcal",
      color: "emerald",
    },
    {
      label: "Proteina",
      icon: Target,
      actual: macroAverages.protein,
      target: currentPlan?.targetProtein,
      unit: "g",
      color: "blue",
    },
    {
      label: "Carboidratos",
      icon: Target,
      actual: macroAverages.carbs,
      target: currentPlan?.targetCarbs,
      unit: "g",
      color: "amber",
    },
    {
      label: "Gorduras",
      icon: Droplets,
      actual: macroAverages.fat,
      target: currentPlan?.targetFat,
      unit: "g",
      color: "rose",
    },
  ]

  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    emerald: { bg: "bg-emerald-600/10", text: "text-emerald-400", bar: "bg-emerald-500" },
    blue: { bg: "bg-blue-600/10", text: "text-blue-400", bar: "bg-blue-500" },
    amber: { bg: "bg-amber-600/10", text: "text-amber-400", bar: "bg-amber-500" },
    rose: { bg: "bg-rose-600/10", text: "text-rose-400", bar: "bg-rose-500" },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Patient Info */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
            <User className="w-3 h-3 text-emerald-500" />
          </div>
          Informacoes do Paciente
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem label="Peso" value={student.weight ? `${student.weight} kg` : "-"} />
          <InfoItem label="Altura" value={student.height ? `${student.height} cm` : "-"} />
          <InfoItem
            label="Nascimento"
            value={student.birthDate ? format(new Date(student.birthDate), "dd/MM/yyyy") : "-"}
          />
          <InfoItem label="Objetivo" value={student.goals || "-"} />
        </div>
        {currentPlan && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-0.5">Plano Atual</p>
                <p className="text-white/80 text-sm font-medium">{currentPlan.name}</p>
                {currentPlan.description && (
                  <p className="text-neutral-500 text-[11px] mt-0.5">{currentPlan.description}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-700" />
            </div>
          </div>
        )}
      </div>

      {/* Macro Targets vs Actual */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
            <Target className="w-3 h-3 text-emerald-500" />
          </div>
          Macros — Media 7 dias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {macros.map((macro) => {
            const colors = colorMap[macro.color]
            const percentage = macro.target
              ? Math.min(100, Math.round((macro.actual / macro.target) * 100))
              : null

            return (
              <div
                key={macro.label}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <macro.icon className={`w-3.5 h-3.5 ${colors.text}`} />
                    </div>
                    <span className="text-neutral-400 text-[12px] font-medium">{macro.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold text-sm">
                      {macro.actual}
                    </span>
                    {macro.target && (
                      <span className="text-neutral-600 text-[11px]">
                        {" "}/ {macro.target} {macro.unit}
                      </span>
                    )}
                  </div>
                </div>
                {percentage !== null && (
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1 ${colors.text}`}>{percentage}% da meta</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-white/70 text-sm truncate">{value}</p>
    </div>
  )
}

/* ═══ ADHERENCE TAB ═══ */
function AdherenceTab({ adherenceGrid }: { adherenceGrid: StudentDetail["adherenceGrid"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-emerald-500" />
          </div>
          Aderencia — Ultimos 7 dias
        </h3>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {adherenceGrid.map((day) => {
            const date = new Date(day.date + "T12:00:00")
            const dayName = dayLabels[date.getDay()]
            const dayNum = format(date, "dd")

            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium">
                  {dayName}
                </p>
                <div
                  className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                    day.logged
                      ? day.percentage >= 80
                        ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                        : day.percentage >= 50
                        ? "bg-amber-500/15 border-amber-500/20 text-amber-400"
                        : "bg-red-500/15 border-red-500/20 text-red-400"
                      : "bg-white/[0.02] border-white/[0.06] text-neutral-700"
                  }`}
                >
                  <p className="text-lg sm:text-xl font-bold leading-none">{dayNum}</p>
                  {day.logged && (
                    <p className="text-[9px] font-medium mt-0.5">{day.percentage}%</p>
                  )}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  day.logged ? "bg-emerald-500" : "bg-neutral-800"
                }`} />
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/20" />
            <span className="text-[10px] text-neutral-500">Otimo (80%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/20" />
            <span className="text-[10px] text-neutral-500">Regular (50-79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/15 border border-red-500/20" />
            <span className="text-[10px] text-neutral-500">Baixo (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white/[0.02] border border-white/[0.06]" />
            <span className="text-[10px] text-neutral-500">Sem registro</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══ HISTORY TAB ═══ */
function HistoryTab({ history }: { history: StudentDetail["history"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
            <History className="w-3 h-3 text-emerald-500" />
          </div>
          Historico de Registros
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <History className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">Nenhum registro encontrado</p>
            <p className="text-neutral-600 text-xs mt-1">Os registros aparecem quando o paciente loga refeicoes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">
                    {format(new Date(log.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-emerald-400 text-[11px] font-medium">{log.totalCalories} kcal</span>
                    <span className="text-blue-400 text-[11px]">P: {log.protein}g</span>
                    <span className="text-amber-400 text-[11px]">C: {log.carbs}g</span>
                    <span className="text-rose-400 text-[11px]">G: {log.fat}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Droplets className="w-3 h-3 text-blue-400/60" />
                  <span className="text-neutral-500 text-[11px]">{log.waterMl}ml</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
