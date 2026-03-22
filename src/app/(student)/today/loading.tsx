export default function TodayLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Template name skeleton */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-white/[0.04] rounded-lg" />
          <div className="h-3 w-24 bg-white/[0.03] rounded-lg" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="h-2 w-full bg-white/[0.04] rounded-full" />

      {/* Exercise cards skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-20 bg-white/[0.03] rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-white/[0.03] rounded-lg" />
            <div className="h-8 w-16 bg-white/[0.03] rounded-lg" />
            <div className="h-8 w-16 bg-white/[0.03] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
