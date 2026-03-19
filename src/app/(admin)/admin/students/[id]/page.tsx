import { getSession } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import {
  ArrowLeft, Mail, Phone, Calendar, Ruler,
  Weight, Target, AlertTriangle, FileText,
  Dumbbell, Clock, Activity,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StudentDetailActions } from "./student-detail-actions"

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

  const genderLabel = student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : student.gender === "OTHER" ? "Other" : null

  return (
    <div className="space-y-6 pb-20">
      {/* Back link */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Students
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
                Member since {format(student.user.createdAt, "MMM yyyy")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <StudentDetailActions studentId={student.id} status={student.status} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal & Physical Info */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Overview
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoTile
                icon={Calendar}
                label="Birth Date"
                value={student.birthDate ? format(student.birthDate, "dd/MM/yyyy") : "---"}
              />
              <InfoTile
                icon={Activity}
                label="Gender"
                value={genderLabel || "---"}
              />
              <InfoTile
                icon={Weight}
                label="Weight"
                value={student.weight ? `${student.weight} kg` : "---"}
              />
              <InfoTile
                icon={Ruler}
                label="Height"
                value={student.height ? `${student.height} cm` : "---"}
              />
            </div>
          </div>

          {/* Goals & Restrictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Goals
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {student.goals || "No goals defined yet."}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                Restrictions
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {student.restrictions
                  ? typeof student.restrictions === "string"
                    ? student.restrictions
                    : JSON.stringify(student.restrictions)
                  : "No restrictions listed."}
              </p>
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-3">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Notes
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {student.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Sessions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              Recent Sessions
            </h3>

            {student.sessions.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No sessions yet</p>
                <p className="text-neutral-600 text-xs mt-1">
                  Sessions appear when workouts are completed
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.sessions.map((sess) => (
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
                            {format(sess.startedAt, "dd MMM, HH:mm")}
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
                            Done
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                            In Progress
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
