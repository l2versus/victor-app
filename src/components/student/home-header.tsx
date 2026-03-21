"use client"

import { Flame, MessageCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/student/notification-bell"

interface HomeHeaderProps {
  name: string
  avatar?: string | null
  streak: number
  weekSessions: number
  weekTarget: number
}

export function HomeHeader({ name, avatar, streak, weekSessions, weekTarget }: HomeHeaderProps) {
  const firstName = name.split(" ")[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  const progress = weekTarget > 0 ? Math.min(weekSessions / weekTarget, 1) : 0

  return (
    <div className="flex items-center gap-3 mb-5">
      {/* Avatar — social style */}
      <Link href="/profile" className="relative shrink-0 group">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-red-600/20 ring-2 ring-red-500/20 group-active:scale-95 transition-transform">
          {avatar ? (
            <img src={avatar} alt={firstName} className="w-full h-full rounded-full object-cover" />
          ) : (
            firstName.charAt(0).toUpperCase()
          )}
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050505]" />
        {/* Progress ring around avatar */}
        <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle
            cx="24" cy="24" r="22" fill="none"
            stroke="rgba(239,68,68,0.6)" strokeWidth="2"
            strokeDasharray={`${progress * 138} 138`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
      </Link>

      {/* Greeting + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-[15px] truncate">
          {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300">{firstName}</span> 💪
        </p>
        <p className="text-neutral-600 text-[11px] mt-0.5">
          {weekSessions}/{weekTarget} treinos esta semana
        </p>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[11px] font-bold text-orange-300">{streak}</span>
        </div>
      )}

      {/* Chat with Victor */}
      <Link
        href="/messages"
        className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/[0.12] active:scale-95 transition-all shrink-0"
      >
        <MessageCircle className="w-4 h-4" />
      </Link>

      {/* Notifications */}
      <NotificationBell />
    </div>
  )
}

/* ═══════════════════════════════════════════
   QUICK STATS — Social-style metrics row
   ═══════════════════════════════════════════ */
export function QuickStats({
  totalSessions,
  totalVolume,
  avgRpe,
}: {
  totalSessions: number
  totalVolume: number
  avgRpe: number | null
}) {
  if (totalSessions === 0) return null

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
      <StatPill label="Treinos" value={totalSessions.toString()} />
      {totalVolume > 0 && (
        <StatPill label="Volume" value={`${(totalVolume / 1000).toFixed(1)}t`} />
      )}
      {avgRpe && <StatPill label="RPE" value={avgRpe.toFixed(1)} />}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
      <span className="text-[10px] text-neutral-500">{label}</span>
      <span className="text-[11px] font-bold text-white">{value}</span>
    </div>
  )
}
