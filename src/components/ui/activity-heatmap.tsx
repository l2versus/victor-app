"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type HeatmapDay = { date: string; count: number }

interface ActivityHeatmapProps {
  data: HeatmapDay[]
  months?: number
}

const DAY_LABELS = ["", "Seg", "", "Qua", "", "Sex", ""]
const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

function getColor(count: number): string {
  if (count === 0) return "bg-white/[0.03]"
  if (count === 1) return "bg-red-900/40"
  if (count === 2) return "bg-red-700/60"
  return "bg-red-500/80"
}

function getBorderColor(count: number): string {
  if (count === 0) return "border-white/[0.02]"
  if (count === 1) return "border-red-900/30"
  if (count === 2) return "border-red-700/30"
  return "border-red-500/30"
}

export function ActivityHeatmap({ data, months }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  // Responsive: default 4 months on desktop, 3 on mobile
  // We'll use months prop or default to 4 (CSS will handle mobile truncation)
  const displayMonths = months ?? 4

  const grid = useMemo(() => {
    const lookup = new Map<string, number>()
    for (const d of data) lookup.set(d.date, d.count)

    const today = new Date()
    const totalDays = displayMonths * 30 // approximate
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - totalDays)

    // Align to start of week (Monday)
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startDate.setDate(startDate.getDate() + mondayOffset)

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = []
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = []

    const cursor = new Date(startDate)
    while (cursor <= today) {
      const dateStr = cursor.toISOString().slice(0, 10)
      const dow = cursor.getDay()
      // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
      const adjustedDow = dow === 0 ? 6 : dow - 1

      currentWeek.push({
        date: dateStr,
        count: lookup.get(dateStr) || 0,
        dayOfWeek: adjustedDow,
      })

      if (adjustedDow === 6 || cursor.getTime() === today.getTime()) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    if (currentWeek.length > 0) weeks.push(currentWeek)

    return weeks
  }, [data, displayMonths])

  // Month labels with positions
  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = []
    let lastMonth = -1

    for (let w = 0; w < grid.length; w++) {
      const firstDay = grid[w][0]
      if (!firstDay) continue
      const month = parseInt(firstDay.date.slice(5, 7), 10) - 1
      if (month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[month], col: w })
        lastMonth = month
      }
    }

    return positions
  }, [grid])

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-")
    return `${d}/${m}/${y}`
  }

  return (
    <div className="relative select-none">
      {/* Month labels */}
      <div className="flex ml-7 mb-1 relative h-3">
        {monthPositions.map((mp) => (
          <span
            key={`${mp.label}-${mp.col}`}
            className="text-[8px] text-neutral-500 absolute"
            style={{ left: `${mp.col * 14}px` }}
          >
            {mp.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1.5 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[12px] flex items-center justify-end">
              <span className="text-[7px] text-neutral-600 leading-none">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px] overflow-hidden">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week.find((c) => c.dayOfWeek === di)
                if (!cell) {
                  return <div key={di} className="w-[12px] h-[12px]" />
                }
                return (
                  <div
                    key={di}
                    className={cn(
                      "w-[12px] h-[12px] rounded-sm border cursor-pointer transition-all duration-150",
                      getColor(cell.count),
                      getBorderColor(cell.count),
                      "hover:ring-1 hover:ring-red-400/40 hover:scale-125"
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const parent = e.currentTarget.closest(".relative")?.getBoundingClientRect()
                      if (parent) {
                        setTooltip({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left - parent.left + rect.width / 2,
                          y: rect.top - parent.top - 4,
                        })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onTouchStart={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const parent = e.currentTarget.closest(".relative")?.getBoundingClientRect()
                      if (parent) {
                        setTooltip({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left - parent.left + rect.width / 2,
                          y: rect.top - parent.top - 4,
                        })
                      }
                    }}
                    onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2.5 mr-1">
        <span className="text-[8px] text-neutral-600">Menos</span>
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "w-[10px] h-[10px] rounded-sm border",
              getColor(level),
              getBorderColor(level),
            )}
          />
        ))}
        <span className="text-[8px] text-neutral-600">Mais</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="rounded-lg bg-[#111]/95 backdrop-blur-xl border border-white/[0.08] px-2.5 py-1.5 shadow-2xl whitespace-nowrap">
            <p className="text-[9px] text-neutral-400">{formatDate(tooltip.date)}</p>
            <p className="text-[11px] font-bold text-white">
              {tooltip.count === 0
                ? "Nenhum treino"
                : `${tooltip.count} treino${tooltip.count > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
