export default function HistoryLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-5 w-40 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-32 bg-white/[0.03] rounded-lg" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-24 bg-white/[0.03] rounded-lg" />
            </div>
            <div className="h-3 w-12 bg-white/[0.03] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
