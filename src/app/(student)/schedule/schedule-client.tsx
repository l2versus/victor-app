"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight,
  Check, X, CalendarCheck, CalendarX,
} from "lucide-react"

type Slot = {
  id: string
  title: string | null
  date: string
  duration: number
  status: string
  notes: string | null
  trainer: { user: { name: string; avatar: string | null } }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: "Pendente", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  CONFIRMED: { label: "Confirmado", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  COMPLETED: { label: "Concluído", color: "text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/20" },
  CANCELLED: { label: "Cancelado", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  NO_SHOW: { label: "Falta", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
}

const DAY_NAMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]
const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function ScheduleStudentClient() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1) // Monday
    d.setHours(0, 0, 0, 0)
    return d
  })

  const weekEnd = useMemo(() => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }, [currentWeekStart])

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const end = new Date(currentWeekStart)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const res = await fetch(
        `/api/student/schedule?start=${currentWeekStart.toISOString()}&end=${end.toISOString()}`
      )
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [currentWeekStart])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  function navigate(dir: number) {
    setCurrentWeekStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  async function respondToSlot(id: string, status: "CONFIRMED" | "CANCELLED") {
    setUpdating(id)
    try {
      const res = await fetch(`/api/student/schedule?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) fetchSlots()
    } catch { /* ignore */ }
    setUpdating(null)
  }

  // Group slots by date
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const hasSlots = slots.length > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-400" />
          Agenda
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Seus agendamentos com o professor</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-neutral-400" />
        </button>
        <div className="text-sm font-semibold text-white flex-1 text-center">
          {currentWeekStart.getDate()} {MONTH_NAMES[currentWeekStart.getMonth()]} — {weekEnd.getDate()} {MONTH_NAMES[weekEnd.getMonth()]}
        </div>
        <button onClick={() => navigate(1)} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          const daySlots = slots.filter(s => {
            const sd = new Date(s.date)
            return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()
          })
          const hasAppointment = daySlots.length > 0

          return (
            <div key={i} className={`text-center p-1.5 rounded-xl transition-colors ${isToday ? "bg-red-600/15 border border-red-500/20" : "bg-white/[0.02]"}`}>
              <p className="text-[9px] text-neutral-600 uppercase">{DAY_NAMES[d.getDay()]}</p>
              <p className={`text-sm font-bold ${isToday ? "text-red-400" : "text-white"}`}>{d.getDate()}</p>
              {hasAppointment && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mx-auto mt-1" />
              )}
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasSlots ? (
        <div className="text-center py-12 space-y-3">
          <Calendar className="w-10 h-10 text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">Nenhum agendamento nesta semana</p>
          <p className="text-xs text-neutral-600">Quando seu professor agendar uma sessão, ela aparecerá aqui</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {slots.map((slot, idx) => {
              const date = new Date(slot.date)
              const config = STATUS_CONFIG[slot.status] || STATUS_CONFIG.SCHEDULED
              const isPending = slot.status === "SCHEDULED"
              const isUpdating = updating === slot.id

              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border p-4 space-y-3 ${config.bg}`}
                >
                  {/* Date + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex flex-col items-center justify-center">
                        <span className="text-[9px] text-neutral-500 uppercase leading-none">{DAY_NAMES[date.getDay()]}</span>
                        <span className="text-sm font-bold text-white leading-none">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {slot.title || "Sessão de treino"}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />
                          {date.getHours().toString().padStart(2, "0")}:{date.getMinutes().toString().padStart(2, "0")}
                          <span className="text-neutral-600">•</span>
                          {slot.duration}min
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Trainer */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center">
                      {slot.trainer?.user.avatar ? (
                        <img src={slot.trainer.user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-neutral-500" />
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">
                      Prof. {slot.trainer?.user.name || "—"}
                    </span>
                  </div>

                  {/* Notes */}
                  {slot.notes && (
                    <p className="text-xs text-neutral-500 bg-white/[0.03] rounded-lg px-3 py-2">
                      {slot.notes}
                    </p>
                  )}

                  {/* Actions — only for SCHEDULED */}
                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => respondToSlot(slot.id, "CONFIRMED")}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-500/20 text-green-400 text-xs font-semibold min-h-[44px] hover:bg-green-600/30 transition-colors disabled:opacity-40"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        Confirmar
                      </button>
                      <button
                        onClick={() => respondToSlot(slot.id, "CANCELLED")}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-semibold min-h-[44px] hover:bg-red-600/30 transition-colors disabled:opacity-40"
                      >
                        <CalendarX className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
