export default function EvolutionLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-5 w-32 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-48 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
            <div className="h-3 w-12 bg-white/[0.03] rounded" />
            <div className="h-6 w-16 bg-white/[0.04] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="h-4 w-24 bg-white/[0.04] rounded-lg mb-4" />
        <div className="h-48 w-full bg-white/[0.03] rounded-xl" />
      </div>

      {/* History list */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="h-4 w-28 bg-white/[0.04] rounded-lg" />
          <div className="h-3 w-40 bg-white/[0.03] rounded-lg" />
        </div>
      ))}
    </div>
  )
}
