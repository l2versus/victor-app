"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users, ClipboardList, TrendingUp, AlertTriangle,
  ArrowRight, Leaf, AlertCircle, Info, ChevronRight,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  stats: {
    totalPatients: number
    activeMealPlans: number
    avgAdherence: number
    alertCount: number
  }
  recentPatients: {
    id: string
    name: string
    email: string
    avatar: string | null
    adherence: number
    lastLogDate: string | null
    currentPlan: string | null
  }[]
  alerts: {
    type: "danger" | "warning" | "info"
    message: string
  }[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function NutriDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nutri/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Painel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-300">
                Nutricional
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Acompanhe seus pacientes em tempo real
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <NutriStatCard
              index={0}
              icon={Users}
              label="Pacientes"
              value={data?.stats.totalPatients ?? 0}
              detail="ativos"
            />
            <NutriStatCard
              index={1}
              icon={ClipboardList}
              label="Planos Ativos"
              value={data?.stats.activeMealPlans ?? 0}
              detail="em andamento"
            />
            <NutriStatCard
              index={2}
              icon={TrendingUp}
              label="Aderencia Media"
              value={`${data?.stats.avgAdherence ?? 0}%`}
              detail="ultimos 7 dias"
            />
            <NutriStatCard
              index={3}
              icon={AlertTriangle}
              label="Alertas"
              value={data?.stats.alertCount ?? 0}
              detail="requerem atencao"
              isAlert={(data?.stats.alertCount ?? 0) > 0}
            />
          </>
        )}
      </div>

      {/* ═══ TWO COLUMN ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Patients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <Users className="w-3 h-3 text-emerald-500" />
              </div>
              Pacientes Recentes
            </h3>
            <Link
              href="/nutri/students"
              className="text-[10px] text-neutral-500 hover:text-emerald-400 flex items-center gap-1 transition-colors duration-300"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : !data?.recentPatients?.length ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Nenhum paciente ainda</p>
              <p className="text-neutral-600 text-xs mt-1">
                Vincule pacientes ao seu perfil
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/nutri/students/${patient.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 flex items-center justify-center text-emerald-400/80 text-sm font-medium border border-emerald-500/10 group-hover:border-emerald-500/30 group-hover:shadow-md group-hover:shadow-emerald-600/10 transition-all duration-300 overflow-hidden">
                    {patient.avatar ? (
                      <img src={patient.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      patient.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium truncate">{patient.name}</p>
                    <p className="text-neutral-600 text-[11px] truncate">
                      {patient.currentPlan || "Sem plano ativo"}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className={`text-[11px] font-medium ${
                        patient.adherence >= 70
                          ? "text-emerald-400"
                          : patient.adherence >= 40
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}>
                        {patient.adherence}%
                      </span>
                      <span className="text-[9px] text-neutral-600">aderencia</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-emerald-400/60 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-amber-600/10 flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
              Alertas
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : !data?.alerts?.length ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Nenhum alerta no momento</p>
              <p className="text-neutral-600 text-xs mt-1">Tudo em ordem com seus pacientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    alert.type === "danger"
                      ? "bg-red-500/5 border-red-500/10"
                      : alert.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/10"
                      : "bg-blue-500/5 border-blue-500/10"
                  }`}
                >
                  {alert.type === "danger" ? (
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  ) : alert.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  )}
                  <p className={`text-sm ${
                    alert.type === "danger"
                      ? "text-red-300/80"
                      : alert.type === "warning"
                      ? "text-amber-300/80"
                      : "text-blue-300/80"
                  }`}>
                    {alert.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/* ═══ STAT CARD — Emerald glass ═══ */
function NutriStatCard({
  index,
  icon: Icon,
  label,
  value,
  detail,
  isAlert = false,
}: {
  index: number
  icon: typeof Users
  label: string
  value: number | string
  detail: string
  isAlert?: boolean
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <div className="relative z-10">
        <div className="mb-3 sm:mb-4">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
            isAlert ? "bg-amber-600/10 text-amber-500" : "bg-emerald-600/10 text-emerald-500"
          }`}>
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
        <p className="text-2xl sm:text-[32px] font-bold text-white tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">
          {label}
        </p>
        <p className="text-[9px] text-neutral-600 mt-0.5 hidden sm:block">{detail}</p>
      </div>
      {/* Hover glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
        isAlert ? "bg-amber-600/10" : "bg-emerald-600/10"
      }`} />
    </motion.div>
  )
}

/* ═══ SKELETON CARD ═══ */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 animate-pulse">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] mb-3 sm:mb-4" />
      <div className="h-8 w-16 bg-white/[0.05] rounded mb-1" />
      <div className="h-3 w-24 bg-white/[0.03] rounded" />
    </div>
  )
}
