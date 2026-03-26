"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  ClipboardList,
  TrendingUp,
  Minus,
  CalendarCheck,
  Flame,
  Beef,
  AlertTriangle,
  Trophy,
  RefreshCw,
  BarChart3,
  Activity,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface BiData {
  patients: {
    total: number
    active: number
    inactive: number
    withMealPlan: number
    withoutMealPlan: number
    loggedThisWeek: number
  }
  adherence: {
    average7d: number
    average30d: number
    trend: "up" | "down" | "stable"
  }
  mealPlans: {
    total: number
    active: number
    avgCalories: number
    avgProtein: number
  }
  schedule: {
    thisWeek: number
    confirmed: number
    noShow: number
    completed: number
  }
  macroAverages: {
    calories: number
    protein: number
    carbs: number
    fat: number
    water: number
  }
  charts: {
    adherenceByDay: number[]
    logsByDay: number[]
  }
  lists: {
    atRiskPatients: { id: string; name: string; daysSinceLog: number; adherence: number }[]
    topAdherent: { id: string; name: string; adherence: number; streak: number }[]
  }
  updatedAt: string
}

// ═══════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

function getLast7DayLabels(): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    labels.push(DAY_LABELS[d.getDay()])
  }
  return labels
}

// ═══════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════

function AnimatedNumber({ value, suffix = "", duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }

    const startVal = 0
    const endVal = value

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startVal + (endVal - startVal) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    startRef.current = null
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return (
    <span>
      {display.toLocaleString("pt-BR")}
      {suffix}
    </span>
  )
}

// ═══════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-neutral-600 hover:text-emerald-400 transition-colors duration-200"
        aria-label={text}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/10 text-[11px] text-neutral-300 whitespace-nowrap z-50 shadow-xl pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800" />
        </div>
      )}
    </span>
  )
}

// ═══════════════════════════════════════
// MAIN CLIENT
// ═══════════════════════════════════════

