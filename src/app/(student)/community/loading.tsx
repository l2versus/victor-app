export default function CommunityLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-5 w-36 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-48 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Podium skeleton */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-end justify-center gap-4 h-40">
          <div className="w-16 h-24 bg-white/[0.04] rounded-xl" />
          <div className="w-16 h-32 bg-white/[0.04] rounded-xl" />
          <div className="w-16 h-20 bg-white/[0.04] rounded-xl" />
        </div>
      </div>

      {/* Ranking list */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-20 bg-white/[0.03] rounded-lg" />
            </div>
            <div className="h-5 w-12 bg-white/[0.04] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
