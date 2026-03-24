"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar, Plus, X, Clock, User, ChevronLeft, ChevronRight,
  Check, Trash2, AlertCircle, Dumbbell, Monitor, ClipboardList,
  DollarSign,
} from "lucide-react"

type SessionType = "PRESENCIAL" | "ONLINE" | "CONSULTORIA"

type Slot = {
  id: string
  studentId: string | null
  title: string | null
  date: string
  duration: number
  status: string
  sessionType: SessionType
  paidOutside: boolean
  notes: string | null
  color: string | null
  student: { user: { name: string; avatar: string | null } } | null
}

type StudentOption = { id: string; name: string; avatar: string | null }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CONFIRMED:  "bg-green-500/15 text-green-400 border-green-500/20",
  COMPLETED:  "bg-neutral-500/15 text-neutral-400 border-neutral-500/20",
  CANCELLED:  "bg-red-500/15 text-red-400 border-red-500/20",
  NO_SHOW:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW:   "Falta",
}

type SessionTypeConfig = {
  label: string
  shortLabel: string
  Icon: React.FC<{ className?: string }>
  color: string
  pillBg: string
  activeBg: string
  activeBorder: string
}

const SESSION_TYPES = ["PRESENCIAL", "ONLINE", "CONSULTORIA"] as const

const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  PRESENCIAL: {
    label: "Presencial",
    shortLabel: "Pres.",
    Icon: Dumbbell,
    color: "text-orange-400",
    pillBg: "bg-orange-500/10 border-orange-500/20",
    activeBg: "bg-orange-500/20",
    activeBorder: "border-orange-500/40",
  },
  ONLINE: {
    label: "Online",
    shortLabel: "Online",
    Icon: Monitor,
    color: "text-indigo-400",
    pillBg: "bg-indigo-500/10 border-indigo-500/20",
    activeBg: "bg-indigo-500/20",
    activeBorder: "border-indigo-500/40",
  },
  CONSULTORIA: {
    label: "Consultoria",
    shortLabel: "Consul.",
    Icon: ClipboardList,
    color: "text-emerald-400",
    pillBg: "bg-emerald-500/10 border-emerald-500/20",
    activeBg: "bg-emerald-500/20",
    activeBorder: "border-emerald-500/40",
  },
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6) // 6h–20h

