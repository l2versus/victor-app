"use client"

import { useState, useEffect } from "react"
import { MapPin, Users, Calendar, TrendingUp, UserCheck, RefreshCw, Dumbbell } from "lucide-react"

type CheckInEntry = {
  id: string
  method: string
  createdAt: string
  student: { user: { name: string; avatar: string | null } }
}

export function CheckinAdminClient() {
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([])
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 })
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/admin/checkin?date=${today}`)
      if (res.ok) {
        const data = await res.json()
        setCheckIns(data.checkIns)
        setStats(data.stats)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-400" />
          Controle de Presença
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Acompanhe os check-ins dos alunos pelo app</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <UserCheck className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.today}</p>
          <p className="text-[10px] text-neutral-500 uppercase">Hoje</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.week}</p>
          <p className="text-[10px] text-neutral-500 uppercase">Semana</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <TrendingUp className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.month}</p>
          <p className="text-[10px] text-neutral-500 uppercase">Mês</p>
        </div>
      </div>

      {/* Today's check-ins */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            Check-ins de hoje
          </h3>
          <button onClick={fetchData} className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {checkIns.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Nenhum check-in hoje</p>
            <p className="text-xs text-neutral-600 mt-1">Os alunos fazem check-in pelo app ao chegar na academia</p>
          </div>
        ) : (
          <div className="space-y-2">
            {checkIns.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  {c.student?.user.avatar ? (
                    <img src={c.student.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-green-400">
                      {c.student?.user.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{c.student?.user.name || "—"}</p>
                  <p className="text-[10px] text-neutral-600">
                    {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {" • "}
                    {c.method === "QR" ? "Pelo app" : "Manual"}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
