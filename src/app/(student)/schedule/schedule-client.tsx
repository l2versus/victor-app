"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight,
  Check, X, CalendarCheck, CalendarX,
  Dumbbell, Monitor, ClipboardList, AlertCircle,
} from "lucide-react"

type SessionType = "PRESENCIAL" | "ONLINE" | "CONSULTORIA"

type Slot = {
  id: string
  title: string | null
  date: string
  duration: number
  status: string
  sessionType: SessionType
  notes: string | null
  trainer: { user: { name: string; avatar: string | null } }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED:  { label: "Pendente",    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  CONFIRMED:  { label: "Confirmado",  color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20" },
  COMPLETED:  { label: "Concluído",   color: "text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/20" },
  CANCELLED:  { label: "Cancelado",   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  NO_SHOW:    { label: "Falta",       color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
}

type SessionTypeConfig = {
  label: string
  Icon: React.FC<{ className?: string }>
  color: string
  pillBg: string
  dotColor: string
  confirmLabel: string
  confirmDetail: string
}

const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  PRESENCIAL: {
    label: "Presencial",
    Icon: Dumbbell,
    color: "text-orange-400",
    pillBg: "bg-orange-500/10 border-orange-500/20",
    dotColor: "bg-orange-500",
    confirmLabel: "Confirmar presença",
    confirmDetail: "Confirme que você irá à academia",
  },
  ONLINE: {
    label: "Online",
    Icon: Monitor,
    color: "text-indigo-400",
    pillBg: "bg-indigo-500/10 border-indigo-500/20",
    dotColor: "bg-indigo-500",
    confirmLabel: "Confirmar participação",
    confirmDetail: "Confirme presença na videochamada",
  },
  CONSULTORIA: {
    label: "Consultoria",
    Icon: ClipboardList,
    color: "text-emerald-400",
    pillBg: "bg-emerald-500/10 border-emerald-500/20",
    dotColor: "bg-emerald-500",
    confirmLabel: "Confirmar consulta",
    confirmDetail: "Confirme presença na consultoria",
  },
}

const DAY_NAMES   = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]
const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function ScheduleStudentClient() {
  const [slots, setSlots]       = useState<Slot[]>([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
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
    setRespondError(null)
    try {
      const res = await fetch(`/api/student/schedule?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchSlots()
      } else {
        const data = await res.json().catch(() => ({}))
        setRespondError(data.error ?? "Não foi possível atualizar o agendamento.")
      }
    } catch {
      setRespondError("Erro de conexão. Tente novamente.")
    }
    setUpdating(null)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

      {/* Week mini-grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          const daySlots = slots.filter(s => {
            const sd = new Date(s.date)
            return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()
          })
          const pending   = daySlots.some(s => s.status === "SCHEDULED")
          const confirmed = daySlots.some(s => s.status === "CONFIRMED")
          const hasAny    = daySlots.length > 0

          // Dot color: orange = presencial pending, green = confirmed, red dot = neutral fallback
          const dotClass = pending
            ? "bg-orange-500"
            : confirmed
              ? "bg-green-500"
              : "bg-neutral-500"

          return (
            <div key={i} className={`text-center p-1.5 rounded-xl transition-colors ${isToday ? "bg-red-600/15 border border-red-500/20" : "bg-white/[0.02]"}`}>
              <p className="text-[9px] text-neutral-600 uppercase">{DAY_NAMES[d.getDay()]}</p>
              <p className={`text-sm font-bold ${isToday ? "text-red-400" : "text-white"}`}>{d.getDate()}</p>
              {hasAny && <div className={`w-1.5 h-1.5 rounded-full ${dotClass} mx-auto mt-1`} />}
            </div>
          )
        })}
      </div>

      {/* Error banner — shows above slots without replacing them */}
      {respondError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-red-400 text-sm flex-1">{respondError}</span>
          <button onClick={() => setRespondError(null)} className="text-red-400/70 hover:text-red-400 shrink-0 mt-0.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Calendar className="w-10 h-10 text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">Nenhum agendamento nesta semana</p>
          <p className="text-xs text-neutral-600">Quando seu professor agendar uma sessão, ela aparecerá aqui</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {slots.map((slot, idx) => {
              const date      = new Date(slot.date)
              const config    = STATUS_CONFIG[slot.status] || STATUS_CONFIG.SCHEDULED
              const typeCfg   = SESSION_TYPE_CONFIG[slot.sessionType] || SESSION_TYPE_CONFIG.PRESENCIAL
              const TypeIcon  = typeCfg.Icon
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
                  {/* Date + Status row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Day box */}
                      <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] text-neutral-500 uppercase leading-none">{DAY_NAMES[date.getDay()]}</span>
                        <span className="text-base font-bold text-white leading-tight">{date.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {slot.title || "Sessão de treino"}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{date.getHours().toString().padStart(2, "0")}:{date.getMinutes().toString().padStart(2, "0")}</span>
                          <span className="text-neutral-600">·</span>
                          <span>{slot.duration}min</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Modality badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${typeCfg.pillBg} ${typeCfg.color}`}>
                      <TypeIcon className="w-3 h-3" />
                      {typeCfg.label}
                    </span>
                    {/* Trainer */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                        {slot.trainer?.user.avatar ? (
                          <img src={slot.trainer.user.avatar} alt="" className="w-5 h-5 object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-neutral-500" />
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        Prof. {slot.trainer?.user.name || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Notes (link, endereço, etc.) */}
                  {slot.notes && (
                    <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-xl px-3 py-2 leading-relaxed">
                      {slot.notes}
                    </p>
                  )}

                  {/* Actions — only for SCHEDULED */}
                  {isPending && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] text-neutral-500">{typeCfg.confirmDetail}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondToSlot(slot.id, "CONFIRMED")}
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-500/20 text-green-400 text-xs font-semibold min-h-[44px] hover:bg-green-600/30 active:scale-95 transition-all disabled:opacity-40"
                        >
                          {isUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CalendarCheck className="w-4 h-4" />
                          )}
                          {typeCfg.confirmLabel}
                        </button>
                        <button
                          onClick={() => respondToSlot(slot.id, "CANCELLED")}
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-red-600/15 border border-red-500/15 text-red-400 text-xs font-medium min-h-[44px] hover:bg-red-600/25 active:scale-95 transition-all disabled:opacity-40"
                        >
                          <CalendarX className="w-4 h-4" />
                          Não vou
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmed state — reassurance */}
                  {slot.status === "CONFIRMED" && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <p className="text-xs text-green-400/80">
                        {slot.sessionType === "PRESENCIAL"
                          ? "Presença confirmada — até logo na academia!"
                          : slot.sessionType === "ONLINE"
                            ? "Participação confirmada — prepare o link da chamada"
                            : "Consulta confirmada — até logo!"}
                      </p>
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