export function ScheduleClient({ students }: { students: StudentOption[] }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // slotId being mutated
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    date: "",
    time: "08:00",
    duration: "60",
    sessionType: "PRESENCIAL" as SessionType,
    paidOutside: false,
    notes: "",
    color: "",
  })

  const fetchSlots = useCallback(async () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    if (viewMode === "week") {
      start.setDate(start.getDate() - start.getDay() + 1)
      end.setDate(start.getDate() + 6)
    }
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    try {
      const res = await fetch(`/api/admin/schedule?start=${start.toISOString()}&end=${end.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [currentDate, viewMode])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (viewMode === "week") d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  async function createSlot() {
    if (!form.date || !form.time) return
    setSaving(true)
    try {
      const dateTime = new Date(`${form.date}T${form.time}:00`)
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:   form.studentId || null,
          title:       form.title || null,
          date:        dateTime.toISOString(),
          duration:    Number(form.duration),
          sessionType: form.sessionType,
          paidOutside: form.paidOutside,
          notes:       form.notes || null,
          color:       form.color || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ studentId: "", title: "", date: "", time: "08:00", duration: "60", sessionType: "PRESENCIAL", paidOutside: false, notes: "", color: "" })
        fetchSlots()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    if (actionLoading) return
    setActionLoading(id)
    try {
      await fetch(`/api/admin/schedule?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      await fetchSlots()
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  async function togglePaid(id: string, current: boolean) {
    if (actionLoading) return
    setActionLoading(id + "-paid")
    try {
      await fetch(`/api/admin/schedule?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidOutside: !current }),
      })
      await fetchSlots()
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  async function deleteSlot(id: string) {
    if (actionLoading) return
    setActionLoading(id + "-del")
    try {
      await fetch(`/api/admin/schedule?id=${id}`, { method: "DELETE" })
      await fetchSlots()
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  // Week days
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayNames = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Stats
  const confirmed  = slots.filter(s => s.status === "CONFIRMED" || s.status === "COMPLETED").length
  const noShows    = slots.filter(s => s.status === "NO_SHOW").length
  const paidCount  = slots.filter(s => s.paidOutside).length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
            <ChevronLeft className="w-4 h-4 text-neutral-400" />
          </button>
          <div className="text-sm font-semibold text-white flex-1 text-center">
            {viewMode === "week"
              ? `${weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
              : currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
            <button onClick={() => setViewMode("day")} className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === "day" ? "bg-red-600/20 text-red-400" : "bg-white/[0.02] text-neutral-500"}`}>
              Dia
            </button>
            <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === "week" ? "bg-red-600/20 text-red-400" : "bg-white/[0.02] text-neutral-500"}`}>
              Semana
            </button>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (!showForm) setForm(f => ({ ...f, date: currentDate.toISOString().split("T")[0] })) }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20 shrink-0"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancelar" : "Novo"}
          </button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 space-y-4">

              {/* Modalidade — pill selector */}
              <div>
                <label className="text-xs text-neutral-400 mb-2 block">Modalidade</label>
                <div className="grid grid-cols-3 gap-2">
                  {SESSION_TYPES.map(type => {
                    const cfg = SESSION_TYPE_CONFIG[type]
                    const active = form.sessionType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, sessionType: type }))}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                          active
                            ? `${cfg.activeBg} ${cfg.activeBorder} ${cfg.color}`
                            : "bg-white/[0.03] border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                        }`}
                      >
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Aluno (opcional)</label>
                  <select
                    value={form.studentId}
                    onChange={e => setForm({ ...form, studentId: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  >
                    <option value="">Horário livre</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Título</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Treino Força, Avaliação..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Horário</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Duração</label>
                  <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]">
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h30</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">Observações</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Link da chamada, endereço, observação..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]"
                />
              </div>

              {/* Pago por fora toggle */}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, paidOutside: !f.paidOutside }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
                  form.paidOutside
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-white/[0.03] border-white/[0.06] text-neutral-500 hover:border-white/[0.12]"
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  form.paidOutside ? "bg-amber-500 border-amber-500" : "border-white/20"
                }`}>
                  {form.paidOutside && <Check className="w-2.5 h-2.5 text-black" />}
                </div>
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                Pagamento recebido fora do app (pix / dinheiro)
              </button>

              <button onClick={createSlot} disabled={!form.date || saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40 min-h-[44px] shadow-lg shadow-red-600/20">
                {saving ? "Salvando..." : "Agendar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "week" ? (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {weekDays.map((d, i) => {
                  const isToday = d.getTime() === today.getTime()
                  return (
                    <div key={i} className={`p-2 text-center border-r border-white/[0.04] last:border-r-0 ${isToday ? "bg-red-600/10" : ""}`}>
                      <p className="text-[10px] text-neutral-500 uppercase">{dayNames[i]}</p>
                      <p className={`text-sm font-bold ${isToday ? "text-red-400" : "text-white"}`}>{d.getDate()}</p>
                    </div>
                  )
                })}
              </div>
              {/* Slots grid */}
              <div className="grid grid-cols-7 min-h-[300px]">
                {weekDays.map((d, i) => {
                  const daySlots = slots.filter(s => {
                    const sd = new Date(s.date)
                    return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate()
                  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                  return (
                    <div key={i} className="border-r border-white/[0.04] last:border-r-0 p-1 space-y-1">
                      {daySlots.map(slot => (
                        <SlotCard key={slot.id} slot={slot} compact actionLoading={actionLoading} onStatusChange={updateStatus} onDelete={deleteSlot} onTogglePaid={togglePaid} />
                      ))}
                      {daySlots.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-30">
                          <Calendar className="w-3 h-3 text-neutral-700" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="sm:hidden text-center py-2 border-t border-white/[0.04]">
            <p className="text-[9px] text-neutral-600">← Deslize para ver todos os dias →</p>
          </div>
        </div>
      ) : (
        /* Day view */
        <div className="space-y-2">
          {HOURS.map(hour => {
            const hourSlots = slots.filter(s => {
              const sd = new Date(s.date)
              return sd.getFullYear() === currentDate.getFullYear() && sd.getMonth() === currentDate.getMonth() && sd.getDate() === currentDate.getDate() && sd.getHours() === hour
            })
            return (
              <div key={hour} className="flex gap-3">
                <div className="w-12 text-right shrink-0 pt-2">
                  <span className="text-[11px] text-neutral-600 font-mono">{String(hour).padStart(2, "0")}:00</span>
                </div>
                <div className="flex-1 min-h-[50px] border-t border-white/[0.04] pt-1 space-y-1">
                  {hourSlots.map(slot => (
                    <SlotCard key={slot.id} slot={slot} compact={false} actionLoading={actionLoading} onStatusChange={updateStatus} onDelete={deleteSlot} onTogglePaid={togglePaid} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-white">{slots.length}</p>
            <p className="text-[10px] text-neutral-500">Agendados</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-green-400">{confirmed}</p>
            <p className="text-[10px] text-neutral-500">Confirmados</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{noShows}</p>
            <p className="text-[10px] text-neutral-500">Faltas</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{paidCount}</p>
            <p className="text-[10px] text-neutral-500">Pagos fora</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SlotCard({ slot, compact, actionLoading, onStatusChange, onDelete, onTogglePaid }: {
  slot: Slot
  compact: boolean
  actionLoading: string | null
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onTogglePaid: (id: string, current: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const time = new Date(slot.date)
  const statusClass = STATUS_COLORS[slot.status] || STATUS_COLORS.SCHEDULED
  const typeCfg = SESSION_TYPE_CONFIG[slot.sessionType] || SESSION_TYPE_CONFIG.PRESENCIAL
  const TypeIcon = typeCfg.Icon
  const isMutating = actionLoading !== null

  if (compact) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full text-left px-1.5 py-1 rounded-lg text-[10px] border transition-all ${statusClass}`}
        >
          <div className="flex items-center gap-1">
            <TypeIcon className={`w-2.5 h-2.5 shrink-0 ${typeCfg.color}`} />
            <span className="font-semibold truncate">
              {time.getHours()}:{String(time.getMinutes()).padStart(2, "0")}
            </span>
          </div>
          <div className="truncate opacity-80">{slot.student?.user.name || slot.title || "Livre"}</div>
          {slot.paidOutside && (
            <div className="text-amber-400 text-[9px] font-semibold">Pago ✓</div>
          )}
        </button>

        {/* Expanded inline panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-1 rounded-xl border p-3 space-y-2 ${statusClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${typeCfg.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    {typeCfg.label}
                  </span>
                  <button onClick={() => setExpanded(false)}>
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                </div>
                <ActionButtons slot={slot} isMutating={isMutating} onStatusChange={onStatusChange} onDelete={onDelete} onTogglePaid={onTogglePaid} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${statusClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-semibold">
              {time.getHours()}:{String(time.getMinutes()).padStart(2, "0")} — {slot.duration}min
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="text-xs truncate">{slot.student?.user.name || slot.title || "Horário livre"}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] uppercase font-bold tracking-wider">{STATUS_LABELS[slot.status] ?? slot.status}</span>
        </div>
      </div>

      {/* Modality + Paid badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeCfg.pillBg} ${typeCfg.color}`}>
          <TypeIcon className="w-2.5 h-2.5" />
          {typeCfg.label}
        </span>
        {slot.paidOutside && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <DollarSign className="w-2.5 h-2.5" />
            Pago fora
          </span>
        )}
      </div>

      {slot.notes && <p className="text-[10px] opacity-70 leading-relaxed">{slot.notes}</p>}

      <ActionButtons slot={slot} isMutating={isMutating} onStatusChange={onStatusChange} onDelete={onDelete} onTogglePaid={onTogglePaid} />
    </div>
  )
}

function ActionButtons({ slot, isMutating, onStatusChange, onDelete, onTogglePaid }: {
  slot: Slot
  isMutating: boolean
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onTogglePaid: (id: string, current: boolean) => void
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {slot.status === "SCHEDULED" && (
        <button onClick={() => onStatusChange(slot.id, "CONFIRMED")} disabled={isMutating} title="Confirmar"
          className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-40">
          <Check className="w-3 h-3 text-green-400" />
        </button>
      )}
      {(slot.status === "SCHEDULED" || slot.status === "CONFIRMED") && (
        <>
          <button onClick={() => onStatusChange(slot.id, "COMPLETED")} disabled={isMutating} title="Concluir"
            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors disabled:opacity-40">
            <Check className="w-3 h-3 text-blue-400" />
          </button>
          <button onClick={() => onStatusChange(slot.id, "NO_SHOW")} disabled={isMutating} title="Falta"
            className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors disabled:opacity-40">
            <AlertCircle className="w-3 h-3 text-yellow-400" />
          </button>
          <button onClick={() => onStatusChange(slot.id, "CANCELLED")} disabled={isMutating} title="Cancelar"
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-40">
            <X className="w-3 h-3 text-red-400" />
          </button>
        </>
      )}
      {/* Toggle pago fora */}
      {slot.studentId && (
        <button
          onClick={() => onTogglePaid(slot.id, slot.paidOutside)}
          disabled={isMutating}
          title={slot.paidOutside ? "Desmarcar pagamento" : "Marcar como pago fora"}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            slot.paidOutside
              ? "bg-amber-500/30 hover:bg-amber-500/20"
              : "bg-neutral-500/20 hover:bg-amber-500/20"
          }`}
        >
          <DollarSign className={`w-3 h-3 ${slot.paidOutside ? "text-amber-400" : "text-neutral-500"}`} />
        </button>
      )}
      <button onClick={() => onDelete(slot.id)} disabled={isMutating} title="Excluir"
        className="p-1.5 rounded-lg bg-neutral-500/20 hover:bg-neutral-500/30 transition-colors disabled:opacity-40 ml-auto">
        <Trash2 className="w-3 h-3 text-neutral-400" />
      </button>
    </div>
  )
}
