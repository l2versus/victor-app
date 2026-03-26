import { getSession } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowLeft, Mail, Phone, Calendar, Ruler,
  Weight, Target, AlertTriangle, FileText,
  Dumbbell, Clock, Activity,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StudentDetailActions } from "./student-detail-actions"
import { WorkoutPlans } from "./workout-plans"
import { StudentSubscription } from "./student-subscription"
import { StudentTools } from "./student-tools"

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params

  let trainer
  try {
    trainer = await getTrainerProfile(session.userId)
  } catch {
    return notFound()
  }

  const student = await prisma.student.findFirst({
    where: { id, trainerId: trainer.id },
    include: {
      user: { select: { name: true, email: true, phone: true, active: true, createdAt: true } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          template: { select: { name: true, type: true } },
        },
      },
    },
  })

  if (!student) return notFound()

  const genderLabel = student.gender === "MALE" ? "Masculino" : student.gender === "FEMALE" ? "Feminino" : student.gender === "OTHER" ? "Outro" : null

  return (
    <div className="space-y-6 pb-20">
      {/* Back link */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para Alunos
      </Link>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] p-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-600/10 to-red-800/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
          {/* Large Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center text-red-400 text-2xl font-bold border border-red-500/10 shadow-lg shadow-red-600/10">
            {student.user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white truncate">{student.user.name}</h1>
              <Badge status={student.status.toLowerCase() as "active" | "inactive" | "pending"} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {student.user.email}
              </span>
              {student.user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {student.user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Membro desde {format(student.user.createdAt, "MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <StudentDetailActions studentId={student.id} studentName={student.user.name} status={student.status} />
        </div>
      </div>

      {/* Quick Tools — Visão do Aluno / Evolução / PDF */}
      <StudentTools studentId={student.id} studentName={student.user.name} studentPhone={student.user.phone} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal & Physical Info */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Visão Geral
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoTile
                icon={Calendar}
                label="Nascimento"
                value={student.birthDate ? format(student.birthDate, "dd/MM/yyyy") : "---"}
              />
              <InfoTile
                icon={Activity}
                label="Sexo"
                value={genderLabel || "---"}
              />
              <InfoTile
                icon={Weight}
                label="Peso"
                value={student.weight ? `${student.weight} kg` : "---"}
              />
              <InfoTile
                icon={Ruler}
                label="Altura"
                value={student.height ? `${student.height} cm` : "---"}
              />
            </div>
          </div>

          {/* Goals & Restrictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Objetivos
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {student.goals || "Nenhum objetivo definido ainda."}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                Restrições
              </h4>
              <div className="text-sm text-neutral-400 leading-relaxed space-y-1.5">
                {student.restrictions
                  ? typeof student.restrictions === "string"
                    ? <p>{student.restrictions}</p>
                    : (() => {
                        const r = student.restrictions as Record<string, unknown>
                        return Object.entries(r).map(([key, val]) => (
                          <p key={key}>
                            <span className="text-neutral-500 capitalize">{key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}:</span>{" "}
                            {Array.isArray(val) ? val.join(", ") : String(val)}
                          </p>
                        ))
                      })()
                  : <p>Nenhuma restrição listada.</p>}
              </div>
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Observações
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {student.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Plans + Sessions */}
        <div className="space-y-6">
          {/* Subscription / Plan */}
          <StudentSubscription studentId={student.id} />

          {/* Workout Plans */}
          <WorkoutPlans studentId={student.id} />

          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              Sessões Recentes
            </h3>

            {student.sessions.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">Nenhuma sessão ainda</p>
                <p className="text-neutral-600 text-xs mt-1">
                  As sessões aparecem quando os treinos são concluídos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.sessions.map((sess: typeof student.sessions[0]) => (
                  <div
                    key={sess.id}
                    className="group rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-neutral-800 p-3 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center text-blue-400 border border-blue-500/10 shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {sess.template.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-neutral-500">
                            {format(sess.startedAt, "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                          {sess.durationMin && (
                            <span className="flex items-center gap-0.5 text-xs text-neutral-600">
                              <Clock className="w-3 h-3" />
                              {sess.durationMin}min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {sess.completedAt ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            Concluído
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                            Em Andamento
                          </span>
                        )}
                        {sess.rpe && (
                          <p className="text-[10px] text-neutral-600 mt-1">
                            RPE {sess.rpe}/10
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ INFO TILE ═══ */
function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-neutral-800/50 p-3 hover:bg-white/[0.04] hover:border-neutral-700 transition-all duration-200 group">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  )
}
