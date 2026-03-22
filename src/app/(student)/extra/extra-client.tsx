"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, X, Activity, Clock, Flame, MapPin, Heart,
  Bike, Waves, Footprints, Wind, Dumbbell, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ExtraActivityItem = {
  id: string
  type: string
  name: string
  durationMin: number | null
  caloriesBurned: number | null
  distance: number | null
  heartRateAvg: number | null
  notes: string | null
  date: string
  createdAt: string
}

const ACTIVITY_TYPES = [
  { value: "CARDIO", label: "Cardio", icon: Heart, color: "text-red-400 bg-red-500/15" },
  { value: "RUNNING", label: "Corrida", icon: Footprints, color: "text-blue-400 bg-blue-500/15" },
  { value: "CYCLING", label: "Bike", icon: Bike, color: "text-green-400 bg-green-500/15" },
  { value: "SWIMMING", label: "Natação", icon: Waves, color: "text-cyan-400 bg-cyan-500/15" },
  { value: "YOGA", label: "Yoga", icon: Wind, color: "text-purple-400 bg-purple-500/15" },
  { value: "STRETCHING", label: "Alongamento", icon: Activity, color: "text-amber-400 bg-amber-500/15" },
  { value: "HIIT", label: "HIIT", icon: Zap, color: "text-orange-400 bg-orange-500/15" },
  { value: "SPORT", label: "Esporte", icon: Dumbbell, color: "text-emerald-400 bg-emerald-500/15" },
  { value: "OTHER", label: "Outro", icon: Activity, color: "text-neutral-400 bg-neutral-500/15" },
]

export function ExtraActivityClient({ activities: initialActivities }: { activities: ExtraActivityItem[] }) {
  const [activities, setActivities] = useState(initialActivities)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: "CARDIO",
    name: "",
    durationMin: "",
    caloriesBurned: "",
    distance: "",
    heartRateAvg: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  })

  async function createActivity() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/student/extra-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setActivities([{ ...data.activity, date: data.activity.date, createdAt: new Date().toISOString() }, ...activities])
        setShowForm(false)
        setForm({ type: "CARDIO", name: "", durationMin: "", caloriesBurned: "", distance: "", heartRateAvg: "", notes: "", date: new Date().toISOString().split("T")[0] })
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function deleteActivity(id: string) {
    await fetch(`/api/student/extra-activities?id=${id}`, { method: "DELETE" })
    setActivities(activities.filter(a => a.id !== id))
  }

  // Stats
  const thisWeek = activities.filter(a => {
    const d = new Date(a.date)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return d >= weekStart
  })
  const totalMinutes = thisWeek.reduce((sum, a) => sum + (a.durationMin || 0), 0)
  const totalCalories = thisWeek.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)
  const totalDistance = thisWeek.reduce((sum, a) => sum + (a.distance || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            Atividades Extra
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">Cardio, corrida, bike, yoga e mais</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Registrar"}
        </button>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{totalMinutes}min</p>
          <p className="text-[9px] text-neutral-500">Esta semana</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{totalCalories}</p>
          <p className="text-[9px] text-neutral-500">Calorias</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <MapPin className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{totalDistance.toFixed(1)}km</p>
          <p className="text-[9px] text-neutral-500">Distância</p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
              <div className="grid grid-cols-3 gap-1.5">
                {ACTIVITY_TYPES.map(t => {
                  const Icon = t.icon
                  return (
                    <button key={t.value} onClick={() => setForm({ ...form, type: t.value, name: form.name || t.label })}
                      className={cn(
                        "py-2 rounded-xl text-[10px] font-medium border transition-all flex flex-col items-center gap-1",
                        form.type === t.value ? "bg-red-600/20 text-red-400 border-red-500/20" : "bg-white/[0.04] text-neutral-500 border-white/[0.06]"
                      )}>
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
              <input type="text" placeholder="Nome da atividade" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Duração (min)" value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                <input type="number" placeholder="Calorias" value={form.caloriesBurned} onChange={e => setForm({ ...form, caloriesBurned: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.1" placeholder="Distância (km)" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              </div>
              <button onClick={createActivity} disabled={!form.name.trim() || saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40 min-h-[44px] shadow-lg shadow-red-600/20">
                {saving ? "Salvando..." : "Registrar Atividade"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhuma atividade registrada</p>
          <p className="text-neutral-600 text-xs mt-1">Registre corridas, yoga, natação e mais!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const typeInfo = ACTIVITY_TYPES.find(t => t.value === a.type) || ACTIVITY_TYPES[8]
            const Icon = typeInfo.icon
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeInfo.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      {new Date(a.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 shrink-0">
                    {a.durationMin && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.durationMin}min</span>}
                    {a.caloriesBurned && <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{a.caloriesBurned}</span>}
                    {a.distance && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" />{a.distance}km</span>}
                  </div>
                  <button onClick={() => deleteActivity(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5 text-neutral-600" />
                  </button>
                </div>
                {a.notes && <p className="text-[10px] text-neutral-500 mt-2 ml-[52px]">{a.notes}</p>}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
