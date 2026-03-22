export default function PostureLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-5 w-40 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-56 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Body scan card skeleton */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-2xl bg-white/[0.04]" />
          <div className="h-5 w-36 bg-white/[0.04] rounded-lg" />
          <div className="h-3 w-48 bg-white/[0.03] rounded-lg" />
          <div className="h-10 w-full bg-white/[0.04] rounded-xl" />
        </div>
      </div>

      {/* History skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-32 bg-white/[0.03] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
