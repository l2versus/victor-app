import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTrainerProfile } from "@/lib/admin"

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
}
import {
  Users, Dumbbell, Calendar, DollarSign,
  ArrowRight, Plus, Activity, Zap, Flame, Brain
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  let trainer
  try {
    trainer = await getTrainerProfile(session.userId)
  } catch {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Zap className="w-10 h-10 text-red-600/50 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/80 mb-2">Configurando seu perfil...</h2>
          <p className="text-neutral-500 text-sm">Atualize a página em instantes.</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const [
    totalStudents, activeStudents, sessionsThisWeek, pendingPayments,
    recentStudents, recentSessions, totalExercises,
  ] = await Promise.all([
    prisma.student.count({ where: { trainerId: trainer.id } }),
    prisma.student.count({ where: { trainerId: trainer.id, status: "ACTIVE" } }),
    prisma.workoutSession.count({ where: { student: { trainerId: trainer.id }, startedAt: { gte: weekStart } } }),
    prisma.payment.count({ where: { student: { trainerId: trainer.id }, status: "PENDING" } }),
    prisma.student.findMany({
      where: { trainerId: trainer.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }, take: 5,
    }),
    prisma.workoutSession.findMany({
      where: { student: { trainerId: trainer.id } },
      include: { student: { include: { user: { select: { name: true } } } }, template: { select: { name: true } } },
      orderBy: { startedAt: "desc" }, take: 5,
    }),
    prisma.exercise.count(),
  ])

  const firstName = session.email.split("@")[0]

  const statusLabels: Record<string, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    PENDING: "Pendente",
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER — Warm greeting with ember icon ═══ */}
      <div className="pt-1 sm:pt-2">
        <div className="flex items-center gap-3 sm:gap-4 mb-1">
          <div className="relative">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/25">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ember bg-red-500/20" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300">{firstName}</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ STAT CARDS — Glass with colored accents ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AliveStatCard icon={Users} label="Total de Alunos" value={totalStudents} detail={`${activeStudents} ativos`} accent="red" />
        <AliveStatCard icon={Calendar} label="Sessões" value={sessionsThisWeek} detail="esta semana" accent="orange" />
        <AliveStatCard icon={Dumbbell} label="Exercícios" value={totalExercises} detail="na biblioteca" accent="red" />
        <AliveStatCard icon={DollarSign} label="Pagamentos" value={pendingPayments} detail="pendentes" accent="orange" />
      </div>

      {/* ═══ QUICK ACTIONS — Alive hover ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AliveAction href="/admin/students" icon={Plus} title="Novo Aluno" desc="Cadastrar um novo aluno" />
        <AliveAction href="/admin/workouts/new" icon={Dumbbell} title="Criar Treino" desc="Montar um plano de treino" />
        <AliveAction href="/admin/exercises" icon={Activity} title="Biblioteca" desc={`${totalExercises} exercícios`} />
        <AliveAction href="/admin/ai" icon={Brain} title="IA Tools" desc="Treinos, anamnese, engajamento" />
      </div>

      {/* ═══ TWO COLUMN — Glass Panels ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Students */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-600/10 flex items-center justify-center">
                <Users className="w-3 h-3 text-red-500" />
              </div>
              Alunos Recentes
            </h3>
            <Link href="/admin/students" className="text-[10px] text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors duration-300">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentStudents.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Nenhum aluno ainda</p>
              <Link href="/admin/students" className="text-neutral-500 text-xs hover:text-red-400 mt-2 inline-block transition-colors">
                Adicione seu primeiro aluno →
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentStudents.map((s: typeof recentStudents[0]) => (
                <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/20 to-red-900/10 flex items-center justify-center text-red-400/80 text-sm font-medium border border-red-500/10 group-hover:border-red-500/30 group-hover:shadow-md group-hover:shadow-red-600/10 transition-all duration-300">
                    {s.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium truncate">{s.user.name}</p>
                    <p className="text-neutral-600 text-[11px] truncate">{s.user.email}</p>
                  </div>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/15"
                    : s.status === "PENDING" ? "bg-amber-500/10 text-amber-400/80 border border-amber-500/15"
                    : "bg-neutral-500/10 text-neutral-500 border border-neutral-500/15"
                  }`}>{statusLabels[s.status] || s.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-600/10 flex items-center justify-center">
                <Dumbbell className="w-3 h-3 text-orange-500" />
              </div>
              Sessões Recentes
            </h3>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="w-5 h-5 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Nenhuma sessão ainda</p>
              <p className="text-neutral-600 text-xs mt-1">As sessões aparecem quando os alunos treinam</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSessions.map((sess: typeof recentSessions[0]) => (
                <div key={sess.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600/15 to-orange-900/5 flex items-center justify-center text-orange-400/70 border border-orange-500/10">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium truncate">{sess.student.user.name}</p>
                    <p className="text-neutral-600 text-[11px] truncate">{sess.template.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-500 text-[11px]">{format(sess.startedAt, "dd/MM")}</p>
                    <p className={`text-[9px] ${sess.completedAt ? "text-emerald-400/70" : "text-amber-400/70"}`}>
                      {sess.completedAt ? "Concluído" : "Em andamento"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══ ALIVE STAT CARD — Glass with colored ember glow ═══ */
function AliveStatCard({
  icon: Icon, label, value, detail, accent,
}: {
  icon: typeof Users; label: string; value: number; detail: string; accent: "red" | "orange"
}) {
  const isRed = accent === "red"
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] active:scale-[0.98]">
      {/* Hover ember glow */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${isRed ? 'bg-red-600/15' : 'bg-orange-600/15'}`} />
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent ${isRed ? 'via-red-600/25' : 'via-orange-600/25'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className="mb-3 sm:mb-5">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${isRed ? 'text-red-500/70' : 'text-orange-500/70'} group-hover:border-white/[0.12] group-hover:scale-105 transition-all duration-300`}>
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
        </div>
        <p className="text-2xl sm:text-[32px] font-bold text-white/90 tracking-tight leading-none mb-1">{value}</p>
        <p className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-[0.12em] font-medium">{label}</p>
        <p className="text-[9px] text-neutral-600 mt-0.5 hidden sm:block">{detail}</p>
      </div>
    </div>
  )
}

/* ═══ ALIVE ACTION CARD ═══ */
function AliveAction({
  href, icon: Icon, title, desc,
}: {
  href: string; icon: typeof Plus; title: string; desc: string
}) {
  return (
    <Link href={href}
      className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04] active:scale-[0.98]"
    >
      {/* Hover glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-red-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 group-hover:text-red-400 group-hover:border-red-500/20 transition-all duration-300 relative z-10">
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-white/80 font-medium text-sm">{title}</p>
        <p className="text-neutral-600 text-[11px]">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:text-red-400/60 group-hover:translate-x-0.5 transition-all duration-300 relative z-10" />
    </Link>
  )
}
