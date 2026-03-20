"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ChartPoint {
  date: string
  shoulderHip: number
  waistHip: number
}

interface Props {
  data: ChartPoint[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
      <p className="text-neutral-500 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-neutral-400">{p.name}:</span>
          <span className="text-white font-mono font-semibold">{p.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export function ScanEvolutionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#525252", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#525252", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          tickCount={4}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="shoulderHip"
          name="Ombro/Quadril"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#ef4444" }}
        />
        <Line
          type="monotone"
          dataKey="waistHip"
          name="Cintura/Quadril"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
