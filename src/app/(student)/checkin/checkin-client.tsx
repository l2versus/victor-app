"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Check, Flame, Calendar, Dumbbell } from "lucide-react"

export function CheckinStudentClient() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [monthCount, setMonthCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    try {
      const res = await fetch("/api/student/checkin")
      if (res.ok) {
        const data = await res.json()
        setCheckedIn(data.checkedInToday)
        setStreak(data.streak)
        setMonthCount(data.thisMonthCount)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function doCheckin() {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/student/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "auto" }),
      })
      const data = await res.json()
      if (res.ok) {
        setCheckedIn(true)
        setMessage(data.message || "Check-in realizado!")
        fetchStatus()
      } else {
        setError(data.error || "Erro no check-in")
      }
    } catch {
      setError("Erro de conexão")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <MapPin className="w-5 h-5 text-red-400" />
          Check-in
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Registre sua presença na academia</p>
      </div>

      {/* Main action */}
      {checkedIn ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border border-green-500/20 bg-green-500/10 p-8 text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-lg font-bold text-green-400">Check-in feito!</p>
          <p className="text-sm text-neutral-400">{message || "Bom treino hoje!"}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={doCheckin}
            disabled={submitting}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold min-h-[64px] flex items-center justify-center gap-3 shadow-lg shadow-red-600/20 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Dumbbell className="w-6 h-6" />
                <span className="text-base">Cheguei na academia!</span>
              </>
            )}
          </button>
          <p className="text-xs text-neutral-600 text-center">
            Toque para registrar sua presença de hoje
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center space-y-2">
          <Flame className="w-6 h-6 text-orange-400 mx-auto" />
          <p className="text-3xl font-bold text-white">{streak}</p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Dias seguidos</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center space-y-2">
          <Calendar className="w-6 h-6 text-blue-400 mx-auto" />
          <p className="text-3xl font-bold text-white">{monthCount}</p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Este mês</p>
        </div>
      </div>
    </div>
  )
}