export function BiClient() {
  const [data, setData] = useState<BiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch("/api/nutri/bi")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const dayLabels = getLast7DayLabels()

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 mb-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                BI{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300">
                  & Analytics
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                Metricas e indicadores nutricionais
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300",
              "border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/20",
              "text-neutral-400 hover:text-emerald-400",
              refreshing && "pointer-events-none opacity-50"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ STAT CARDS (6) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              index={0}
              icon={Users}
              label="Total Pacientes"
              value={data?.patients.total ?? 0}
              detail={`${data?.patients.active ?? 0} ativos`}
              tooltip="Total de pacientes vinculados"
            />
            <StatCard
              index={1}
              icon={ClipboardList}
              label="Com Plano"
              value={data?.patients.withMealPlan ?? 0}
              detail={`${data?.patients.withoutMealPlan ?? 0} sem plano`}
              tooltip="Pacientes com plano alimentar ativo"
            />
            <StatCard
              index={2}
              icon={TrendingUp}
              label="Aderencia 7d"
              value={data?.adherence.average7d ?? 0}
              suffix="%"
              detail={`30d: ${data?.adherence.average30d ?? 0}%`}
              trend={data?.adherence.trend}
              tooltip="% dos pacientes que registraram refeicoes nos ultimos 7 dias"
            />
            <StatCard
              index={3}
              icon={CalendarCheck}
              label="Consultas Semana"
              value={data?.schedule.thisWeek ?? 0}
              detail={`${data?.schedule.completed ?? 0} concluidas`}
              tooltip="Agendamentos desta semana"
            />
            <StatCard
              index={4}
              icon={Flame}
              label="Calorias Medias"
              value={data?.macroAverages.calories ?? 0}
              suffix=" kcal"
              detail="media dos logs"
              tooltip="Media de calorias registradas por log nos ultimos 7 dias"
            />
            <StatCard
              index={5}
              icon={Beef}
              label="Proteina Media"
              value={data?.macroAverages.protein ?? 0}
              suffix="g"
              detail="media dos logs"
              tooltip="Media de proteina registrada por log nos ultimos 7 dias"
            />
          </>
        )}
      </div>

      {/* ═══ CHARTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Adherence by Day (Bar Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <BarChart3 className="w-3 h-3 text-emerald-500" />
              </div>
              Aderencia por Dia
            </h3>
            <Tooltip text="% de pacientes que registraram neste dia" />
          </div>

          {loading ? (
            <div className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
          ) : (
            <BarChart
              data={data?.charts.adherenceByDay ?? []}
              labels={dayLabels}
              suffix="%"
              maxValue={100}
            />
          )}
        </motion.div>

        {/* Logs by Day (Line Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <Activity className="w-3 h-3 text-emerald-500" />
              </div>
              Logs por Dia
            </h3>
            <Tooltip text="Quantidade total de registros por dia" />
          </div>

          {loading ? (
            <div className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
          ) : (
            <LineChart
              data={data?.charts.logsByDay ?? []}
              labels={dayLabels}
            />
          )}
        </motion.div>
      </div>

      {/* ═══ MACRO OVERVIEW ═══ */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <Flame className="w-3 h-3 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
              Macros Medios (7 dias)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <MacroCard label="Calorias" value={data.macroAverages.calories} unit="kcal" color="from-orange-500 to-red-500" />
            <MacroCard label="Proteina" value={data.macroAverages.protein} unit="g" color="from-emerald-500 to-teal-500" />
            <MacroCard label="Carboidratos" value={data.macroAverages.carbs} unit="g" color="from-amber-500 to-yellow-500" />
            <MacroCard label="Gordura" value={data.macroAverages.fat} unit="g" color="from-purple-500 to-pink-500" />
            <MacroCard label="Agua" value={data.macroAverages.water} unit="ml" color="from-sky-500 to-blue-500" />
          </div>
        </motion.div>
      )}

      {/* ═══ LISTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* At-Risk Patients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-red-600/10 flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
              Pacientes em Risco
            </h3>
            <Tooltip text="Sem registros ha 3+ dias" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : !data?.lists.atRiskPatients.length ? (
            <EmptyState icon={AlertTriangle} text="Nenhum paciente em risco" subtext="Todos estao registrando refeicoes" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Paciente
                    </th>
                    <th className="text-center text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Dias s/ Log
                    </th>
                    <th className="text-right text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Aderencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.lists.atRiskPatients.map((patient, i) => (
                    <motion.tr
                      key={patient.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center text-red-400/80 text-[11px] font-medium border border-red-500/10 shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white/80 text-sm font-medium truncate max-w-[140px]">
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                          patient.daysSinceLog >= 7
                            ? "bg-red-500/10 text-red-400"
                            : patient.daysSinceLog >= 5
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        )}>
                          {patient.daysSinceLog >= 999 ? "Nunca" : `${patient.daysSinceLog}d`}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={cn(
                          "text-[11px] font-medium",
                          patient.adherence >= 50 ? "text-amber-400" : "text-red-400"
                        )}>
                          {patient.adherence}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Top Adherent */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <Trophy className="w-3 h-3 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
              Top Aderentes
            </h3>
            <Tooltip text="Pacientes mais consistentes nos registros" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : !data?.lists.topAdherent.length ? (
            <EmptyState icon={Trophy} text="Sem dados de aderencia" subtext="Os pacientes ainda nao registraram refeicoes" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2 w-6">
                      #
                    </th>
                    <th className="text-left text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Paciente
                    </th>
                    <th className="text-center text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Aderencia
                    </th>
                    <th className="text-right text-[10px] text-neutral-500 uppercase tracking-wider font-medium pb-3 px-2">
                      Sequencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.lists.topAdherent.map((patient, i) => (
                    <motion.tr
                      key={patient.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      <td className="py-3 px-2">
                        <span className={cn(
                          "text-[11px] font-bold",
                          i === 0 ? "text-amber-400" : i === 1 ? "text-neutral-400" : i === 2 ? "text-orange-400" : "text-neutral-600"
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border shrink-0",
                            i === 0
                              ? "bg-gradient-to-br from-amber-600/20 to-amber-900/10 text-amber-400/80 border-amber-500/20"
                              : "bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 text-emerald-400/80 border-emerald-500/10"
                          )}>
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white/80 text-sm font-medium truncate max-w-[140px]">
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                          patient.adherence >= 70
                            ? "bg-emerald-500/10 text-emerald-400"
                            : patient.adherence >= 40
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        )}>
                          {patient.adherence}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-[11px] text-emerald-400/80 font-medium">
                          {patient.streak}d
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══ FOOTER ═══ */}
      {data?.updatedAt && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[10px] text-neutral-600"
        >
          Atualizado em {new Date(data.updatedAt).toLocaleString("pt-BR")}
        </motion.p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════

function StatCard({
  index,
  icon: Icon,
  label,
  value,
  suffix = "",
  detail,
  trend,
  tooltip,
}: {
  index: number
  icon: typeof Users
  label: string
  value: number
  suffix?: string
  detail: string
  trend?: "up" | "down" | "stable"
  tooltip?: string
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-500">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {trend && <TrendBadge trend={trend} />}
            {tooltip && <Tooltip text={tooltip} />}
          </div>
        </div>
        <p className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-none mb-1">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        <p className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">
          {label}
        </p>
        <p className="text-[9px] text-neutral-600 mt-0.5 hidden sm:block">{detail}</p>
      </div>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  )
}

// ═══════════════════════════════════════
// TREND BADGE
// ═══════════════════════════════════════

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
        <ChevronUp className="w-3 h-3" />
      </span>
    )
  }
  if (trend === "down") {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-400">
        <ChevronDown className="w-3 h-3" />
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-neutral-500">
      <Minus className="w-3 h-3" />
    </span>
  )
}

