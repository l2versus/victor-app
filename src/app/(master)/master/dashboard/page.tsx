"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Building2, UserCog, Users, TrendingUp, Shield } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DashboardData {
  stats: {
    totalOrgs: number
    activeOrgs: number
    totalTrainers: number
    totalNutris: number
    totalStudents: number
    activeStudents: number
    totalProfessionals: number
  }
  recentOrgs: {
    id: string
    name: string
    slug: string
    status: string
    logo: string | null
    createdAt: string
    _count: {
      students: number
      trainers: number
      nutritionists: number
    }
  }[]
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  TRIAL: { label: "Trial", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  SUSPENDED: { label: "Suspenso", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  CANCELLED: { label: "Cancelado", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function MasterDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/master/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activationRate =
    data && data.stats.totalStudents > 0
      ? Math.round((data.stats.activeStudents / data.stats.totalStudents) * 100)
      : 0

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
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Master{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-300">
                Dashboard
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Painel de controle da plataforma
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
            <MasterStatCard
              index={0}
              icon={Building2}
              label="Organizacoes"
              value={data?.stats.totalOrgs ?? 0}
              detail={`${data?.stats.activeOrgs ?? 0} ativas`}
            />
            <MasterStatCard
              index={1}
              icon={UserCog}
              label="Profissionais"
              value={data?.stats.totalProfessionals ?? 0}
              detail={`${data?.stats.totalTrainers ?? 0} trainers · ${data?.stats.totalNutris ?? 0} nutris`}
            />
            <MasterStatCard
              index={2}
              icon={Users}
              label="Alunos"
              value={data?.stats.totalStudents ?? 0}
              detail={`${data?.stats.activeStudents ?? 0} ativos`}
            />
            <MasterStatCard
              index={3}
              icon={TrendingUp}
              label="Taxa Ativacao"
              value={`${activationRate}%`}
              detail="alunos ativos / total"
            />
          </>
        )}
      </div>

      {/* ═══ RECENT ORGANIZATIONS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <Building2 className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
            Organizacoes Recentes
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : !data?.recentOrgs?.length ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">Nenhuma organizacao cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Nome
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Status
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Trainers
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Nutris
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Alunos
                  </th>
                  <th className="text-right py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Criada em
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrgs.map((org, i) => {
                  const status = statusConfig[org.status] ?? statusConfig.CANCELLED
                  return (
                    <motion.tr
                      key={org.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-xs font-semibold border border-violet-500/10">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white/80 font-medium truncate max-w-[160px]">{org.name}</p>
                            <p className="text-neutral-600 text-[11px]">{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400 hidden sm:table-cell">
                        {org._count.trainers}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400 hidden sm:table-cell">
                        {org._count.nutritionists}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400">
                        {org._count.students}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500 text-[11px] hidden md:table-cell">
                        {format(new Date(org.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ═══ STAT CARD — Violet glass ═══ */
function MasterStatCard({
  index,
  icon: Icon,
  label,
  value,
  detail,
}: {
  index: number
  icon: typeof Building2
  label: string
  value: number | string
  detail: string
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
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-violet-600/10 text-violet-500">
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
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-violet-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
