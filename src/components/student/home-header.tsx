"use client"

import { Flame, MessageCircle, BookOpen } from "lucide-react"
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
      {/* Avatar — refined ring with progress */}
      <Link href="/profile" className="relative shrink-0 group">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-red-600/20 group-active:scale-95 transition-transform overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={firstName} className="w-full h-full rounded-full object-cover" />
          ) : (
            firstName.charAt(0).toUpperCase()
          )}
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050505] shadow-sm shadow-emerald-500/40" />
        {/* Progress ring around avatar */}
        <svg className="absolute -inset-[3px] w-[54px] h-[54px] -rotate-90" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle
            cx="27" cy="27" r="25" fill="none"
            stroke="url(#avatarGradient)" strokeWidth="2.5"
            strokeDasharray={`${progress * 157} 157`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </Link>

      {/* Greeting + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-[15px] truncate">
          {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300">{firstName}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 tabular-nums font-medium">
              {weekSessions}/{weekTarget}
            </span>
          </div>
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0 shadow-sm shadow-orange-500/10">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-streak-fire" />
          <span className="text-[11px] font-bold text-orange-300 tabular-nums">{streak}</span>
        </div>
      )}

      {/* Action buttons — unified style */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/exercises"
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/[0.12] active:scale-90 transition-all"
        >
          <BookOpen className="w-4 h-4" />
        </Link>
        <Link
          href="/messages"
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/[0.12] active:scale-90 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
        </Link>
        <NotificationBell />
      </div>
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