// ═══════════════════════════════════════
// MACRO CARD
// ═══════════════════════════════════════

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 sm:p-4 text-center hover:border-white/[0.08] transition-all duration-300">
      <div className={cn("w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center bg-gradient-to-br opacity-20", color)} />
      <p className="text-lg sm:text-xl font-bold text-white leading-none">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[9px] text-neutral-500 mt-0.5">{unit}</p>
      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1 font-medium">{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════
// BAR CHART (DIV-based)
// ═══════════════════════════════════════

function BarChart({
  data,
  labels,
  suffix = "",
  maxValue,
}: {
  data: number[]
  labels: string[]
  suffix?: string
  maxValue?: number
}) {
  const max = maxValue ?? Math.max(...data, 1)

  return (
    <div className="flex items-end gap-2 sm:gap-3 h-48">
      {data.map((value, i) => {
        const height = max > 0 ? (value / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            {/* Value label */}
            <span className="text-[10px] text-neutral-400 font-medium">
              {value}{suffix}
            </span>
            {/* Bar */}
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                className={cn(
                  "w-full rounded-t-lg transition-colors duration-300",
                  value >= 70
                    ? "bg-gradient-to-t from-emerald-600/60 to-emerald-400/80"
                    : value >= 40
                    ? "bg-gradient-to-t from-amber-600/60 to-amber-400/80"
                    : "bg-gradient-to-t from-red-600/40 to-red-400/60"
                )}
                style={{ minHeight: value > 0 ? "4px" : "0px" }}
              />
            </div>
            {/* Day label */}
            <span className="text-[10px] text-neutral-600 font-medium">{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════
// LINE CHART (DIV-based with dots)
// ═══════════════════════════════════════

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1)

  return (
    <div className="relative h-48">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-white/[0.03] flex items-center">
            <span className="text-[9px] text-neutral-700 w-6 text-right mr-2 -mb-px">
              {Math.round(max - (max / 3) * i)}
            </span>
          </div>
        ))}
      </div>

      {/* Data points and lines */}
      <div className="absolute inset-0 pl-9 pr-1 flex items-end">
        {data.map((value, i) => {
          const height = max > 0 ? (value / max) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center relative group">
              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-neutral-800 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white whitespace-nowrap shadow-xl">
                  {value} logs
                </div>
              </div>
              {/* Vertical connector */}
              <div className="w-full flex-1 flex items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                  className="w-[2px] bg-gradient-to-t from-transparent to-emerald-500/40 relative"
                  style={{ minHeight: value > 0 ? "4px" : "0px" }}
                >
                  {/* Dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#060606] shadow-lg shadow-emerald-500/30 group-hover:scale-150 transition-transform duration-200"
                  />
                </motion.div>
              </div>
              {/* Day label */}
              <span className="text-[10px] text-neutral-600 font-medium mt-2">{labels[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// SKELETON / EMPTY STATE
// ═══════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-white/[0.05] mb-3" />
      <div className="h-7 w-14 bg-white/[0.05] rounded mb-1" />
      <div className="h-3 w-20 bg-white/[0.03] rounded" />
    </div>
  )
}

function EmptyState({ icon: Icon, text, subtext }: { icon: typeof Users; text: string; subtext: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-neutral-600" />
      </div>
      <p className="text-neutral-400 text-sm">{text}</p>
      <p className="text-neutral-600 text-xs mt-1">{subtext}</p>
    </div>
  )
}
