"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users, Search, AlertCircle, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface StudentData {
  id: string
  name: string
  email: string
  avatar: string | null
  status: string
  weight: number | null
  currentPlan: string | null
  adherence: number
  lastLogDate: string | null
  hasAlert: boolean
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  INACTIVE: { label: "Inativo", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
  PENDING: { label: "Pendente", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
}

export default function NutriStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/nutri/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Pacientes
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                {students.length} paciente{students.length !== 1 ? "s" : ""} cadastrado{students.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ SEARCH ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* ═══ TABLE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.1] transition-all duration-500 overflow-hidden"
      >
        {loading ? (
          <div className="p-5 sm:p-7 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">
              {search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 sm:px-6 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Paciente
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Plano Atual
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Aderencia 7d
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Ultimo Registro
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Peso
                  </th>
                  <th className="py-3 px-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => {
                  const status = statusLabels[student.status] ?? statusLabels.INACTIVE
                  return (
                    <motion.tr
                      key={student.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      <td className="py-3 px-4 sm:px-6">
                        <Link href={`/nutri/students/${student.id}`} className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 flex items-center justify-center text-emerald-400/80 text-sm font-medium border border-emerald-500/10 overflow-hidden">
                              {student.avatar ? (
                                <img src={student.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                student.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            {student.hasAlert && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-[#060606] flex items-center justify-center">
                                <AlertCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/80 font-medium truncate max-w-[160px]">
                              {student.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className="text-neutral-400 text-[13px]">
                          {student.currentPlan || (
                            <span className="text-neutral-600 italic">Sem plano</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                student.adherence >= 70
                                  ? "bg-emerald-500"
                                  : student.adherence >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(100, student.adherence)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-medium tabular-nums min-w-[32px] ${
                            student.adherence >= 70
                              ? "text-emerald-400"
                              : student.adherence >= 40
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}>
                            {student.adherence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-neutral-500 text-[13px]">
                          {student.lastLogDate
                            ? format(new Date(student.lastLogDate), "dd/MM/yyyy", { locale: ptBR })
                            : <span className="text-neutral-700 italic">Nunca</span>
                          }
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center hidden md:table-cell">
                        <span className="text-neutral-400 text-[13px]">
                          {student.weight ? `${student.weight} kg` : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Link href={`/nutri/students/${student.id}`}>
                          <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-emerald-400/60 transition-colors" />
                        </Link>
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
