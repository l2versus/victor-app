export default function ExercisesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-5 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-32 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-11 w-full bg-white/[0.04] rounded-xl" />

      {/* Filter chips skeleton */}
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shrink-0 h-7 w-20 bg-white/[0.04] rounded-full" />
        ))}
      </div>

      {/* Exercise list skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-24 bg-white/[0.03] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
